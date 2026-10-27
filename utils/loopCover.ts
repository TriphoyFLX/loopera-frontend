import { getAssetUrl } from './urls';

export const LOOP_COVER_COLORS = ['#2558CF', '#C30202', '#FF215C', '#25CF83'] as const;

export type LoopLike = {
  id?: number | string | null;
  cover_url?: string | null;
};

export function getLoopCoverColor(id?: number | string | null): string {
  const n = typeof id === 'number' ? id : Number(id) || 0;
  const idx = Math.abs(Math.trunc(n)) % LOOP_COVER_COLORS.length;
  return LOOP_COVER_COLORS[idx];
}

export function getLoopCoverUrl(loop?: LoopLike | null): string | null {
  if (!loop?.cover_url) return null;
  return getAssetUrl(loop.cover_url) || null;
}
