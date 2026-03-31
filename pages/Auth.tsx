import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import looperaLogo from '../assets/loopera.svg';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      {/* ─── LEFT: Branding Panel ─── */}
      <div className="auth-branding">
        <div className="brand-grid" />

        <div className="brand-top">
          <div className="brand-logo-mark">
            <img src={looperaLogo} alt="Loopera" />
          </div>
          <span className="brand-logo-name">Loopera</span>
        </div>

        <div className="brand-middle">
          <h2 className="brand-tagline">
            Музыка, которая<br />
            <em>живёт в тебе.</em>
          </h2>
          <p className="brand-desc">
            Стриминг нового поколения. Умные плейлисты,
            миллионы треков и звук, который ты чувствуешь.
          </p>
        </div>

        <div className="brand-stats">
          <div className="brand-stat">
            <span className="brand-stat-num">80M+</span>
            <span className="brand-stat-label">Треков</span>
          </div>
          <div className="brand-stat">
            <span className="brand-stat-num">5M+</span>
            <span className="brand-stat-label">Слушателей</span>
          </div>
          <div className="brand-stat">
            <span className="brand-stat-num">320kbps</span>
            <span className="brand-stat-label">Качество</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Auth Form ─── */}
      <div className="auth-right">
        <div className="auth-container">
          {/* Mobile-only logo */}
          <div className="auth-logo">
            <img src={looperaLogo} alt="Loopera" className="logo-image" />
            <h1 className="logo-text">Loopera</h1>
          </div>

          <div className="auth-toggle">
            <button
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Вход
            </button>
            <button
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Регистрация
            </button>
          </div>

          <div className="auth-forms">
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;