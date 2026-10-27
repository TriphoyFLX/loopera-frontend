import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { profilePath } from '../utils/routes';
import { getAssetUrl } from '../utils/urls';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import { topUsersApi, type TopUser } from '../utils/topUsersApi';
import styles from './TopLoopmakers.module.css';

type Props = {
  limit?: number;
};

const avatarColor = (id: number) =>
  LOOP_COVER_COLORS[Math.abs(Math.trunc(id)) % LOOP_COVER_COLORS.length];

const formatLoops = (n: number) => {
  const count = Math.max(0, n || 0);
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} луп`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} лупа`;
  return `${count} лупов`;
};

const TopLoopmakers = ({ limit = 8 }: Props) => {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const response = await topUsersApi.getTopUsers(limit);
        if (!cancelled) {
          setUsers(response.users || []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить топ мейкеров');
          setUsers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading) {
    return (
      <div className={styles.row} aria-hidden>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className={styles.item}>
            <div className={`${styles.avatar} ${styles.skeleton}`} />
            <div className={`${styles.skelLine} ${styles.skeleton}`} />
            <div className={`${styles.skelLineSm} ${styles.skeleton}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className={styles.state}>{error}</p>;
  }

  if (!users.length) {
    return <p className={styles.state}>Пока нет мейкеров</p>;
  }

  return (
    <div className={styles.row}>
      {users.map((user, index) => {
        const avatar = user.avatar_url ? getAssetUrl(user.avatar_url) : '';
        const verified = index === 0 && (user.total_likes || 0) > 0;
        const subtitle = user.hashtag
          ? `@${user.hashtag}`
          : formatLoops(user.loops_count);

        return (
          <Link
            key={user.id}
            to={profilePath(user.username)}
            className={styles.item}
          >
            <div
              className={styles.avatar}
              style={
                avatar
                  ? { backgroundImage: `url(${avatar})` }
                  : { backgroundColor: avatarColor(user.id) }
              }
            >
              {!avatar && (user.username || '?').charAt(0).toUpperCase()}
            </div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{user.username}</span>
              {verified && (
                <svg
                  className={styles.verified}
                  viewBox="0 0 24 24"
                  aria-label="Топ"
                >
                  <circle cx="12" cy="12" r="10" fill="currentColor" />
                  <path
                    d="M7.5 12.5l3 3 6-6"
                    fill="none"
                    stroke="#0a0a0a"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <p className={styles.sub}>{subtitle}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default TopLoopmakers;
