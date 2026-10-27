import { useI18n } from '../i18n/useI18n';
import styles from './ContestBanner.module.css';

const TG_URL = 'https://t.me/looperalpr';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12l5 5L20 7" />
  </svg>
);

const TgIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
  </svg>
);

const ContestBanner = () => {
  const { t } = useI18n();

  const perks = [
    t('home.contest.perkUploads'),
    t('home.contest.perkDownloads'),
    t('home.contest.perkLooptok'),
    t('home.contest.perkSize'),
    t('home.contest.perkColor'),
    t('home.contest.perkFrame'),
  ];

  return (
    <section className={styles.wrap} aria-labelledby="contest-title">
      <div className={styles.card}>
        <div className={styles.main}>
          <p className={styles.eyebrow}>{t('home.contest.eyebrow')}</p>
          <h2 id="contest-title" className={styles.title}>
            {t('home.contest.title')}
          </h2>
          <p className={styles.lead}>{t('home.contest.lead')}</p>
          <p className={styles.rule}>{t('home.contest.rule')}</p>

          <a
            href={TG_URL}
            target="_blank"
            rel="noreferrer"
            className={styles.cta}
          >
            <TgIcon />
            <span>{t('home.contest.cta')}</span>
          </a>
        </div>

        <div className={styles.aside}>
          <p className={styles.asideLabel}>{t('home.contest.proIncludes')}</p>
          <ul className={styles.perks}>
            {perks.map((perk) => (
              <li key={perk}>
                <span className={styles.check}>
                  <CheckIcon />
                </span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ContestBanner;
