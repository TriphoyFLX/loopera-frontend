import type { Locale } from '../i18n/types';
import { useI18n } from '../i18n/useI18n';
import styles from './LanguageSwitcher.module.css';

const OPTIONS: { id: Locale; label: string }[] = [
  { id: 'ru', label: 'RU' },
  { id: 'en', label: 'EN' },
];

const LanguageSwitcher = () => {
  const { locale, setLocale } = useI18n();

  return (
    <div className={styles.switcher} role="group" aria-label="Language">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`${styles.btn} ${locale === option.id ? styles.active : ''}`}
          onClick={() => setLocale(option.id)}
          aria-pressed={locale === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
