import { Link, useLocation } from 'react-router-dom'
import styles from './MobileAppBar.module.css'

const MobileAppBar = () => {
  const location = useLocation()

  const navItems = [
    {
      path: '/',
      label: 'Главная',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      )
    },
    {
      path: '/loops',
      label: 'Петли',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 12h2M8 9v6M12 7v10M16 9v6M20 12h2"/>
        </svg>
      )
    },
    {
      path: '/chats',
      label: 'Чаты',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z"/>
        </svg>
      )
    },
    {
      path: '/loop-upload',
      label: 'Загрузить',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      )
    }
  ]

  return (
    <nav className={styles.mobileAppBar}>
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`${styles.navItem} ${
            location.pathname === item.path ? styles.active : ''
          }`}
        >
          <div className={styles.iconWrapper}>
            {item.icon}
          </div>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default MobileAppBar
