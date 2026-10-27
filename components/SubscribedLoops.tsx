import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscriptionApi } from '../utils/subscriptionApi';
import { followsApi, type FollowUser } from '../utils/followsApi';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import { getAssetUrl } from '../utils/urls';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import { profilePath } from '../utils/routes';
import LoopCard from './LoopCard';
import styles from './SubscribedLoops.module.css';

type Loop = {
  id: number;
  title: string;
  filename: string;
  author?: string;
  user_id: number;
  genre?: string;
  tags?: string[] | string;
  bpm?: number;
  key?: string;
  cover_url?: string | null;
};

type Props = {
  limit?: number;
  showAllButton?: boolean;
};

const SubscribedLoops = ({ limit = 8, showAllButton = false }: Props) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loops, setLoops] = useState<Loop[]>([]);
  const [makers, setMakers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoops([]);
      setMakers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [loopsRes, followingRes] = await Promise.all([
          subscriptionApi.getSubscribedLoops(1, limit),
          followsApi.listMyFollowing().catch(() => ({ following: [] as FollowUser[] })),
        ]);
        if (cancelled) return;
        setLoops(loopsRes.loops || []);
        setMakers((followingRes.following || []).slice(0, 12));
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(t('recentLoops.loadError'));
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
  }, [user, limit, t]);

  const makersFromLoops = useMemo(() => {
    if (makers.length) return makers;
    const map = new Map<number, FollowUser>();
    for (const loop of loops) {
      if (!loop.user_id || map.has(loop.user_id)) continue;
      map.set(loop.user_id, {
        id: loop.user_id,
        username: loop.author || `user${loop.user_id}`,
      });
    }
    return Array.from(map.values()).slice(0, 12);
  }, [makers, loops]);

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.makersRail} aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${styles.makerChip} ${styles.skeleton}`} />
          ))}
        </div>
        <div className={styles.rail}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${styles.cardSlot} ${styles.skeletonCard}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error || (loops.length === 0 && makersFromLoops.length === 0)) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
          </svg>
        </div>
        <h3>{t('subscribedLoops.empty')}</h3>
        <p>{error ? t('recentLoops.loadError') : t('subscribedLoops.hint')}</p>
        <button type="button" className={styles.emptyCta} onClick={() => navigate('/search')}>
          Найти мейкеров
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {makersFromLoops.length > 0 && (
        <div className={styles.makersRail}>
          {makersFromLoops.map((maker) => {
            const avatar = maker.avatar_url ? getAssetUrl(maker.avatar_url) : '';
            const color = LOOP_COVER_COLORS[Math.abs(maker.id) % LOOP_COVER_COLORS.length];
            return (
              <Link
                key={maker.id}
                to={profilePath(maker.username)}
                className={styles.makerChip}
              >
                <span
                  className={styles.makerAvatar}
                  style={
                    avatar
                      ? { backgroundImage: `url(${avatar})` }
                      : { backgroundColor: color }
                  }
                >
                  {!avatar && maker.username.charAt(0).toUpperCase()}
                </span>
                <span className={styles.makerName}>{maker.username}</span>
              </Link>
            );
          })}
        </div>
      )}

      {loops.length > 0 ? (
        <div className={styles.railBleed}>
          <div className={styles.rail}>
            {loops.map((loop) => (
              <div key={loop.id} className={styles.cardSlot}>
                <LoopCard loop={loop} currentUserId={user?.id} queue={loops} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.quietHint}>Пока нет новых лупов от подписок</p>
      )}

      {showAllButton && (
        <div className={styles.footer}>
          <Link to="/following" className={styles.viewAll}>
            {t('subscribedLoops.viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
};

export default SubscribedLoops;
