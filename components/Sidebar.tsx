import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Sidebar.module.css'

const Sidebar = () => {
  const location = useLocation()
  const { isLoading } = useAuth()

  if (isLoading) return null

  const items = [
    {
      path: '/',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      )
    },
    {
      path: '/loops',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 12h2M8 9v6M12 7v10M16 9v6M20 12h2"/>
        </svg>
      )
    },
    {
      path: '/chats',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z"/>
        </svg>
      )
    },
    {
      path: '/loop-upload',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      )
    },
    {
      path: '/statistics',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M3 3v18h18M3 9l3 3 6-6 6 6 6-6"/>
        </svg>
      )
    },
    {
      path: '/shop',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      )
    }
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.menu}>
        {items.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.item} ${
              location.pathname === item.path ? styles.active : ''
            }`}
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar