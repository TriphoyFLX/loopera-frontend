import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { api } from '../utils/api';
import { useI18n } from '../i18n/useI18n';
import AuthPrompt from './AuthPrompt';
import PaywallModal, { isPlanLimitError, type PaywallAction } from './PaywallModal';
import styles from './LoopUpload.module.css';

const UPLOAD_RULE_KEYS = [
  'uploadPage.rule1',
  'uploadPage.rule2',
  'uploadPage.rule3',
  'uploadPage.rule4',
  'uploadPage.rule5',
  'uploadPage.rule6',
  'uploadPage.rule7',
  'uploadPage.rule8',
  'uploadPage.rule9',
  'uploadPage.rule10',
] as const;

const MOOD_OPTIONS = ['angry', 'dark', 'sad', 'happy', 'chill', 'energetic', 'romantic'] as const;

const LoopUpload = () => {
  const { t } = useI18n();
  const { token, logout, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    title: '',
    bpm: undefined as number | undefined,
    key: '',
    genre: '',
    mood: '',
    tags: '',
    instagram: '',
    telegram: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallAction, setPaywallAction] = useState<PaywallAction>('upload');
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'bpm' ? (value ? parseInt(value, 10) : undefined) : value,
    }));
  };

  const acceptFile = (selectedFile: File | null | undefined) => {
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(t('uploadPage.fileTooBig'));
      return;
    }

    const allowedTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/webm',
      'audio/aac',
      'audio/flac',
      'audio/x-wav',
      'audio/wave',
    ];
    const byExt = /\.(mp3|wav|ogg|m4a|webm|aac|flac)$/i.test(selectedFile.name);
    if (!allowedTypes.includes(selectedFile.type) && !byExt) {
      setError(t('uploadPage.badFormat'));
      return;
    }

    setFile(selectedFile);
    setError('');
    if (!formData.title.trim()) {
      setFormData((prev) => ({
        ...prev,
        title: selectedFile.name.replace(/\.[^.]+$/, '').slice(0, 80),
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requireAuth(() => {}, 'upload')) return;
    if (!token) return;

    if (!file) {
      setError(t('uploadPage.fileRequired'));
      return;
    }

    if (!formData.title.trim()) {
      setError(t('uploadPage.titleRequired'));
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('loop', file);
      uploadFormData.append('title', formData.title);
      if (coverFile) uploadFormData.append('cover', coverFile);

      if (formData.bpm) uploadFormData.append('bpm', formData.bpm.toString());
      if (formData.key) uploadFormData.append('key', formData.key);
      if (formData.genre) uploadFormData.append('genre', formData.genre);
      if (formData.mood) uploadFormData.append('mood', formData.mood);
      if (formData.tags.trim()) {
        const tagsArray = formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
        if (tagsArray.length > 0) {
          uploadFormData.append('tags', JSON.stringify(tagsArray));
        }
      }
      if (formData.instagram) uploadFormData.append('instagram', formData.instagram);
      if (formData.telegram) uploadFormData.append('telegram', formData.telegram);

      const progressInterval = window.setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            window.clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await api.uploadLoop(uploadFormData, token);
      window.clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(t('uploadPage.success'));

      setFormData({
        title: '',
        bpm: undefined,
        key: '',
        genre: '',
        mood: '',
        tags: '',
        instagram: '',
        telegram: '',
      });
      setFile(null);
      setCoverFile(null);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (coverInputRef.current) coverInputRef.current.value = '';

      window.setTimeout(() => {
        setUploadProgress(0);
        setSuccess('');
      }, 3000);
    } catch (err) {
      if (isPlanLimitError(err)) {
        setPaywallAction((err.action as PaywallAction) || 'upload');
        setPaywallMessage(err.message);
        setPaywallOpen(true);
        setUploadProgress(0);
        return;
      }

      const errorMessage = err instanceof Error ? err.message : t('uploadPage.uploadFailed');

      if (errorMessage.includes('сессия истекла') || errorMessage.includes('войдите снова')) {
        setError(t('uploadPage.sessionExpiredRedirect'));
        logout?.();
        window.setTimeout(() => navigate('/auth'), 1500);
      } else {
        setError(errorMessage);
      }

      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const guestReturnTo = `${location.pathname}${location.search}`;

  return (
    <div className={`${styles.page} ${!isAuthenticated ? styles.guest : ''}`}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{t('uploadPage.title')}</h1>
      </header>

      <div className={styles.layout}>
      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div
            className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''} ${file ? styles.dropzoneFilled : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="file"
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/aac,audio/flac,.mp3,.wav,.ogg,.m4a,.webm,.aac,.flac"
              onChange={handleFileChange}
              disabled={isLoading}
              className={styles.fileInput}
            />
            <div className={styles.dropIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4" />
                <path d="M8 8l4-4 4 4" />
                <path d="M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16" />
              </svg>
            </div>
            {file ? (
              <div className={styles.fileMeta}>
                <strong>{file.name}</strong>
                <span>
                  {formatFileSize(file.size)}
                  {file.type ? ` · ${file.type.replace('audio/', '').toUpperCase()}` : ''}
                </span>
              </div>
            ) : (
              <div className={styles.fileMeta}>
                <strong>{t('uploadPage.dropTitle')}</strong>
                <span>{t('uploadPage.fileMax')}</span>
              </div>
            )}
          </div>

          <div className={styles.coverField}>
            <span className={styles.coverLabel}>Обложка (необязательно)</span>
            <div className={styles.coverRow}>
              <button
                type="button"
                className={styles.coverPick}
                onClick={() => coverInputRef.current?.click()}
                disabled={isLoading}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="" className={styles.coverPreview} />
                ) : (
                  <span className={styles.coverPlaceholder}>+</span>
                )}
              </button>
              <div className={styles.coverMeta}>
                <p>JPG, PNG или WEBP. Если не добавить — цветной квадрат.</p>
                {coverFile && (
                  <button
                    type="button"
                    className={styles.coverClear}
                    onClick={() => {
                      setCoverFile(null);
                      if (coverPreview) URL.revokeObjectURL(coverPreview);
                      setCoverPreview(null);
                      if (coverInputRef.current) coverInputRef.current.value = '';
                    }}
                  >
                    Убрать
                  </button>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                className={styles.fileInput}
                disabled={isLoading}
                onChange={(e) => {
                  const next = e.target.files?.[0];
                  if (!next) return;
                  if (next.size > 10 * 1024 * 1024) {
                    setError('Обложка слишком большая (макс. 10MB)');
                    return;
                  }
                  if (coverPreview) URL.revokeObjectURL(coverPreview);
                  setCoverFile(next);
                  setCoverPreview(URL.createObjectURL(next));
                  setError('');
                }}
              />
            </div>
          </div>

          <label className={styles.field}>
            <span>{t('uploadPage.nameRequired')}</span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder={t('uploadPage.titlePlaceholder')}
              disabled={isLoading}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>{t('uploadPage.bpm')}</span>
              <input
                type="number"
                name="bpm"
                value={formData.bpm || ''}
                onChange={handleInputChange}
                placeholder="120"
                min={60}
                max={200}
                disabled={isLoading}
              />
            </label>
            <label className={styles.field}>
              <span>{t('uploadPage.key')}</span>
              <input
                type="text"
                name="key"
                value={formData.key}
                onChange={handleInputChange}
                placeholder={t('uploadPage.keyPlaceholder')}
                maxLength={10}
                disabled={isLoading}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>{t('uploadPage.genre')}</span>
            <input
              type="text"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              placeholder={t('uploadPage.genrePlaceholder')}
              disabled={isLoading}
            />
          </label>

          <label className={styles.field}>
            <span>{t('uploadPage.mood')}</span>
            <select
              name="mood"
              value={formData.mood}
              onChange={(e) => setFormData((prev) => ({ ...prev, mood: e.target.value }))}
              disabled={isLoading}
            >
              <option value="">{t('uploadPage.moodPlaceholder')}</option>
              {MOOD_OPTIONS.map((mood) => (
                <option key={mood} value={mood}>
                  {t(`uploadPage.moodOptions.${mood}`)}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>{t('uploadPage.tagsComma')}</span>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder={t('uploadPage.tagsPlaceholder')}
              disabled={isLoading}
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>{t('uploadPage.instagramOptional')}</span>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
                placeholder={t('uploadPage.instagramPlaceholder')}
                disabled={isLoading}
              />
            </label>
            <label className={styles.field}>
              <span>{t('uploadPage.telegramOptional')}</span>
              <input
                type="url"
                name="telegram"
                value={formData.telegram}
                onChange={handleInputChange}
                placeholder={t('uploadPage.telegramPlaceholder')}
                disabled={isLoading}
              />
            </label>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {uploadProgress > 0 && (
            <div className={styles.progress}>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
              </div>
              <span>{uploadProgress}%</span>
            </div>
          )}

          <button type="submit" disabled={isLoading || !file} className={styles.submit}>
            {isLoading ? t('uploadPage.uploading') : t('uploadPage.submit')}
          </button>
        </form>

        {!isAuthenticated && (
          <div className={styles.gate}>
            <AuthPrompt feature="upload" variant="inline" returnTo={guestReturnTo} />
          </div>
        )}
      </div>

      <section className={styles.rules} aria-labelledby="upload-rules-title">
        <div className={styles.rulesHead}>
          <h2 id="upload-rules-title" className={styles.rulesTitle}>
            {t('uploadPage.rulesTitle')}
          </h2>
        </div>
        <ol className={styles.rulesList}>
          {UPLOAD_RULE_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
      </section>
      </div>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        action={paywallAction}
        message={paywallMessage}
      />
    </div>
  );
};

export default LoopUpload;
