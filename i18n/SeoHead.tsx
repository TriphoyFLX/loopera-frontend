import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useI18n } from './useI18n';
import { applySeo } from './seo';

/** Updates document title, meta tags & JSON-LD per route */
export function SeoHead() {
  const { pathname } = useLocation();
  const { t, locale } = useI18n();

  useEffect(() => {
    applySeo(pathname, t, locale);
  }, [pathname, t, locale]);

  return null;
}
