import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import './Statistics.css';

const Statistics = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    total_loops: 0,
    total_likes: 0,
    total_telegram_clicks: 0,
    total_file_size: 0,
    avg_likes_per_loop: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (token) {
        try {
          setIsLoading(true);
          const response = await api.getUserStats(token);
          setStats(response);
        } catch (err) {
          console.error('Error fetching stats:', err);
          setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchStats();
  }, [token]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!token) {
    return (
      <div className="statistics-page">
        <div className="statistics-container">
          <h2>Статистика</h2>
          <div className="error-message">
            Для просмотра статистики необходимо авторизоваться
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="statistics-page">
        <div className="statistics-container">
          <h2>Статистика</h2>
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-page">
        <div className="statistics-container">
          <h2>Статистика</h2>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="statistics-container">
        <h2>📊 Статистика</h2>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎵</div>
            <div className="stat-value">{stats.total_loops}</div>
            <div className="stat-label">Лупов опубликовано</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">❤️</div>
            <div className="stat-value">{stats.total_likes}</div>
            <div className="stat-label">Лайков получено</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{stats.avg_likes_per_loop.toFixed(2)}</div>
            <div className="stat-label">Средних лайков на луп</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-value">{stats.total_telegram_clicks}</div>
            <div className="stat-label">Кликов на Telegram</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-value">{formatFileSize(stats.total_file_size)}</div>
            <div className="stat-label">Общий размер файлов</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
