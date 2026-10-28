import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import { api } from '../utils/api';
import { profilePath, loopDetailPath } from '../utils/routes';
import DownloadRulesModal from './DownloadRulesModal';
import PaywallModal, { isPlanLimitError, type PaywallAction } from './PaywallModal';
import LoopCover from './LoopCover';
import { useI18n } from '../i18n/useI18n';
import './LoopCard.css';

interface LoopCardProps {
  loop: any;
  currentUserId?: number;
  onDelete?: (id: number) => void;
  onPin?: (id: number) => void;
  isPinned?: boolean;
  onPlay?: (loop: any) => void;
  isPlaying?: boolean;
  isLoading?: boolean;
  queue?: any[];
}

const LoopCard: React.FC<LoopCardProps> = ({
  loop,
  currentUserId,
  onDelete,
  onPin,
  isPinned = false,
  onPlay,
  isPlaying: isPlayingProp,
  isLoading: isLoadingProp,
  queue,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { requireAuth } = useAuthGate();
  const player = useLoopPlayerOptional();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallAction, setPaywallAction] = useState<PaywallAction>('download');
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();
  const [downloading, setDownloading] = useState(false);

  const isPlaying =
    typeof isPlayingProp === 'boolean'
      ? isPlayingProp
      : Boolean(player?.isCurrent(loop.id) && player.isPlaying);
  const isLoading =
    typeof isLoadingProp === 'boolean'
      ? isLoadingProp
      : Boolean(player?.isCurrent(loop.id) && player.isLoading);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(loop);
      return;
    }
    player?.play(loop, queue);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => setShowDownloadModal(true), 'download');
  };

  const handleDownloadConfirm = async () => {
    setShowDownloadModal(false);
    if (!token) return;
    const fileExtension = loop.filename?.split('.').pop() || 'mp3';
    const sanitizedTitle = String(loop.title || 'loop')
      .replace(/[^a-zA-Z0-9а-яА-Я_\-\s]/g, '')
      .trim();
    const downloadName = `loopera.ru_${sanitizedTitle}.${fileExtension}`;
    try {
      setDownloading(true);
      await api.downloadLoop(loop.id, token, downloadName);
    } catch (error) {
      if (isPlanLimitError(error)) {
        setPaywallAction((error.action as PaywallAction) || 'download');
        setPaywallMessage(error.message);
        setPaywallOpen(true);
      }
    } finally {
      setDownloading(false);
    }
  };

  const isOwner =
    currentUserId != null &&
    loop.user_id != null &&
    Number(currentUserId) === Number(loop.user_id);
  const metaBits = [
    loop.bpm ? `${loop.bpm}bpm` : null,
    loop.key || null,
  ].filter(Boolean);

  const openLoop = () => navigate(loopDetailPath(loop.id));

  return (
    <article
      className={`loop-card ${isPlaying ? 'loop-card--playing' : ''}`}
      id={`loop-card-${loop.id}`}
    >
      <div className="loop-card-cover">
        <button
          type="button"
          className="loop-card-cover-open"
          onClick={openLoop}
          aria-label={loop.title || t('loopCard.untitled')}
        >
          <LoopCover loop={loop} rounded="xl" alt={loop.title || ''} />
        </button>
        <button
          type="button"
          className="loop-card-play"
          onClick={handlePlay}
          aria-label={isPlaying ? 'Пауза' : 'Играть'}
        >
          {isLoading ? (
            <span className="loop-card-spinner" />
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      <div className="loop-card-body">
        <h4
          className="loop-card-title"
          title={loop.title || t('loopCard.untitled')}
          onClick={openLoop}
        >
          {loop.title || t('loopCard.untitled')}
        </h4>
        <button
          type="button"
          className="loop-card-author"
          onClick={() => {
            window.location.href = profilePath(loop.author);
          }}
        >
          {loop.author || 'loopera'}
        </button>

        <div className="loop-card-footer">
          <button
            type="button"
            className="loop-card-download"
            onClick={handleDownloadClick}
            disabled={downloading}
            aria-label="Скачать"
          >
            <svg className="loop-card-download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3v10" strokeLinecap="round" />
              <path d="M8 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
            </svg>
            <span className="loop-card-download-label">Скачать</span>
          </button>
          <span className="loop-card-meta">{metaBits.join(' ') || '—'}</span>
        </div>

        {(isOwner && (onDelete || onPin)) || isPinned ? (
          <div className="loop-card-extra">
            {(isPinned || (isOwner && onPin)) && (
              <button
                type="button"
                className={`loop-card-icon pin ${isPinned ? 'pinned' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOwner && onPin) onPin(loop.id);
                }}
                aria-label={isPinned ? 'Открепить' : 'Закрепить'}
                disabled={!isOwner || !onPin}
                title={isPinned ? 'Закреплён' : 'Закрепить'}
              >
                <svg viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M12 17v5" strokeLinecap="round" />
                  <path d="M9 2h6l-1 7h4l-6 7-6-7h4L9 2z" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {isOwner && onDelete && (
              <button
                type="button"
                className="loop-card-icon delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(loop.id);
                }}
                aria-label={t('loopCard.delete')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        ) : null}
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

export default LoopCard;
