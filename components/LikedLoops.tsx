import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { likeApi, type LikedLoop } from '../utils/likeApi';
import { useI18n } from '../i18n/useI18n';
import LoopCard from './LoopCard';
import styles from './LikedLoops.module.css';

type Props = {
  limit?: number;
  showAllButton?: boolean;
};

const LikedLoops = ({ limit = 12, showAllButton = true }: Props) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loops, setLoops] = useState<LikedLoop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const response = await likeApi.getLikedLoops(1, limit);
        if (!cancelled) {
          setLoops(response.loops || []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(t('likedLoops.error'));
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
  }, [limit, t]);

  if (loading) {
    return (
      <div className={styles.grid} aria-hidden>
        {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>{error}</p>
      </div>
    );
  }

  if (!loops.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        <p className={styles.emptyTitle}>{t('likedLoops.empty')}</p>
        <Link to="/loops" className={styles.emptyCta}>
          Смотреть лупы
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {loops.map((loop) => (
          <LoopCard
            key={loop.id}
            loop={loop}
            currentUserId={user?.id}
            showLike
            queue={loops}
          />
        ))}
      </div>

      {showAllButton && (
        <div className={styles.footer}>
          <Link to="/liked" className={styles.viewAll}>
            Все избранные
          </Link>
        </div>
      )}
    </div>
  );
};

export default LikedLoops;
