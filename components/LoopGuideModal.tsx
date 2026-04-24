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
      title: 'Выбери жанр',
      description: 'Определи стиль твоего лупа - Trap, Drill, Lo-Fi или другой жанр'
    },
    {
      icon: '🎹',
      title: 'Создай мелодию',
      description: 'Запиши качественную мелодию или басовую линию в DAW'
    },
    {
      icon: '🎚️',
      title: 'Настрой громкость',
      description: 'Убедись что уровень громкости не клиппирует и звучит чисто'
    },
    {
      icon: '📁',
      title: 'Экспортируй',
      description: 'Сохрани в формате WAV или MP3 с качеством 320kbps'
    },
    {
      icon: '📤',
      title: 'Загрузи на сайт',
      description: 'Добавь обложку, описание и теги для лучшего охвата'
    }
  ];

  return (
    <div 
      className={`${styles.modalOverlay} ${isVisible ? styles.visible : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`${styles.modalContent} ${isVisible ? styles.slideIn : ''}`}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4L16 16M4 16L16 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <span className={styles.iconEmoji}>🎯</span>
            <div className={styles.iconGlow} />
          </div>
          <h2 className={styles.modalTitle}>
            Как загрузить <span className={styles.titleAccent}>красивый луп</span>
          </h2>
          <p className={styles.modalSubtitle}>
            Следуй этим шагам для создания качественного лупа в стиле сайта
          </p>
        </div>

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

        <div className={styles.tipsSection}>
          <h4 className={styles.tipsTitle}>
            <span className={styles.tipsIcon}>💡</span>
            Профессиональные советы
          </h4>
          <div className={styles.tipsGrid}>
            <div className={styles.tipItem}>
              <span className={styles.tipIcon}>🎧</span>
              <span>Используй наушники для детальной проработки</span>
            </div>
            <div className={styles.tipItem}>
              <span className={styles.tipIcon}>🔊</span>
              <span>Проверь звучание на разных устройствах</span>
            </div>
            <div className={styles.tipItem}>
              <span className={styles.tipIcon}>⚡</span>
              <span>Добавь уникальный саунд для узнаваемости</span>
            </div>
            <div className={styles.tipItem}>
              <span className={styles.tipIcon}>🎨</span>
              <span>Создай яркую обложку для привлечения внимания</span>
            </div>
          </div>
        </div>

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
            Закрыть окно
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoopGuideModal;
