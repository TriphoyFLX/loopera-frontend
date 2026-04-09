import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { getUploadsUrl } from '../utils/urls';
import LoopCard from '../components/LoopCard';
import './Search.css';


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
  author_id?: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  loop_count?: number;
}

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'loops' | 'users'>('loops');
  const [loops, setLoops] = useState<Loop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Получаем все уникальные теги для предложений
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await api.getAllLoops(1, 1000);
      const allTags = response.loops.flatMap((loop: any) => loop.tags || []);
      const uniqueTags = Array.from(new Set(allTags)) as string[];
      setSuggestions(uniqueTags);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setLoops([]);
      setUsers([]);
    }
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (searchType === 'loops') {
        const response = await api.getAllLoops(1, 100);
        const filteredLoops = response.loops.filter((loop: any) => {
          const titleMatch = loop.title?.toLowerCase().includes(searchQuery.toLowerCase());
          const genreMatch = loop.genre?.toLowerCase().includes(searchQuery.toLowerCase());
          const tagsMatch = loop.tags?.some((tag: any) => 
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return titleMatch || genreMatch || tagsMatch;
        });
        setLoops(filteredLoops);
        setUsers([]);
      } else {
        // Поиск пользователей (временно по именам из лупов)
        const response = await api.getAllLoops(1, 1000);
        const userMap = new Map<number, User>();
        
        response.loops.forEach((loop: any) => {
          if (loop.author && loop.author_id) {
            if (!userMap.has(loop.author_id)) {
              userMap.set(loop.author_id, {
                id: loop.author_id,
                username: loop.author,
                created_at: loop.created_at,
                loop_count: 0
              });
            }
            const user = userMap.get(loop.author_id)!;
            user.loop_count = (user.loop_count || 0) + 1;
          }
        });
        
        const filteredUsers = Array.from(userMap.values()).filter(user => 
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setUsers(filteredUsers);
        setLoops([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка поиска');
    } finally {
      setLoading(false);
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

      // Сохраняем обработчики в аудио элементе для последующего удаления
      (audio as any)._handleLoadStart = handleLoadStart;
      (audio as any)._handleCanPlay = handleCanPlay;
      (audio as any)._handleEnded = handleEnded;
      (audio as any)._handleError = handleError;

      // Добавляем обработчики событий
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      audio.load();
    } catch (error) {
      console.error('Error playing loop:', error);
      setAudioLoading(null);
      alert('Ошибка воспроизведения лупа');
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="search-page">
      <div className="search-header">
        <h1 className="page-title">🔍 Поиск</h1>
        <p className="page-description">
          Ищите лупы по названию, автору, жанру или тегам
        </p>
      </div>

      <div className="search-container">
        <div className="search-type-toggle">
          <button
            className={`type-button ${searchType === 'loops' ? 'active' : ''}`}
            onClick={() => setSearchType('loops')}
          >
            🎵 Лупы
          </button>
          <button
            className={`type-button ${searchType === 'users' ? 'active' : ''}`}
            onClick={() => setSearchType('users')}
          >
            👤 Пользователи
          </button>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder={searchType === 'loops' 
              ? "Введите название лупа, имя автора, жанр или тег..." 
              : "Введите имя пользователя..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {searchType === 'loops' && showSuggestions && filteredSuggestions.length > 0 && (
            <div className="suggestions">
              {filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  #{suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          className="search-button"
          onClick={performSearch}
          disabled={loading || !searchQuery.trim()}
        >
          {loading ? '🔍 Поиск...' : '🔍 Найти'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => setError(null)} className="close-error">
            ✕
          </button>
        </div>
      )}

      <div className="search-results">
        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Поиск...</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {searchType === 'loops' && loops.length > 0 && (
              <div className="results-header">
                <h2>🎵 Найденные лупы ({loops.length})</h2>
              </div>
            )}

            {searchType === 'users' && users.length > 0 && (
              <div className="results-header">
                <h2>👤 Найденные пользователи ({users.length})</h2>
              </div>
            )}

            {searchType === 'loops' && loops.length > 0 && (
              <div className="loops-grid">
                {loops.map((loop) => (
                  <LoopCard
                    key={loop.id}
                    loop={loop}
                    onPlay={handlePlay}
                    isPlaying={currentlyPlaying === loop.id && isPlaying}
                    isLoading={audioLoading === loop.id}
                  />
                ))}
              </div>
            )}

            {searchType === 'users' && users.length > 0 && (
              <div className="users-grid">
                {users.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-avatar">
                      {user.first_name ? user.first_name[0].toUpperCase() : user.username[0].toUpperCase()}
                    </div>
                    <div className="user-info">
                      <h3 className="user-username">{user.username}</h3>
                      <p className="user-stats">
                        🎵 {user.loop_count} лупов • 
                        📅 На платформе с {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <Link to={`/user/${user.id}`} className="view-profile-button">
                      Посмотреть профиль →
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {!loading && searchQuery.trim() && loops.length === 0 && users.length === 0 && (
              <div className="no-results">
                <p>
                  {searchType === 'loops' 
                    ? '🎵 Лупы не найдены' 
                    : '👤 Пользователи не найдены'
                  }
                </p>
                <p>Попробуйте изменить поисковый запрос</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
