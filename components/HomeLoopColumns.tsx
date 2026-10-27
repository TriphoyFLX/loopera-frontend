import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import { api } from '../utils/api';
import LoopCover from './LoopCover';
import { loopDetailPath, profilePath } from '../utils/routes';
import styles from './HomeLoopColumns.module.css';

type LoopItem = {
  id: number;
  title: string;
  filename: string;
  author?: string;
  cover_url?: string | null;
  bpm?: number | null;
  key?: string | null;
  user_id?: number;
};

type Props = {
  sortBy?: 'created_at' | 'likes' | 'trending' | 'discover' | 'for_you';
  limit?: number;
  columns?: number;
  rows?: number;
};

const HomeLoopColumns = ({
  sortBy = 'trending',
  limit = 12,
  columns = 3,
  rows = 4,
}: Props) => {
  const { token } = useAuth();
  const player = useLoopPlayerOptional();
  const navigate = useNavigate();
  const [loops, setLoops] = useState<LoopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuId, setMenuId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data =
          sortBy === 'for_you' && token
            ? await api.getForYouLoops(1, limit, token)
            : await api.getAllLoops(1, limit, token || undefined, sortBy);
        if (!cancelled) setLoops(data?.loops || []);
      } catch {
        if (!cancelled) setLoops([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [sortBy, limit, token]);

  useEffect(() => {
    if (menuId == null) return;
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuId]);

  if (!loading && loops.length === 0) return null;

  const cols = Math.max(1, columns);
  const perCol = Math.max(1, rows);
  const take = Math.min(loops.length, cols * perCol);
  const items = loops.slice(0, take);
  // Fill top→bottom per column (BeatStars-style), then next column
  const columnBuckets: LoopItem[][] = Array.from({ length: cols }, () => []);
  items.forEach((loop, i) => {
    const col = Math.floor(i / perCol);
    if (col < cols) columnBuckets[col].push(loop);
  });

  if (loading) {
    return (
      <div className={styles.grid} style={{ ['--cols' as string]: cols }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className={styles.col}>
            {Array.from({ length: perCol }).map((__, r) => (
              <div key={r} className={styles.skelRow} aria-hidden>
                <div className={styles.skelCover} />
                <div className={styles.skelText}>
                  <div className={styles.skelLine} />
                  <div className={styles.skelLineSm} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.grid} style={{ ['--cols' as string]: cols }}>
      {columnBuckets.map((col, ci) => (
        <div key={ci} className={styles.col}>
          {col.map((loop) => {
            const playing = Boolean(player?.isCurrent(loop.id) && player.isPlaying);
            return (
              <article
                key={loop.id}
                className={`${styles.row} ${playing ? styles.playing : ''}`}
              >
                <button
                  type="button"
                  className={styles.coverBtn}
                  onClick={() => player?.play(loop, items)}
                  aria-label={playing ? 'Пауза' : 'Играть'}
                >
                  <LoopCover loop={loop} rounded="md" className={styles.cover} alt="" />
                  <span className={styles.play}>
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
                  </span>
                </button>

                <div className={styles.meta}>
                  <button
                    type="button"
                    className={styles.title}
                    onClick={() => navigate(loopDetailPath(loop.id))}
                  >
                    {loop.title || 'Untitled'}
                  </button>
                  <div className={styles.sub}>
                    <Link
                      to={profilePath(loop.author)}
                      className={styles.author}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {loop.author || 'loopera'}
                    </Link>
                  </div>
                </div>

                <div className={styles.moreWrap}>
                  <button
                    type="button"
                    className={styles.more}
                    aria-label="Ещё"
                    aria-expanded={menuId === loop.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuId((id) => (id === loop.id ? null : loop.id));
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.7" />
                      <circle cx="12" cy="12" r="1.7" />
                      <circle cx="12" cy="19" r="1.7" />
                    </svg>
                  </button>
                  {menuId === loop.id && (
                    <div className={styles.menu} role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => navigate(loopDetailPath(loop.id))}
                      >
                        Открыть
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuId(null);
                          player?.play(loop, items);
                        }}
                      >
                        Слушать
                      </button>
                      <Link
                        to={profilePath(loop.author)}
                        role="menuitem"
                        onClick={() => setMenuId(null)}
                      >
                        Автор
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default HomeLoopColumns;
