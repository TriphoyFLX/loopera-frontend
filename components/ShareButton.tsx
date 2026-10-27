import { useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import LoopShareModal from './LoopShareModal';
import type { LoopShareMeta } from '../utils/loopShareVideo';
import './ShareButton.css';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  label?: string;
  compact?: boolean;
  className?: string;
  loop?: LoopShareMeta | null;
}

const ShareButton = ({
  title,
  text,
  url,
  label,
  compact = false,
  className = '',
  loop = null,
}: ShareButtonProps) => {
  const { t } = useI18n();
  const shareLabel = label ?? t('share.default');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`share-button ${compact ? 'share-button--compact' : ''} ${className}`.trim()}
        onClick={() => setOpen(true)}
        aria-label={shareLabel}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 3v10" />
          <path d="M8 7l4-4 4 4" />
          <path d="M5 12v5a2 2 0 002 2h10a2 2 0 002-2v-5" />
        </svg>
        {!compact && <span>{shareLabel}</span>}
      </button>

      <LoopShareModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        text={text}
        url={url}
        loop={loop}
      />
    </>
  );
};

export default ShareButton;
