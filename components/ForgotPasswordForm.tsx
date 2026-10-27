import React, { useState } from 'react';
import { api } from '../utils/api';
import { useI18n } from '../i18n/useI18n';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const { t } = useI18n();
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
      setMessage(t('forgotPassword.success'));
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage(error instanceof Error ? error.message : t('forgotPassword.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const isSuccessMessage = message === t('forgotPassword.success');

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
        {t('forgotPassword.title')}
      </h2>

      {!isCodeSent ? (
        <>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            {t('forgotPassword.subtitle')}
          </p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'block',
                marginBottom: '5px',
                color: '#333',
                fontWeight: '500'
              }}>
                {t('forgotPassword.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('forgotPassword.email')}
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
              {isLoading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
            </button>
          </form>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {t('forgotPassword.success')}
          </p>
        </div>
      )}

      {message && !isCodeSent && (
        <div style={{
          backgroundColor: isSuccessMessage ? '#d4edda' : '#f8d7da',
          color: isSuccessMessage ? '#155724' : '#721c24',
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
          {t('forgotPassword.back')}
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
