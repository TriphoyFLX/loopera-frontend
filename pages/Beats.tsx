import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import './Beats.css';

const Beats = () => {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    bpm: undefined as number | undefined,
    key: '',
    genre: '',
    tags: '',
    description: '',
    selectedLoop: null as any,
    selectedLoopId: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loopSearchQuery, setLoopSearchQuery] = useState('');
  const [loopSearchResults, setLoopSearchResults] = useState<any[]>([]);
  const [showLoopDropdown, setShowLoopDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'bpm' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 4 * 1024 * 1024) {
        setError('Размер файла не должен превышать 4MB');
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

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      tags: e.target.value
    }));
  };

  const handleLoopSearch = async (query: string) => {
    setLoopSearchQuery(query);
    if (query.length > 0) {
      try {
        const result = await api.getAllLoops(1, 10, undefined, 'created_at', undefined, undefined, undefined, undefined, undefined, query);
        setLoopSearchResults(result.loops);
        setShowLoopDropdown(true);
      } catch (error) {
        console.error('Error searching loops:', error);
      }
    } else {
      setLoopSearchResults([]);
      setShowLoopDropdown(false);
    }
  };

  const handleLoopSelect = (loop: any) => {
    setFormData(prev => ({
      ...prev,
      selectedLoop: loop,
      selectedLoopId: loop.id.toString()
    }));
    setLoopSearchQuery(loop.title);
    setShowLoopDropdown(false);
    setLoopSearchResults([]);
  };

  const handleClearLoop = () => {
    setFormData(prev => ({
      ...prev,
      selectedLoop: null,
      selectedLoopId: ''
    }));
    setLoopSearchQuery('');
    setLoopSearchResults([]);
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
      
      if (formData.selectedLoopId) {
        uploadFormData.append('loop_id', formData.selectedLoopId);
      }
      if (formData.description) {
        uploadFormData.append('description', formData.description);
      }
      if (formData.tags && formData.tags.trim()) {
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

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await api.uploadBeat(uploadFormData, token);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess('Бит успешно загружен!');
      
      setFormData({
        title: '',
        bpm: undefined,
        key: '',
        genre: '',
        tags: '',
        description: '',
        selectedLoop: null,
        selectedLoopId: ''
      });
      setFile(null);
      setLoopSearchQuery('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setUploadProgress(0);
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки бита');
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
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
      <div className="beats-page">
        <div className="upload-container">
          <h2>Загрузка бита</h2>
          <div className="error-message">
            Для загрузки битов необходимо авторизоваться
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="beats-page">
      <div className="upload-container">
        <h2>Загрузка бита</h2>
        <p className="user-info">Пользователь: {user?.username}</p>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="file">Аудиофайл (макс. 4MB)</label>
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
              placeholder="Название вашего бита"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="loopSearch">Я использовал луп с Луперы</label>
            <div className="loop-selector">
              <input
                type="text"
                id="loopSearch"
                value={loopSearchQuery}
                onChange={(e) => handleLoopSearch(e.target.value)}
                placeholder="Поиск лупа по названию или автору"
                disabled={isLoading}
              />
              {formData.selectedLoop && (
                <button
                  type="button"
                  className="clear-loop-btn"
                  onClick={handleClearLoop}
                  disabled={isLoading}
                >
                  ✕
                </button>
              )}
            </div>
            {showLoopDropdown && loopSearchResults.length > 0 && (
              <div className="loop-dropdown">
                {loopSearchResults.map(loop => (
                  <div
                    key={loop.id}
                    className="loop-dropdown-item"
                    onClick={() => handleLoopSelect(loop)}
                  >
                    <div className="loop-dropdown-info">
                      <span className="loop-dropdown-title">{loop.title}</span>
                      <span className="loop-dropdown-author">by {loop.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {formData.selectedLoop && (
              <div className="selected-loop-info">
                Выбран: {formData.selectedLoop.title} by {formData.selectedLoop.author}
              </div>
            )}
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
              value={formData.tags}
              onChange={handleTagsChange}
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
      </div>
    </div>
  );
};

export default Beats;
