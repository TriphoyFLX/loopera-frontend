import { normalizePlanSlug } from '../utils/plans';
import styles from './VerifiedBadge.module.css';

type Props = {
  plan?: string | null;
  className?: string;
  title?: string;
};

/** Blue/gold check next to username for paid plans. */
const VerifiedBadge = ({ plan, className, title }: Props) => {
  const slug = normalizePlanSlug(plan);
  if (slug === 'free') return null;

  const tone = slug === 'business' ? styles.gold : styles.blue;
  const label =
    title ||
    (slug === 'business' ? 'Business' : slug === 'pro' ? 'Pro' : 'Basic');

  return (
    <svg
      className={`${styles.badge} ${tone} ${className ?? ''}`}
      viewBox="0 0 24 24"
      aria-label={label}
      role="img"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M7.5 12.5l3 3 6-6"
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default VerifiedBadge;
