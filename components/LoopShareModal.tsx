import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/useI18n';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { shareContent } from '../utils/share';
import { api } from '../utils/api';
import PaywallModal, { isPlanLimitError } from './PaywallModal';
import {
  downloadBlob,
  generateLoopShareVideo,
  type LoopShareMeta,
  type ShareVideoProgress,
} from '../utils/loopShareVideo';
import styles from './LoopShareModal.module.css';

interface LoopShareModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url: string;
  loop?: LoopShareMeta | null;
}

const LoopShareModal = ({ open, onClose, title, text, url, loop }: LoopShareModalProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { requireAuth } = useAuthGate();
  const [linkStatus, setLinkStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [videoState, setVideoState] = useState<ShareVideoProgress | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();
  const busyRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (!open) {
      setPublished(false);
      setPublishing(false);
    }
  }, [open]);

  if (!open) return null;

  const handleShareLink = async () => {
    // Always copy link to clipboard immediately
    const result = await shareContent({ title, text, url, preferNative: false });
    if (result.ok || result.copied) {
      setLinkStatus('copied');
      window.setTimeout(() => setLinkStatus('idle'), 2000);
    }
  };

  const handleMakeVideo = async () => {
    if (!loop || busyRef.current) return;
    busyRef.current = true;
    setError('');
    setPublished(false);
    setVideoBlob(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }

    try {
      const result = await generateLoopShareVideo(loop, setVideoState);
      const objectUrl = URL.createObjectURL(result.blob);
      setVideoBlob(result.blob);
      setVideoUrl(objectUrl);
      setVideoName(result.filename);
      setVideoState({ phase: 'done', progress: 1, message: t('share.videoReady') });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('share.videoError');
      setError(message);
      setVideoState({ phase: 'error', progress: 0, message });
    } finally {
      busyRef.current = false;
    }
  };

  const handleDownloadVideo = () => {
    if (!videoBlob || !videoName) return;
    downloadBlob(videoBlob, videoName);
  };

  const doPublish = async () => {
    if (!videoBlob || !loop || !token) return;
    setPublishing(true);
    setError('');
    try {
      const ext = videoName.endsWith('.mp4') ? 'mp4' : 'webm';
      const mime = videoBlob.type || (ext === 'mp4' ? 'video/mp4' : 'video/webm');
      const file = new File([videoBlob], videoName || `looptok.${ext}`, { type: mime });

      if (file.size > 15 * 1024 * 1024) {
        setError(t('looptok.videoTooLarge'));
        return;
      }

      const form = new FormData();
      form.append('clip', file);
      form.append('title', loop.title || title);
      form.append('caption', text || '');
      form.append('loop_id', String(loop.id));
      form.append('from_share', '1');
      if (loop.bpm) form.append('bpm', String(loop.bpm));
      if (loop.key) form.append('key', String(loop.key));

      await api.uploadLoopTok(form, token);
      setPublished(true);
    } catch (err) {
      if (isPlanLimitError(err)) {
        setPaywallMessage(err.message);
        setPaywallOpen(true);
      } else {
        setError(err instanceof Error ? err.message : t('looptok.uploadFailed'));
      }
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = () => {
    requireAuth(() => {
      void doPublish();
    }, 'upload');
  };

  const progressPct = Math.round((videoState?.progress ?? 0) * 100);
  const isBusy =
    videoState?.phase === 'loading' ||
    videoState?.phase === 'rendering' ||
    videoState?.phase === 'encoding' ||
    publishing;

  return createPortal(
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && !isBusy && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={t('share.modalTitle')}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('share.modalTitle')}</h2>
          <button type="button" className={styles.close} onClick={onClose} disabled={isBusy} aria-label={t('common.close')}>
            ×
          </button>
        </div>

        <div className={styles.loopMeta}>
          <strong>{title}</strong>
          {loop?.author && <span>@{loop.author}</span>}
          {(loop?.bpm || loop?.key || loop?.genre) && (
            <div className={styles.pills}>
              {loop?.bpm ? <em>{loop.bpm} BPM</em> : null}
              {loop?.key ? <em>{loop.key}</em> : null}
              {loop?.genre ? <em>{loop.genre}</em> : null}
            </div>
          )}
        </div>

        <div className={styles.urlRow}>{url}</div>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={handleShareLink} disabled={isBusy}>
            {linkStatus === 'copied' ? t('share.copied') : t('share.shareLink')}
          </button>

          {loop && (
            <button type="button" className={styles.secondary} onClick={handleMakeVideo} disabled={isBusy}>
              {isBusy && !publishing ? t('share.makingVideo') : t('share.makeVideo')}
            </button>
          )}
        </div>

        {isBusy && !publishing && (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <span style={{ width: `${progressPct}%` }} />
            </div>
            <p>{videoState?.message || t('share.makingVideo')} · {progressPct}%</p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {videoUrl && (
          <div className={styles.preview}>
            <video src={videoUrl} controls playsInline className={styles.video} />
            <div className={styles.previewActions}>
              <button type="button" className={styles.download} onClick={handleDownloadVideo} disabled={publishing}>
                {t('share.downloadMp4')}
              </button>
              {!published ? (
                <button
                  type="button"
                  className={styles.publish}
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? t('looptok.uploading') : t('share.publishLoopTok')}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.publish}
                  onClick={() => {
                    onClose();
                    navigate('/looptok');
                  }}
                >
                  {t('share.openLoopTok')}
                </button>
              )}
            </div>
            <p className={styles.hint}>
              {published ? t('share.publishedHint') : t('share.videoHint')}
            </p>
          </div>
        )}
      </div>
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        action="looptok"
        message={paywallMessage}
      />
    </div>,
    document.body,
  );
};

export default LoopShareModal;
