import React, { useState, useEffect, useRef } from 'react';
import { getUploadsUrl } from '../utils/urls';
import { likeApi } from '../utils/likeApi';
import DownloadRulesModal from './DownloadRulesModal';
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
  const [showDownloadModal, setShowDownloadModal] = useState(false);
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

  const handleDownloadClick = () => {
    setShowDownloadModal(true);
  };

  const handleDownloadConfirm = () => {
    const url = getUploadsUrl(loop.filename);
    const link = document.createElement('a');
    link.href = url;
    
    // Создаем имя файла: loopera.ru_[название_лупа].расширение
    const fileExtension = loop.filename.split('.').pop();
    const sanitizedTitle = loop.title.replace(/[^a-zA-Z0-9а-яА-Я_\-\s]/g, '').trim();
    const downloadName = `loopera.ru_${sanitizedTitle}.${fileExtension}`;
    
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="loop-user" onClick={() => window.location.href = `/profile/${loop.user_id}`}>
          <div className="loop-avatar">
            {getInitials(loop.author)}
          </div>
          <span className="loop-username">{loop.author || 'triphoy_prod'}</span>
        </div>
        
        <div className="loop-actions">
          <button 
            className="loop-action-btn" 
            onClick={handleDownloadClick}
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

        {(loop.instagram || loop.telegram) && (
          <div className="loop-social-links">
            {loop.instagram && (
              <a
                href={loop.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {loop.telegram && (
              <a
                href={loop.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                title="Telegram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21-.258-1.91.247-.502.377-1.012.756-1.512 1.136-.316.237-.622.373-.922.363-.68-.018-1.735-.376-3.018-.967-1.938-.854-3.232-1.88-4.293-2.915-.248-.242-.498-.49-.75-.737-.424-.416-.425-.656-.42-1.06.003-.22.088-.45.25-.65.27-.3.575-.605.864-.913.565-.597 1.05-1.122 1.458-1.536.358-.364.648-.478.942-.477.314.002.672.126 1.07.368.86.518 2.038 1.41 3.38 2.38 1.837 1.34 2.57 2.87 3.25 4.22.45.917.632 1.326.714 1.546.083.224.077.45-.026.695-.067.16-.22.33-.465.488-.738.535-1.518 1.09-2.298 1.648-.78.56-1.558 1.12-2.338 1.678-.78.558-1.558 1.116-2.338 1.674-.78.558-1.558 1.116-2.338 1.674z"/>
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
      
      <DownloadRulesModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownloadConfirm}
        loopTitle={loop.title}
      />
    </div>
  );
};

export default LoopCard;