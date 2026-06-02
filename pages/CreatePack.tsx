// CreatePack.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreatePack.module.css';

const CreatePack: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [voiceTag, setVoiceTag] = useState('');
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [previewFile1, setPreviewFile1] = useState<File | null>(null);
  const [previewFile2, setPreviewFile2] = useState<File | null>(null);
  const [voiceTagFile, setVoiceTagFile] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Название обязательно');
      return;
    }

    if (!price || parseInt(price) < 0) {
      setError('Укажите корректную цену');
      return;
    }

    if (!description.trim() || description.trim().length < 100) {
      setError('Описание должно содержать минимум 100 символов');
      return;
    }

    if (!archiveFile) {
      setError('Архив обязателен');
      return;
    }

    if (!previewFile1) {
      setError('Минимум один превью файл обязателен');
      return;
    }

    if (!textFile) {
      setError('Текстовый файл обязателен');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('voice_tag', voiceTag.trim());
      formData.append('archive', archiveFile);
      formData.append('preview1', previewFile1);
      if (previewFile2) {
        formData.append('preview2', previewFile2);
      }
      if (voiceTagFile) {
        formData.append('voiceTag', voiceTagFile);
      }
      formData.append('textFile', textFile);
      if (coverFile) {
        formData.append('cover', coverFile);
      }

      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось создать пак');
      }

      setSuccess('Пак успешно отправлен! Он будет проверен модераторами.');
      
      setTimeout(() => {
        navigate('/shop');
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать пак');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dragOver);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragOver);
  };

  const handleDrop = (e: React.DragEvent, setter: (file: File) => void, accept: string[]) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragOver);
    
    const file = e.dataTransfer.files[0];
    if (file && accept.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setter(file);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Создать пак звуков</h1>
          <p className={styles.subtitle}>Поделитесь своими звуками со всем миром</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.alertError}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.alertSuccess}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>{success}</span>
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Основная информация</h2>
            
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="title">
                Название пака <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="title"
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="например, 'Полуночные мелодии'"
                maxLength={255}
                required
              />
              <p className={styles.hint}>Выберите запоминающееся название для вашего пака</p>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Обложка
              </label>
              <div
                className={styles.uploadArea}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setCoverFile, ['.jpg', '.jpeg', '.png', '.webp'])}
              >
                <input
                  type="file"
                  id="coverFile"
                  className={styles.fileInput}
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCoverFile(e.target.files[0]);
                    }
                  }}
                  disabled={loading}
                />
                <label htmlFor="coverFile" className={styles.uploadLabel}>
                  <div className={styles.uploadIcon}>🖼️</div>
                  <div className={styles.uploadText}>
                    <span className={styles.uploadTitle}>Загрузить обложку</span>
                    <span className={styles.uploadSubtitle}>Необязательно - JPG, PNG, WEBP (Макс 10МБ)</span>
                  </div>
                </label>
                {coverFile && (
                  <div className={styles.fileInfo}>
                    <span className={styles.fileIcon}>✓</span>
                    <span className={styles.fileName}>{coverFile.name}</span>
                    <span className={styles.fileSize}>({formatFileSize(coverFile.size)})</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="description">
                Описание
              </label>
              <textarea
                id="description"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите ваш пак, вдохновение и чего ожидать пользователям..."
                rows={4}
                maxLength={1000}
              />
              <p className={styles.hint}>{description.length}/1000 символов</p>
            </div>

            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="price">
                  Цена <span className={styles.required}>*</span>
                </label>
                <div className={styles.priceInput}>
                  <span className={styles.priceSymbol}>💰</span>
                  <input
                    type="number"
                    id="price"
                    className={styles.input}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="10000"
                    required
                  />
                  <span className={styles.priceUnit}>coins</span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="voiceTag">
                  Текст голосового тега
                </label>
                <input
                  type="text"
                  id="voiceTag"
                  className={styles.input}
                  value={voiceTag}
                  onChange={(e) => setVoiceTag(e.target.value)}
                  placeholder="Ваш продюсерский тег..."
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Файлы</h2>
            
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Архив <span className={styles.required}>*</span>
              </label>
              <div 
                className={styles.uploadArea}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setArchiveFile, ['.zip'])}
              >
                <input
                  type="file"
                  id="archiveFile"
                  className={styles.fileInput}
                  accept=".zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArchiveFile(e.target.files[0]);
                    }
                  }}
                  disabled={loading}
                />
                <label htmlFor="archiveFile" className={styles.uploadLabel}>
                  <div className={styles.uploadIcon}>📦</div>
                  <div className={styles.uploadText}>
                    <span className={styles.uploadTitle}>Загрузить архив</span>
                    <span className={styles.uploadSubtitle}>Формат ZIP до 500МБ</span>
                  </div>
                </label>
              </div>
              {archiveFile && (
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>✓</span>
                  <span className={styles.fileName}>{archiveFile.name}</span>
                  <span className={styles.fileSize}>({formatFileSize(archiveFile.size)})</span>
                </div>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Превью 1 <span className={styles.required}>*</span>
                </label>
                <div 
                  className={styles.uploadArea}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, setPreviewFile1, ['.mp3', '.wav', '.ogg', '.m4a', '.flac'])}
                >
                  <input
                    type="file"
                    id="preview1"
                    className={styles.fileInput}
                    accept=".mp3,.wav,.ogg,.m4a,.flac"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPreviewFile1(e.target.files[0]);
                      }
                    }}
                    disabled={loading}
                  />
                  <label htmlFor="preview1" className={styles.uploadLabel}>
                    <div className={styles.uploadIcon}>🎵</div>
                    <div className={styles.uploadText}>
                      <span className={styles.uploadTitle}>Загрузить превью 1</span>
                      <span className={styles.uploadSubtitle}>MP3, WAV, OGG, M4A, FLAC (Макс 50МБ)</span>
                    </div>
                  </label>
                </div>
                {previewFile1 && (
                  <div className={styles.fileInfo}>
                    <span className={styles.fileIcon}>✓</span>
                    <span className={styles.fileName}>{previewFile1.name}</span>
                    <span className={styles.fileSize}>({formatFileSize(previewFile1.size)})</span>
                  </div>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Превью 2</label>
                <div 
                  className={styles.uploadArea}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, setPreviewFile2, ['.mp3', '.wav', '.ogg', '.m4a', '.flac'])}
                >
                  <input
                    type="file"
                    id="preview2"
                    className={styles.fileInput}
                    accept=".mp3,.wav,.ogg,.m4a,.flac"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPreviewFile2(e.target.files[0]);
                      }
                    }}
                    disabled={loading}
                  />
                  <label htmlFor="preview2" className={styles.uploadLabel}>
                    <div className={styles.uploadIcon}>🎵</div>
                    <div className={styles.uploadText}>
                      <span className={styles.uploadTitle}>Загрузить превью 2</span>
                      <span className={styles.uploadSubtitle}>Необязательно - MP3, WAV, OGG, M4A, FLAC (Макс 50МБ)</span>
                    </div>
                  </label>
                </div>
                {previewFile2 && (
                  <div className={styles.fileInfo}>
                    <span className={styles.fileIcon}>✓</span>
                    <span className={styles.fileName}>{previewFile2.name}</span>
                    <span className={styles.fileSize}>({formatFileSize(previewFile2.size)})</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Файл голосового тега</label>
              <div 
                className={styles.uploadArea}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setVoiceTagFile, ['.mp3', '.wav', '.ogg', '.m4a', '.flac'])}
              >
                <input
                  type="file"
                  id="voiceTagFile"
                  className={styles.fileInput}
                  accept=".mp3,.wav,.ogg,.m4a,.flac"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setVoiceTagFile(e.target.files[0]);
                    }
                  }}
                  disabled={loading}
                />
                <label htmlFor="voiceTagFile" className={styles.uploadLabel}>
                  <div className={styles.uploadIcon}>🎤</div>
                  <div className={styles.uploadText}>
                    <span className={styles.uploadTitle}>Загрузить голосовой тег</span>
                    <span className={styles.uploadSubtitle}>Необязательно - MP3, WAV, OGG, M4A, FLAC (Макс 50МБ)</span>
                  </div>
                </label>
              </div>
              {voiceTagFile && (
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>✓</span>
                  <span className={styles.fileName}>{voiceTagFile.name}</span>
                  <span className={styles.fileSize}>({formatFileSize(voiceTagFile.size)})</span>
                </div>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Текстовый файл <span className={styles.required}>*</span>
              </label>
              <div 
                className={styles.uploadArea}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setTextFile, ['.txt', '.rtf', '.pdf'])}
              >
                <input
                  type="file"
                  id="textFile"
                  className={styles.fileInput}
                  accept=".txt,.rtf,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setTextFile(e.target.files[0]);
                    }
                  }}
                  disabled={loading}
                  required
                />
                <label htmlFor="textFile" className={styles.uploadLabel}>
                  <div className={styles.uploadIcon}>📄</div>
                  <div className={styles.uploadText}>
                    <span className={styles.uploadTitle}>Загрузить текстовый файл</span>
                    <span className={styles.uploadSubtitle}>Формат TXT, RTF, PDF (Макс 10МБ)</span>
                  </div>
                </label>
              </div>
              {textFile && (
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>✓</span>
                  <span className={styles.fileName}>{textFile.name}</span>
                  <span className={styles.fileSize}>({formatFileSize(textFile.size)})</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Правила</h2>
            <div className={styles.rulesGrid}>
              <div className={styles.ruleCard}>
                <span className={styles.ruleIcon}>📦</span>
                <span className={styles.ruleText}>ZIP архив с лупами</span>
              </div>
              <div className={styles.ruleCard}>
                <span className={styles.ruleIcon}>🎵</span>
                <span className={styles.ruleText}>1-2 превью файла</span>
              </div>
              <div className={styles.ruleCard}>
                <span className={styles.ruleIcon}>⏰</span>
                <span className={styles.ruleText}>Аккаунт должен быть старше 3 дней</span>
              </div>
              <div className={styles.ruleCard}>
                <span className={styles.ruleIcon}>📦</span>
                <span className={styles.ruleText}>Отправляйте сколько угодно паков</span>
              </div>
              <div className={styles.ruleCard}>
                <span className={styles.ruleIcon}>👁️</span>
                <span className={styles.ruleText}>Проверяется модераторами</span>
              </div>
              <div className={styles.ruleCard}>
                <span className={styles.ruleIcon}>💰</span>
                <span className={styles.ruleText}>15% комиссия с продаж</span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() => navigate('/shop')}
              disabled={loading}
            >
              Отмена
            </button>
            
            <button
              type="submit"
              className={`${styles.buttonPrimary} ${loading ? styles.loading : ''}`}
              disabled={loading || !archiveFile || !previewFile1 || !textFile}
            >
              {loading ? 'Создание...' : 'Отправить на проверку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePack;