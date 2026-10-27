import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import looperaLogo from '../assets/loopera-logo.png'
import styles from './Sidebar.module.css'

const IconHome = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
)

const IconLoops = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="8" width="18" height="10" rx="2" />
    <path d="M6 12h1M9 11v2M12 10v4M15 11v2M18 12h1" />
  </svg>
)

const IconShop = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
)

const IconStats = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
  </svg>
)

const IconChats = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />
  </svg>
)

const IconUpload = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const IconSupport = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 12a8 8 0 0116 0" />
    <path d="M4 12v3a2 2 0 002 2h1v-5H6a2 2 0 00-2 2zM20 12v3a2 2 0 01-2 2h-1v-5h1a2 2 0 012 2z" />
    <path d="M12 19v2M9 21h6" />
  </svg>
)

type NavItem = { path: string; label: string; icon: ReactNode; exact?: boolean }

const contentItems: NavItem[] = [
  { path: '/loops', label: 'Лупы', icon: <IconLoops /> },
  { path: '/shop', label: 'Маркетплейс', icon: <IconShop /> },
]

const otherItems: NavItem[] = [
  { path: '/statistics', label: 'Аналитика', icon: <IconStats /> },
  { path: '/chats', label: 'Чаты', icon: <IconChats /> },
  { path: '/loop-upload', label: 'Загрузить', icon: <IconUpload /> },
]

const isActive = (pathname: string, item: NavItem) => {
  if (item.exact || item.path === '/') return pathname === '/'
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}

const NavLink = ({ item, pathname }: { item: NavItem; pathname: string }) => (
  <Link
    to={item.path}
    className={`${styles.item} ${isActive(pathname, item) ? styles.active : ''}`}
  >
    <span className={styles.itemIcon}>{item.icon}</span>
    <span className={styles.itemLabel}>{item.label}</span>
  </Link>
)

const Sidebar = () => {
  const location = useLocation()
  const { isLoading } = useAuth()

  if (isLoading) return null

  return (
    <aside className={styles.sidebar}>
      <Link to="/" className={styles.brand} aria-label="Loopera — на главную">
        <span className={styles.brandMark}>
          <img src={looperaLogo} alt="" width={40} height={40} />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>Loopera</span>
          <span className={styles.brandDomain}>.ru</span>
        </span>
      </Link>

      <nav className={styles.nav}>
        <NavLink
          item={{ path: '/', label: 'Главная', icon: <IconHome />, exact: true }}
          pathname={location.pathname}
        />

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Контент</div>
          {contentItems.map((item) => (
            <NavLink key={item.path} item={item} pathname={location.pathname} />
          ))}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Другое</div>
          {otherItems.map((item) => (
            <NavLink key={item.path} item={item} pathname={location.pathname} />
          ))}
        </div>
      </nav>

      <Link to="/chats?support=1" className={styles.support}>
        <span className={styles.itemIcon}>
          <IconSupport />
        </span>
        <span className={styles.itemLabel}>Тех.поддержка</span>
      </Link>
    </aside>
  )
}

export default Sidebar
