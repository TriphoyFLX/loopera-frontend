import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profilePath } from '../utils/routes';
import { artistTypesApi, type ArtistType } from '../utils/artistTypesApi';
import { notificationsApi, type AdminNotification } from '../utils/notificationsApi';
import { homePostsApi, type HomePost, type HomePostKind } from '../utils/homePostsApi';
import { useAuth } from '../hooks/useAuth';
import './Admin.css';
import { tokenStorage } from '../utils/tokenStorage';
import { getApiBaseUrl, getUploadsUrl } from '../utils/urls';

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  loop_count: number;
  total_size?: number;
  is_banned?: boolean;
  ban_reason?: string;
  plan_slug?: string;
  plan_ends_at?: string | null;
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

interface Pack {
  id: number;
  title: string;
  description: string;
  price: number;
  username: string;
  hashtag: string;
  avatar_url?: string;
  voice_tag?: string;
  status: string;
  created_at: string;
  loops_count?: number;
  sales_count?: number;
}

interface AdminStats {
  overview: {
    totalUsers: number;
    totalLoops: number;
    totalStorage: number;
    totalPacks?: number;
    activeNotifications?: number;
    downloadsToday?: number;
    downloadsTotal?: number;
    uniqueDownloadersToday?: number;
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
  const { isAdmin, isManager } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'loops' | 'balance' | 'shop' | 'packs' | 'types' | 'notifications' | 'home'>(
    isManager && !isAdmin ? 'loops' : 'overview',
  );
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalLoops, setTotalLoops] = useState(0);
  const [totalPacks, setTotalPacks] = useState(0);
  const [activeNotificationsCount, setActiveNotificationsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'banned' | 'active'>('all');
  const [packStatusFilter, setPackStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'deleted'>('all');
  const [playingLoopId, setPlayingLoopId] = useState<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [balanceUsername, setBalanceUsername] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<{ id: number; username: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [artistTypes, setArtistTypes] = useState<ArtistType[]>([]);
  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistSlug, setNewArtistSlug] = useState('');
  const [newArtistAliases, setNewArtistAliases] = useState('');
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifSending, setNotifSending] = useState(false);
  const [homePosts, setHomePosts] = useState<HomePost[]>([]);
  const [homeKind, setHomeKind] = useState<HomePostKind>('news');
  const [homeTitle, setHomeTitle] = useState('');
  const [homeBody, setHomeBody] = useState('');
  const [homeCtaLabel, setHomeCtaLabel] = useState('');
  const [homeCtaUrl, setHomeCtaUrl] = useState('');
  const [homeImageUrl, setHomeImageUrl] = useState('');
  const [homeSending, setHomeSending] = useState(false);

  const handlePlayLoop = (loopId: number, filename: string) => {
    if (playingLoopId === loopId) {
      // Pause if clicking the same loop
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingLoopId(null);
      }
    } else {
      // Play new loop
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(getUploadsUrl(filename));
      audioRef.current = audio;
      setPlayingLoopId(loopId);
      audio.play();
      audio.onended = () => setPlayingLoopId(null);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Функция для API запросов с токеном авторизации
  const apiRequest = async (url: string) => {
    const token = tokenStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${getApiBaseUrl()}${url}`, {
      headers
    });
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Слишком много запросов. Подождите минуту и обновите страницу.');
      }
      if (response.status === 401) {
        throw new Error('Сессия истекла. Войдите снова.');
      }
      if (response.status === 403) {
        throw new Error('Нет доступа к админ-панели.');
      }
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

  const fetchUsers = async (page: number = 1, search?: string, status?: string) => {
    try {
      setLoading(true);
      let url = `/admin/users?page=${page}&limit=20`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status && status !== 'all') url += `&status=${status}`;
      const data = await apiRequest(url);
      setUsers(data.users);
      setTotalUsers(data.pagination.totalUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoops = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/admin/loops?limit=10000`);
      setLoops(data.loops);
      setTotalLoops(data.pagination.totalLoops);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/admin/shop/packs/all?status=${packStatusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch packs');
      const data = await response.json();
      setPacks(data.packs);
      setTotalPacks(data.pagination.totalPacks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deletePack = async (packId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот пак?')) return;

    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/admin/shop/packs/${packId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) throw new Error('Failed to delete pack');

      fetchPacks();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const downloadPack = async (packId: number) => {
    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/shop/${packId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download pack');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pack_${packId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteLoop = async (loopId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот луп?')) return;
    
    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/admin/loops/${loopId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) throw new Error('Failed to delete loop');
      
      // Обновляем список лупов
      fetchLoops();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const banUser = async (userId: number, reason: string) => {
    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to ban user');
      
      // Обновляем список пользователей
      fetchUsers(userPage, searchQuery, filterStatus);
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const unbanUser = async (userId: number) => {
    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) throw new Error('Failed to unban user');
      
      // Обновляем список пользователей
      fetchUsers(userPage, searchQuery, filterStatus);
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const setUserPlan = async (userId: number, plan: string) => {
    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/admin/users/${userId}/plan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          period: 'yearly',
          days: plan === 'free' ? undefined : 365,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to set plan');
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, plan_slug: plan, plan_ends_at: data.period_end || null }
            : u,
        ),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось сменить тариф');
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUserSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Strip special characters like colon at the end
    const cleanQuery = query.replace(/[:\s]/g, '');

    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/shop/admin/search-users?q=${encodeURIComponent(cleanQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Search users error:', errorData);
        throw new Error(errorData.error || 'Failed to search users');
      }

      const data = await response.json();
      console.log('Search results:', data);
      setUserSuggestions(data.users || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error searching users:', err);
      setUserSuggestions([]);
    }
  };

  const handleSelectUser = (username: string) => {
    setBalanceUsername(username);
    setShowSuggestions(false);
    setUserSuggestions([]);
  };

  const handleViewBalance = async () => {
    if (!balanceUsername) {
      alert('Введите имя пользователя');
      return;
    }

    try {
      const token = tokenStorage.getToken();
      const response = await fetch(`${getApiBaseUrl()}/shop/admin/balance/${encodeURIComponent(balanceUsername)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user balance');
      }

      const data = await response.json();
      alert(`Баланс пользователя ${data.username}:\n\nДоступно: ${data.available_balance} ₽\nВ ожидании вывода: ${data.pending_balance} ₽\nВсего заработано: ${data.total_earned} ₽\n\nEmail: ${data.email}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/stats');
      setStats(data);
      setTotalUsers(data.overview?.totalUsers ?? 0);
      setTotalLoops(data.overview?.totalLoops ?? 0);
      setTotalPacks(data.overview?.totalPacks ?? 0);
      setActiveNotificationsCount(data.overview?.activeNotifications ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtistTypes = async () => {
    try {
      setLoading(true);
      const token = tokenStorage.getToken();
      if (!token) return;
      const data = await artistTypesApi.getAdminArtists(token);
      setArtistTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArtistType = async () => {
    try {
      const token = tokenStorage.getToken();
      if (!token || !newArtistName.trim() || !newArtistSlug.trim()) return;
      await artistTypesApi.createArtist(token, {
        name: newArtistName.trim(),
        slug: newArtistSlug.trim(),
        aliases: newArtistAliases.split(',').map((item) => item.trim()).filter(Boolean),
        sort_order: artistTypes.length + 1,
        is_active: true,
      });
      setNewArtistName('');
      setNewArtistSlug('');
      setNewArtistAliases('');
      fetchArtistTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка создания');
    }
  };

  const handleToggleArtistType = async (artist: ArtistType) => {
    try {
      const token = tokenStorage.getToken();
      if (!token) return;
      await artistTypesApi.updateArtist(token, artist.id, { is_active: !artist.is_active });
      fetchArtistTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка обновления');
    }
  };

  const handleDeleteArtistType = async (id: number) => {
    if (!window.confirm('Удалить артиста из онбординга?')) return;
    try {
      const token = tokenStorage.getToken();
      if (!token) return;
      await artistTypesApi.deleteArtist(token, id);
      fetchArtistTypes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const fetchAdminNotifications = async () => {
    try {
      const data = await notificationsApi.adminList();
      const list = data.notifications || [];
      setAdminNotifications(list);
      setActiveNotificationsCount(list.filter((n) => n.is_active).length);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки уведомлений');
    }
  };

  const handleCreateNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      alert('Заполните заголовок и текст');
      return;
    }
    setNotifSending(true);
    try {
      await notificationsApi.create(notifTitle.trim(), notifBody.trim());
      setNotifTitle('');
      setNotifBody('');
      await fetchAdminNotifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка создания уведомления');
    } finally {
      setNotifSending(false);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!window.confirm('Скрыть это уведомление из ленты?')) return;
    try {
      await notificationsApi.remove(id);
      await fetchAdminNotifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  const fetchHomePosts = async () => {
    try {
      const data = await homePostsApi.adminList();
      setHomePosts(data.posts || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки публикаций');
    }
  };

  const handleCreateHomePost = async () => {
    if (!homeTitle.trim() || !homeBody.trim()) {
      alert('Заполните заголовок и текст');
      return;
    }
    setHomeSending(true);
    try {
      await homePostsApi.create({
        kind: homeKind,
        title: homeTitle.trim(),
        body: homeBody.trim(),
        cta_label: homeCtaLabel.trim() || undefined,
        cta_url: homeCtaUrl.trim() || undefined,
        image_url: homeImageUrl.trim() || undefined,
      });
      setHomeTitle('');
      setHomeBody('');
      setHomeCtaLabel('');
      setHomeCtaUrl('');
      setHomeImageUrl('');
      setHomeKind('news');
      await fetchHomePosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка публикации');
    } finally {
      setHomeSending(false);
    }
  };

  const handleToggleHomePost = async (post: HomePost) => {
    try {
      await homePostsApi.update(post.id, { is_active: !post.is_active });
      await fetchHomePosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка обновления');
    }
  };

  const handleHideHomePost = async (id: number) => {
    if (!window.confirm('Скрыть публикацию с главной?')) return;
    try {
      await homePostsApi.remove(id);
      await fetchHomePosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  useEffect(() => {
    fetchStats();
    if (isAdmin) {
      fetchArtistTypes().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(userPage, searchQuery, filterStatus);
    } else if (activeTab === 'loops') {
      fetchLoops();
    } else if (activeTab === 'packs') {
      fetchPacks();
    } else if (activeTab === 'types') {
      fetchArtistTypes();
    } else if (activeTab === 'notifications') {
      fetchAdminNotifications();
    } else if (activeTab === 'home') {
      fetchHomePosts();
    }
  }, [activeTab, userPage, searchQuery, filterStatus, packStatusFilter]);

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
    const isAuthError = error.includes('401') || error.toLowerCase().includes('сессия') || error.toLowerCase().includes('авториз');
    const isRateLimit = error.includes('429') || error.toLowerCase().includes('слишком много запросов');

    return (
      <div className="admin-container">
        <div className="error-container">
          <div className="error-message">
            <p>{error}</p>
          </div>
          {isRateLimit ? (
            <div className="error-warning">
              <p>Сервер временно ограничил запросы</p>
              <p>Подождите 1–2 минуты и обновите страницу. Авторизация не сброшена.</p>
              <button onClick={() => window.location.reload()} className="btn-logout">
                Обновить
              </button>
            </div>
          ) : isAuthError ? (
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
          ) : (
            <div className="error-warning">
              <button onClick={() => window.location.reload()} className="btn-logout">
                Попробовать снова
              </button>
            </div>
          )}
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
              <h1 className="gradient-text">
                {isAdmin ? 'Админ' : 'Менеджер'}
              </h1>
            </div>
            <div className="system-indicator">
              <div className="system-indicator-dot"></div>
              <span>Online</span>
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
            {isAdmin && (
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
            )}
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
            {isAdmin && (
            <button
              className={`tab-button ${activeTab === 'balance' ? 'active' : ''}`}
              onClick={() => setActiveTab('balance')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 0c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 0c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
              </svg>
              <span>Баланс</span>
            </button>
            )}
            <button
              className={`tab-button ${activeTab === 'shop' ? 'active' : ''}`}
              onClick={() => window.location.href = '/admin/shop'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Shop</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'packs' ? 'active' : ''}`}
              onClick={() => setActiveTab('packs')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Паки</span>
              <span className="tab-count">{totalPacks}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Уведомления</span>
              <span className="tab-count">{activeNotificationsCount}</span>
            </button>
            <button
              className={`tab-button ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2h-2z" />
              </svg>
              <span>Главная</span>
              <span className="tab-count">{homePosts.filter((p) => p.is_active).length}</span>
            </button>
            {isAdmin && (
            <button
              className={`tab-button ${activeTab === 'types' ? 'active' : ''}`}
              onClick={() => setActiveTab('types')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span>Тайпы</span>
              <span className="tab-count">{artistTypes.length}</span>
            </button>
            )}
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
                  </div>
                  <div className="stats-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stats-card">
                <div className="stats-card-content">
                  <div className="stats-info">
                    <p>Скачиваний за день</p>
                    <p className="stats-value">{stats.overview.downloadsToday ?? 0}</p>
                    <p className="stats-trend">
                      {stats.overview.uniqueDownloadersToday ?? 0} чел. · всего {stats.overview.downloadsTotal ?? 0}
                    </p>
                  </div>
                  <div className="stats-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
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
                      {isAdmin && <th>Email</th>}
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
                        {isAdmin && (
                          <td>
                            <p>{user.email}</p>
                          </td>
                        )}
                        <td>
                          <p>{formatDate(user.created_at)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Loopmakers */}
            <div className="admin-card">
              <div className="card-header">
                <h3>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Топ лупмейкеры
                </h3>
              </div>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Пользователь</th>
                      {isAdmin && <th>Email</th>}
                      <th>Лупов</th>
                      <th>Объем</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <Link
                            to={profilePath(user.username)}
                            className="user-link"
                          >
                            <div className="user-info">
                              <div className="user-avatar">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="user-details">
                                <p>{user.username}</p>
                                <p>ID: {user.id}</p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        {isAdmin && (
                          <td>
                            <p>{user.email}</p>
                          </td>
                        )}
                        <td>
                          <p className="loop-count">{user.loop_count}</p>
                        </td>
                        <td>
                          <p>{formatBytes(user.total_size || 0)}</p>
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
            <div className="search-filters-container">
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Поиск по имени или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-box">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'banned' | 'active')}
                >
                  <option value="all">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="banned">Забаненные</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setUserPage(1);
                }}
                className="btn-show-all"
              >
                Показать всех
              </button>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Email</th>
                    <th>Лупов</th>
                    <th>Тариф</th>
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
                        <select
                          className="plan-select"
                          value={(user.plan_slug || 'free').toLowerCase()}
                          onChange={(e) => setUserPlan(user.id, e.target.value)}
                          title={
                            user.plan_ends_at
                              ? `До ${new Date(user.plan_ends_at).toLocaleDateString('ru-RU')}`
                              : 'Тариф'
                          }
                        >
                          <option value="free">Free</option>
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="business">Business</option>
                        </select>
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
            <div className="pagination-container">
              <div className="pagination-info">
                <span>Показано {Math.min(userPage * 20, totalUsers)} из {totalUsers} пользователей</span>
                <span>Страница {userPage} из {Math.ceil(totalUsers / 20)}</span>
              </div>
              <div className="pagination-buttons">
                <button
                  onClick={() => setUserPage(userPage - 1)}
                  disabled={userPage === 1}
                  className="btn-pagination"
                >
                  ← Назад
                </button>
                <span className="page-numbers">
                  {Array.from({ length: Math.ceil(totalUsers / 20) }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === Math.ceil(totalUsers / 20) || 
                      Math.abs(page - userPage) <= 2
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && <span className="pagination-ellipsis">...</span>}
                        <button
                          onClick={() => setUserPage(page)}
                          className={`btn-page ${page === userPage ? 'active' : ''}`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </span>
                <button
                  onClick={() => setUserPage(userPage + 1)}
                  disabled={userPage >= Math.ceil(totalUsers / 20)}
                  className="btn-pagination"
                >
                  Вперед →
                </button>
              </div>
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
                          <button
                            className="play-button"
                            onClick={() => handlePlayLoop(loop.id, loop.filename)}
                            title={playingLoopId === loop.id ? 'Пауза' : 'Воспроизвести'}
                          >
                            {playingLoopId === loop.id ? (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <rect x="6" y="4" width="4" height="16"/>
                                <rect x="14" y="4" width="4" height="16"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
                            )}
                          </button>
                          <div className="loop-info">
                            <p>{loop.title}</p>
                            <p>ID: {loop.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="artist-name">{loop.artist_name}</p>
                          {isAdmin && (
                            <p className="artist-email">{loop.artist_email}</p>
                          )}
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

        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <div className="admin-card">
            <div className="card-header">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 0c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 0c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
                </svg>
                Управление балансом
              </h3>
            </div>

            <div className="balance-section">
              <h4>Баланс продавца (₽)</h4>
              <div className="balance-credit-form">
                <div className="form-group">
                  <label>Имя пользователя:</label>
                  <div className="autocomplete-wrapper">
                    <input
                      type="text"
                      value={balanceUsername}
                      onChange={(e) => {
                        setBalanceUsername(e.target.value);
                        handleSearchUsers(e.target.value);
                      }}
                      placeholder="Введите имя пользователя"
                      autoComplete="off"
                    />
                    {showSuggestions && userSuggestions.length > 0 && (
                      <div className="suggestions-list">
                        {userSuggestions.map((user) => (
                          <div
                            key={user.id}
                            className="suggestion-item"
                            onClick={() => handleSelectUser(user.username)}
                          >
                            {user.username}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={handleViewBalance} className="btn-credit" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  Просмотреть баланс
                </button>
              </div>
            </div>

            <div className="balance-info">
              <p>Маркетплейс Loopera</p>
              <ul>
                <li>Покупатели оплачивают паки через ЮKassa (рубли)</li>
                <li>Продавцу на баланс зачисляется 85% от цены (комиссия платформы 15%)</li>
                <li>Вывод — заявка в профиле, обработка в разделе «Магазин» админки</li>
              </ul>
            </div>
          </div>
        )}

        {/* Packs Tab */}
        {activeTab === 'packs' && (
          <div className="admin-card">
            <div className="card-header">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Управление паками
              </h3>
            </div>
            <div className="search-filters-container">
              <div className="filter-box">
                <select
                  value={packStatusFilter}
                  onChange={(e) => setPackStatusFilter(e.target.value as any)}
                >
                  <option value="all">Все статусы</option>
                  <option value="approved">Опубликовано</option>
                  <option value="rejected">Отклонено</option>
                  <option value="deleted">Удалено</option>
                </select>
              </div>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Автор</th>
                    <th>Цена</th>
                    <th>Статус</th>
                    <th>Продаж</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {packs.map((pack) => (
                    <tr key={pack.id}>
                      <td>
                        <p>{pack.title}</p>
                        <p>ID: {pack.id}</p>
                      </td>
                      <td>
                        <div>
                          <p className="artist-name">@{pack.hashtag}</p>
                          <p className="artist-email">{pack.username}</p>
                        </div>
                      </td>
                      <td>
                        <p>{pack.price} ₽</p>
                      </td>
                      <td>
                        <span className={`status-badge ${pack.status}`}>
                          {pack.status}
                        </span>
                      </td>
                      <td>
                        <p>{pack.sales_count || 0}</p>
                      </td>
                      <td>
                        <p>{formatDate(pack.created_at)}</p>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => downloadPack(pack.id)}
                            className="btn-download"
                          >
                            Скачать
                          </button>
                          {isAdmin && (
                          <button
                            onClick={() => deletePack(pack.id)}
                            className="btn-delete"
                          >
                            Удалить
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

        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="balance-section">
              <h3>Публикация на главную</h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
                Новости и реклама появятся на главной странице. Доступно админу и менеджеру.
              </p>
              <div className="balance-form" style={{ display: 'grid', gap: 12 }}>
                <select
                  value={homeKind}
                  onChange={(e) => setHomeKind(e.target.value as HomePostKind)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="news">Новость</option>
                  <option value="ad">Реклама</option>
                </select>
                <input
                  type="text"
                  placeholder="Заголовок"
                  value={homeTitle}
                  onChange={(e) => setHomeTitle(e.target.value)}
                  maxLength={200}
                />
                <textarea
                  placeholder="Текст"
                  value={homeBody}
                  onChange={(e) => setHomeBody(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <input
                  type="text"
                  placeholder="Текст кнопки (необязательно)"
                  value={homeCtaLabel}
                  onChange={(e) => setHomeCtaLabel(e.target.value)}
                  maxLength={80}
                />
                <input
                  type="text"
                  placeholder="Ссылка кнопки — /loops или https://..."
                  value={homeCtaUrl}
                  onChange={(e) => setHomeCtaUrl(e.target.value)}
                  maxLength={500}
                />
                <input
                  type="text"
                  placeholder="URL картинки (необязательно)"
                  value={homeImageUrl}
                  onChange={(e) => setHomeImageUrl(e.target.value)}
                  maxLength={500}
                />
                <button
                  className="admin-action-btn"
                  onClick={handleCreateHomePost}
                  disabled={homeSending}
                >
                  {homeSending ? 'Публикация...' : 'Опубликовать на главную'}
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Тип</th>
                    <th>Заголовок</th>
                    <th>Текст</th>
                    <th>Автор</th>
                    <th>Статус</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {homePosts.length === 0 ? (
                    <tr>
                      <td colSpan={7}>Пока нет публикаций</td>
                    </tr>
                  ) : (
                    homePosts.map((p) => (
                      <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.45 }}>
                        <td>{p.kind === 'ad' ? 'Реклама' : 'Новость'}</td>
                        <td>{p.title}</td>
                        <td style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>{p.body}</td>
                        <td>{p.author_name || '—'}</td>
                        <td>{p.is_active ? 'На главной' : 'Скрыто'}</td>
                        <td>{new Date(p.created_at).toLocaleString('ru-RU')}</td>
                        <td style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            className="admin-action-btn"
                            onClick={() => handleToggleHomePost(p)}
                          >
                            {p.is_active ? 'Скрыть' : 'Показать'}
                          </button>
                          {p.is_active && (
                            <button
                              className="admin-action-btn danger"
                              onClick={() => handleHideHomePost(p.id)}
                            >
                              Снять
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <div className="balance-section">
              <h3>Новое уведомление</h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
                Текст увидят все пользователи в колокольчике рядом с поиском. Доступно админу и менеджеру.
              </p>
              <div className="balance-form" style={{ display: 'grid', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Заголовок"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  maxLength={200}
                />
                <textarea
                  placeholder="Текст уведомления"
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <button
                  className="admin-action-btn"
                  onClick={handleCreateNotification}
                  disabled={notifSending}
                >
                  {notifSending ? 'Отправка...' : 'Опубликовать'}
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Заголовок</th>
                    <th>Текст</th>
                    <th>Автор</th>
                    <th>Просмотры</th>
                    <th>Статус</th>
                    <th>Дата</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {adminNotifications.length === 0 ? (
                    <tr>
                      <td colSpan={7}>Пока нет уведомлений</td>
                    </tr>
                  ) : (
                    adminNotifications.map((n) => (
                      <tr key={n.id} style={{ opacity: n.is_active ? 1 : 0.45 }}>
                        <td>{n.title}</td>
                        <td style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>{n.body}</td>
                        <td>{n.author_name || '—'}</td>
                        <td>{n.reads_count ?? 0}</td>
                        <td>{n.is_active ? 'Активно' : 'Скрыто'}</td>
                        <td>{new Date(n.created_at).toLocaleString('ru-RU')}</td>
                        <td>
                          {n.is_active && (
                            <button
                              className="admin-action-btn danger"
                              onClick={() => handleDeleteNotification(n.id)}
                            >
                              Скрыть
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="space-y-8">
            <div className="balance-section">
              <h3>Тайпы артистов для онбординга</h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
                Эти артисты показываются при регистрации и влияют на персональную ленту
              </p>
              <div className="balance-form" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <input
                  type="text"
                  placeholder="Название (Ken Carson)"
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Slug (kencarson)"
                  value={newArtistSlug}
                  onChange={(e) => setNewArtistSlug(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Алиасы через запятую"
                  value={newArtistAliases}
                  onChange={(e) => setNewArtistAliases(e.target.value)}
                />
                <button className="admin-action-btn" onClick={handleCreateArtistType}>
                  Добавить артиста
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Slug</th>
                    <th>Алиасы</th>
                    <th>Порядок</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {artistTypes.map((artist) => (
                    <tr key={artist.id}>
                      <td>{artist.name}</td>
                      <td>{artist.slug}</td>
                      <td>{(artist.aliases || []).join(', ') || '—'}</td>
                      <td>{artist.sort_order ?? '—'}</td>
                      <td>{artist.is_active ? 'Активен' : 'Скрыт'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="admin-action-btn" onClick={() => handleToggleArtistType(artist)}>
                            {artist.is_active ? 'Скрыть' : 'Показать'}
                          </button>
                          <button className="admin-action-btn danger" onClick={() => handleDeleteArtistType(artist.id)}>
                            Удалить
                          </button>
                        </div>
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