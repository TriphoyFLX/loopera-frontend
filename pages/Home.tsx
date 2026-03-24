import RecentLoops from '../components/RecentLoops';
import SubscribedLoops from '../components/SubscribedLoops';
import TopLoopmakers from '../components/TopLoopmakers';
import { useAuth } from '../hooks/useAuth';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero секция */}
      <section className="home-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Loopera<span className="hero-accent">.</span>
          </h1>
          <p className="hero-subtitle">
            Откройте для себя тысячи профессиональных лупов от лучших продюсеров
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">10k+</span>
              <span className="stat-label">лупов</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">500+</span>
              <span className="stat-label">продюсеров</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">24/7</span>
              <span className="stat-label">новые лупы</span>
            </div>
          </div>
          <div className="hero-actions">
            {user ? (
              <>
                <a href="/loops" className="btn btn-primary">
                  Исследовать лупы
                </a>
                <a href="/loop-upload" className="btn btn-secondary">
                  Загрузить свой луп
                </a>
              </>
            ) : (
              <>
                <a href="/auth" className="btn btn-primary">
                  Начать сейчас
                </a>
                <a href="/loops" className="btn btn-outline">
                  Смотреть лупы
                </a>
              </>
            )}
          </div>
        </div>
        <div className="hero-decoration">
          <div className="decoration-circle"></div>
          <div className="decoration-circle"></div>
          <div className="decoration-circle"></div>
        </div>
      </section>

      {/* Популярные лупы */}
      <section className="home-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <span className="section-badge">Популярное</span>
            <h2 className="section-title">
              Популярные <span className="title-accent">лупы</span>
            </h2>
          </div>
          <p className="section-description">
            Самые скачиваемые лупы этой недели
          </p>
        </div>
        <RecentLoops limit={6} showAllButton={true} type="all" title="" />
      </section>

      {/* Лупы для вас (только для авторизованных) */}
      {user && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-badge">Рекомендации</span>
              <h2 className="section-title">
                Лупы <span className="title-accent">для вас</span>
              </h2>
            </div>
            <p className="section-description">
              Лупы от артистов, на которых вы подписаны
            </p>
          </div>
          <SubscribedLoops limit={6} showAllButton={false} />
        </section>
      )}

      {/* Топ лупмейкеры */}
      <section className="home-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <span className="section-badge">Топ</span>
            <h2 className="section-title">
              Топ <span className="title-accent">лупмейкеры</span>
            </h2>
          </div>
          <p className="section-description">
            Лучшие продюсеры по количеству лупов и лайков
          </p>
        </div>
        <TopLoopmakers limit={6} />
      </section>

      {/* Фичи */}
      <section className="home-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <span className="section-badge">Возможности</span>
            <h2 className="section-title">
              Почему <span className="title-accent">Loopera</span>
            </h2>
          </div>
          <p className="section-description">
            Инструменты для продюсеров и битмейкеров
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎵</div>
            <h3 className="feature-title">Библиотека лупов</h3>
            <p className="feature-description">
              Тысячи качественных лупов в разных жанрах от профессиональных продюсеров
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔥</div>
            <h3 className="feature-title">Подписки на артистов</h3>
            <p className="feature-description">
              Следите за любимыми продюсерами и получайте их новые лупы первыми
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3 className="feature-title">Сообщество</h3>
            <p className="feature-description">
              Общайтесь с другими продюсерами, обменивайтесь опытом и находите коллаборации
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📤</div>
            <h3 className="feature-title">Загрузка лупов</h3>
            <p className="feature-description">
              Делитесь своими творениями с сообществом и получайте обратную связь
            </p>
          </div>
        </div>
      </section>

      {/* CTA секция */}
      {!user && (
        <section className="home-cta">
          <div className="cta-content">
            <h2 className="cta-title">
              Готовы создать свой следующий хит?
            </h2>
            <p className="cta-subtitle">
              Присоединяйтесь к тысячам продюсеров, которые уже используют Loopera
            </p>
            <div className="cta-actions">
              <a href="/auth" className="btn btn-primary btn-large">
                Создать аккаунт
              </a>
              <a href="/loops" className="btn btn-outline btn-large">
                Смотреть лупы
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
