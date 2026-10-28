import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import LoopCard from '../components/LoopCard';
import LoopListRow from '../components/LoopListRow';
import MobilePageHeader from '../components/MobilePageHeader';
import MobileSearchBar from '../components/MobileSearchBar';
import './Loops.css';

const QUICK_TAGS = ['drake', 'trap', 'osamason', 'osamason type beat'];
const GENRES = ['Trap', 'Drill', 'R&B', 'Hip-Hop', 'Electronic', 'Lo-fi'];
const MOODS = ['angry', 'dark', 'sad', 'happy', 'chill', 'energetic', 'romantic'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Am', 'Em', 'Fm'];

type ViewMode = 'grid' | 'list';
type SortMode = 'created_at' | 'likes' | 'trending' | 'discover';

const Loops: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFromUrl = searchParams.get('tag') || '';
  const playLoopId = searchParams.get('play');
  const highlightLoopId = playLoopId ? Number(playLoopId) : undefined;

  const { token, user } = useAuth();
  const player = useLoopPlayerOptional();

  const [query, setQuery] = useState(tagFromUrl);
  const [activeTag, setActiveTag] = useState(tagFromUrl);
  const [sortBy, setSortBy] = useState<SortMode>('trending');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [key, setKey] = useState('');
  const [minBpm, setMinBpm] = useState<number | undefined>();
  const [maxBpm, setMaxBpm] = useState<number | undefined>();
  const [view, setView] = useState<ViewMode>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? 'list'
      : 'grid',
  );
  const [loops, setLoops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>(QUICK_TAGS);

  const searchValue = useMemo(() => {
    if (activeTag) return undefined;
    const q = query.trim();
    return q || undefined;
  }, [query, activeTag]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await api.getPopularHashtags(20);
        const tags = (data?.hashtags || [])
          .map((item: any) => (typeof item === 'string' ? item : item.tag || item.name))
          .filter(Boolean)
          .slice(0, 8);
        if (tags.length) setPopularTags(tags);
      } catch {
        /* keep defaults */
      }
    };
    void loadTags();
  }, []);

  useEffect(() => {
    setActiveTag(tagFromUrl);
    if (tagFromUrl) setQuery(tagFromUrl);
  }, [tagFromUrl]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => {
      if (mq.matches) setView('list');
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAllLoops(
          1,
          24,
          token || undefined,
          sortBy,
          activeTag || undefined,
          genre || undefined,
          minBpm,
          maxBpm,
          key || undefined,
          searchValue,
          mood || undefined,
        );
        if (cancelled) return;
        setLoops(data.loops || []);
        setPage(1);
        setHasMore(Boolean(data.pagination?.hasMore));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить лупы');
          setLoops([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token, sortBy, activeTag, genre, mood, key, minBpm, maxBpm, searchValue]);

  useEffect(() => {
    if (!highlightLoopId || loading || !loops.length) return;
    const target = loops.find((l) => l.id === highlightLoopId);
    if (!target) return;
    document.getElementById(`loop-card-${highlightLoopId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    player?.play(target, loops);
  }, [highlightLoopId, loading, loops, player]);

  const applySearch = (value?: string) => {
    const next = (value ?? query).trim();
    setActiveTag(next);
    setQuery(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('tag', next);
    else params.delete('tag');
    setSearchParams(params);
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      const data = await api.getAllLoops(
        nextPage,
        24,
        token || undefined,
        sortBy,
        activeTag || undefined,
        genre || undefined,
        minBpm,
        maxBpm,
        key || undefined,
        searchValue,
        mood || undefined,
      );
      setLoops((prev) => [...prev, ...(data.loops || [])]);
      setPage(nextPage);
      setHasMore(Boolean(data.pagination?.hasMore));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const tagChips = useMemo(() => {
    const merged = [...QUICK_TAGS, ...popularTags];
    return Array.from(new Set(merged.map((t) => t.toLowerCase()))).slice(0, 8);
  }, [popularTags]);

  return (
    <div className="loops-page">
      <div className="loops-mobile-chrome">
        <MobilePageHeader title="Мелодии" />
        <MobileSearchBar
          initialQuery={query}
          filterTo="/loops"
          onSubmitQuery={(q) => {
            setQuery(q);
            setActiveTag('');
            setPage(1);
            setSearchParams(q ? { tag: q } : {});
          }}
        />
      </div>

      <header className="loops-head">
        <h1 className="loops-title">Лупы</h1>
      </header>

      <div className="loops-search-row">
        <form
          className="loops-search"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch();
          }}
        >
          <span className="loops-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Искать по тегам"
            aria-label="Искать по тегам"
          />
        </form>

        <div className="loops-tags">
          {tagChips.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`loops-tag ${activeTag.toLowerCase() === tag ? 'active' : ''}`}
              onClick={() => applySearch(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="loops-filters">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortMode)}
          aria-label="Сортировка"
        >
          <option value="trending">В тренде</option>
          <option value="created_at">Все время</option>
          <option value="likes">По лайкам</option>
          <option value="discover">Discover</option>
        </select>

        <select value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Жанр">
          <option value="">Жанр</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select value={mood} onChange={(e) => setMood(e.target.value)} aria-label="Настроение">
          <option value="">Настроение</option>
          {MOODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={minBpm && maxBpm ? `${minBpm}-${maxBpm}` : ''}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              setMinBpm(undefined);
              setMaxBpm(undefined);
              return;
            }
            const [min, max] = v.split('-').map(Number);
            setMinBpm(min);
            setMaxBpm(max);
          }}
          aria-label="BPM"
        >
          <option value="">BPM</option>
          <option value="60-99">60–99</option>
          <option value="100-119">100–119</option>
          <option value="120-139">120–139</option>
          <option value="140-160">140–160</option>
          <option value="161-200">161+</option>
        </select>

        <select value={key} onChange={(e) => setKey(e.target.value)} aria-label="Тональность">
          <option value="">Тональность</option>
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <div className="loops-view-toggle" role="group" aria-label="Вид">
          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
            aria-label="Список"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <button
            type="button"
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
            aria-label="Сетка"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <rect x="14" y="14" width="6" height="6" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="loops-error">
          <p>{error}</p>
          <button type="button" onClick={() => applySearch(activeTag || query)}>
            Попробовать снова
          </button>
        </div>
      )}

      {loading && loops.length === 0 ? (
        <div className="loops-loading">Загрузка лупов…</div>
      ) : loops.length === 0 ? (
        <div className="loops-empty">Ничего не найдено. Попробуйте другой тег или фильтр.</div>
      ) : (
        view === 'list' ? (
          <div className="loops-list">
            {loops.map((loop, i) => (
              <LoopListRow key={loop.id} loop={loop} index={i + 1} queue={loops} />
            ))}
          </div>
        ) : (
          <div className="loops-grid">
            {loops.map((loop) => (
              <LoopCard
                key={loop.id}
                loop={loop}
                currentUserId={user?.id}
                onPlay={(l) => player?.play(l, loops)}
                isPlaying={Boolean(player?.isCurrent(loop.id) && player.isPlaying)}
                isLoading={Boolean(player?.isCurrent(loop.id) && player.isLoading)}
                queue={loops}
              />
            ))}
          </div>
        )
      )}

      {hasMore && (
        <div className="loops-more">
          <button type="button" onClick={loadMore} disabled={loading}>
            {loading ? 'Загрузка…' : 'Загрузить ещё'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Loops;
