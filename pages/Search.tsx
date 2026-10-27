import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchApi } from '../utils/searchApi';
import { getUploadsUrl } from '../utils/urls';
import { profilePath } from '../utils/routes';
import { useI18n } from '../i18n/useI18n';
import LoopCard from '../components/LoopCard';
import styles from './Search.module.css';

interface Loop {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  file_size: number;
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  user_id: number;
  author?: string;
  author_id?: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  created_at?: string;
  loop_count?: number;
}

const Search: React.FC = () => {
  const { t, locale } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [searchType, setSearchType] = useState<'loops' | 'users'>('loops');
  const [loops, setLoops] = useState<Loop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const q = searchQuery.trim();

    if (!q) {
      setLoops([]);
      setUsers([]);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        if (searchType === 'loops') {
          const response = await searchApi.searchLoops(q);
          if (requestId !== requestIdRef.current) return;
          setLoops((response.loops || []) as Loop[]);
          setUsers([]);
        } else {
          const response = await searchApi.searchArtists(q);
          if (requestId !== requestIdRef.current) return;
          setUsers(
            (response.artists || []).map((artist) => ({
              id: artist.id,
              username: artist.username,
              loop_count: artist.loops_count,
            })),
          );
          setLoops([]);
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Ошибка поиска');
        setLoops([]);
        setUsers([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  const updateQuery = (value: string) => {
    setSearchQuery(value);
    const trimmed = value.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handlePlay = async (loop: Loop) => {
    try {
      if (currentlyPlaying === loop.id && isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      setAudioLoading(loop.id);
      const audio = new Audio(getUploadsUrl(loop.filename));
      audioRef.current = audio;

      audio.addEventListener('canplay', () => {
        void audio.play();
        setCurrentlyPlaying(loop.id);
        setIsPlaying(true);
        setAudioLoading(null);
      });
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        setAudioLoading(null);
      });
      audio.addEventListener('error', () => {
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        setAudioLoading(null);
      });
      audio.load();
    } catch {
      setAudioLoading(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const dateLocale = locale === 'ru' ? 'ru-RU' : 'en-US';
  const hasQuery = Boolean(searchQuery.trim());
  const empty =
    !loading &&
    !error &&
    hasQuery &&
    ((searchType === 'loops' && loops.length === 0) || (searchType === 'users' && users.length === 0));

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.brand}>Loopera</p>
        <h1 className={styles.title}>{t('searchPage.title')}</h1>
        <p className={styles.subtitle}>{t('searchPage.enterQueryHint')}</p>
      </header>

      <div className={styles.panel}>
        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${searchType === 'loops' ? styles.toggleActive : ''}`}
            onClick={() => setSearchType('loops')}
          >
            {t('searchPage.tabLoops')}
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${searchType === 'users' ? styles.toggleActive : ''}`}
            onClick={() => setSearchType('users')}
          >
            {t('searchPage.tabUsers')}
          </button>
        </div>

        <div className={styles.inputWrap}>
          <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.input}
            placeholder={t('searchPage.placeholder')}
            value={searchQuery}
            onChange={(e) => updateQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button type="button" className={styles.clear} onClick={() => updateQuery('')} aria-label={t('common.close')}>
              ×
            </button>
          )}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.results}>
        {loading && <p className={styles.state}>{t('loading.default')}</p>}

        {!loading && !hasQuery && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{t('searchPage.enterQuery')}</p>
            <p className={styles.emptyText}>{t('searchPage.enterQueryHint')}</p>
          </div>
        )}

        {!loading && searchType === 'loops' && loops.length > 0 && (
          <>
            <div className={styles.resultsHead}>
              {t('searchPage.foundLoops')} · {loops.length}
            </div>
            <div className={styles.loopsGrid}>
              {loops.map((loop) => (
                <LoopCard
                  key={loop.id}
                  loop={loop}
                  onPlay={handlePlay}
                  isPlaying={currentlyPlaying === loop.id && isPlaying}
                  isLoading={audioLoading === loop.id}
                />
              ))}
            </div>
          </>
        )}

        {!loading && searchType === 'users' && users.length > 0 && (
          <>
            <div className={styles.resultsHead}>
              {t('searchPage.foundUsers')} · {users.length}
            </div>
            <div className={styles.usersGrid}>
              {users.map((user) => (
                <Link key={user.id} to={profilePath(user.username)} className={styles.userCard}>
                  <span className={styles.avatar}>{(user.username[0] || '?').toUpperCase()}</span>
                  <span className={styles.userBody}>
                    <span className={styles.userName}>{user.username}</span>
                    <span className={styles.userMeta}>
                      {t('searchPage.loopsCount', { count: user.loop_count || 0 })}
                      {user.created_at
                        ? ` · ${new Date(user.created_at).toLocaleDateString(dateLocale)}`
                        : ''}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {empty && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {searchType === 'loops' ? t('searchPage.noLoops') : t('searchPage.noUsers')}
            </p>
            <p className={styles.emptyText}>
              {searchType === 'loops' ? t('searchPage.noLoopsHint') : t('searchPage.noUsersHint')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
