import { useState, useEffect } from 'react';
import styles from './LoopGuideModal.module.css';

interface LoopGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoopGuideModal = ({ isOpen, onClose }: LoopGuideModalProps) => {
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const steps = [
    {
      icon: '🎵',
      title: 'Выбери вайб',
      description: 'Определи настроение: Trap, Drill, Lo-Fi или свой уникальный стиль'
    },
    {
      icon: '🎹',
      title: 'Сделай мелодию',
      description: 'Создай цепляющий луп — мелодия или бас, который хочется зациклить'
    },
    {
      icon: '🎚️',
      title: 'Доведи звук',
      description: 'Убери клиппинг, выровняй громкость, сделай чистый микс'
    },
    {
      icon: '📁',
      title: 'Экспорт',
      description: 'WAV или MP3 (лучше WAV) — без потери качества'
    },
    {
      icon: '📤',
      title: 'Залив на сайт',
      description: 'Добавь обложку, описание и теги — это бустит просмотры'
    }
  ];

  return (
    <div 
      className={`${styles.modalOverlay} ${isVisible ? styles.visible : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`${styles.modalContent} ${isVisible ? styles.slideIn : ''}`}>
        
        {/* CLOSE */}
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* HEADER */}
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <span className={styles.iconEmoji}>🎯</span>
            <div className={styles.iconGlow} />
          </div>

          <h2 className={styles.modalTitle}>
            Как загрузить <span className={styles.titleAccent}>луп, который качает</span>
          </h2>

          <p className={styles.modalSubtitle}>
            Короткий гайд, чтобы твои лупы реально скачивали и юзали
          </p>
        </div>

        {/* STEPS */}
        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <div className={styles.stepNumber}>
                <span>{index + 1}</span>
              </div>

              <div className={styles.stepIcon}>
                <span>{step.icon}</span>
              </div>

              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* IMPORTANT NOTE */}
        <div className={styles.importantNote}>
          <span className={styles.noteIcon}>📢</span>
          <p>
            Добавь в название лупа свой Telegram для связи <br />
            <strong>(пример: dark trap loop @yourtag)</strong>
          </p>
        </div>

        {/* TIPS */}
        <div className={styles.tipsSection}>
          <h4 className={styles.tipsTitle}>
            <span className={styles.tipsIcon}>💡</span>
            Советы
          </h4>

          <div className={styles.tipsGrid}>
            <div className={styles.tipItem}>
              <span className={styles.tipIcon}>🎧</span>
              <span>Проверяй звук в наушниках</span>
            </div>

            <div className={styles.tipItem}>
              <span className={styles.tipIcon}>🔊</span>
              <span>Тестируй на телефоне и колонках</span>
            </div>

            <div className={styles.tipItem}>
              <span className={styles.tipIcon}>⚡</span>
              <span>Делай уникальный саунд</span>
            </div>

            <div className={styles.tipItem}>
              <span className={styles.tipIcon}>🎨</span>
              <span>Крутая обложка = больше кликов</span>
            </div>
          </div>
        </div>

        {/* FINAL CTA */}
        <div className={styles.finalCTA}>
          <h4>🚀 Готов залететь?</h4>
          <p>
            Чем уникальнее твой звук — тем выше шанс, что его заберут в трек
          </p>
        </div>

        {/* FOOTER */}
        <div className={styles.modalFooter}>
          <button 
            className={styles.primaryButton}
            onClick={() => {
              onClose();
              window.location.href = '/loop-upload';
            }}
          >
            <span>Начать загрузку</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button 
            className={styles.footerCloseButton}
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoopGuideModal;