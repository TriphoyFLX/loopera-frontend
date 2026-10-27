import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useI18n } from '../i18n/useI18n';
import { api } from '../utils/api';
import { normalizePlanSlug } from '../utils/plans';
import styles from './Pricing.module.css';

type PlanSlug = 'free' | 'basic' | 'pro' | 'business';
type Period = 'monthly' | 'yearly';

type Plan = {
  slug: PlanSlug;
  name: string;
  name_ru: string;
  tagline: string;
  tagline_ru: string;
  price_monthly: number;
  price_yearly: number;
  limits: {
    uploadsPerPeriod: number;
    downloadsPerPeriod: number;
    looptokPerPeriod: number;
    maxFileBytes: number;
  };
};

const Pricing = () => {
  const { t, locale } = useI18n();
  const { token, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [period, setPeriod] = useState<Period>('monthly');
  const [currentSlug, setCurrentSlug] = useState<PlanSlug>('free');
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getBillingPlans();
      setPlans(data.plans || []);
      if (token) {
        const me = await api.getMyBilling(token);
        setCurrentSlug(normalizePlanSlug(me.subscription?.slug) as PlanSlug);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pricingPage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment !== 'return' || !token) return;

    const paymentId = localStorage.getItem('pending_subscription_payment_id');
    if (!paymentId) {
      setStatusMsg(t('pricingPage.returnNoId'));
      setSearchParams({}, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setStatusMsg(t('pricingPage.confirming'));
        const result = await api.confirmSubscription(paymentId, token);
        if (cancelled) return;
        if (result.activated || result.status === 'succeeded') {
          localStorage.removeItem('pending_subscription_payment_id');
          setStatusMsg(t('pricingPage.activated', { plan: String(result.plan || '').toUpperCase() }));
          await load();
        } else {
          setStatusMsg(t('pricingPage.pending'));
        }
      } catch {
        if (!cancelled) setStatusMsg(t('pricingPage.confirmError'));
      } finally {
        setSearchParams({}, { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, token, t, setSearchParams, load]);

  const formatLimit = (n: number) => (n >= 500 ? t('pricingPage.unlimited') : String(n));

  const handleCheckout = (slug: PlanSlug) => {
    if (slug === 'free') return;
    requireAuth(async () => {
      if (!token) return;
      try {
        setCheckoutLoading(slug);
        setError(null);
        const result = await api.checkoutPlan(slug, period, token);
        if (result.payment_id) {
          localStorage.setItem('pending_subscription_payment_id', result.payment_id);
        }
        if (result.confirmation_url) {
          window.location.href = result.confirmation_url;
          return;
        }
        setError(t('pricingPage.checkoutError'));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('pricingPage.checkoutError'));
      } finally {
        setCheckoutLoading(null);
      }
    }, 'buy');
  };

  const featureRows = (plan: Plan) => [
    t('pricingPage.featUploads', { n: formatLimit(plan.limits.uploadsPerPeriod) }),
    t('pricingPage.featDownloads', { n: formatLimit(plan.limits.downloadsPerPeriod) }),
    t('pricingPage.featLooptok', { n: formatLimit(plan.limits.looptokPerPeriod) }),
    t('pricingPage.featSize', { mb: Math.round(plan.limits.maxFileBytes / (1024 * 1024)) }),
    plan.slug === 'business'
      ? t('pricingPage.featEliteProfile')
      : plan.slug === 'pro'
        ? t('pricingPage.featProAccent')
        : plan.slug === 'basic'
          ? t('pricingPage.featProAccent')
          : t('pricingPage.featBasic'),
    plan.slug === 'business'
      ? t('pricingPage.featEliteCard')
      : plan.slug === 'pro'
        ? t('pricingPage.featProCard')
        : t('pricingPage.featStdCard'),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.brand}>Loopera</p>
        <h1 className={styles.title}>{t('pricingPage.title')}</h1>
        <p className={styles.subtitle}>{t('pricingPage.subtitle')}</p>

        <div className={styles.periodToggle} role="group" aria-label={t('pricingPage.periodLabel')}>
          <button
            type="button"
            className={period === 'monthly' ? styles.periodActive : ''}
            onClick={() => setPeriod('monthly')}
          >
            {t('pricingPage.monthly')}
          </button>
          <button
            type="button"
            className={period === 'yearly' ? styles.periodActive : ''}
            onClick={() => setPeriod('yearly')}
          >
            {t('pricingPage.yearly')}
            <span className={styles.saveBadge}>{t('pricingPage.save30')}</span>
          </button>
        </div>
      </header>

      {statusMsg && <div className={styles.status}>{statusMsg}</div>}
      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>{t('common.loading')}</p>
      ) : (
        <div className={styles.grid}>
          {plans.map((plan) => {
            const price = period === 'yearly' ? plan.price_yearly : plan.price_monthly;
            const name = locale === 'ru' ? plan.name_ru : plan.name;
            const tagline = locale === 'ru' ? plan.tagline_ru : plan.tagline;
            const isCurrent = currentSlug === plan.slug;
            const isBusiness = plan.slug === 'business';
            const isPro = plan.slug === 'pro';

            return (
              <article
                key={plan.slug}
                className={`${styles.card} ${isBusiness ? styles.elite : ''} ${isPro ? styles.pro : ''}`}
              >
                <div className={styles.cardTop}>
                  <h2>{name}</h2>
                  {isCurrent && <span className={styles.currentBadge}>{t('pricingPage.current')}</span>}
                </div>
                <p className={styles.tagline}>{tagline}</p>
                <div className={styles.price}>
                  {price <= 0 ? (
                    <span className={styles.priceValue}>{t('pricingPage.free')}</span>
                  ) : (
                    <>
                      <span className={styles.priceValue}>{price.toLocaleString('ru-RU')} ₽</span>
                      <span className={styles.pricePeriod}>
                        / {period === 'yearly' ? t('pricingPage.perYear') : t('pricingPage.perMonth')}
                      </span>
                    </>
                  )}
                </div>
                <p className={styles.priceHint}>
                  {price > 0 && period === 'yearly'
                    ? `≈ ${Math.round(price / 12).toLocaleString('ru-RU')} ₽ / ${t('pricingPage.perMonth')}`
                    : '\u00A0'}
                </p>
                <ul className={styles.features}>
                  {featureRows(plan).map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                {plan.slug === 'free' ? (
                  <button type="button" className={styles.ctaGhost} disabled={isCurrent}>
                    {isCurrent ? t('pricingPage.current') : t('pricingPage.stayFree')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={isBusiness ? styles.ctaElite : styles.cta}
                    disabled={isCurrent || checkoutLoading === plan.slug}
                    onClick={() => handleCheckout(plan.slug)}
                  >
                    {checkoutLoading === plan.slug
                      ? t('pricingPage.redirecting')
                      : isCurrent
                        ? t('pricingPage.current')
                        : t('pricingPage.upgrade', { plan: name })}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className={styles.note}>{t('pricingPage.melodyNote')}</p>
      {!isAuthenticated && (
        <button type="button" className={styles.signIn} onClick={() => navigate('/auth')}>
          {t('pricingPage.signInHint')}
        </button>
      )}
    </div>
  );
};

export default Pricing;
