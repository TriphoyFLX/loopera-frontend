import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import './PaywallModal.css';

export type PaywallAction = 'upload' | 'download' | 'looptok' | 'generic';

type Props = {
  open: boolean;
  onClose: () => void;
  action?: PaywallAction;
  plan?: string;
  message?: string;
};

const PaywallModal = ({ open, onClose, action = 'generic', plan, message }: Props) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  if (!open) return null;

  const actionKey =
    action === 'upload' || action === 'download' || action === 'looptok'
      ? `paywall.action_${action}`
      : 'paywall.action_generic';

  return (
    <div className="paywall-overlay" onClick={onClose} role="presentation">
      <div
        className="paywall-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        <button type="button" className="paywall-close" onClick={onClose} aria-label={t('common.close')}>
          ×
        </button>
        <p className="paywall-eyebrow">{t('paywall.eyebrow')}</p>
        <h2 id="paywall-title">{t('paywall.title')}</h2>
        <p className="paywall-body">
          {message || t(actionKey)}
          {plan && plan !== 'free' ? ` (${plan.toUpperCase()})` : ''}
        </p>
        <div className="paywall-actions">
          <button
            type="button"
            className="paywall-cta"
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
          >
            {t('paywall.cta')}
          </button>
          <button type="button" className="paywall-secondary" onClick={onClose}>
            {t('paywall.later')}
          </button>
        </div>
      </div>
    </div>
  );
};

export function isPlanLimitError(err: unknown): err is Error & {
  code?: string;
  action?: PaywallAction;
  plan?: string;
} {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'PLAN_LIMIT'
  );
}

export default PaywallModal;
