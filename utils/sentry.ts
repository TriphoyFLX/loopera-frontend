/** Lightweight Sentry browser reporter (no SDK). Set VITE_SENTRY_DSN. */

type Payload = {
  message: string;
  stack?: string;
  componentStack?: string | null;
};

function parseDsn(dsn: string) {
  try {
    const u = new URL(dsn);
    const publicKey = u.username;
    const projectId = u.pathname.replace(/^\//, '');
    if (!publicKey || !projectId) return null;
    return {
      url: `${u.protocol}//${u.host}/api/${projectId}/store/`,
      publicKey,
    };
  } catch {
    return null;
  }
}

export function reportClientError(payload: Payload): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || typeof window === 'undefined') return;
  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const body = {
    event_id: crypto.randomUUID().replace(/-/g, ''),
    timestamp: new Date().toISOString(),
    platform: 'javascript',
    level: 'error',
    environment: import.meta.env.MODE,
    request: { url: window.location.href },
    message: payload.message,
    exception: {
      values: [
        {
          type: 'Error',
          value: payload.message,
          stacktrace: payload.stack
            ? {
                frames: payload.stack
                  .split('\n')
                  .slice(0, 40)
                  .map((line) => ({ filename: line.trim() })),
              }
            : undefined,
        },
      ],
    },
    extra: { componentStack: payload.componentStack },
  };

  void fetch(parsed.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=loopera-web/1.0`,
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

export function installClientErrorHooks(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (ev) => {
    reportClientError({
      message: ev.message || 'window.error',
      stack: ev.error?.stack,
    });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason;
    reportClientError({
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}
