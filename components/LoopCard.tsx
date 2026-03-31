import React, { useState, useEffect, useRef } from 'react';
import { getUploadsUrl } from '../utils/urls';
import { likeApi } from '../utils/likeApi';
import './LoopCard.css';

interface LoopCardProps {
  loop: any;
  currentUserId?: number;
  onDelete?: (id: number) => void;
  onPlay?: (loop: any) => void;
  isPlaying?: boolean;
  isLoading?: boolean;
  showLike?: boolean;
}

const LoopCard: React.FC<LoopCardProps> = ({ 
  loop, 
  currentUserId, 
  onDelete, 
  onPlay, 
  isPlaying, 
  isLoading,
  showLike = true 
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLikeStatus = async () => {
      if (currentUserId && showLike) {
        try {
          const status = await likeApi.getLikeStatus(loop.id);
          setIsLiked(status.liked);
          setLikesCount(status.likes_count);
        } catch (error) {
          console.error('Error loading like status:', error);
        }
      }
    };

    loadLikeStatus();
  }, [loop.id, currentUserId, showLike]);

  // Проверка на переполнение тегов
  useEffect(() => {
    const checkOverflow = () => {
      if (tagsContainerRef.current) {
        const container = tagsContainerRef.current;
        const isOverflowing = container.scrollHeight > container.clientHeight;
        setHasOverflow(isOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [loop.tags]);

  const handleLike = async () => {
    if (!currentUserId || isLikeLoading) return;

    setIsLikeLoading(true);
    try {
      const response = await likeApi.toggleLike(loop.id);
      setIsLiked(response.liked);
      setLikesCount(response.likes_count);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  const isOwner = currentUserId === loop.user_id;

  const formatBpm = (bpm: number) => {
    return bpm ? `${bpm} BPM` : '—';
  };

  const formatKey = (key: string) => {
    return key || '—';
  };

  // Получаем теги для отображения
  const allTags = loop.tags?.length > 0 ? loop.tags : ['osamason', 'tyloop', 'trap'];
  const visibleTags = showAllTags ? allTags : allTags.slice(0, 3);
  const hasMoreTags = allTags.length > 3;

  return (
    <div className="loop-card">
      <div className="loop-card-header">
        <div className="loop-user" onClick={() => window.location.href = `/user/${loop.user_id}`}>
          <div className="loop-avatar">
            {getInitials(loop.author)}
          </div>
          <span className="loop-username">{loop.author || 'triphoy_prod'}</span>
        </div>
        
        <div className="loop-actions">
          <button 
            className="loop-action-btn" 
            onClick={() => window.open(getUploadsUrl(loop.filename))}
            title="Скачать"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </button>
          
          {showLike && currentUserId && (
            <button 
              className={`loop-action-btn ${isLiked ? 'liked' : ''}`} 
              onClick={handleLike}
              disabled={isLikeLoading}
              title={isLiked ? 'Убрать из избранного' : 'Добавить в избранное'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "#ff2a55" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {likesCount > 0 && (
                <span className="likes-count">{likesCount}</span>
              )}
            </button>
          )}
          
          {isOwner && onDelete && (
            <button 
              className="loop-action-btn delete" 
              onClick={() => onDelete(loop.id)}
              title="Удалить"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="loop-player">
        <div className="player-controls">
          <button 
            className={`play-button ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={() => onPlay?.(loop)}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none">
                  <animate attributeName="r" values="10;8;10" dur="1.5s" repeatCount="indefinite"/>
                </circle>
              </svg>
            ) : isPlaying ? (
              <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>

          <div className="waveform-container">
            <div className="waveform-bars">
              {[...Array(40)].map((_, i) => (
                <div 
                  key={i} 
                  className={`waveform-bar ${isPlaying && i < 20 ? 'active' : ''}`}
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animation: isPlaying ? `waveform 1s ease infinite ${i * 0.05}s` : 'none'
                  }}
                />
              ))}
            </div>
            {isPlaying && <div className="progress-bar" style={{ width: '45%' }} />}
          </div>
        </div>
      </div>

      <div className="loop-details">
        <h4 className="loop-title" title={loop.title || 'Без названия'}>
          {loop.title || 'Без названия'}
        </h4>
        
        <div 
          className={`loop-tags ${hasOverflow ? 'has-overflow' : ''}`}
          ref={tagsContainerRef}
        >
          {visibleTags.map((tag: string, index: number) => (
            <span key={index} className="loop-tag">#{tag}</span>
          ))}
          
          {!showAllTags && hasMoreTags && (
            <span 
              className="more-tags-indicator"
              onClick={() => setShowAllTags(true)}
              title={`Показать все теги (${allTags.length})`}
            >
              +{allTags.length - 3}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          )}
          
          {showAllTags && hasMoreTags && (
            <span 
              className="more-tags-indicator"
              onClick={() => setShowAllTags(false)}
              title="Свернуть"
            >
              Свернуть
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(180deg)' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          )}
        </div>

        <div className="loop-metadata">
          <div className="metadata-item" title={loop.bpm ? `${loop.bpm} BPM` : 'BPM не указан'}>
            <svg className="metadata-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="metadata-value">{formatBpm(loop.bpm)}</span>
          </div>
          
          <div className="metadata-item" title={loop.key || 'Тональность не указана'}>
            <svg className="metadata-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3c0 5 3 8 3 8s3-3 3-8a3 3 0 0 0-3-3z"/>
              <circle cx="12" cy="9" r="1"/>
            </svg>
            <span className="metadata-value">{formatKey(loop.key)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoopCard;