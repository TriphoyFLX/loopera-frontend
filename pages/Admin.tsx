import React, { useState, useEffect } from 'react';
import './Admin.css';
import { tokenStorage } from '../utils/tokenStorage';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  loop_count: number;
  total_size?: number;
  is_banned?: boolean;
  ban_reason?: string;
}

interface Loop {
  id: number;
  title: string;
  filename: string;
  file_size: number;
  created_at: string;
  artist_name: string;
  artist_email: string;
  bpm?: number;
  key?: string;
  genre?: string;
  duration?: number;
}

interface AdminStats {
  overview: {
    totalUsers: number;
    totalLoops: number;
    totalStorage: number;
  };
  recentUsers: User[];
  recentLoops: Loop[];
  topUsers: User[];
  storageByGenre: Array<{
    genre: string;
    count: number;
    total_size: number;
  }>;
}

const Admin: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'loops'>('overview');
  const [userPage] = useState(1);
  const [loopPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalLoops, setTotalLoops] = useState(0);

  // Простая функция для API запросов без токена
  const apiRequest = async (url: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api${url}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/admin/users?page=${page}&limit=20`);
      setUsers(data.users);
      setTotalUsers(data.pagination.totalUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoops = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await apiRequest(`/admin/loops?page=${page}&limit=20`);
      setLoops(data.loops);
      setTotalLoops(data.pagination.totalLoops);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteLoop = async (loopId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот луп?')) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/admin/loops/${loopId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete loop');
      
      // Обновляем список лупов
      fetchLoops(loopPage);
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const banUser = async (userId: number, reason: string) => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to ban user');
      
      // Обновляем список пользователей
      fetchUsers(userPage);
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const unbanUser = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}/unban`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to unban user');
      
      // Обновляем список пользователей
      fetchUsers(userPage);
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/stats');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(userPage);
    } else if (activeTab === 'loops') {
      fetchLoops(loopPage);
    }
  }, [activeTab, userPage, loopPage]);

  if (loading && !stats) {
    return (
      <div className="admin-container">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="error-container">
          <div className="error-message">
            <p>{error}</p>
          </div>
          <div className="error-warning">
            <p>Требуется повторная авторизация</p>
            <p>Пожалуйста, выйдите из системы и войдите снова, чтобы получить права администратора.</p>
            <button
              onClick={() => {
                tokenStorage.removeToken();
                tokenStorage.removeUser();
                window.location.reload();
              }}
              className="btn-logout"
            >
              Выйти и обновить
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-container">
        <div className="loading-container">
          <p>Нет данных</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div className="max-w-7xl">
          <div className="flex">
            <div>
              <h1 className="gradient-text">Панель администратора</h1>
              <p>Управление платформой Loopera</p>
            </div>
            <div className="system-indicator">
              <div className="system-indicator-dot"></div>
              <span>Система активна</span>
            </div>
          </div>
        </div>
      </div>

      <div className="main-container">
        {/* Enhanced Tabs */}
        <div className="admin-tabs">
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Обзор</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Пользователи</span>
              <span className="tab-count">{totalUsers}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'loops' ? 'active' : ''}`}
              onClick={() => setActiveTab('loops')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span>Лупы</span>
              <span className="tab-count">{totalLoops}</span>
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="stats-grid">
              <div className="stats-card">
                <div className="stats-card-content">
                  <div className="stats-info">
                    <p>Всего пользователей</p>
                    <p className="stats-value">{stats.overview.totalUsers}</p>
                    <p className="stats-trend">+12% за месяц</p>
                  </div>
                  <div className="stats-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-content">
                  <div className="stats-info">
                    <p>Всего лупов</p>
                    <p className="stats-value">{stats.overview.totalLoops}</p>
                    <p className="stats-trend">+25% за месяц</p>
                  </div>
                  <div className="stats-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-card-content">
                  <div className="stats-info">
                    <p>Объем хранилища</p>
                    <p className="stats-value">{formatBytes(stats.overview.totalStorage)}</p>
                    <p className="stats-trend">+8% за месяц</p>
                  </div>
                  <div className="stats-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Recent Users */}
            <div className="admin-card">
              <div className="card-header">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Новые пользователи
                </h3>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Имя пользователя</th>
                      <th>Email</th>
                      <th>Дата регистрации</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-details">
                              <p>{user.username}</p>
                              <p>ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p>{user.email}</p>
                        </td>
                        <td>
                          <p>{formatDate(user.created_at)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-card">
            <div className="card-header">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Управление пользователями
              </h3>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Email</th>
                    <th>Лупов</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-info">
                          <div className="user-avatar">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <p>{user.username}</p>
                            <p>ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p>{user.email}</p>
                      </td>
                      <td>
                        <p className="loop-count">{user.loop_count}</p>
                      </td>
                      <td>
                        {user.is_banned ? (
                          <span className="status-badge banned">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Забанен
                          </span>
                        ) : (
                          <span className="status-badge active">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Активен
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {user.is_banned ? (
                            <button
                              onClick={() => unbanUser(user.id)}
                              className="btn-unban"
                            >
                              Разбанить
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const reason = prompt('Причина бана:');
                                if (reason) banUser(user.id, reason);
                              }}
                              className="btn-ban"
                            >
                              Забанить
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loops Tab */}
        {activeTab === 'loops' && (
          <div className="admin-card">
            <div className="card-header">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Управление лупами
              </h3>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Артист</th>
                    <th>Размер</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {loops.map((loop) => (
                    <tr key={loop.id}>
                      <td>
                        <div className="loop-item">
                          <div className="loop-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                          <div className="loop-info">
                            <p>{loop.title}</p>
                            <p>ID: {loop.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="artist-name">{loop.artist_name}</p>
                          <p className="artist-email">{loop.artist_email}</p>
                        </div>
                      </td>
                      <td>
                        <p>{formatBytes(loop.file_size)}</p>
                      </td>
                      <td>
                        <p>{formatDate(loop.created_at)}</p>
                      </td>
                      <td>
                        <button
                          onClick={() => deleteLoop(loop.id)}
                          className="btn-delete"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;