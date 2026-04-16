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
      console.log('Submitting login form with:', { 
        username: credentials.username, 
        password: '***' 
      });
      
      const response = await api.login(credentials.username, credentials.password);
      
      console.log('Login response:', response);
      
      if (response.requiresVerification) {
        // Показываем форму верификации
        setVerificationEmail(response.email || credentials.username);
        setShowVerification(true);
        return;
      }
      
      if (!response.token || !response.user) {
        throw new Error('Неверный ответ от сервера');
      }
      
      login(response.token, response.user);
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
      {showVerification ? (
        <VerificationForm
          email={verificationEmail}
          onSuccess={(token, user) => {
            login(token, user);
            navigate('/');
          }}
          onBack={() => {
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