import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { chatApi } from '../utils/chatApi';
import { useAuth } from '../hooks/useAuth';
import { getUploadsUrl } from '../utils/urls';
import LoopCard from '../components/LoopCard';
import './UserProfile.css';

interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  created_at: string;
}

interface Loop {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  file_size: number;
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  user_id: number;
  author?: string;
  created_at: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { token, user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleStartChat = async () => {
    try {
      console.log('handleStartChat called');
      if (!currentUser) {
        console.error('User not authenticated');
        return;
      }

      const targetUserId = userId || currentUser?.id?.toString();
      console.log('targetUserId:', targetUserId);
      if (!targetUserId) {
        console.error('No user ID available');
        return;
      }

      // Сначала получаем ID пользователя из API (если targetUserId это username)
      console.log('Fetching user info for:', targetUserId);
      const userResponse = await fetch(`https://loopera-lpr.vercel.app/api/chats/user/${targetUserId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      console.log('User response status:', userResponse.status);
      if (!userResponse.ok) {
        throw new Error('Пользователь не найден');
      }
      
      const userData = await userResponse.json();
      console.log('User data:', userData);
      const actualUserId = userData.user.id;
      console.log('Actual user ID:', actualUserId);

      // Создаем или получаем существующий чат
      console.log('Creating chat with user ID:', actualUserId);
      await chatApi.createOrGetChat(actualUserId);
      console.log('Chat created successfully');
      
      // Переходим к чатам
      navigate('/chats');
    } catch (error) {
      console.error('Error creating chat:', error);
      // Можно показать ошибку пользователю
    }
  };

  const handlePlay = async (loop: Loop) => {
    try {
      // Если уже воспроизводим этот же луп, ставим на паузу
      if (currentlyPlaying === loop.id && isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      // Очищаем предыдущий аудио элемент
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        // Удаляем все обработчики событий
        const prevAudio = audioRef.current as any;
        if (prevAudio._handleLoadStart) {
          prevAudio.removeEventListener('loadstart', prevAudio._handleLoadStart);
        }
        if (prevAudio._handleCanPlay) {
          prevAudio.removeEventListener('canplay', prevAudio._handleCanPlay);
        }
        if (prevAudio._handleEnded) {
          prevAudio.removeEventListener('ended', prevAudio._handleEnded);
        }
        if (prevAudio._handleError) {
          prevAudio.removeEventListener('error', prevAudio._handleError);
        }
      }

      // Устанавливаем состояние загрузки
      setAudioLoading(loop.id);

      // Создаем новый аудио элемент
      const audio = new Audio(getUploadsUrl(loop.filename));
      audioRef.current = audio;

      // Создаем именованные обработчики событий
      const handleLoadStart = () => {
        console.log('Loading audio:', loop.filename);
      };

      const handleCanPlay = () => {
        audio.play();
        setCurrentlyPlaying(loop.id);
        setIsPlaying(true);
        setAudioLoading(null);
        console.log('Playing loop:', loop.title);
      };

      const handleEnded = () => {
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        setAudioLoading(null);
      };

      const handleError = (e: Event) => {
        console.error('Audio error:', e);
        setCurrentlyPlaying(null);
        setIsPlaying(false);
        setAudioLoading(null);
        alert('Ошибка воспроизведения аудио файла');
      };

      // Добавляем обработчики событий
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Сохраняем обработчики для последующего удаления
      (audio as any)._handleLoadStart = handleLoadStart;
      (audio as any)._handleCanPlay = handleCanPlay;
      (audio as any)._handleEnded = handleEnded;
      (audio as any)._handleError = handleError;

      // Загружаем аудио
      audio.load();
    } catch (error) {
      console.error('Error playing loop:', error);
      setAudioLoading(null);
      alert('Ошибка воспроизведения лупа');
    }
  };

  useEffect(() => {
    const targetUserId = userId || currentUser?.id?.toString();
    if (targetUserId) {
      fetchUserProfile(targetUserId);
      fetchUserLoops(targetUserId);
    }
  }, [userId, currentUser]);

  const fetchUserProfile = async (targetUserId: string) => {
    try {
      // Используем API для получения информации о пользователе
      const response = await fetch(`https://loopera-lpr.vercel.app/api/chats/user/${targetUserId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error('Пользователь не найден');
      }
      
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
    }
  };

  const fetchUserLoops = async (targetUserId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Сначала получаем ID пользователя из API
      const userResponse = await fetch(`https://loopera-lpr.vercel.app/api/chats/user/${targetUserId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Пользователь не найден');
      }
      
      const userData = await userResponse.json();
      const userId = userData.user.id;
      
      // Затем получаем все лупы и фильтруем по ID пользователя
      const response = await api.getAllLoops(1, 100, token || undefined);
      const userLoops = response.loops.filter((loop: Loop) => loop.user_id === userId);
      setLoops(userLoops);
    } catch (err) {
      console.error('Error fetching user loops:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки лупов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        // Удаляем все обработчики событий
        const audio = audioRef.current as any;
        if (audio._handleLoadStart) {
          audio.removeEventListener('loadstart', audio._handleLoadStart);
        }
        if (audio._handleCanPlay) {
          audio.removeEventListener('canplay', audio._handleCanPlay);
        }
        if (audio._handleEnded) {
          audio.removeEventListener('ended', audio._handleEnded);
        }
        if (audio._handleError) {
          audio.removeEventListener('error', audio._handleError);
        }
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-header">
          <div className="user-profile-header-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Загрузка профиля...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-header">
          <div className="user-profile-header-content">
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={() => window.location.reload()} className="retry-button">
                🔄 Попробовать снова
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-header">
          <div className="user-profile-header-content">
            <div className="not-found">
              <h2>👤 Пользователь не найден</h2>
              <p>Пользователь с ID {userId} не существует</p>
              <button onClick={() => navigate('/loops')} className="user-profile-button secondary">
                ← Вернуться к лупам
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="user-profile-header">
        <div className="user-profile-header-content">
          <div className="user-profile-avatar">
            {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
          </div>
          <div className="user-profile-info">
            <h1 className="user-profile-name">{user.username}</h1>
            <div className="user-profile-stats">
              <div className="user-profile-stat">
                <div className="user-profile-stat-value">{loops.length}</div>
                <div className="user-profile-stat-label">Лупов</div>
              </div>
              <div className="user-profile-stat">
                <div className="user-profile-stat-value">
                  {new Date(user.created_at).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}
                </div>
                <div className="user-profile-stat-label">На платформе</div>
              </div>
            </div>
            <div className="user-profile-join-date">
              На платформе с {new Date(user.created_at).toLocaleDateString('ru-RU')}
            </div>
            
            <div className="user-profile-actions">
              <button onClick={handleStartChat} className="user-profile-button primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Начать чат
              </button>
              <button onClick={() => navigate('/loops')} className="user-profile-button secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                Все лупы
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="user-profile-content">
        <div className="user-loops-section">
          <div className="user-loops-header">
            <h2 className="user-loops-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
              Лупы пользователя {user.username}
            </h2>
            <div className="user-loops-count">{loops.length} лупов</div>
          </div>
          
          {loops.length === 0 ? (
            <div className="user-loops-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <h3>У этого пользователя пока нет лупов</h3>
              <p>Возможно, он скоро что-нибудь загрузит!</p>
            </div>
          ) : (
            <div className="user-loops-grid">
              {loops.map((loop) => (
                <LoopCard
                  key={loop.id}
                  loop={{
                    ...loop,
                    author: user?.username || 'Unknown',
                    created_at: loop.created_at,
                    tags: loop.tags || []
                  }}
                  currentUserId={currentUser?.id}
                  onPlay={handlePlay}
                  isPlaying={currentlyPlaying === loop.id && isPlaying}
                  isLoading={audioLoading === loop.id}
                  showLike={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
