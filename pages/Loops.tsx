import React, { useState } from 'react';
import RecentLoops from '../components/RecentLoops';
import SubscribedLoops from '../components/SubscribedLoops';
import './Loops.css';

const Loops: React.FC = () => {
  // лимиты
  const [recentLimit, setRecentLimit] = useState(8);
  const [subLimit, setSubLimit] = useState(8);

  return (
    <div className="loops-page">
      {/* Hero */}
      <section className="loops-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Лупы<span className="hero-title-accent">.</span>
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
        </div>

        <div className="hero-decoration">
          <div className="decoration-circle"></div>
          <div className="decoration-circle"></div>
          <div className="decoration-circle"></div>
        </div>
      </section>

      {/* Контент */}
      <div className="loops-content">

        {/* Популярные */}
        <section className="loops-section">
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

          <RecentLoops
            limit={recentLimit}
            showAllButton={false}
            type="all"
            title=""
          />

          <button
            className="load-more"
            onClick={() => setRecentLimit(prev => prev + 8)}
          >
            Загрузить ещё
          </button>
        </section>

        {/* Подписки */}
        <section className="loops-section">
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

          <SubscribedLoops
            limit={subLimit}
            showAllButton={false}
          />

          <button
            className="load-more"
            onClick={() => setSubLimit(prev => prev + 8)}
          >
            Загрузить ещё
          </button>
        </section>

      </div>
    </div>
  );
};

export default Loops;