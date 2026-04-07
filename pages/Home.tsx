import RecentLoops from '../components/RecentLoops';
import SubscribedLoops from '../components/SubscribedLoops';
import TopLoopmakers from '../components/TopLoopmakers';
import { useAuth } from '../hooks/useAuth';
import styles from './Home.module.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className={styles.homePage}>
      {/* Hero секция */}
      <section className={styles.promoSection}>
  <div className={styles.promoCard}>

    {/* ЛЕВАЯ ЧАСТЬ */}
    <div className={styles.promoLeft}>
      <h2 className={styles.promoTitle}>
        Loopera*<br />Real loops
      </h2>

      <p className={styles.promoSubtitle}>
        Создавай, коллабарируйся, знакомься. Лупы это огромная часть музыки
      </p>

      <div className={styles.promoButtons}>
        <a href="/loops" className={styles.promoPrimary}>
          Загрузить луп
        </a>
        <a href="/loops" className={styles.promoSecondary}>
          Смотреть все лупы
        </a>
      </div>
    </div>

    {/* ПРАВАЯ ЧАСТЬ (UI / карточки) */}
    <div className={styles.promoRight}>
      
      <div className={styles.uiCard}>
        <span className={styles.uiTitle}>Top Loop</span>
        <div className={styles.uiWave}></div>
      </div>

      <div className={styles.uiStats}>
        <div>
          <span className={styles.statBig}>8.5k</span>
          <span className={styles.statSmall}>loops</span>
        </div>
        <div>
          <span className={styles.statBig}>500+</span>
          <span className={styles.statSmall}>producers</span>
        </div>
      </div>

    </div>

  </div>
</section>

      {/* Популярные лупы */}
      <section className={styles.homeSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrapper}>
            <span className={styles.sectionBadge}>Популярное</span>
            <h2 className={styles.sectionTitle}>
              Популярные <span className={styles.titleAccent}>лупы</span>
            </h2>
          </div>
          <p className={styles.sectionDescription}>
            Самые скачиваемые лупы этой недели
          </p>
        </div>
        <RecentLoops limit={6} showAllButton={true} type="all" title="" />
      </section>

      {/* Лупы для вас (только для авторизованных) */}
      {user && (
        <section className={styles.homeSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <span className={styles.sectionBadge}>Рекомендации</span>
              <h2 className={styles.sectionTitle}>
                Лупы <span className={styles.titleAccent}>для вас</span>
              </h2>
            </div>
            <p className={styles.sectionDescription}>
              Лупы от артистов, на которых вы подписаны
            </p>
          </div>
          <SubscribedLoops limit={6} showAllButton={false} />
        </section>
      )}

      {/* Топ лупмейкеры */}
      <section className={styles.homeSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrapper}>
            <span className={styles.sectionBadge}>Топ</span>
            <h2 className={styles.sectionTitle}>
              Топ <span className={styles.titleAccent}>лупмейкеры</span>
            </h2>
          </div>
          <p className={styles.sectionDescription}>
            Лучшие продюсеры по количеству лупов и лайков
          </p>
        </div>
        <TopLoopmakers limit={6} />
      </section>

      {/* Фичи */}
      <section className={styles.homeSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrapper}>
            <span className={styles.sectionBadge}>Возможности</span>
            <h2 className={styles.sectionTitle}>
              Почему <span className={styles.titleAccent}>Loopera</span>
            </h2>
          </div>
          <p className={styles.sectionDescription}>
            Инструменты для продюсеров и битмейкеров
          </p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎵</div>
            <h3 className={styles.featureTitle}>Библиотека лупов</h3>
            <p className={styles.featureDescription}>
              Тысячи качественных лупов в разных жанрах от профессиональных продюсеров
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔥</div>
            <h3 className={styles.featureTitle}>Подписки на артистов</h3>
            <p className={styles.featureDescription}>
              Следите за любимыми продюсерами и получайте их новые лупы первыми
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3 className={styles.featureTitle}>Сообщество</h3>
            <p className={styles.featureDescription}>
              Общайтесь с другими продюсерами, обменивайтесь опытом и находите коллаборации
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📤</div>
            <h3 className={styles.featureTitle}>Загрузка лупов</h3>
            <p className={styles.featureDescription}>
              Делитесь своими творениями с сообществом и получайте обратную связь
            </p>
          </div>
        </div>
      </section>

      {/* CTA секция */}
      {!user && (
        <section className={styles.homeCta}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              Готовы создать свой следующий хит?
            </h2>
            <p className={styles.ctaSubtitle}>
              Присоединяйтесь к тысячам продюсеров, которые уже используют Loopera
            </p>
            <div className={styles.ctaActions}>
              <a href="/auth" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
                Создать аккаунт
              </a>
              <a href="/loops" className={`${styles.btn} ${styles.btnOutline} ${styles.btnLarge}`}>
                Смотреть лупы
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
