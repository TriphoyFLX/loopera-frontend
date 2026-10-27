export type PlanSlug = 'free' | 'basic' | 'pro' | 'business' | 'elite';

/** Normalize legacy elite → business for UI. */
export function normalizePlanSlug(slug?: string | null): Exclude<PlanSlug, 'elite'> {
  const key = String(slug || 'free').toLowerCase();
  if (key === 'elite' || key === 'business') return 'business';
  if (key === 'basic') return 'basic';
  if (key === 'pro') return 'pro';
  return 'free';
}

export function planDisplayName(slug?: string | null): string {
  const key = normalizePlanSlug(slug);
  const names: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
    business: 'Business',
  };
  return names[key] || 'Free';
}

export function isPaidPlan(slug?: string | null): boolean {
  const key = normalizePlanSlug(slug);
  return key === 'basic' || key === 'pro' || key === 'business';
}

export function canEditFullTheme(slug?: string | null): boolean {
  return normalizePlanSlug(slug) === 'business';
}

export function canEditAccent(slug?: string | null): boolean {
  const key = normalizePlanSlug(slug);
  return key === 'pro' || key === 'business';
}
