import React, { useState } from 'react';
import { api } from '../utils/api';
import { useI18n } from '../i18n/useI18n';

interface VerificationFormProps {
  email: string;
  onSuccess: (token: string, user: any) => void;
  onBack: () => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({ 
  email, 
  onSuccess, 
  onBack 
}) => {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);

  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.verifyEmail(email, code);
      
      if (response.token && response.user) {
        onSuccess(response.token, response.user);
      } else {
        throw new Error(t('verification.serverError'));
      }
    } catch (err) {
      console.error('❌ Verification error:', err);
      setError(err instanceof Error ? err.message : t('verification.verifyError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setError('');
      setSuccess('');
      setIsLoading(true);
      
      await api.resendVerificationCode(email);
      
      setTimeLeft(600);
      setCanResend(false);
      setSuccess(t('verification.resendOk', { email }));
    } catch (err) {
      console.error('❌ Resend code error:', err);
      setError(err instanceof Error ? err.message : t('verification.resendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="verification-form">
      <h2>{t('verification.title')}</h2>
      <p className="verification-subtitle">
        {t('verification.subtitle')} <strong>{email}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="code">{t('verification.codeLabel')}</label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength={6}
            required
            disabled={isLoading}
            className="verification-input"
            style={{ 
              fontSize: '24px', 
              letterSpacing: '8px', 
              textAlign: 'center',
              fontFamily: 'monospace'
            }}
            autoFocus
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="error-message success">
            {success}
          </div>
        )}

        <div className="verification-timer">
          {timeLeft > 0 ? (
            <p>{t('verification.expiresIn', { time: formatTime(timeLeft) })}</p>
          ) : (
            <p className="expired">{t('verification.expired')}</p>
          )}
        </div>

        <div className="verification-actions">
          <button
            type="button"
            onClick={onBack}
            className="auth-button-secondary"
            disabled={isLoading}
          >
            {t('verification.back')}
          </button>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="auth-button"
            style={{ flex: 1 }}
          >
            {isLoading ? t('verification.checking') : t('verification.confirm')}
          </button>
        </div>

        <div className="resend-section">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading || !canResend}
            className="forgot-link"
            style={{
              border: 'none',
              background: 'none',
              cursor: canResend ? 'pointer' : 'not-allowed',
              opacity: canResend ? 1 : 0.5,
              width: '100%',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            {canResend
              ? t('verification.resend')
              : t('verification.resendWait', { time: formatTime(timeLeft) })}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm;
