import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RecentLoops from '../components/RecentLoops';
import SubscribedLoops from '../components/SubscribedLoops';
import PopularHashtags from '../components/PopularHashtags';
import './Loops.css';

const Loops: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');
  
  // Поиск по артисту
  const [artistSearch, setArtistSearch] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // лимиты
  const [freshLimit, setFreshLimit] = useState(8);
  const [popularLimit, setPopularLimit] = useState(8);
  const [fastLimit, setFastLimit] = useState(8);
  const [subLimit, setSubLimit] = useState(8);

  return (
    <div className="loops-page">
      {/* Hero */}
      <section className="loops-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            {tag ? `#${tag}` : 'Лупы'}<span className="hero-title-accent">.</span>
          </h1>
          <p className="hero-subtitle">
            {tag 
              ? `Лупы с тегом #${tag}`
              : 'Откройте для себя тысячи профессиональных лупов от лучших продюсеров'
            }
          </p>

          {/* Поиск по артисту */}
          <div className="hero-artist-search">
            <input
              type="text"
              placeholder="Введите артиста в стиле которого хотите луп..."
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setIsSearching(!isSearching)}
              className="artist-search-input"
            />
            <button 
              className="artist-search-button"
              onClick={() => setIsSearching(!isSearching)}
            >
              🎵 Найти
            </button>
          </div>

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

        {/* Популярные хэштеги */}
        <section className="loops-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-badge">Хэштеги</span>
              <h2 className="section-title">
                Популярные <span className="title-accent">хэштеги</span>
              </h2>
            </div>
            <p className="section-description">
              Трендовые теги этой недели
            </p>
          </div>
          <PopularHashtags />
        </section>

        {/* Свежие лупы */}
        <section className="loops-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-badge">Новинки</span>
              <h2 className="section-title">
                Свежие <span className="title-accent">лупы</span>
              </h2>
            </div>
            <p className="section-description">
              Только что загруженные лупы от продюсеров
            </p>
          </div>

          <RecentLoops
            limit={freshLimit}
            showAllButton={false}
            type="all"
            title=""
            sortBy="created_at"
            tag={tag || undefined}
            search={isSearching ? artistSearch || undefined : undefined}
          />

          <button
            className="load-more"
            onClick={() => setFreshLimit(prev => prev + 8)}
          >
            Загрузить ещё
          </button>
        </section>

        {/* Популярные лупы */}
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
            limit={popularLimit}
            showAllButton={false}
            type="all"
            title=""
            sortBy="likes"
            tag={tag || undefined}
            search={isSearching ? artistSearch || undefined : undefined}
          />

          <button
            className="load-more"
            onClick={() => setPopularLimit(prev => prev + 8)}
          >
            Загрузить ещё
          </button>
        </section>

        {/* Быстрые лупы (High BPM) */}
        <section className="loops-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-badge">Быстрые</span>
              <h2 className="section-title">
                Быстрые <span className="title-accent">лупы</span>
              </h2>
            </div>
            <p className="section-description">
              Энергичные лупы с высоким темпом
            </p>
          </div>

          <RecentLoops
            limit={fastLimit}
            showAllButton={false}
            type="all"
            title=""
            sortBy="created_at"
            minBpm={120}
            tag={tag || undefined}
            search={isSearching ? artistSearch || undefined : undefined}
          />

          <button
            className="load-more"
            onClick={() => setFastLimit(prev => prev + 8)}
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