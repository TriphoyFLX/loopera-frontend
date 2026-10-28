import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchApi } from '../utils/searchApi';
import { getAssetUrl } from '../utils/urls';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import { profilePath } from '../utils/routes';
import { useI18n } from '../i18n/useI18n';
import LoopListRow from '../components/LoopListRow';
import VerifiedBadge from '../components/VerifiedBadge';
import { isPaidPlan } from '../utils/plans';
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
  cover_url?: string | null;
  user_id: number;
  author?: string;
  author_id?: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  avatar_url?: string | null;
  created_at?: string;
  loop_count?: number;
  plan_slug?: string | null;
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
              avatar_url: artist.avatar_url ?? null,
              loop_count: artist.loops_count,
              created_at: artist.created_at,
              plan_slug: artist.plan_slug ?? null,
            })),
          );
          setLoops([]);
        }
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError(t('searchPage.error'));
        setLoops([]);
        setUsers([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, searchType, t]);

  const updateQuery = (value: string) => {
    setSearchQuery(value);
    const trimmed = value.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

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
        <p className={styles.subtitle}>{t('searchPage.subtitle')}</p>
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
            <div className={styles.loopsList}>
              {loops.map((loop, i) => (
                <LoopListRow key={loop.id} loop={loop} index={i + 1} queue={loops} />
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
              {users.map((user) => {
                const avatarSrc = user.avatar_url ? getAssetUrl(user.avatar_url) : '';
                const fallback =
                  LOOP_COVER_COLORS[Math.abs(user.id) % LOOP_COVER_COLORS.length];
                return (
                  <Link key={user.id} to={profilePath(user.username)} className={styles.userCard}>
                    <span
                      className={styles.avatar}
                      style={
                        avatarSrc
                          ? { backgroundImage: `url(${avatarSrc})` }
                          : { backgroundColor: fallback }
                      }
                    >
                      {!avatarSrc && (user.username[0] || '?').toUpperCase()}
                    </span>
                    <span className={styles.userBody}>
                      <span className={styles.userName}>
                        {user.username}
                        {isPaidPlan(user.plan_slug) && <VerifiedBadge plan={user.plan_slug} />}
                      </span>
                      <span className={styles.userMeta}>
                        {t('searchPage.loopsCount', { count: user.loop_count || 0 })}
                        {user.created_at
                          ? ` · ${new Date(user.created_at).toLocaleDateString(dateLocale)}`
                          : ''}
                      </span>
                    </span>
                  </Link>
                );
              })}
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
