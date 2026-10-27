import { Link } from 'react-router-dom';
import styles from './LegalFooter.module.css';

const LegalFooter = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      <Link to="/offer">Оферта</Link>
      <Link to="/privacy">Политика конфиденциальности</Link>
      <Link to="/contacts">Контакты</Link>
      <Link to="/refunds">Возвраты</Link>
      <Link to="/delivery">Получение услуги</Link>
    </div>
  </footer>
);

export default LegalFooter;
