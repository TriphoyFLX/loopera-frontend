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

  const steps = [
    {
      title: 'Выбери стиль',
      description: 'Trap, Drill, Lo-Fi или свой звук'
    },
    {
      title: 'Создай луп',
      description: 'Мелодия или бас, который хочется крутить'
    },
    {
      title: 'Чистый звук',
      description: 'Без клиппинга, норм уровень'
    },
    {
      title: 'Экспорт',
      description: 'Лучше WAV'
    },
    {
      title: 'Загрузка',
      description: 'Добавь обложку и теги'
    }
  ];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      
      <div className={`${styles.modal} ${isVisible ? styles.show : ''}`}>

        {/* HEADER */}
        <div className={styles.header}>
          <h2>
            Загрузка <span>лупа</span>
          </h2>
          <p>Коротко и по делу</p>
        </div>

        {/* STEPS */}
        <div className={styles.steps}>
          {steps.map((step, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.index}>{i + 1}</div>

              <div>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDesc}>{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* NOTE */}
        <div className={styles.note}>
          Добавь Telegram в название<br />
          <span>dark trap loop @yourtag</span>
        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button
            className={styles.primary}
            onClick={() => {
              onClose();
              window.location.href = '/loop-upload';
            }}
          >
            Начать
          </button>

          <button className={styles.secondary} onClick={onClose}>
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoopGuideModal;