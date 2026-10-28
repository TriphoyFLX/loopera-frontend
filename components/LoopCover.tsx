import { getLoopCoverColor, getLoopCoverUrl, type LoopLike } from '../utils/loopCover';
import styles from './LoopCover.module.css';

type Props = {
  loop: LoopLike;
  className?: string;
  alt?: string;
  rounded?: 'md' | 'lg' | 'xl' | 'full';
};

const LoopCover = ({ loop, className, alt = '', rounded = 'lg' }: Props) => {
  const url = getLoopCoverUrl(loop);
  const color = getLoopCoverColor(loop.id);
  const radiusClass =
    rounded === 'full'
      ? styles.full
      : rounded === 'xl'
        ? styles.xl
        : rounded === 'md'
          ? styles.md
          : styles.lg;

  const adBadge = loop?.is_ad ? (
    <span className={styles.adBadge} aria-label="Реклама">
      Ad
    </span>
  ) : null;

  if (url) {
    return (
      <div className={`${styles.cover} ${radiusClass} ${className ?? ''}`}>
        <img src={url} alt={alt} className={styles.img} loading="lazy" />
        {adBadge}
      </div>
    );
  }

  return (
    <div
      className={`${styles.cover} ${styles.solid} ${radiusClass} ${className ?? ''}`}
      style={{ backgroundColor: color }}
      aria-hidden={alt ? undefined : true}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    >
      {adBadge}
    </div>
  );
};

export default LoopCover;
