import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RecentLoops from '../components/RecentLoops';
import SubscribedLoops from '../components/SubscribedLoops';
import './Loops.css';

const Loops: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');
  
  // Фильтры
  const [genre, setGenre] = useState<string>('');
  const [minBpm, setMinBpm] = useState<number | ''>('');
  const [maxBpm, setMaxBpm] = useState<number | ''>('');
  const [key, setKey] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  
  // лимиты
  const [recentLimit, setRecentLimit] = useState(8);
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

          {/* Поисковая строка */}
          <div className="hero-search">
            <input
              type="text"
              placeholder="Поиск по названию или автору..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button className="search-button">🔍</button>
          </div>

          {/* Фильтры */}
          <div className="hero-filters">
            <select 
              value={genre} 
              onChange={(e) => setGenre(e.target.value)}
              className="filter-select"
            >
              <option value="">Все жанры</option>
              <option value="trap">Trap</option>
              <option value="drill">Drill</option>
              <option value="lofi">Lo-Fi</option>
              <option value="hiphop">Hip-Hop</option>
              <option value="rnb">R&B</option>
              <option value="electronic">Electronic</option>
              <option value="pop">Pop</option>
              <option value="synthwave">Synthwave</option>
            </select>

            <select 
              value={key} 
              onChange={(e) => setKey(e.target.value)}
              className="filter-select"
            >
              <option value="">Все тональности</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>

            <div className="bpm-filters">
              <input
                type="number"
                placeholder="Min BPM"
                value={minBpm}
                onChange={(e) => setMinBpm(e.target.value ? parseInt(e.target.value) : '')}
                className="bpm-input"
                min="60"
                max="200"
              />
              <span className="bpm-separator">-</span>
              <input
                type="number"
                placeholder="Max BPM"
                value={maxBpm}
                onChange={(e) => setMaxBpm(e.target.value ? parseInt(e.target.value) : '')}
                className="bpm-input"
                min="60"
                max="200"
              />
            </div>

            <button 
              onClick={() => {
                setGenre('');
                setMinBpm('');
                setMaxBpm('');
                setKey('');
                setSearch('');
              }}
              className="reset-filters"
            >
              Сбросить
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
            tag={tag || undefined}
            genre={genre || undefined}
            minBpm={minBpm || undefined}
            maxBpm={maxBpm || undefined}
            key={key || undefined}
            search={search || undefined}
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

        {/* По жанрам */}
        <section className="loops-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-badge">Жанры</span>
              <h2 className="section-title">
                Лупы по <span className="title-accent">жанрам</span>
              </h2>
            </div>
            <p className="section-description">
              Найдите лупы в любимом жанре
            </p>
          </div>

          <div className="genre-grid">
            <div className="genre-card" onClick={() => setGenre('trap')}>
              <span className="genre-emoji">🔥</span>
              <span className="genre-name">Trap</span>
            </div>
            <div className="genre-card" onClick={() => setGenre('drill')}>
              <span className="genre-emoji">🎯</span>
              <span className="genre-name">Drill</span>
            </div>
            <div className="genre-card" onClick={() => setGenre('lofi')}>
              <span className="genre-emoji">🌙</span>
              <span className="genre-name">Lo-Fi</span>
            </div>
            <div className="genre-card" onClick={() => setGenre('hiphop')}>
              <span className="genre-emoji">🎤</span>
              <span className="genre-name">Hip-Hop</span>
            </div>
            <div className="genre-card" onClick={() => setGenre('rnb')}>
              <span className="genre-emoji">💕</span>
              <span className="genre-name">R&B</span>
            </div>
            <div className="genre-card" onClick={() => setGenre('electronic')}>
              <span className="genre-emoji">🎹</span>
              <span className="genre-name">Electronic</span>
            </div>
          </div>
        </section>

        {/* По BPM */}
        <section className="loops-section">
          <div className="section-header">
            <div className="section-title-wrapper">
              <span className="section-badge">BPM</span>
              <h2 className="section-title">
                Лупы по <span className="title-accent">темпу</span>
              </h2>
            </div>
            <p className="section-description">
              Выберите подходящий темп для вашего трека
            </p>
          </div>

          <div className="bpm-grid">
            <div className="bpm-card" onClick={() => { setMinBpm(80); setMaxBpm(90); }}>
              <span className="bpm-range">80-90</span>
              <span className="bpm-label">Chill</span>
            </div>
            <div className="bpm-card" onClick={() => { setMinBpm(90); setMaxBpm(100); }}>
              <span className="bpm-range">90-100</span>
              <span className="bpm-label">Mid</span>
            </div>
            <div className="bpm-card" onClick={() => { setMinBpm(100); setMaxBpm(110); }}>
              <span className="bpm-range">100-110</span>
              <span className="bpm-label">Upbeat</span>
            </div>
            <div className="bpm-card" onClick={() => { setMinBpm(110); setMaxBpm(120); }}>
              <span className="bpm-range">110-120</span>
              <span className="bpm-label">Fast</span>
            </div>
            <div className="bpm-card" onClick={() => { setMinBpm(120); setMaxBpm(200); }}>
              <span className="bpm-range">120+</span>
              <span className="bpm-label">Hard</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Loops;