import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useLoopPlayer } from '../hooks/useLoopPlayer';
import { likeApi } from '../utils/likeApi';
import { api } from '../utils/api';
import { loopDetailPath, profilePath } from '../utils/routes';
import LoopCover from './LoopCover';
import DownloadRulesModal from './DownloadRulesModal';
import PaywallModal, { isPlanLimitError, type PaywallAction } from './PaywallModal';
import { useEffect, useRef, useState } from 'react';
import styles from './LoopPlayerBar.module.css';

const SWIPE_MIN = 48;

const LoopPlayerBar = () => {
  const { current, isPlaying, isLoading, toggle, next, prev } = useLoopPlayer();
  const { token, user } = useAuth();
  const { requireAuth } = useAuthGate();
  const [liked, setLiked] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallAction, setPaywallAction] = useState<PaywallAction>('download');
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!current || !user) {
        setLiked(false);
        return;
      }
      try {
        const status = await likeApi.getLikeStatus(current.id);
        if (!cancelled) setLiked(status.liked);
      } catch {
        if (!cancelled) setLiked(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [current?.id, user]);

  if (!current) return null;

  const authorName = current.author || 'loopera';
  const loopHref = loopDetailPath(current.id);
  const authorHref = profilePath(authorName);

  const handleLike = async () => {
    if (!requireAuth(() => {}, 'like') || !user) return;
    try {
      const res = await likeApi.toggleLike(current.id);
      setLiked(res.liked);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = async () => {
    if (!token) return;
    const ext = current.filename?.split('.').pop() || 'mp3';
    const name = `loopera.ru_${String(current.title || 'loop').replace(/[^\wа-яА-Я\- ]+/gi, '').trim()}.${ext}`;
    try {
      await api.downloadLoop(current.id, token, name);
    } catch (error) {
      if (isPlanLimitError(error)) {
        setPaywallAction((error.action as PaywallAction) || 'download');
        setPaywallMessage(error.message);
        setPaywallOpen(true);
      }
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) next();
    else prev();
  };

  return (
    <>
      <div
        className={styles.bar}
        role="region"
        aria-label="Сейчас играет"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.track}>
          <Link to={loopHref} className={styles.cover} aria-label={current.title || 'Открыть луп'}>
            <LoopCover loop={current} rounded="md" />
          </Link>
          <div className={styles.meta}>
            <Link to={loopHref} className={styles.title}>
              {current.title || 'Untitled'}
            </Link>
            <Link to={authorHref} className={styles.author}>
              {authorName}
            </Link>
          </div>
        </div>

        <div className={styles.controls}>
          <button type="button" className={`${styles.ctrl} ${styles.desktopOnlyCtrl}`} onClick={prev} aria-label="Предыдущий">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button
            type="button"
            className={styles.play}
            onClick={toggle}
            aria-label={isPlaying ? 'Пауза' : 'Играть'}
            disabled={isLoading}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button type="button" className={`${styles.ctrl} ${styles.desktopOnlyCtrl}`} onClick={next} aria-label="Следующий">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>
          </button>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.heart} ${liked ? styles.liked : ''}`}
            onClick={handleLike}
            aria-label="Лайк"
          >
            <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.download} ${styles.desktopOnlyCtrl}`}
            onClick={() => requireAuth(() => setShowDownloadModal(true), 'download')}
          >
            Скачать
          </button>
        </div>
      </div>

      <DownloadRulesModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={async () => {
          setShowDownloadModal(false);
          await handleDownload();
        }}
        loopTitle={current.title}
      />
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        action={paywallAction}
        message={paywallMessage}
      />
    </>
  );
};

export default LoopPlayerBar;
