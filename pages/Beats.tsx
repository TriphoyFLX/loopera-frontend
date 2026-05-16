import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { getUploadsUrl } from '../utils/urls';
import './Beats.css';

const Beats: React.FC = () => {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    loop_id: '',
    description: '',
    tags: '',
    bpm: undefined as number | undefined,
    key: '',
    genre: '',
    is_collaboration: false,
    collaboration_credit: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [beats, setBeats] = useState<any[]>([]);
  const [beatsLoading, setBeatsLoading] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Размер файла не должен превышать 10MB');
        return;
      }
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/aac', 'audio/flac'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Неподдерживаемый формат файла');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Необходимо авторизоваться');
      return;
    }

    if (!file) {
      setError('Выберите файл для загрузки');
      return;
    }

    if (!formData.title.trim()) {
      setError('Название бита обязательно');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('beat', file);
      uploadFormData.append('title', formData.title);
      
      if (formData.loop_id) {
        uploadFormData.append('loop_id', formData.loop_id);
      }
      if (formData.description) {
        uploadFormData.append('description', formData.description);
      }
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        if (tagsArray.length > 0) {
          uploadFormData.append('tags', JSON.stringify(tagsArray));
        }
      }
      if (formData.bpm) {
        uploadFormData.append('bpm', formData.bpm.toString());
      }
      if (formData.key) {
        uploadFormData.append('key', formData.key);
      }
      if (formData.genre) {
        uploadFormData.append('genre', formData.genre);
      }
      if (formData.is_collaboration) {
        uploadFormData.append('is_collaboration', 'true');
      }
      if (formData.collaboration_credit) {
        uploadFormData.append('collaboration_credit', formData.collaboration_credit);
      }

      await api.uploadBeat(uploadFormData, token);
      setSuccess('Бит успешно загружен!');
      
      setFormData({
        title: '',
        loop_id: '',
        description: '',
        tags: '',
        bpm: undefined,
        key: '',
        genre: '',
        is_collaboration: false,
        collaboration_credit: ''
      });
      setFile(null);
      
      loadBeats();

      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки бита');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBeats = async () => {
    try {
      setBeatsLoading(true);
      const result = await api.getAllBeats();
      setBeats(result.beats);
    } catch (err) {
      console.error('Failed to load beats:', err);
    } finally {
      setBeatsLoading(false);
    }
  };

  React.useEffect(() => {
    loadBeats();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!token) {
    return (
      <div className="beats-page">
        <div className="beats-container">
          <h2>Биты</h2>
          <div className="error-message">
            Для просмотра и загрузки битов необходимо авторизоваться
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="beats-page">
      <div className="beats-container">
        <h2>Загрузить бит</h2>
        <p className="user-info">Пользователь: {user?.username}</p>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="beat">Аудиофайл (макс. 10MB)</label>
            <input
              type="file"
              id="beat"
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/aac,audio/flac"
              onChange={handleFileChange}
              required
              disabled={isLoading}
            />
            {file && (
              <div className="file-info">
                <span>📁 {file.name}</span>
                <span>📊 {formatFileSize(file.size)}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="title">Название *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Название вашего бита"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="loop_id">Луп (опционально)</label>
            <input
              type="text"
              id="loop_id"
              name="loop_id"
              value={formData.loop_id}
              onChange={handleInputChange}
              placeholder="ID лупа который использовали"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bpm">BPM</label>
              <input
                type="number"
                id="bpm"
                name="bpm"
                value={formData.bpm || ''}
                onChange={handleInputChange}
                placeholder="120"
                min="60"
                max="200"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="key">Тональность</label>
              <input
                type="text"
                id="key"
                name="key"
                value={formData.key}
                onChange={handleInputChange}
                placeholder="C, Am, Fm"
                maxLength={10}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="genre">Жанр</label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              placeholder="Hip-Hop, Electronic, Rock"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Теги (через запятую)</label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="trap, bass, 808, melody"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Описание вашего бита"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="is_collaboration"
                checked={formData.is_collaboration}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              Это коллаборация
            </label>
          </div>

          {formData.is_collaboration && (
            <div className="form-group">
              <label htmlFor="collaboration_credit">Кредиты коллаборации</label>
              <input
                type="text"
                id="collaboration_credit"
                name="collaboration_credit"
                value={formData.collaboration_credit}
                onChange={handleInputChange}
                placeholder="Имя соавтора"
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              ✅ {success}
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || !file}
            className={`upload-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? '⏳ Загрузка...' : '📤 Загрузить бит'}
          </button>
        </form>

        <div className="beats-list-section">
          <h3>Все биты</h3>
          {beatsLoading ? (
            <div className="loading">Загрузка...</div>
          ) : (
            <div className="beats-grid">
              {beats.map(beat => (
                <div key={beat.id} className="beat-card">
                  <h4>{beat.title}</h4>
                  <p className="beat-author">Автор: {beat.author}</p>
                  {beat.loop_title && (
                    <p className="beat-loop">Луп: {beat.loop_title}</p>
                  )}
                  <audio controls src={getUploadsUrl(beat.filename)} />
                  {beat.is_collaboration && (
                    <span className="collaboration-badge">Коллаборация</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Beats;
