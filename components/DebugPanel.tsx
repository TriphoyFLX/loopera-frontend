import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'
import styles from './DebugPanel.module.css'

const DebugPanel = () => {
  const { user, token, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  return (
    <div className={styles.debugPanel}>
      <div className={styles.debugHeader}>
        <strong>DEBUG PANEL</strong>
        <button 
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          className={styles.clearButton}
        >
          Clear & Reload
        </button>
      </div>
      <div className={styles.debugContent}>
        <div><strong>Route:</strong> {location.pathname}</div>
        <div><strong>Is Authenticated:</strong> {isAuthenticated ? 'YES' : 'NO'}</div>
        <div><strong>Is Loading:</strong> {isLoading ? 'YES' : 'NO'}</div>
        <div><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'NONE'}</div>
        <div><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'NONE'}</div>
        <div><strong>LocalStorage Token:</strong> {localStorage.getItem('token') ? 'EXISTS' : 'NONE'}</div>
        <div><strong>LocalStorage User:</strong> {localStorage.getItem('user') ? 'EXISTS' : 'NONE'}</div>
      </div>
    </div>
  )
}

export default DebugPanel
