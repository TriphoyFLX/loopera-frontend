import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { profilePath } from '../utils/routes'
import styles from './MobileAppBar.module.css'

const MobileAppBar = () => {
  const location = useLocation()
  const { user } = useAuth()
  const barRef = useRef<HTMLElement>(null)

  // iOS Safari / Chrome: keep bar glued to the *visual* viewport bottom
  useEffect(() => {
    const bar = barRef.current
    const vv = window.visualViewport
    if (!bar || !vv) return

    const sync = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      bar.style.transform = offset > 0 ? `translate3d(0, ${-offset}px, 0)` : 'translate3d(0, 0, 0)'
    }

    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      bar.style.transform = ''
    }
  }, [])

  const navItems = [
    {
      path: '/',
      label: 'Главная',
      match: (path: string) => path === '/',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      ),
    },
    {
      path: '/loops',
      label: 'Мелодии',
      match: (path: string) => path.startsWith('/loops'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="8" width="3" height="10" rx="0.5" />
          <rect x="8" y="5" width="3" height="13" rx="0.5" />
          <rect x="13" y="9" width="3" height="9" rx="0.5" />
          <rect x="18" y="6" width="3" height="12" rx="0.5" />
        </svg>
      ),
    },
    {
      path: '/shop',
      label: 'Маркет',
      match: (path: string) => path.startsWith('/shop') || path.startsWith('/create-pack'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M6 7h12l-1 13H7L6 7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      ),
    },
    {
      path: '/looptok',
      label: 'Чарт',
      match: (path: string) => path.startsWith('/looptok') || path.startsWith('/statistics'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 19V11M10 19V5M16 19v-7M22 19V8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      path: user ? '/profile' : '/auth',
      label: 'Профиль',
      match: (path: string) =>
        path === '/profile' ||
        path === '/auth' ||
        path.startsWith('/search') ||
        path.startsWith('/loop-upload') ||
        path.startsWith('/pricing') ||
        (!!user?.username && path === profilePath(user.username)),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 19.5c1.8-3.2 4-4.8 6.5-4.8s4.7 1.6 6.5 4.8" strokeLinecap="round" />
        </svg>
      ),
    },
  ]

  return (
    <nav ref={barRef} className={styles.mobileAppBar} aria-label="Мобильная навигация">
      {navItems.map((item) => {
        const isActive = item.match(location.pathname)
        return (
          <Link
            key={item.path + item.label}
            to={item.path}
            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            aria-label={item.label}
          >
            <div className={styles.iconWrapper}>{item.icon}</div>
          </Link>
        )
      })}
    </nav>
  )
}

export default MobileAppBar
