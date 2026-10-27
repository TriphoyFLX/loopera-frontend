import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import { api } from '../utils/api';
import { consumeAuthReturnTo } from '../hooks/useAuthGate';
import type { LoginCredentials } from '../types/auth';
import EyeIcon from './EyeIcon';
import VerificationForm from './VerificationForm';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

const LoginForm = ({ onSwitchToRegister }: LoginFormProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const { login } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    const storedMessage = sessionStorage.getItem('auth_message');
    if (storedMessage) {
      setError(storedMessage);
      sessionStorage.removeItem('auth_message');
      return;
    }

    if (searchParams.get('expired') === '1') {
      setError(t('auth.sessionExpired'));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.login(credentials.username, credentials.password);

      if (response.requiresVerification === true) {
        setVerificationEmail(response.email || credentials.username);
        setShowVerification(true);
        setIsLoading(false);
        return;
      }

      if (!response.token || !response.user) {
        throw new Error(t('auth.serverError'));
      }

      login(response.token, response.user);
      const returnTo = searchParams.get('returnTo') || consumeAuthReturnTo('/');
      navigate(returnTo, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.loginError');

      if (
        errorMessage.includes('код верификации') ||
        errorMessage.includes('verification') ||
        errorMessage.includes('verify')
      ) {
        setVerificationEmail(credentials.username);
        setShowVerification(true);
        setError(t('auth.verifyCodeRequired'));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = async (token: string, user: any) => {
    login(token, user);
    const returnTo = searchParams.get('returnTo') || consumeAuthReturnTo('/');
    navigate(returnTo, { replace: true });
  };

  if (showVerification) {
    return (
      <VerificationForm
        email={verificationEmail}
        onSuccess={handleVerificationSuccess}
        onBack={() => {
          setShowVerification(false);
          setVerificationEmail('');
          setError('');
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="username">{t('auth.username')}</label>
        <input
          type="text"
          id="username"
          name="username"
          value={credentials.username}
          onChange={handleChange}
          required
          placeholder={t('auth.usernameOrEmailPlaceholder')}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="password">{t('auth.password')}</label>
          <Link to="/forgot-password" className="forgot-link">
            {t('auth.forgotPassword')}
          </Link>
        </div>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            placeholder={t('auth.passwordPlaceholder')}
            disabled={isLoading}
            minLength={6}
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

      {error && (
        <div className={`error-message ${error === t('auth.verifyCodeRequired') ? 'warning' : ''}`}>
          {error}
        </div>
      )}

      <button type="submit" disabled={isLoading} className="auth-button">
        {isLoading ? t('auth.signingIn') : t('auth.submitLogin')}
      </button>

      {onSwitchToRegister && (
        <p className="auth-switch">
          {t('auth.noAccount')}{' '}
          <button type="button" onClick={onSwitchToRegister}>
            {t('auth.register')}
          </button>
        </p>
      )}
    </form>
  );
};

export default LoginForm;
