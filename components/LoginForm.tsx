import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import type { LoginCredentials } from '../types/auth';
import EyeIcon from './EyeIcon';
import VerificationForm from './VerificationForm';

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
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Submitting login form with:', { 
        username: credentials.username, 
        password: '***' 
      });
      
      const response = await api.login(credentials.username, credentials.password);
      
      console.log('📦 Full login response:', JSON.stringify(response, null, 2));
      console.log('🔑 requiresVerification:', response.requiresVerification);
      console.log('📧 response.email:', response.email);
      console.log('👤 response.user:', response.user);
      console.log('🎫 response.token:', response.token ? 'exists' : 'missing');
      
      // ПРОВЕРКА: Если ответ содержит email, но не требует верификации
      // ВРЕМЕННОЕ РЕШЕНИЕ для тестирования
      if (response.email && !response.token) {
        console.log('⚠️ Server returned email but no token - forcing verification');
        setVerificationEmail(response.email);
        setShowVerification(true);
        setIsLoading(false);
        return;
      }
      
      if (response.requiresVerification === true) {
        console.log('✅ Verification required, showing form');
        const email = response.email || credentials.username;
        console.log('📧 Setting verification email to:', email);
        setVerificationEmail(email);
        setShowVerification(true);
        setIsLoading(false);
        return;
      }
      
      if (!response.token || !response.user) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('Неверный ответ от сервера');
      }
      
      console.log('✅ Login successful, saving token and user');
      login(response.token, response.user);
      navigate('/');
    } catch (err) {
      console.error('❌ Login form error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  // Временная функция для принудительного показа верификации (для теста)
  const forceShowVerification = () => {
    console.log('🔧 Manually showing verification form');
    setVerificationEmail(credentials.username || 'test@example.com');
    setShowVerification(true);
  };

  return (
    <>
      {/* Debug панель */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        backgroundColor: '#333',
        color: '#0f0',
        padding: '10px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        maxWidth: '300px',
        borderRadius: '4px',
        opacity: 0.9
      }}>
        <div>showVerification: {showVerification ? '✅ YES' : '❌ NO'}</div>
        <div>email: {verificationEmail || 'не задан'}</div>
        <button 
          onClick={forceShowVerification}
          style={{
            marginTop: '5px',
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#ff5722',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🔧 Показать окно верификации
        </button>
      </div>

      {showVerification ? (
        <VerificationForm
          email={verificationEmail}
          onSuccess={(token, user) => {
            console.log('✅ Verification successful, logging in');
            login(token, user);
            navigate('/');
          }}
          onBack={() => {
            console.log('⬅️ Back from verification');
            setShowVerification(false);
            setVerificationEmail('');
          }}
        />
      ) : (
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
              ❌ {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="auth-button"
          >
            {isLoading ? '⏳ Вход...' : '🔑 Войти'}
          </button>

          <p className="auth-note">
            Нет аккаунта? <a href="/register">Зарегистрироваться</a>
          </p>
        </form>
      )}
    </>
  );
};

export default LoginForm;