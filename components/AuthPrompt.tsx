import GoogleSignInButton from './GoogleSignInButton';
import type { AuthGateFeature } from '../hooks/useAuthGate';
import { useI18n } from '../i18n/useI18n';

type AuthGateIcon = 'download' | 'buy' | 'upload' | 'profile' | 'chats' | 'lock';

const FEATURE_KEYS: Record<
  AuthGateFeature,
  { titleKey: string; subtitleKey: string; icon: AuthGateIcon }
> = {
  download: {
    titleKey: 'authGate.downloadTitle',
    subtitleKey: 'authGate.downloadSubtitle',
    icon: 'download',
  },
  buy: {
    titleKey: 'authGate.buyTitle',
    subtitleKey: 'authGate.buySubtitle',
    icon: 'buy',
  },
  upload: {
    titleKey: 'authGate.uploadTitle',
    subtitleKey: 'authGate.uploadSubtitle',
    icon: 'upload',
  },
  profile: {
    titleKey: 'authGate.profileTitle',
    subtitleKey: 'authGate.profileSubtitle',
    icon: 'profile',
  },
  chats: {
    titleKey: 'authGate.chatsTitle',
    subtitleKey: 'authGate.chatsSubtitle',
    icon: 'chats',
  },
  like: {
    titleKey: 'authGate.defaultTitle',
    subtitleKey: 'authGate.defaultSubtitle',
    icon: 'lock',
  },
  default: {
    titleKey: 'authGate.defaultTitle',
    subtitleKey: 'authGate.defaultSubtitle',
    icon: 'lock',
  },
};

const Icon = ({ type }: { type: AuthGateIcon }) => {
  switch (type) {
    case 'download':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );
    case 'buy':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M6 6h15l-1.5 9h-12z" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M6 6L5 3H2" />
        </svg>
      );
    case 'upload':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 16V4" />
          <path d="M8 8l4-4 4 4" />
          <path d="M4 20h16" />
        </svg>
      );
    case 'chats':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
        </svg>
      );
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.5-4 6-6 8-6s6.5 2 8 6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 118 0v3" />
        </svg>
      );
  }
};

interface AuthPromptProps {
  feature?: AuthGateFeature;
  variant?: 'page' | 'sheet' | 'inline';
  returnTo?: string;
  onLogin?: () => void;
  onGuest?: () => void;
}

const AuthPrompt = ({
  feature = 'default',
  variant = 'page',
  returnTo = '/',
  onLogin,
  onGuest,
}: AuthPromptProps) => {
  const { t } = useI18n();
  const copy = FEATURE_KEYS[feature];

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
      return;
    }
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className={`auth-prompt auth-prompt--${variant}`}>
      <div className="auth-prompt-card">
        <div className="auth-prompt-icon">
          <Icon type={copy.icon} />
        </div>
        <h2 className="auth-prompt-title">{t(copy.titleKey)}</h2>
        <p className="auth-prompt-subtitle">{t(copy.subtitleKey)}</p>

        <div className="auth-prompt-actions">
          <button type="button" className="auth-prompt-primary" onClick={handleLogin}>
            {t('authGate.signInBtn')}
          </button>
          <GoogleSignInButton returnTo={returnTo} />
          {variant !== 'page' && onGuest && (
            <button type="button" className="auth-prompt-ghost" onClick={onGuest}>
              {t('authGate.continueBrowsing')}
            </button>
          )}
          {variant === 'page' && (
            <button type="button" className="auth-prompt-ghost" onClick={() => { window.location.href = '/loops'; }}>
              {t('authGate.browseWithoutLogin')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPrompt;
