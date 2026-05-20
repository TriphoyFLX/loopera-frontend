import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
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
  const [history, setHistory] = useState({
    likes_over_time: [],
    loops_over_time: [],
    telegram_clicks_over_time: []
  });
  const [period, setPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (token) {
        try {
          setIsLoading(true);
          const [statsResponse, historyResponse] = await Promise.all([
            api.getUserStats(token),
            api.getUserStatsHistory(token, period)
          ]);
          setStats(statsResponse);
          setHistory(historyResponse);
        } catch (err) {
          console.error('Error fetching stats:', err);
          setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchStats();
  }, [token, period]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (period === 'day') {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }
  };

  const prepareChartData = (data: any[]) => {
    return data.map(item => ({
      date: formatDate(item.date),
      value: parseInt(item.count)
    }));
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
        <div className="statistics-header">
          <h2>📊 Статистика</h2>
          <div className="period-selector">
            <button 
              className={period === 'day' ? 'active' : ''} 
              onClick={() => setPeriod('day')}
            >
              День
            </button>
            <button 
              className={period === 'week' ? 'active' : ''} 
              onClick={() => setPeriod('week')}
            >
              Неделя
            </button>
            <button 
              className={period === 'month' ? 'active' : ''} 
              onClick={() => setPeriod('month')}
            >
              Месяц
            </button>
          </div>
        </div>
        
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

        <div className="charts-grid">
          <div className="chart-card">
            <h3>❤️ Лайки за {period === 'day' ? 'день' : period === 'week' ? 'неделю' : 'месяц'}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareChartData(history.likes_over_time)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(13, 13, 28, 0.9)', 
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#7c3aed" 
                  strokeWidth={2}
                  dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>🎵 Лупы за {period === 'day' ? 'день' : period === 'week' ? 'неделю' : 'месяц'}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareChartData(history.loops_over_time)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(13, 13, 28, 0.9)', 
                    border: '1px solid rgba(6, 214, 245, 0.3)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#06d6f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>📱 Telegram клики за {period === 'day' ? 'день' : period === 'week' ? 'неделю' : 'месяц'}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareChartData(history.telegram_clicks_over_time)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                <YAxis stroke="rgba(255,255,255,0.6)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(13, 13, 28, 0.9)', 
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06d6f5" 
                  strokeWidth={2}
                  dot={{ fill: '#06d6f5', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
