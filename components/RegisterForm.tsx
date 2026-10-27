import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import { api } from '../utils/api';
import { consumeAuthReturnTo } from '../hooks/useAuthGate';
import type { RegisterCredentials } from '../types/auth';
import EyeIcon from './EyeIcon';
import VerificationForm from './VerificationForm';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const { login } = useAuth();
  const { t } = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError(t('auth.agreeRequired'));
      return;
    }

    setIsLoading(true);

    try {
      if (credentials.password.length < 6) {
        throw new Error(t('auth.passwordMin'));
      }

      if (credentials.password.length > 128) {
        throw new Error(t('auth.passwordMax'));
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error(t('auth.emailInvalid'));
      }

      if (credentials.username.length < 3) {
        throw new Error(t('auth.usernameMin'));
      }

      if (credentials.username.length > 50) {
        throw new Error(t('auth.usernameMax'));
      }

      const response = await api.register(credentials);

      if (response.requiresVerification) {
        setVerificationEmail(credentials.email);
        setShowVerification(true);
        return;
      }

      if (response.token && response.user) {
        login(response.token, response.user);
        const returnTo = searchParams.get('returnTo') || consumeAuthReturnTo('/');
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <VerificationForm
        email={verificationEmail}
        onSuccess={(token, user) => {
          login(token, user);
          const returnTo = searchParams.get('returnTo') || consumeAuthReturnTo('/');
          navigate(returnTo, { replace: true });
        }}
        onBack={() => {
          setShowVerification(false);
          setVerificationEmail('');
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="username">{t('auth.usernameLabel')}</label>
        <input
          type="text"
          id="username"
          name="username"
          value={credentials.username}
          onChange={handleChange}
          required
          minLength={3}
          placeholder={t('auth.usernamePlaceholder')}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">{t('auth.email')}</label>
        <input
          type="email"
          id="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          required
          placeholder="your@email.com"
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">{t('auth.password')}</label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            minLength={6}
            placeholder={t('auth.passwordMinPlaceholder')}
            disabled={isLoading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            <EyeIcon isOpen={showPassword} size={18} />
          </button>
        </div>
      </div>

      <div className="checkbox-group">
        <input
          type="checkbox"
          id="terms"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={isLoading}
        />
        <label htmlFor="terms">
          {t('auth.agreePrefix')}{' '}
          <Link to="/offer" target="_blank" rel="noreferrer">
            {t('auth.terms')}
          </Link>{' '}
          {t('auth.and')}{' '}
          <Link to="/privacy" target="_blank" rel="noreferrer">
            {t('auth.privacy')}
          </Link>
        </label>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={isLoading} className="auth-button">
        {isLoading ? t('auth.registering') : t('auth.submitRegister')}
      </button>

      {onSwitchToLogin && (
        <p className="auth-switch">
          {t('auth.hasAccount')}{' '}
          <button type="button" onClick={onSwitchToLogin}>
            {t('auth.signIn')}
          </button>
        </p>
      )}
    </form>
  );
};

export default RegisterForm;
