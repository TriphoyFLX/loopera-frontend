import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAssetUrl } from '../utils/urls';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import looperaLogo from '../assets/loopera.svg';
import styles from './MobilePageHeader.module.css';

type Props = {
  title: string;
  /** logo + title left-aligned (marketplace) vs title centered (home/melodies) */
  align?: 'center' | 'start';
};

const MobilePageHeader = ({ title, align = 'center' }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const avatarSrc = user?.avatar_url ? getAssetUrl(user.avatar_url) : '';
  const avatarColor = user
    ? LOOP_COVER_COLORS[Math.abs(user.id) % LOOP_COVER_COLORS.length]
    : '#2a2a2a';

  return (
    <header className={`${styles.bar} ${align === 'start' ? styles.alignStart : ''}`}>
      <Link to="/" className={styles.logoLink} aria-label="Loopera">
        <img src={looperaLogo} alt="" className={styles.logo} />
      </Link>
      <h1 className={styles.title}>{title}</h1>
      <button
        type="button"
        className={styles.avatarBtn}
        onClick={() => navigate(user ? '/profile' : '/auth')}
        aria-label={user ? 'Профиль и настройки' : 'Войти'}
      >
        <span
          className={styles.avatar}
          style={
            avatarSrc
              ? { backgroundImage: `url(${avatarSrc})` }
              : { backgroundColor: avatarColor }
          }
        >
          {!avatarSrc && (user?.username || '?').charAt(0).toUpperCase()}
        </span>
      </button>
    </header>
  );
};

export default MobilePageHeader;
