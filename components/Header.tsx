import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n/useI18n'
import { getAssetUrl } from '../utils/urls'
import { LOOP_COVER_COLORS } from '../utils/loopCover'
import NotificationBell from './NotificationBell'
import LikesMenu from './LikesMenu'
import styles from './Header.module.css'

const Header = () => {
  const navigate = useNavigate()
  const { user, isStaff } = useAuth()
  const { t } = useI18n()

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile')
      return
    }
    navigate('/auth')
  }

  const avatarSrc = user?.avatar_url ? getAssetUrl(user.avatar_url) : ''
  const avatarColor = user
    ? LOOP_COVER_COLORS[Math.abs(user.id) % LOOP_COVER_COLORS.length]
    : '#2a2a2a'

  return (
    <header className={styles.header}>
      <div className={styles.actions}>
        <NotificationBell />
        <LikesMenu />

        {isStaff && (
          <button
            type="button"
            className={styles.adminBtn}
            onClick={() => navigate('/admin')}
            aria-label={t('common.admin')}
          >
            Admin
          </button>
        )}

        <button
          type="button"
          className={styles.profilePill}
          onClick={handleProfileClick}
          aria-label={t('common.profile')}
        >
          <span
            className={styles.profileAvatar}
            style={
              avatarSrc
                ? { backgroundImage: `url(${avatarSrc})` }
                : { backgroundColor: avatarColor }
            }
            aria-hidden
          >
            {!avatarSrc && (user?.username || '?').charAt(0).toUpperCase()}
          </span>
          <span className={styles.profileMeta}>
            <span className={styles.profileName}>
              {user?.username || t('common.login')}
            </span>
            {user && <span className={styles.profileHint}>Профиль</span>}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default Header
