import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import {
  decodeAudioFile,
  formatBytes,
  formatTime,
  LOOPTOK_MAX_BYTES,
  LOOPTOK_MAX_TRIM_SEC,
  trimAudioFileToBlob,
} from '../utils/audioTrim';
import styles from './LoopTokTrimModal.module.css';

type Props = {
  file: File;
  open: boolean;
  onClose: () => void;
  onConfirm: (file: File, duration: number) => void;
};

export default function LoopTokTrimModal({ file, open, onClose, onConfirm }: Props) {
  const { t } = useI18n();
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(30);
  const [loading, setLoading] = useState(false);
  const [decoding, setDecoding] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    const run = async () => {
      setDecoding(true);
      setError('');
      try {
        const buffer = await decodeAudioFile(file);
        if (cancelled) return;
        const dur = buffer.duration;
        setDuration(dur);
        const initialEnd = Math.min(dur, LOOPTOK_MAX_TRIM_SEC, 30);
        setStart(0);
        setEnd(initialEnd);
        objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) setError(t('looptok.trimDecodeError'));
      } finally {
        if (!cancelled) setDecoding(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, open, t]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.currentTime >= end) {
        audio.pause();
        audio.currentTime = start;
      }
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, [start, end]);

  if (!open) return null;

  const selectionLen = Math.max(0, end - start);
  const estimatedWavBytes = Math.ceil(selectionLen * 44100 * 2 * 2);
  const mayExceed = estimatedWavBytes > LOOPTOK_MAX_BYTES;

  const handlePlayPreview = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = start;
    void audio.play();
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      if (selectionLen < 0.5) {
        setError(t('looptok.trimTooShort'));
        return;
      }
      if (selectionLen > LOOPTOK_MAX_TRIM_SEC) {
        setError(t('looptok.trimTooLong', { sec: LOOPTOK_MAX_TRIM_SEC }));
        return;
      }

      const { blob, duration: outDur, filename } = await trimAudioFileToBlob(file, start, end);
      const trimmed = new File([blob], filename, { type: 'audio/wav' });
      onConfirm(trimmed, outDur);
    } catch (err) {
      if (err instanceof Error && err.message === 'TRIM_STILL_TOO_LARGE') {
        setError(t('looptok.trimStillLarge'));
      } else {
        setError(t('looptok.trimFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2>{t('looptok.trimTitle')}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <p className={styles.hint}>
          {t('looptok.trimHint', {
            size: formatBytes(file.size),
            max: '15 MB',
          })}
        </p>

        {decoding ? (
          <p className={styles.status}>{t('looptok.trimDecoding')}</p>
        ) : (
          <>
            <div className={styles.meta}>
              <span>{file.name}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {previewUrl && (
              <audio ref={audioRef} src={previewUrl} preload="metadata" className={styles.audio} />
            )}

            <div className={styles.rangeBlock}>
              <label>
                {t('looptok.trimStart')}: {formatTime(start)}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0.1, duration)}
                  step={0.05}
                  value={start}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setStart(Math.min(next, end - 0.5));
                  }}
                />
              </label>
              <label>
                {t('looptok.trimEnd')}: {formatTime(end)}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0.1, duration)}
                  step={0.05}
                  value={end}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setEnd(Math.max(next, start + 0.5));
                  }}
                />
              </label>
            </div>

            <div className={styles.selection}>
              <strong>{formatTime(selectionLen)}</strong>
              <span>
                ~{formatBytes(estimatedWavBytes)}
                {mayExceed ? ` · ${t('looptok.trimMayExceed')}` : ''}
              </span>
            </div>

            <button type="button" className={styles.previewBtn} onClick={handlePlayPreview}>
              {t('looptok.trimPreview')}
            </button>
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <footer className={styles.footer}>
          <button type="button" className={styles.secondary} onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={handleConfirm}
            disabled={decoding || loading}
          >
            {loading ? t('looptok.trimming') : t('looptok.trimUse')}
          </button>
        </footer>
      </div>
    </div>
  );
}
