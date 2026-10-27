import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import { followsApi, type FollowUser } from '../utils/followsApi';
import { getAssetUrl } from '../utils/urls';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import { profilePath } from '../utils/routes';
import SubscribedLoops from '../components/SubscribedLoops';
import styles from './Following.module.css';

const Following = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const [makers, setMakers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await followsApi.listMyFollowing();
        if (!cancelled) setMakers(data.following || []);
      } catch {
        if (!cancelled) setMakers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.title}>{t('followingPage.title')}</h1>
        <p className={styles.sub}>{t('followingPage.subtitle')}</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('followingPage.makers')}</h2>
        {loading ? (
          <p className={styles.hint}>{t('common.loading')}</p>
        ) : makers.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('followingPage.emptyMakers')}</p>
            <Link to="/search" className={styles.link}>
              {t('followingPage.findMakers')}
            </Link>
          </div>
        ) : (
          <div className={styles.makers}>
            {makers.map((m) => {
              const avatar = m.avatar_url ? getAssetUrl(m.avatar_url) : '';
              return (
                <Link key={m.id} to={profilePath(m.username)} className={styles.maker}>
                  <div
                    className={styles.avatar}
                    style={
                      avatar
                        ? { backgroundImage: `url(${avatar})` }
                        : {
                            backgroundColor:
                              LOOP_COVER_COLORS[Math.abs(m.id) % LOOP_COVER_COLORS.length],
                          }
                    }
                  >
                    {!avatar && m.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.makerMeta}>
                    <span className={styles.makerName}>{m.username}</span>
                    <span className={styles.makerSub}>
                      {m.loops_count != null
                        ? t('followingPage.loopsCount', { count: m.loops_count })
                        : '@' + (m.hashtag || m.username)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('followingPage.feed')}</h2>
        <SubscribedLoops limit={24} showAllButton={false} />
      </section>
    </div>
  );
};

export default Following;
