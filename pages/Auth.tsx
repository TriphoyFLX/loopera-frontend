import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import GoogleSignInButton from '../components/GoogleSignInButton';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useI18n } from '../i18n/useI18n';
import looperaLogo from '../assets/loopera.svg';
import authBg from '../assets/bg.png';
import './Auth.css';

const PARTNERS = ['Spotify', 'YouTube', 'SoundCloud', 'Telegram', 'Beatstars'];

const PartnersCarousel = () => (
  <div className="auth-partners-carousel" aria-hidden="true">
    <div className="auth-partners-track">
      {[...PARTNERS, ...PARTNERS].map((name, index) => (
        <span key={`${name}-${index}`} className="auth-partner-pill">
          {name}
        </span>
      ))}
    </div>
  </div>
);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';
  const { t } = useI18n();

  return (
    <div className="auth-page" style={{ '--auth-bg': `url(${authBg})` } as React.CSSProperties}>
      <div className="auth-lang-switch">
        <LanguageSwitcher />
      </div>
      <div className="auth-card">
        <aside
          className="auth-card-left"
          style={{ backgroundImage: `url(${authBg})` }}
          aria-hidden="true"
        >
          <div className="auth-left-content">
            <div className="auth-left-top">
              <img src={looperaLogo} alt="" className="auth-left-logo" />
              <span className="auth-left-brand">Loopera</span>
            </div>

            <div className="auth-left-middle">
              <p className="auth-eyebrow">{t('auth.eyebrow')}</p>
              <h1 className="auth-left-title">{t('auth.leftTitle')}</h1>
            </div>

            <div className="auth-partners">
              <p className="auth-partners-label">{t('auth.partnersLabel')}</p>
              <PartnersCarousel />
            </div>
          </div>
        </aside>

        <main className="auth-card-right">
          <div className="auth-card-right-inner">
            <div className="auth-mobile-logo">
              <img src={looperaLogo} alt="Loopera" />
              <span>Loopera</span>
            </div>

            <div className="auth-mobile-partners">
              <PartnersCarousel />
            </div>

            <header className="auth-form-header">
              <h2>{isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}</h2>
              <p>{isLogin ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}</p>
            </header>

            <div className="auth-form-body">
              {isLogin ? (
                <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
              ) : (
                <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
              )}
            </div>

            <div className="auth-or">
              <span>{t('common.or')}</span>
            </div>

            <GoogleSignInButton returnTo={returnTo} className="auth-google-btn" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Auth;
