import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import './LoopUpload.css';

const LoopUpload = () => {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    bpm: undefined as number | undefined,
    key: '',
    genre: '',
    tags: [] as string[]
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('Auth state:', { token: token ? 'есть' : 'нет', user });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'bpm' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      console.log('Выбран файл:', selectedFile.name, selectedFile.type, selectedFile.size);

      // Проверка размера файла (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5MB');
        return;
      }

      // Проверка формата файла
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/aac', 'audio/flac'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Неподдерживаемый формат файла. Разрешены: MP3, WAV, OGG, M4A, WEBM, AAC, FLAC');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== НАЧАЛО ОТПРАВКИ ФОРМЫ ===');
    
    if (!token) {
      setError('Необходимо авторизоваться');
      console.log('Ошибка: нет токена');
      return;
    }

    if (!file) {
      setError('Выберите файл для загрузки');
      console.log('Ошибка: нет файла');
      return;
    }

    if (!formData.title.trim()) {
      setError('Название лупа обязательно');
      console.log('Ошибка: нет названия');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('loop', file);
      uploadFormData.append('title', formData.title);
      
      if (formData.bpm) {
        uploadFormData.append('bpm', formData.bpm.toString());
      }
      if (formData.key) {
        uploadFormData.append('key', formData.key);
      }
      if (formData.genre) {
        uploadFormData.append('genre', formData.genre);
      }
      if (formData.tags && formData.tags.length > 0) {
        uploadFormData.append('tags', JSON.stringify(formData.tags));
      }

      console.log('📦 FormData подготовлен:');
      for (let pair of uploadFormData.entries()) {
        if (pair[0] === 'loop') {
          console.log('loop:', pair[1]);
        } else {
          console.log(`${pair[0]}:`, pair[1]);
        }
      }

      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      console.log('🚀 Отправка запроса...');
      const result = await api.uploadLoop(uploadFormData, token);
      console.log('✅ Результат загрузки:', result);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess('Луп успешно загружен!');
      
      // Сброс формы
      setFormData({
        title: '',
        bpm: undefined,
        key: '',
        genre: '',
        tags: []
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setUploadProgress(0);
        setSuccess('');
      }, 3000);

    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки лупа');
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
      console.log('=== КОНЕЦ ОТПРАВКИ ФОРМЫ ===');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!token) {
    return (
      <div className="loop-upload">
        <div className="upload-container">
          <h2>Загрузка лупа</h2>
          <div className="error-message">
            Для загрузки лупов необходимо авторизоваться
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="loop-upload">
      <div className="upload-container">
        <h2>Загрузка лупа</h2>
        <p className="user-info">Пользователь: {user?.username}</p>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="file">Аудиофайл (макс. 5MB)</label>
            <input
              ref={fileInputRef}
              type="file"
              id="file"
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/aac,audio/flac"
              onChange={handleFileChange}
              required
              disabled={isLoading}
            />
            {file && (
              <div className="file-info">
                <span>📁 {file.name}</span>
                <span>📊 {formatFileSize(file.size)}</span>
                <span>🎵 {file.type}</span>
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
              placeholder="Название вашего лупа"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bpm">BPM (60-200)</label>
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
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="trap, bass, 808, melody"
              disabled={isLoading}
            />
          </div>

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
            {isLoading ? '⏳ Загрузка...' : '📤 Загрузить луп'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoopUpload;