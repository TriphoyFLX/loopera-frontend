import React, { useState } from 'react';
import styles from './Add.module.css';

const Add: React.FC = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className={styles.root}>
      <div className={styles.wrap}>

        <div className={styles.topRow}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Реклама
          </div>
          <button
            className={styles.closeBtn}
            aria-label="Закрыть рекламу"
            onClick={() => setVisible(false)}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="9" y2="9" />
              <line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        </div>

        <h2 className={styles.headline}>
          Охватите<br />
          <em>свою аудиторию</em>
        </h2>

        <p className={styles.sub}>
          Тысячи читателей видят этот блок каждый день.
          Займите его первым.
        </p>

        <div className={styles.divider} />

        <div className={styles.contacts}>
          <a className={styles.contactLink} href="mailto:ads@loopera.com">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            triphoyprod@gmail.com
          </a>
          
        </div>

        <div className={styles.footer}>
  <button
    className={styles.cta}
    onClick={() => {
      window.open('https://t.me/triphoyprod', '_blank');
    }}
  >
    Разместить рекламу
    <span className={styles.ctaArrow}>
      <svg
        width="11"
        height="11"
        viewBox="0 0 11 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="1.5" y1="9.5" x2="9.5" y2="1.5" />
        <polyline points="3.5,1.5 9.5,1.5 9.5,7.5" />
      </svg>
    </span>
  </button>

  <span className={styles.partner}>Партнёрская программа</span>
</div>

      </div>
    </div>
  );
};

export default Add;