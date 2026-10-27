import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/useI18n';
import styles from './DownloadRulesModal.module.css';

interface DownloadRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void | Promise<void>;
  loopTitle?: string;
}

const DownloadRulesModal = ({ isOpen, onClose, onDownload, loopTitle }: DownloadRulesModalProps) => {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setIsVisible(true));
      document.body.style.overflow = 'hidden';
      return () => {
        cancelAnimationFrame(id);
        document.body.style.overflow = 'unset';
      };
    }

    setIsVisible(false);
    document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const rules = [
    {
      title: t('modals.downloadRules.rule1Title'),
      description: t('modals.downloadRules.rule1Desc'),
    },
    {
      title: t('modals.downloadRules.rule2Title'),
      description: t('modals.downloadRules.rule2Desc'),
    },
    {
      title: t('modals.downloadRules.rule3Title'),
      description: t('modals.downloadRules.rule3Desc'),
    },
    {
      title: t('modals.downloadRules.rule4Title'),
      description: t('modals.downloadRules.rule4Desc'),
    },
  ];

  const handleDownload = () => {
    void onDownload();
    onClose();
  };

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className={`${styles.modal} ${isVisible ? styles.show : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-rules-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label={t('common.close')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <header className={styles.header}>
          <h2 id="download-rules-title" className={styles.title}>
            {t('modals.downloadRules.title')} {t('modals.downloadRules.titleAccent')}
          </h2>
          {loopTitle ? <p className={styles.subtitle}>{loopTitle}</p> : null}
        </header>

        <div className={styles.rules}>
          {rules.map((rule, i) => (
            <div key={rule.title} className={styles.rule}>
              <span className={styles.num}>{i + 1}</span>
              <div>
                <div className={styles.ruleTitle}>{rule.title}</div>
                <div className={styles.ruleDesc}>{rule.description}</div>
              </div>
            </div>
          ))}
        </div>

        <p className={styles.note}>
          {t('modals.downloadRules.note')}
          <strong>{t('modals.downloadRules.noteAccent')}</strong>
        </p>

        <div className={styles.footer}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            {t('modals.downloadRules.cancel')}
          </button>
          <button type="button" className={styles.primary} onClick={handleDownload}>
            {t('modals.downloadRules.download')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DownloadRulesModal;
