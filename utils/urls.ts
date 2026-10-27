export const getApiUrl = () => {
  const apiURL = import.meta.env.VITE_API_URL || '';
  return apiURL.replace(/\/$/, '');
};

export const getApiBaseUrl = () => {
  const apiURL = getApiUrl();
  return apiURL ? `${apiURL}/api` : '/api';
};

/**
 * Media should stay same-origin when possible (Vite/nginx proxy).
 * Absolute VITE_API_URL breaks Audio()/img under CORP / mixed hosts.
 * When VITE_MEDIA_CDN_URL is set, rewrite /uploads/* to the CDN.
 */
const preferSameOriginMedia = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
};

const getMediaCdn = () =>
  String(import.meta.env.VITE_MEDIA_CDN_URL || '')
    .trim()
    .replace(/\/$/, '');

export const getAssetUrl = (path?: string | null) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const cdn = getMediaCdn();
  if (cdn && normalized.startsWith('/uploads/') && !preferSameOriginMedia()) {
    return `${cdn}${normalized.replace(/^\/uploads/, '')}`;
  }

  if (preferSameOriginMedia()) return normalized;
  const apiURL = getApiUrl();
  return apiURL ? `${apiURL}${normalized}` : normalized;
};

export const getUploadsUrl = (filename: string) => {
  const name = String(filename || '').replace(/^\/+/, '');
  if (!name) return '';
  if (/^https?:\/\//.test(name) || name.startsWith('/uploads/')) {
    return getAssetUrl(name.startsWith('/') ? name : `/${name}`);
  }
  return getAssetUrl(`/uploads/loops/${name}`);
};

export const getLoopTokUrl = (filename: string) => {
  const name = String(filename || '').replace(/^\/+/, '');
  return getAssetUrl(`/uploads/looptok/${name}`);
};
