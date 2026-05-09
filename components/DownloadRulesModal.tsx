import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './DownloadRulesModal.module.css';

interface DownloadRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  loopTitle?: string;
}

const DownloadRulesModal = ({ isOpen, onClose, onDownload, loopTitle }: DownloadRulesModalProps) => {
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

  const rules = [
    {
      title: 'Поделись прибылью',
      description: 'Если используешь луп в коммерческом проекте - раздели доход с автором'
    },
    {
      title: 'Связь с автором',
      description: 'Используй чат на сервисе для связи и коллабораций'
    },
    {
      title: 'Указывай автора',
      description: 'Упомяни автора лупа в релизе или описании'
    },
    {
      title: 'Не перепродавай',
      description: 'Нельзя продавать луп как есть, только в составе трека'
    }
  ];

  const handleDownload = () => {
    onDownload();
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      
      <div className={`${styles.modal} ${isVisible ? styles.show : ''}`}>

        {/* HEADER */}
        <div className={styles.header}>
          <h2>
            Скачивание <span>лупа</span>
          </h2>
          <p>{loopTitle || 'Прочитай правила использования'}</p>
        </div>

        {/* RULES */}
        <div className={styles.rules}>
          {rules.map((rule, i) => (
            <div key={i} className={styles.rule}>
              <div className={styles.icon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>

              <div>
                <div className={styles.ruleTitle}>{rule.title}</div>
                <div className={styles.ruleDesc}>{rule.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* NOTE */}
        <div className={styles.note}>
          Нажимая скачать, ты соглашаешься с правилами<br />
          <span>Уважай труд авторов!</span>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button
            className={styles.primary}
            onClick={handleDownload}
          >
            Скачать
          </button>

          <button className={styles.secondary} onClick={onClose}>
            Отмена
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default DownloadRulesModal;
