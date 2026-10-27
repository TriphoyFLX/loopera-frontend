import { getApiBaseUrl } from './urls';
import { tokenStorage } from './tokenStorage';

export const AUTH_EXPIRED_EVENT = 'loopera:auth-expired';
export const AUTH_REFRESHED_EVENT = 'loopera:auth-refreshed';
export const SESSION_EXPIRED_MESSAGE = 'Сессия истекла. Войдите в аккаунт снова.';

let refreshInFlight: Promise<string | null> | null = null;

export function getTokenExpiryMs(token: string): number | null {
  try {
    const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return null;
    const payload = JSON.parse(atob(base64));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function refreshAuthToken(): Promise<string | null> {
  const token = tokenStorage.getToken();
  if (!token) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.token) return null;
        tokenStorage.setToken(data.token);
        if (data.user) tokenStorage.setUser(data.user);
        window.dispatchEvent(new CustomEvent(AUTH_REFRESHED_EVENT, { detail: data }));
        return data.token as string;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export function expireAuthSession(redirect = true) {
  tokenStorage.removeToken();
  tokenStorage.removeUser();
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));

  if (!redirect || typeof window === 'undefined') return;

  const path = window.location.pathname;
  if (!path.startsWith('/auth')) {
    sessionStorage.setItem('auth_message', SESSION_EXPIRED_MESSAGE);
    window.location.assign('/auth?expired=1');
  }
}

export async function ensureValidSession(): Promise<boolean> {
  const token = tokenStorage.getToken();
  if (!token) return false;

  const expMs = getTokenExpiryMs(token);
  if (!expMs) return false;

  const msLeft = expMs - Date.now();
  if (msLeft > 3 * 24 * 60 * 60 * 1000) return true;

  return !!(await refreshAuthToken());
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<Response> {
  const token = tokenStorage.getToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && allowRefresh) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...options, headers });
      if (response.status !== 401) return response;
    }
    expireAuthSession();
    const data = await response.clone().json().catch(() => ({}));
    throw new Error(
      typeof data === 'object' && data?.message
        ? data.message
        : SESSION_EXPIRED_MESSAGE,
    );
  }

  return response;
}

export async function parseApiJson<T = unknown>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 429) {
      const msg =
        typeof data === 'object' && data && 'message' in data
          ? String((data as { message: string }).message)
          : 'Слишком много запросов. Подождите минуту и обновите страницу.';
      throw new Error(msg);
    }

    const msg =
      typeof data === 'string'
        ? data
        : (data as { message?: string; error?: string; detail?: string })?.message
          || (data as { error?: string })?.error
          || (typeof (data as { detail?: unknown })?.detail === 'string'
            ? (data as { detail: string }).detail
            : undefined)
          || `HTTP error! status: ${response.status}`;
    const err = new Error(msg) as Error & {
      code?: string;
      action?: string;
      plan?: string;
      status?: number;
    };
    if (typeof data === 'object' && data) {
      const body = data as { code?: string; action?: string; plan?: string };
      err.code = body.code;
      err.action = body.action;
      err.plan = body.plan;
    }
    err.status = response.status;
    throw err;
  }

  return data as T;
}
