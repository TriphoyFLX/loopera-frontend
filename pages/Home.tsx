import { Link } from 'react-router-dom';
import RecentLoops from '../components/RecentLoops';
import SubscribedLoops from '../components/SubscribedLoops';
import TopLoopmakers from '../components/TopLoopmakers';
import HomeHero from '../components/HomeHero';
import HomePicks from '../components/HomePicks';
import HomePosts from '../components/HomePosts';
import HomeLoopColumns from '../components/HomeLoopColumns';
import MobilePageHeader from '../components/MobilePageHeader';
import MobileSearchBar from '../components/MobileSearchBar';
import ScrollReveal from '../components/ScrollReveal';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import type { ReactNode } from 'react';
import styles from './Home.module.css';

const RevealSection = ({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <section className={className ?? styles.homeSection}>
    <ScrollReveal delay={delay}>{children}</ScrollReveal>
  </section>
);

const LoopSectionHead = ({
  title,
  showAll = true,
  allTo = '/loops',
  allLabel = 'Все',
  quietAll = true,
}: {
  title: string;
  showAll?: boolean;
  allTo?: string;
  allLabel?: string;
  quietAll?: boolean;
}) => (
  <div className={styles.loopHead}>
    <h2 className={styles.loopTitle}>{title}</h2>
    {showAll && (
      <Link
        to={allTo}
        className={quietAll ? styles.showAllQuiet : styles.showAllLink}
      >
        {allLabel}
      </Link>
    )}
  </div>
);

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useI18n();

  return (
    <div className={styles.homePage}>
      <div className={styles.mobileChrome}>
        <MobilePageHeader title="Главная" />
        <MobileSearchBar />
      </div>

      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Главная</h1>
      </div>

      <div className={styles.desktopOnly}>
        <HomeHero />
        <HomePosts />
        <HomePicks />
      </div>

      {isAuthenticated && (
        <RevealSection className={`${styles.loopSection} ${styles.desktopOnly}`}>
          <LoopSectionHead title="Ещё то, что тебе нравится" />
          <HomeLoopColumns sortBy="for_you" limit={12} columns={3} rows={4} />
        </RevealSection>
      )}

      <RevealSection className={`${styles.loopSection} ${styles.mobileCarouselSection}`}>
        <LoopSectionHead title="Популярные лупы" allLabel="Смотреть все" quietAll={false} />
        <RecentLoops
          limit={12}
          showAllButton={false}
          type="all"
          title=""
          sortBy="trending"
          variant="carousel"
          hideInternalHeader
        />
      </RevealSection>

      {user && (
        <RevealSection className={`${styles.loopSection} ${styles.mobileCarouselSection}`}>
          <LoopSectionHead
            title="Подписки"
            allTo="/following"
            allLabel="Смотреть все"
            quietAll={false}
          />
          <SubscribedLoops limit={10} showAllButton={false} />
        </RevealSection>
      )}

      <RevealSection className={`${styles.loopSection} ${styles.desktopOnly}`}>
        <LoopSectionHead title={isAuthenticated ? 'Открытие' : 'Ещё то, что тебе нравится'} />
        <HomeLoopColumns
          sortBy={isAuthenticated ? 'discover' : 'trending'}
          limit={12}
          columns={3}
          rows={4}
        />
      </RevealSection>

      <RevealSection className={`${styles.loopSection} ${styles.desktopOnly}`}>
        <LoopSectionHead title="Топ мейкеры" allTo="/search" />
        <TopLoopmakers limit={8} />
      </RevealSection>

      <RevealSection className={`${styles.loopSection} ${styles.mobileCarouselSection}`}>
        <LoopSectionHead title="Свежие лупы" allLabel="Смотреть все" quietAll={false} />
        <RecentLoops
          limit={10}
          showAllButton={false}
          type="all"
          title=""
          sortBy="created_at"
          variant="carousel"
          hideInternalHeader
        />
      </RevealSection>

      <RevealSection className={`${styles.loopSection} ${styles.desktopOnly}`}>
        <LoopSectionHead title="Популярное" />
        <HomeLoopColumns sortBy="likes" limit={12} columns={3} rows={4} />
      </RevealSection>

      {!user && (
        <RevealSection className={`${styles.homeCta} ${styles.desktopOnly}`}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>{t('home.cta.title')}</h2>
            <p className={styles.ctaSubtitle}>{t('home.cta.subtitle')}</p>
            <div className={styles.ctaActions}>
              <a href="/auth" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
                {t('home.cta.signup')}
              </a>
              <a href="/loops" className={`${styles.btn} ${styles.btnOutline} ${styles.btnLarge}`}>
                {t('home.cta.browse')}
              </a>
            </div>
          </div>
        </RevealSection>
      )}
    </div>
  );
};

export default Home;
