import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import type { RegisterCredentials } from '../types/auth';
import EyeIcon from './EyeIcon';
import VerificationForm from './VerificationForm';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '',
    email: '',
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
      console.log('Submitting register form with:', { 
        username: credentials.username,
        email: credentials.email,
        password: '***' 
      });
      
      // Валидация
      if (credentials.password.length < 6) {
        throw new Error('Пароль должен содержать минимум 6 символов');
      }

      if (credentials.password.length > 128) {
        throw new Error('Пароль не должен превышать 128 символов');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error('Введите корректный email адрес');
      }

      if (credentials.username.length < 3) {
        throw new Error('Имя пользователя должно содержать минимум 3 символа');
      }

      if (credentials.username.length > 50) {
        throw new Error('Имя пользователя не должно превышать 50 символов');
      }
      
      const response = await api.register(credentials);
      
      console.log('Register response:', response);
      
      if (response.requiresVerification) {
        // Показываем форму верификации для новых пользователей
        setVerificationEmail(credentials.email);
        setShowVerification(true);
        return;
      }
      
      // Если верификация не требуется (старый режим)
      if (response.token && response.user) {
        login(response.token, response.user);
        navigate('/');
      }
    } catch (err) {
      console.error('Register form error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
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
          <h2>Регистрация</h2>
          
          <div className="form-group">
            <label htmlFor="username">Имя пользователя *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              minLength={3}
              placeholder="Минимум 3 символа"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
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
            <label htmlFor="password">Пароль *</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Минимум 6 символов"
                disabled={isLoading}
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
            {isLoading ? '⏳ Регистрация...' : '📝 Зарегистрироваться'}
          </button>

          <p className="auth-note">
            Уже есть аккаунт? <a href="/login">Войти</a>
          </p>
        </form>
      )}
    </>
  );
};

export default RegisterForm;