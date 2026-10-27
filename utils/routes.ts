export const RESERVED_ROUTES = new Set([
  'auth',
  'forgot-password',
  'loops',
  'loop',
  'liked',
  'following',
  'profile',
  'chats',
  'loop-upload',
  'generate-melody',
  'search',
  'shop',
  'create-pack',
  'statistics',
  'admin',
  'offer',
  'terms',
  'contacts',
  'privacy',
  'refunds',
  'returns',
  'delivery',
  'service',
  'purchase',
  'pricing',
  'looptok',
  'api',
  'uploads',
]);

export const isReservedRoute = (segment: string) =>
  RESERVED_ROUTES.has(segment.toLowerCase());

export const profilePath = (username?: string | null) =>
  username ? `/${encodeURIComponent(username)}` : '/profile';

export const loopSharePath = (loopId: number | string) =>
  `/loops/${loopId}`;

export const loopDetailPath = (loopId: number | string) =>
  `/loops/${loopId}`;

export const parsePackId = (value?: string | null): string | null => {
  if (!value) return null;
  const decoded = decodeURIComponent(value).trim();
  const match = decoded.match(/^(\d+)/);
  return match ? match[1] : null;
};

export const packSharePath = (packId: number | string) => {
  const id = String(packId).match(/^\d+/)?.[0] ?? String(packId);
  return `/shop/pack/${id}`;
};
