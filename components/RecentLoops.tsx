import React, { useState, useEffect, useRef } from 'react';
import { getUploadsUrl } from '../utils/urls';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import LoopCard from './LoopCard';
import './RecentLoops.css';

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

interface RecentLoopsProps {
  title?: string;
  limit?: number;
  showAllButton?: boolean;
  type?: 'all' | 'my';
}

const RecentLoops: React.FC<RecentLoopsProps> = ({ 
  title = "🔥 Новые лупы", 
  limit = 10,
  showAllButton = true,
  type = 'all'
}) => {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { token, user } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMoreLoops = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLoops(nextPage, true);
    }
  };

  const { observerRef } = useInfiniteScroll({
    hasNextPage: hasMore,
    isLoading: loading,
    onLoadMore: loadMoreLoops,
    rootMargin: '100px',
    threshold: 0.1
  });

  useEffect(() => {
    fetchLoops();
  }, [limit, type]);

  useEffect(() => {
    if (observerRef.current && loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
  }, [observerRef]);

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

  // Очистка при размонтировании
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

  const fetchLoops = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (type === 'my' && token) {
        response = await api.getUserLoops(token);
        setLoops(append ? [...loops, ...response.loops] : response.loops);
      } else {
        response = await api.getAllLoops(pageNum, limit, token || undefined);
        const newLoops = append ? [...loops, ...response.loops] : response.loops;
        setLoops(newLoops);
        
        // Обновляем информацию о пагинации
        if (response.pagination) {
          setTotalCount(response.pagination.total);
          setHasMore(response.pagination.hasMore || (newLoops.length >= limit));
        }
      }
    } catch (err) {
      console.error('Error fetching loops:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки лупов');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLoop = async (loopId: number) => {
    if (!token) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить этот луп?')) {
      return;
    }

    try {
      await api.deleteLoop(loopId, token);
      setLoops(loops.filter(loop => loop.id !== loopId));
    } catch (err) {
      console.error('Error deleting loop:', err);
      alert(err instanceof Error ? err.message : 'Ошибка удаления лупа');
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="section-title">{title}</h2>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка лупов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="section-title">{title}</h2>
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => fetchLoops()} className="retry-button">
            🔄 Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (loops.length === 0) {
    const emptyMessage = type === 'my' 
      ? 'У вас пока нет загруженных лупов' 
      : 'Пока нет загруженных лупов';
    const emptySubtext = type === 'my'
      ? 'Загрузите свой первый луп и поделитесь им с сообществом!'
      : 'Будьте первым, кто загрузит свой луп!';

    return (
      <div>
        <h2 className="section-title">{title}</h2>
        <div className="empty-state">
          <p>🎵 {emptyMessage}</p>
          <p>{emptySubtext}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {showAllButton && (
          <button className="view-all-button">
            Посмотреть все →
          </button>
        )}
      </div>

      <div className="loops-grid">
        {loops.map((loop: Loop) => (
          <LoopCard
            key={loop.id}
            loop={loop}
            currentUserId={user?.id}
            onPlay={handlePlay}
            onDelete={handleDeleteLoop}
            isPlaying={currentlyPlaying === loop.id && isPlaying}
            isLoading={audioLoading === loop.id}
          />
        ))}
      </div>

      {/* Триггер для бесконечной прокрутки */}
      <div ref={loadMoreRef} className="load-more-trigger" />

      {showAllButton && loops.length >= limit && (
        <div className="section-footer">
          <span className="loops-count">
            {totalCount !== null ? `Показано ${loops.length} из ${totalCount} лупов` : `Загружено ${loops.length} лупов`}
          </span>
          <button className="load-more-button" onClick={loadMoreLoops} disabled={!hasMore}>
            {hasMore ? 'Загрузить еще лупов' : 'Все лупы загружены'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentLoops;
