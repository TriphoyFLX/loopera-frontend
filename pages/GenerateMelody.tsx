import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useI18n } from '../i18n/useI18n';
import { api } from '../utils/api';
import AuthPrompt from '../components/AuthPrompt';
import styles from './GenerateMelody.module.css';

type MelodyAnalysis = {
  bpm: number;
  key: string;
  mode: string;
  mood?: string;
  mood_label?: string;
  duration_sec?: number;
  instruments_found?: string[];
  beat_sync?: {
    has_melody?: boolean;
    has_bass?: boolean;
    has_drums?: boolean;
    has_chords?: boolean;
  };
};

type StemMeta = {
  id: string;
  label: string;
  label_ru?: string;
  icon: string;
  filename: string;
  note_count: number;
  matched_beat?: boolean;
  source?: string;
};

type StemFile = {
  midi_base64: string;
  filename: string;
};

type RewriteResult = {
  version: string;
  mode: string;
  analysis: MelodyAnalysis;
  stems: Record<string, StemFile>;
  stems_meta: StemMeta[];
  filename: string;
  midi_base64: string;
  zip_base64: string;
  zip_filename: string;
  bars: number;
  stem_count: number;
};

const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',
  'audio/aac',
  'audio/flac',
];

const downloadBase64 = (b64: string, filename: string, mime = 'audio/midi') => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const GenerateMelody = () => {
  const { token, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RewriteResult | null>(null);

  const loadingSteps = useMemo(
    () => [
      t('melodyPage.step1'),
      t('melodyPage.step2'),
      t('melodyPage.step3'),
      t('melodyPage.step4'),
    ],
    [t],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 12 * 1024 * 1024) {
      setError(t('melodyPage.fileTooBig'));
      return;
    }

    if (selected.type && !ALLOWED_TYPES.includes(selected.type)) {
      setError(t('melodyPage.badFormat'));
      return;
    }

    if (sourceUrl) URL.revokeObjectURL(sourceUrl);

    setFile(selected);
    setSourceUrl(URL.createObjectURL(selected));
    setError('');
    setResult(null);
  };

  const handleRewrite = async () => {
    if (!requireAuth(() => {}, 'upload')) return;
    if (!token || !file) {
      setError(t('melodyPage.pickFile'));
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    setLoadingStep(0);

    const stepTimer = window.setInterval(() => {
      setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1600);

    try {
      const formData = new FormData();
      formData.append('beat', file);
      const data = (await api.rewriteMelody(formData, token)) as RewriteResult;
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('melodyPage.generateError');
      setError(message);
    } finally {
      window.clearInterval(stepTimer);
      setIsLoading(false);
    }
  };

  const stemLabel = (stem: StemMeta) => {
    const key = `melodyPage.stems.${stem.id}`;
    const translated = t(key);
    return translated === key ? stem.label : translated;
  };

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{t('melodyPage.title')}</h1>
      </header>

      <div className={styles.card}>
        {!isAuthenticated && (
          <div className={styles.authWrap}>
            <AuthPrompt feature="upload" />
          </div>
        )}

        <div
          className={`${styles.dropzone} ${file ? styles.dropzoneFilled : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className={styles.fileInput}
            onChange={handleFileChange}
          />
          {file ? (
            <>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileMeta}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </>
          ) : (
            <>
              <span className={styles.dropIcon} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4" />
                  <path d="M8 8l4-4 4 4" />
                  <path d="M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16" />
                </svg>
              </span>
              <span className={styles.dropTitle}>{t('melodyPage.dropTitle')}</span>
              <span className={styles.dropHint}>{t('melodyPage.dropHint')}</span>
            </>
          )}
        </div>

        {sourceUrl && (
          <div className={styles.playerBlock}>
            <span className={styles.playerLabel}>{t('melodyPage.sourceLabel')}</span>
            <audio className={styles.player} controls src={sourceUrl} />
          </div>
        )}

        <button
          type="button"
          className={styles.generateBtn}
          onClick={handleRewrite}
          disabled={!file || isLoading}
        >
          {isLoading ? loadingSteps[loadingStep] : t('melodyPage.generateBtn')}
        </button>

        {isLoading && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
            />
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {result && (
          <div className={styles.result}>
            <div className={styles.resultHeader}>
              <h2 className={styles.resultTitle}>{t('melodyPage.resultTitle')}</h2>
              <span className={styles.resultMeta}>
                {t('melodyPage.resultMeta', {
                  bars: result.bars,
                  count: result.stem_count,
                })}
              </span>
            </div>

            <div className={styles.tags}>
              <span className={styles.tag}>{result.analysis.bpm} BPM</span>
              <span className={styles.tag}>
                {result.analysis.key} {result.analysis.mode === 'minor' ? 'min' : 'maj'}
              </span>
              {(result.analysis.instruments_found || []).map((id) => (
                <span key={id} className={styles.tag}>
                  {stemLabel({ id, label: id, icon: '', filename: '', note_count: 0 })}
                </span>
              ))}
            </div>

            <div className={styles.downloadAll}>
              <button
                type="button"
                className={styles.downloadPrimary}
                onClick={() =>
                  downloadBase64(result.zip_base64, result.zip_filename, 'application/zip')
                }
              >
                {t('melodyPage.downloadZip')}
              </button>
              <button
                type="button"
                className={styles.downloadSecondary}
                onClick={() => downloadBase64(result.midi_base64, result.filename)}
              >
                {t('melodyPage.downloadMid')}
              </button>
            </div>

            <div className={styles.stemsGrid}>
              {result.stems_meta.map((stem) => {
                const stemFile = result.stems[stem.id];
                if (!stemFile) return null;
                return (
                  <div key={stem.id} className={styles.stemCard}>
                    <div className={styles.stemTop}>
                      <span className={styles.stemIcon}>
                        {(stemLabel(stem) || '?').charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className={styles.stemName}>{stemLabel(stem)}</span>
                        <span className={styles.stemNotes}>
                          {stem.note_count} {t('melodyPage.notes')}
                        </span>
                      </div>
                      {stem.matched_beat && (
                        <span className={styles.stemMatch}>{t('melodyPage.fromBeat')}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.stemDownload}
                      onClick={() => downloadBase64(stemFile.midi_base64, stemFile.filename)}
                    >
                      {t('melodyPage.downloadMidBtn')}
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateMelody;
