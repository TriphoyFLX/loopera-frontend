export type SeoRouteConfig = {
  titleKey: string;
  descriptionKey: string;
  keywordsKey?: string;
};

const SEO_ROUTES: Record<string, SeoRouteConfig> = {
  '/': {
    titleKey: 'seo.home.title',
    descriptionKey: 'seo.home.description',
    keywordsKey: 'seo.home.keywords',
  },
  '/loops': {
    titleKey: 'seo.loops.title',
    descriptionKey: 'seo.loops.description',
    keywordsKey: 'seo.loops.keywords',
  },
  '/generate-melody': {
    titleKey: 'seo.melody.title',
    descriptionKey: 'seo.melody.description',
    keywordsKey: 'seo.melody.keywords',
  },
  '/shop': {
    titleKey: 'seo.shop.title',
    descriptionKey: 'seo.shop.description',
    keywordsKey: 'seo.shop.keywords',
  },
  '/pricing': {
    titleKey: 'seo.pricing.title',
    descriptionKey: 'seo.pricing.description',
    keywordsKey: 'seo.pricing.keywords',
  },
  '/search': {
    titleKey: 'seo.search.title',
    descriptionKey: 'seo.search.description',
  },
  '/loop-upload': {
    titleKey: 'seo.upload.title',
    descriptionKey: 'seo.upload.description',
  },
  '/looptok': {
    titleKey: 'seo.looptok.title',
    descriptionKey: 'seo.looptok.description',
    keywordsKey: 'seo.looptok.keywords',
  },
  '/auth': {
    titleKey: 'seo.auth.title',
    descriptionKey: 'seo.auth.description',
  },
  '/offer': {
    titleKey: 'seo.offer.title',
    descriptionKey: 'seo.offer.description',
  },
  '/terms': {
    titleKey: 'seo.offer.title',
    descriptionKey: 'seo.offer.description',
  },
  '/privacy': {
    titleKey: 'seo.privacy.title',
    descriptionKey: 'seo.privacy.description',
  },
  '/contacts': {
    titleKey: 'seo.contacts.title',
    descriptionKey: 'seo.contacts.description',
  },
  '/refunds': {
    titleKey: 'seo.refunds.title',
    descriptionKey: 'seo.refunds.description',
  },
  '/returns': {
    titleKey: 'seo.refunds.title',
    descriptionKey: 'seo.refunds.description',
  },
  '/delivery': {
    titleKey: 'seo.delivery.title',
    descriptionKey: 'seo.delivery.description',
  },
  '/service': {
    titleKey: 'seo.delivery.title',
    descriptionKey: 'seo.delivery.description',
  },
};

export function resolveSeoConfig(pathname: string): SeoRouteConfig {
  if (SEO_ROUTES[pathname]) {
    return SEO_ROUTES[pathname];
  }

  if (pathname.startsWith('/shop/pack/')) {
    return SEO_ROUTES['/shop'];
  }

  return SEO_ROUTES['/'];
}

const SITE_URL = 'https://loopera.ru';

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return;

  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;

  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function applySeo(
  pathname: string,
  t: (key: string) => string,
  locale: 'ru' | 'en',
) {
  const config = resolveSeoConfig(pathname);
  const title = t(config.titleKey);
  const description = t(config.descriptionKey);
  const keywords = t(config.keywordsKey || 'seo.default.keywords');
  const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;

  document.title = title;

  upsertMeta('description', description);
  upsertMeta('keywords', keywords);
  upsertMeta('og:title', title, 'property');
  upsertMeta('og:description', description, 'property');
  upsertMeta('og:url', canonical, 'property');
  upsertMeta('og:type', 'website', 'property');
  upsertMeta('og:site_name', 'Loopera', 'property');
  upsertMeta('og:locale', locale === 'ru' ? 'ru_RU' : 'en_US', 'property');
  upsertMeta('twitter:card', 'summary_large_image');
  upsertMeta('twitter:title', title);
  upsertMeta('twitter:description', description);

  upsertLink('canonical', canonical);
  upsertLink('alternate', `${SITE_URL}${pathname}`, 'ru');
  upsertLink('alternate', `${SITE_URL}${pathname}`, 'en');
  upsertLink('alternate', `${SITE_URL}${pathname}`, 'x-default');

  let jsonLd = document.getElementById('loopera-jsonld') as HTMLScriptElement | null;
  if (!jsonLd) {
    jsonLd = document.createElement('script');
    jsonLd.id = 'loopera-jsonld';
    jsonLd.type = 'application/ld+json';
    document.head.appendChild(jsonLd);
  }

  jsonLd.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Loopera',
    url: SITE_URL,
    description,
    inLanguage: [locale, locale === 'ru' ? 'en' : 'ru'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
}
