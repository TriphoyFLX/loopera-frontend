import React, { useState } from 'react';
import { api } from '../utils/api';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await api.forgotPassword(email);
      setIsCodeSent(true);
      setMessage('✅ Код для сброса пароля отправлен на вашу почту');
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage(error instanceof Error ? error.message : 'Ошибка при отправке кода');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '30px',
      border: '1px solid #e1e5e9',
      borderRadius: '8px',
      backgroundColor: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{
        textAlign: 'center',
        marginBottom: '20px',
        color: '#333'
      }}>
        🔐 Восстановление пароля
      </h2>

      {!isCodeSent ? (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '5px',
              color: '#333',
              fontWeight: '500'
            }}>
              Email адрес
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Введите ваш email"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e1e5e9',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '⏳ Отправка...' : '📧 Отправить код'}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            ✅ Код отправлен!
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Проверьте вашу почту <strong>{email}</strong> и введите код из письма.
          </p>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '10px' }}>
            Если письмо не пришло в течение 5 минут, проверьте папку "Спам".
          </p>
        </div>
      )}

      {message && (
        <div style={{
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          padding: '12px',
          borderRadius: '6px',
          marginTop: '15px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ⬅️ Назад
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
