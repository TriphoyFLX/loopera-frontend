import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { likeApi, type LikedLoop } from '../utils/likeApi';
import LoopListRow from '../components/LoopListRow';
import styles from './Liked.module.css';

const Liked = () => {
  const { isAuthenticated } = useAuth();
  const [loops, setLoops] = useState<LikedLoop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = async (nextPage = 1, append = false) => {
    if (!isAuthenticated) {
      setLoops([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await likeApi.getLikedLoops(nextPage, 24);
      setLoops((prev) => (append ? [...prev, ...(data.loops || [])] : data.loops || []));
      setPage(nextPage);
      setHasMore(nextPage < (data.pagination?.totalPages || 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить избранное');
      if (!append) setLoops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, false);
  }, [isAuthenticated]);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>Избранные</h1>
        </div>
        <Link to="/loops" className={styles.browse}>
          Смотреть лупы
        </Link>
      </header>

      {!isAuthenticated ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>Нужен вход</p>
          <Link to="/auth" className={styles.emptyCta}>
            Войти
          </Link>
        </div>
      ) : error ? (
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>{error}</p>
          <button type="button" className={styles.moreBtn} onClick={() => void load(1, false)}>
            Попробовать снова
          </button>
        </div>
      ) : loading && loops.length === 0 ? (
        <div className={styles.list}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.rowSkeleton} />
          ))}
        </div>
      ) : loops.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>Пока пусто</p>
          <Link to="/loops" className={styles.emptyCta}>
            Смотреть лупы
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {loops.map((loop, i) => (
            <LoopListRow
              key={loop.id}
              loop={loop}
              index={i + 1}
              queue={loops}
              initialLiked
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className={styles.more}>
          <button
            type="button"
            className={styles.moreBtn}
            disabled={loading}
            onClick={() => void load(page + 1, true)}
          >
            {loading ? 'Загрузка…' : 'Загрузить ещё'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Liked;
