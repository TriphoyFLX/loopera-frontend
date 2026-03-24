import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './Header.module.css'

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // При вводе текста сразу переходим на страницу поиска
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`)
    }
  }

  const handleProfileClick = () => {
    navigate('/profile')
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        {/* Search Section */}
        <div className={styles.searchSection}>
          {!isSearchOpen ? (
            <button
              className={styles.searchButton}
              onClick={() => setIsSearchOpen(true)}
              aria-label="Поиск"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span className={styles.glowEffect}></span>
            </button>
          ) : (
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Поиск лупов, авторов..."
                className={styles.searchInput}
                autoFocus
              />
              <button type="submit" className={styles.searchSubmitButton} aria-label="Найти">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false)
                  setSearchQuery('')
                }}
                className={styles.searchCancelButton}
                aria-label="Закрыть"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <span className={styles.glowEffect}></span>
            </form>
          )}
        </div>

        {/* Profile Section */}
        <div className={styles.profileSection}>
          <button
            className={styles.profileButton}
            onClick={handleProfileClick}
            aria-label="Профиль"
          >
            <div className={styles.profileAvatar}>
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className={styles.profileName}>
              {user?.username || 'Гость'}
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <span className={styles.glowEffect}></span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header