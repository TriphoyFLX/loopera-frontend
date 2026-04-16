import React, { useState } from 'react';
import { api } from '../utils/api';

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
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 минут в секундах
  const [canResend, setCanResend] = useState(false);

  // Таймер обратного отсчета
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
    setIsLoading(true);

    try {
      console.log('🔐 Verifying email:', email, 'with code:', code);
      const response = await api.verifyEmail(email, code);
      
      console.log('✅ Verification response:', response);
      
      if (response.token && response.user) {
        onSuccess(response.token, response.user);
      } else {
        throw new Error('Неверный ответ от сервера');
      }
    } catch (err) {
      console.error('❌ Verification error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка верификации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      console.log('📧 Resending verification code to:', email);
      
      // Исправлено: используем правильный метод API
      await api.resendVerificationCode(email);
      
      // Сбрасываем таймер
      setTimeLeft(600);
      setCanResend(false);
      setError('✅ Код отправлен повторно на ' + email);
    } catch (err) {
      console.error('❌ Resend code error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка отправки кода');
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
      <h2>Подтвердите email</h2>
      <p className="verification-subtitle">
        Мы отправили 6-значный код на <strong>{email}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="code">Код верификации</label>
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
          <div className="error-message" style={{ 
            color: error.startsWith('✅') ? '#28a745' : '#dc3545' 
          }}>
            {error}
          </div>
        )}

        <div className="verification-timer">
          {timeLeft > 0 ? (
            <p>Код истечет через: {formatTime(timeLeft)}</p>
          ) : (
            <p style={{ color: '#dc3545' }}>Код истек. Отправьте новый.</p>
          )}
        </div>

        <div className="verification-actions">
          <button 
            type="button" 
            onClick={onBack}
            className="btn btn-outline"
            disabled={isLoading}
          >
            ← Назад
          </button>
          
          <button 
            type="submit" 
            disabled={isLoading || code.length !== 6}
            className="btn btn-primary"
          >
            {isLoading ? '⏳ Проверка...' : '✓ Подтвердить'}
          </button>
        </div>

        <div className="resend-section" style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading || !canResend}
            className="btn btn-link"
            style={{
              opacity: canResend ? 1 : 0.5,
              cursor: canResend ? 'pointer' : 'not-allowed'
            }}
          >
            {canResend ? '📧 Отправить код повторно' : `Повторная отправка через ${formatTime(timeLeft)}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm;