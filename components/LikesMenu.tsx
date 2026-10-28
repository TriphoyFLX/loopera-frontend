import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import { likeApi, type LikedLoop } from '../utils/likeApi';
import { loopDetailPath } from '../utils/routes';
import LoopCover from './LoopCover';
import styles from './LikesMenu.module.css';

const LikesMenu = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const player = useLoopPlayerOptional();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LikedLoop[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const data = await likeApi.getLikedLoops(1, 8);
      setItems(data.loops || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = () => {
    if (!user) {
      requireAuth(() => setOpen(true), 'like');
      return;
    }
    setOpen((v) => !v);
  };

  const playLoop = (loop: LikedLoop) => {
    player?.play(loop, items);
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Лайки"
        aria-expanded={open}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Лайкнутые">
          <div className={styles.head}>
            <p className={styles.title}>Лайкнутые</p>
          </div>

          <div className={styles.list}>
            {loading && items.length === 0 && (
              <p className={styles.empty}>Загрузка…</p>
            )}
            {!loading && items.length === 0 && (
              <p className={styles.empty}>Пока нет лайков</p>
            )}
            {items.map((loop) => {
              const playing = Boolean(player?.isCurrent(loop.id) && player.isPlaying);
              return (
                <div key={loop.id} className={styles.item}>
                  <button
                    type="button"
                    className={styles.playHit}
                    onClick={() => playLoop(loop)}
                    aria-label={playing ? 'Пауза' : `Слушать ${loop.title || 'луп'}`}
                  >
                    <div className={styles.cover}>
                      <LoopCover loop={loop} rounded="md" alt="" />
                      <span className={styles.playIcon} aria-hidden>
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
                    </div>
                    <div className={styles.meta}>
                      <span className={styles.itemTitle}>{loop.title || 'Untitled'}</span>
                      <span className={styles.itemAuthor}>{loop.author || 'loopera'}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={styles.openBtn}
                    onClick={() => {
                      setOpen(false);
                      navigate(loopDetailPath(loop.id));
                    }}
                    aria-label="Открыть луп"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.allBtn}
            onClick={() => {
              setOpen(false);
              navigate('/liked');
            }}
          >
            Все лайкнутые
          </button>
        </div>
      )}
    </div>
  );
};

export default LikesMenu;
