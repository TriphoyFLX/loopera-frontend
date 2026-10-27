import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { getLoopCoverColor, getLoopCoverUrl } from '../utils/loopCover';
import { getUploadsUrl } from '../utils/urls';
import { loopDetailPath } from '../utils/routes';
import styles from './HomeHero.module.css';

type FeaturedLoop = {
  id: number;
  title: string;
  author?: string;
  filename: string;
  cover_url?: string | null;
};

const HomeHero = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [loop, setLoop] = useState<FeaturedLoop | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (isAuthenticated && token) {
          const data = await api.getForYouLoops(1, 1, token);
          if (!cancelled && data?.loops?.[0]) {
            setLoop(data.loops[0]);
            return;
          }
        }
        const trending = await api.getAllLoops(1, 1, token || undefined, 'trending');
        if (!cancelled && trending?.loops?.[0]) {
          setLoop(trending.loops[0]);
          return;
        }
        const fresh = await api.getAllLoops(1, 1, token || undefined, 'created_at');
        if (!cancelled && fresh?.loops?.[0]) {
          setLoop(fresh.loops[0]);
        }
      } catch {
        /* empty hero media */
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  useEffect(() => () => {
    audio?.pause();
  }, [audio]);

  const coverUrl = useMemo(() => (loop ? getLoopCoverUrl(loop) : null), [loop]);
  const coverColor = useMemo(() => getLoopCoverColor(loop?.id ?? 1), [loop?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const togglePlay = () => {
    if (!loop) return;
    if (playing && audio) {
      audio.pause();
      setPlaying(false);
      return;
    }

    const next = audio ?? new Audio(getUploadsUrl(loop.filename));
    if (!audio) {
      next.addEventListener('ended', () => setPlaying(false));
      setAudio(next);
    }
    void next.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  return (
    <section className={styles.hero}>
      <div className={styles.banner}>
        <div
          className={styles.media}
          style={
            coverUrl
              ? { backgroundImage: `url(${coverUrl})` }
              : { backgroundColor: coverColor }
          }
          aria-hidden="true"
        />
        <div className={styles.fade} aria-hidden="true" />

        <div className={styles.copy}>
          <h2 className={styles.headline}>Найди бит</h2>

          <form className={styles.search} onSubmit={handleSearch}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="В каком тайпе вы пишите"
              aria-label="Поиск"
            />
            <button type="submit">Поиск</button>
          </form>
        </div>

        {loop && (
          <div className={styles.featured}>
            <button
              type="button"
              className={styles.meta}
              onClick={() => navigate(loopDetailPath(loop.id))}
            >
              <span className={styles.metaTitle}>{loop.title}</span>
              <span className={styles.metaAuthor}>{loop.author || 'loopera'}</span>
            </button>
            <button
              type="button"
              className={`${styles.play} ${playing ? styles.playing : ''}`}
              onClick={togglePlay}
              aria-label={playing ? 'Пауза' : 'Слушать луп'}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeHero;
