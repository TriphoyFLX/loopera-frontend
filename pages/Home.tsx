import RecentLoops from '../components/RecentLoops';
import SubscribedLoops from '../components/SubscribedLoops';
import TopLoopmakers from '../components/TopLoopmakers';
import Add from '../components/Add';
import { useAuth } from '../hooks/useAuth';
import styles from './Home.module.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className={styles.homePage}>

      {/* Hero / Promo секция */}
      <section className={styles.promoSection}>
        <div className={styles.promoNoise} aria-hidden="true" />

        <div className={styles.promoOrb1} aria-hidden="true" />
        <div className={styles.promoOrb2} aria-hidden="true" />

        <div className={styles.promoInner}>

          {/* ЛЕВАЯ ЧАСТЬ */}
          <div className={styles.promoLeft}>
            <span className={styles.promoBadge}>
              <span className={styles.promoBadgeDot} />
              Платформа лупов №1
            </span>

            <h1 className={styles.promoTitle}>
              <span className={styles.promoTitleLine}>Real</span>
              <span className={styles.promoTitleAccent}>Loops.</span>
              <span className={styles.promoTitleLine}>Real</span>
              <span className={styles.promoTitleLine}>Music.</span>
            </h1>

            <p className={styles.promoSubtitle}>
              Создавай, коллаборируйся, знакомься.
              Лупы — это огромная часть музыки.
            </p>

            <div className={styles.promoButtons}>
              <a href="/loops" className={styles.promoPrimary}>
                <span>Загрузить луп</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="/loops" className={styles.promoSecondary}>
                Смотреть все лупы
              </a>
            </div>

            <div className={styles.promoStats}>
              <div className={styles.promoStat}>
                <span className={styles.promoStatNum}>8.5k</span>
                <span className={styles.promoStatLabel}>лупов</span>
              </div>
              <div className={styles.promoStatDivider} />
              <div className={styles.promoStat}>
                <span className={styles.promoStatNum}>500+</span>
                <span className={styles.promoStatLabel}>продюсеров</span>
              </div>
              <div className={styles.promoStatDivider} />
              <div className={styles.promoStat}>
                <span className={styles.promoStatNum}>24/7</span>
                <span className={styles.promoStatLabel}>онлайн</span>
              </div>
            </div>
          </div>

          {/* ПРАВАЯ ЧАСТЬ */}
          <div className={styles.promoRight}>

            {/* Плавающий тег */}
            <div className={styles.floatingTag}>
              <span className={styles.floatingTagDot} />
              Новый луп загружен
            </div>

            {/* UI карточка плеера */}
            <div className={styles.playerCard}>
              <div className={styles.playerTop}>
                <div className={styles.playerCover}>
                  <div className={styles.playerCoverInner} />
                </div>
                <div className={styles.playerMeta}>
                  <p className={styles.playerName}>@triphoymp3</p>
                  <span className={styles.playerSub}>Telegram Channel</span>
                </div>
                <span className={styles.playerGenre}>Trap</span>
              </div>

              <div className={styles.playerWaveform}>
                {[35, 55, 80, 45, 90, 60, 40, 75, 50, 65, 85, 45, 70, 55, 40].map((h, i) => (
                  <div
                    key={i}
                    className={styles.playerBar}
                    style={{
                      '--bar-h': `${h}%` as React.CSSProperties,
                      '--bar-delay': `${i * 0.07}s` as React.CSSProperties,
                    } as React.CSSProperties}
                  />
                ))}
              </div>

              <div className={styles.playerFooter}>
                <div className={styles.playerControls}>
                  <button className={styles.playerBtnSm} aria-label="Предыдущий">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M2 2h1.5v10H2zM12 2L5 7l7 5V2z"/>
                    </svg>
                  </button>
                  <a
                    href="https://t.me/triphoymp3"
                    target="_blank"
                    rel="noreferrer"
                    className={styles.playerBtnMain}
                    aria-label="Перейти"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5 3l8 5-8 5V3z"/>
                    </svg>
                  </a>
                  <button className={styles.playerBtnSm} aria-label="Следующий">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M10.5 2H12v10h-1.5zM2 2l7 5-7 5V2z"/>
                    </svg>
                  </button>
                </div>
                <span className={styles.playerDuration}>2:34</span>
              </div>
            </div>

            {/* Второй мини-блок: активность */}
            <div className={styles.activityCard}>
              <p className={styles.activityTitle}>Активность сейчас</p>
              <div className={styles.activityBars}>
                {[60, 80, 45, 90, 55, 70, 85, 50, 75, 65].map((h, i) => (
                  <div
                    key={i}
                    className={styles.activityBar}
                    style={{ '--ab-h': `${h}%` as React.CSSProperties, '--ab-delay': `${i * 0.1}s` as React.CSSProperties } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className={styles.activityFooter}>
                <span className={styles.activityOnline}>
                  <span className={styles.activityDot} />
                  142 онлайн
                </span>
                <span className={styles.activityCount}>+24 сегодня</span>
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

      {/* Рекламный блок */}
      <Add />

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

      {/* Возможности - ПРОКАЧАННАЯ СЕКЦИЯ */}
<section className={styles.featuresEnhancedSection}>
  {/* Декоративный фон */}
  <div className={styles.featuresBgGlow} aria-hidden="true" />
  <div className={styles.featuresGridPattern} aria-hidden="true" />
  
  <div className={styles.sectionHeader}>
    <div className={styles.sectionTitleWrapper}>
      <span className={styles.sectionBadge}>
        <span className={styles.badgeIcon}>✨</span>
        Возможности
      </span>
      <h2 className={styles.sectionTitle}>
        Почему <span className={styles.titleAccent}>Loopera</span>
      </h2>
    </div>
    <p className={styles.sectionDescription}>
      Инструменты и комьюнити для создания музыки будущего
    </p>
  </div>

  <div className={styles.featuresGridEnhanced}>
    {/* Карточка 1 */}
    <div className={styles.featureCardEnhanced}>
      <div className={styles.featureIconWrapper}>
        <div className={styles.featureIconGlow} />
        <span className={styles.featureEmoji}>🎵</span>
      </div>
      <div className={styles.featureContent}>
        <div className={styles.featureHeader}>
          <h3 className={styles.featureTitleEnhanced}>Библиотека лупов</h3>
          <span className={styles.featureBadge}>8.5k+</span>
        </div>
        <p className={styles.featureDescriptionEnhanced}>
          Тысячи качественных лупов в разных жанрах от профессиональных продюсеров. 
          Ежедневные обновления и эксклюзивный контент.
        </p>
        <div className={styles.featureTags}>
          <span>Trap</span>
          <span>Drill</span>
          <span>Lo-Fi</span>
          <span>+12</span>
        </div>
      </div>
      <div className={styles.featureCardGlow} />
    </div>

    {/* Карточка 2 */}
    <div className={styles.featureCardEnhanced}>
      <div className={styles.featureIconWrapper}>
        <div className={styles.featureIconGlow} />
        <span className={styles.featureEmoji}>🔥</span>
      </div>
      <div className={styles.featureContent}>
        <div className={styles.featureHeader}>
          <h3 className={styles.featureTitleEnhanced}>Подписки на артистов</h3>
          <span className={styles.featureBadge}>NEW</span>
        </div>
        <p className={styles.featureDescriptionEnhanced}>
          Следите за любимыми продюсерами и получайте их новые лупы первыми. 
          Персональная лента рекомендаций на основе ваших интересов.
        </p>
        <div className={styles.featureStats}>
          <div className={styles.featureStatItem}>
            <span className={styles.statValue}>500+</span>
            <span className={styles.statLabel}>артистов</span>
          </div>
          <div className={styles.featureStatItem}>
            <span className={styles.statValue}>24/7</span>
            <span className={styles.statLabel}>обновления</span>
          </div>
        </div>
      </div>
      <div className={styles.featureCardGlow} />
    </div>

    {/* Карточка 3 */}
    <div className={styles.featureCardEnhanced}>
      <div className={styles.featureIconWrapper}>
        <div className={styles.featureIconGlow} />
        <span className={styles.featureEmoji}>💬</span>
      </div>
      <div className={styles.featureContent}>
        <div className={styles.featureHeader}>
          <h3 className={styles.featureTitleEnhanced}>Сообщество</h3>
          <span className={styles.featureBadge}>ACTIVE</span>
        </div>
        <p className={styles.featureDescriptionEnhanced}>
          Общайтесь с другими продюсерами, обменивайтесь опытом и находите коллаборации. 
          Еженедельные челленджи и конкурсы.
        </p>
        <div className={styles.featureActivity}>
          <span className={styles.activityIndicator}>
            <span className={styles.activityDotPulse} />
            142 онлайн
          </span>
          <span className={styles.activityToday}>+24 сегодня</span>
        </div>
      </div>
      <div className={styles.featureCardGlow} />
    </div>

    {/* Карточка 4 */}
    <div className={styles.featureCardEnhanced}>
      <div className={styles.featureIconWrapper}>
        <div className={styles.featureIconGlow} />
        <span className={styles.featureEmoji}>📤</span>
      </div>
      <div className={styles.featureContent}>
        <div className={styles.featureHeader}>
          <h3 className={styles.featureTitleEnhanced}>Загрузка лупов</h3>
          <span className={styles.featureBadge}>FREE</span>
        </div>
        <p className={styles.featureDescriptionEnhanced}>
          Делитесь своими творениями с сообществом и получайте обратную связь. 
          Поддержка WAV, MP3, FLAC и мгновенная модерация.
        </p>
        <div className={styles.featureUploadInfo}>
          <span>⚡ Мгновенная загрузка</span>
          <span>🎯 До 500MB</span>
        </div>
      </div>
      <div className={styles.featureCardGlow} />
    </div>
  </div>

  {/* Декоративная линия внизу */}
  <div className={styles.featuresBottomLine}>
    <span />
    <span />
    <span />
  </div>
</section>

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