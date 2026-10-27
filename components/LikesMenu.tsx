import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { likeApi, type LikedLoop } from '../utils/likeApi';
import { loopDetailPath } from '../utils/routes';
import LoopCover from './LoopCover';
import styles from './LikesMenu.module.css';

const LikesMenu = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
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
      const data = await likeApi.getLikedLoops(1, 6);
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
            {items.map((loop) => (
              <button
                key={loop.id}
                type="button"
                className={styles.item}
                onClick={() => {
                  setOpen(false);
                  navigate(loopDetailPath(loop.id));
                }}
              >
                <div className={styles.cover}>
                  <LoopCover loop={loop} rounded="md" alt="" />
                </div>
                <div className={styles.meta}>
                  <span className={styles.itemTitle}>{loop.title || 'Untitled'}</span>
                  <span className={styles.itemAuthor}>{loop.author || 'loopera'}</span>
                </div>
              </button>
            ))}
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
