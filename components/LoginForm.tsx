import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import type { LoginCredentials } from '../types/auth';
import EyeIcon from './EyeIcon';

const LoginForm = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.verifyEmail(verificationEmail, verificationCode);
      
      if (response.token && response.user) {
        login(response.token, response.user);
        navigate('/');
      } else {
        throw new Error('Неверный код верификации');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка верификации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    console.log('DEBUG: handleResendCode called, verificationEmail:', verificationEmail);

    try {
      if (!verificationEmail) {
        throw new Error('Email не найден. Попробуйте войти снова.');
      }
      
      await api.resendVerificationCode(verificationEmail);
      setError('Код отправлен повторно. Проверьте почту.');
    } catch (err) {
      console.error('Resend code error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при отправке кода. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Submitting login form with:', { 
        username: credentials.username, 
        password: '***' 
      });
      
      const response = await api.login(credentials.username, credentials.password);
      
      console.log('Login response:', response);
      console.log('Response requiresVerification:', response.requiresVerification);
      console.log('Response email:', response.email);
      
      if (response.requiresVerification) {
        // Если требуется верификация email, показываем модальное окно
        console.log('✅ DEBUG: requiresVerification = true, showing verification modal');
        const email = response.email || credentials.username;
        console.log('✅ DEBUG: Setting verificationEmail to:', email);
        setVerificationEmail(email);
        setError(`Введите код верификации из письма, отправленного на ${email}`);
        console.log('✅ DEBUG: About to set showVerification to true');
        setShowVerification(true);
        console.log('✅ DEBUG: showVerification set to true');
        return;
      }
      
      if (!response.token || !response.user) {
        throw new Error('Неверный ответ от сервера');
      }
      
      login(response.token, response.user);
      console.log('Login successful, navigating to home...');
      navigate('/');
    } catch (err) {
      console.error('Login form error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Debug информация */}
      <div style={{ 
        backgroundColor: '#ffeb3b', 
        padding: '10px', 
        fontSize: '14px', 
        margin: '10px 0',
        borderRadius: '4px',
        border: '2px solid #fbc02d'
      }}>
        🐛 DEBUG: showVerification = {showVerification.toString()}, verificationEmail = {verificationEmail}
      </div>

      {/* Modal для верификации кода */}
      {showVerification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxWidth: '400px',
            width: '90%',
            position: 'relative'
          }}>
            {/* Кнопка закрытия */}
            <button
              onClick={() => setShowVerification(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>

            <h2 style={{
              textAlign: 'center',
              margin: '0 0 10px 0',
              color: '#333',
              fontSize: '24px'
            }}>
              📧 Подтверждение email
            </h2>
            
            <p style={{
              textAlign: 'center',
              margin: '0 0 30px 0',
              color: '#666',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Мы отправили код верификации на<br />
              <strong>{verificationEmail}</strong>
            </p>

            <form onSubmit={handleVerificationSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Код верификации
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  placeholder="Введите 6-значный код"
                  disabled={isLoading}
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    textAlign: 'center',
                    letterSpacing: '8px',
                    fontWeight: 'bold',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.target as HTMLElement).style.borderColor = '#ff2a55'}
                  onBlur={(e) => (e.target as HTMLElement).style.borderColor = '#e1e5e9'}
                />
              </div>

              {error && (
                <div style={{
                  backgroundColor: '#fee',
                  color: '#c33',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#ff2a55',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  marginBottom: '10px'
                }}
                onMouseOver={(e) => !isLoading && ((e.target as HTMLElement).style.backgroundColor = '#e02446')}
                onMouseOut={(e) => !isLoading && ((e.target as HTMLElement).style.backgroundColor = '#ff2a55')}
              >
                {isLoading ? 'Проверка...' : 'Подтвердить'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => !isLoading && ((e.target as HTMLElement).style.backgroundColor = '#f8f9fa')}
                onMouseOut={(e) => !isLoading && ((e.target as HTMLElement).style.backgroundColor = 'transparent')}
              >
                {isLoading ? 'Отправка...' : 'Отправить код повторно'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Основная форма входа */}
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Вход</h2>
        
        <div className="form-group">
          <label htmlFor="username">Имя пользователя или Email</label>
          <input
            type="text"
            id="username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            required
            placeholder="Введите имя пользователя или email"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Введите пароль"
              disabled={isLoading}
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            >
              <EyeIcon isOpen={showPassword} size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className="auth-button">
        {isLoading ? 'Вход...' : 'Войти'}
      </button>

      {/* Кнопка для принудительного показа модального окна */}
      <button 
        type="button" 
        onClick={() => {
          console.log('🔧 Принудительный показ модального окна');
          setVerificationEmail('test@example.com');
          setShowVerification(true);
        }} 
        disabled={isLoading} 
        className="auth-button secondary"
        style={{ marginTop: '10px', backgroundColor: '#ff5722' }}
      >
        🔧 Показать окно верификации
      </button>

              </form>
    </>
  );
};

export default LoginForm;