import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/useI18n';
import styles from './LoopGuideModal.module.css';

const TG_URL = 'https://t.me/looperalpr';
const TG_HANDLE = '@looperalpr';

interface LoopGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoopGuideModal = ({ isOpen, onClose }: LoopGuideModalProps) => {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const openChannel = () => {
    window.open(TG_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${isVisible ? styles.show : ''}`}>
        <button type="button" className={styles.closeX} onClick={onClose} aria-label={t('modals.guide.close')}>
          ×
        </button>

        <div className={styles.tgIconWrap}>
          <svg className={styles.tgIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
            />
          </svg>
        </div>

        <div className={styles.header}>
          <h2>
            {t('modals.guide.title')} <span>{t('modals.guide.titleAccent')}</span>
          </h2>
          <p>{t('modals.guide.subtitle')}</p>
        </div>

        <div className={styles.channelCard}>
          <div className={styles.channelHandle}>{TG_HANDLE}</div>
          <p className={styles.channelDesc}>{t('modals.guide.description')}</p>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.primary} onClick={openChannel}>
            {t('modals.guide.subscribe')}
          </button>
          <button type="button" className={styles.secondary} onClick={onClose}>
            {t('modals.guide.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoopGuideModal;
