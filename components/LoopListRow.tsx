import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import { api } from '../utils/api';
import { likeApi } from '../utils/likeApi';
import { loopDetailPath, profilePath } from '../utils/routes';
import LoopCover from './LoopCover';
import DownloadRulesModal from './DownloadRulesModal';
import PaywallModal, { isPlanLimitError, type PaywallAction } from './PaywallModal';
import styles from './LoopListRow.module.css';

type Props = {
  loop: any;
  index: number;
  queue?: any[];
  initialLiked?: boolean;
};

const parseTags = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return raw
        .split(/[,#\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);
    }
  }
  return [];
};

const LoopListRow = ({ loop, index, queue, initialLiked }: Props) => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { requireAuth } = useAuthGate();
  const player = useLoopPlayerOptional();

  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallAction, setPaywallAction] = useState<PaywallAction>('download');
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);

  const isPlaying = Boolean(player?.isCurrent(loop.id) && player.isPlaying);
  const tags = useMemo(() => parseTags(loop.tags).slice(0, 3), [loop.tags]);
  const meta = [loop.bpm ? `${loop.bpm}bpm` : null, loop.key || null].filter(Boolean).join(' ');

  useEffect(() => {
    if (typeof initialLiked === 'boolean' || !user) return;
    let cancelled = false;
    void likeApi.getLikeStatus(loop.id).then((s) => {
      if (!cancelled) setLiked(s.liked);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [loop.id, user, initialLiked]);

  const openLoop = () => {
    setMenuOpen(false);
    navigate(loopDetailPath(loop.id));
  };

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMenuOpen(false);
    player?.play(loop, queue);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth(() => {}, 'like') || !user) return;
    try {
      const res = await likeApi.toggleLike(loop.id);
      setLiked(res.liked);
    } catch {
      /* ignore */
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => setShowDownloadModal(true), 'download');
  };

  const handleDownloadConfirm = async () => {
    setShowDownloadModal(false);
    if (!token) return;
    const ext = loop.filename?.split('.').pop() || 'mp3';
    const title = String(loop.title || 'loop').replace(/[^a-zA-Z0-9а-яА-Я_\-\s]/g, '').trim();
    try {
      await api.downloadLoop(loop.id, token, `loopera.ru_${title}.${ext}`);
    } catch (error) {
      if (isPlanLimitError(error)) {
        setPaywallAction((error.action as PaywallAction) || 'download');
        setPaywallMessage(error.message);
        setPaywallOpen(true);
      }
    }
  };

  return (
    <article
      className={`${styles.row} ${isPlaying ? styles.playing : ''}`}
      onClick={handlePlay}
    >
      <button type="button" className={styles.index} onClick={handlePlay} aria-label="Играть">
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.indexIcon}>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <span className={styles.indexNum}>{index}</span>
        )}
        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.indexPlay}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <button type="button" className={styles.coverBtn} onClick={handlePlay} aria-label={`Слушать ${loop.title || ''}`}>
        <LoopCover loop={loop} rounded="md" className={styles.cover} alt="" />
      </button>

      <div className={styles.info}>
        <button type="button" className={styles.title} onClick={handlePlay}>
          {loop.title || 'Untitled'}
        </button>
        <div className={styles.sub}>
          <button
            type="button"
            className={styles.author}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = profilePath(loop.author);
            }}
          >
            {loop.author || 'loopera'}
          </button>
          {meta && <span className={styles.meta}>{meta}</span>}
        </div>
      </div>

      <div className={styles.tags}>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={styles.tag}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/loops?tag=${encodeURIComponent(tag)}`);
            }}
          >
            #{tag.replace(/^#/, '')}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.iconBtn} ${liked ? styles.liked : ''}`}
          onClick={handleLike}
          aria-label={liked ? 'Убрать лайк' : 'Лайк'}
        >
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <button
          type="button"
          className={styles.download}
          onClick={handleDownloadClick}
          aria-label="Скачать"
        >
          <svg className={styles.downloadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 3v10" strokeLinecap="round" />
            <path d="M8 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
          </svg>
          <span className={styles.downloadLabel}>Скачать</span>
        </button>

        <div className={styles.moreWrap}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Ещё"
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="12" cy="19" r="1.6" />
            </svg>
          </button>
          {menuOpen && (
            <div className={styles.menu} role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  openLoop();
                }}
              >
                Открыть
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(e);
                }}
              >
                Слушать
              </button>
            </div>
          )}
        </div>
      </div>

      <DownloadRulesModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownloadConfirm}
        loopTitle={loop.title}
      />
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        action={paywallAction}
        message={paywallMessage}
      />
    </article>
  );
};

export default LoopListRow;
