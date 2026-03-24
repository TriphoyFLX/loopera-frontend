import { useNavigate } from 'react-router-dom'
import looperaLogo from '../assets/loopera.svg'
import styles from './LogoButton.module.css'

const LogoButton = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/')
  }

  return (
    <button className={styles.logoButton} onClick={handleClick}>
      <img src={looperaLogo} alt="Loopera" className={styles.logoImage} />
    </button>
  )
}

export default LogoButton
