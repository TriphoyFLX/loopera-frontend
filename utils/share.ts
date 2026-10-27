export const getSiteOrigin = () =>
  typeof window !== 'undefined' ? window.location.origin : 'https://loopera.ru';

export const buildShareUrl = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteOrigin()}${normalized}`;
};

/** Always copy URL to clipboard; optionally open native share after. */
export const shareContent = async (options: {
  title: string;
  text: string;
  url: string;
  preferNative?: boolean;
}) => {
  let copied = false;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(options.url);
      copied = true;
    } catch {
      /* fall through */
    }
  }

  if (!copied && typeof document !== 'undefined') {
    try {
      const ta = document.createElement('textarea');
      ta.value = options.url;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copied = true;
    } catch {
      /* ignore */
    }
  }

  if (options.preferNative && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const urlShare: ShareData = { title: options.title, url: options.url };
      if (!navigator.canShare || navigator.canShare(urlShare)) {
        await navigator.share(urlShare);
      } else {
        await navigator.share({
          title: options.title,
          text: `${options.text}\n${options.url}`,
        });
      }
      return { ok: true as const, method: 'native' as const, copied };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { ok: copied, method: copied ? ('clipboard' as const) : ('cancelled' as const), copied };
      }
    }
  }

  if (copied) {
    return { ok: true as const, method: 'clipboard' as const, copied: true };
  }

  return { ok: false as const, method: 'unsupported' as const, copied: false };
};
