import React, { useState, useEffect, useRef } from 'react';
import { getUploadsUrl } from '../utils/urls';
import { subscriptionApi } from '../utils/subscriptionApi';

interface Loop {
  id: number;
  title: string;
  filename: string;
  author?: string;
  user_id: number;
  genre?: string;
  tags?: string[];
  bpm?: number;
  key?: string;
}
import './SubscribedLoops.css';

interface SubscribedLoopsProps {
  limit?: number;
  showAllButton?: boolean;
}

const SubscribedLoops: React.FC<SubscribedLoopsProps> = ({ 
  limit = 4, 
  showAllButton = true 
}) => {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSubscribedLoops = async () => {
      try {
        setIsLoading(true);
        const response = await subscriptionApi.getSubscribedLoops(1, limit);
        setLoops(response.loops);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscribed loops:', err);
        setError('Ошибка загрузки лупов');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscribedLoops();
  }, [limit]);

  const handlePlay = async (loop: Loop) => {
    try {
      if (currentlyPlaying === loop.id && isPlaying) {
        // Пауза
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        // Воспроизведение нового лупа
        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audioUrl = getUploadsUrl(loop.filename);
        console.log('Playing audio from:', audioUrl);
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.addEventListener('error', (e) => {
          console.error('Audio error:', e);
          console.error('Audio src:', audio.src);
          setCurrentlyPlaying(null);
          setIsPlaying(false);
        });
        
        audio.addEventListener('ended', () => {
          setCurrentlyPlaying(null);
          setIsPlaying(false);
        });

        await audio.play();
        setCurrentlyPlaying(loop.id);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing loop:', error);
      setCurrentlyPlaying(null);
      setIsPlaying(false);
    }
  };

  const handleLoopClick = (loopId: number) => {
    // В будущем можно добавить переход к деталям лупа
    console.log('Loop clicked:', loopId);
  };

  if (isLoading) {
    return (
      <div className="subscribed-loops-loading">
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="subscribed-loop-skeleton">
            <div className="skeleton-thumbnail"></div>
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-meta"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || loops.length === 0) {
    return (
      <div className="subscribed-loops-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="m22 21-3-3 3-3"></path>
        </svg>
        <h3>Нет лупов от подписанных артистов</h3>
        <p>
          {error 
            ? 'Произошла ошибка при загрузке' 
            : 'Подпишитесь на артистов, чтобы видеть их лупы здесь'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="subscribed-loops">
      <div className="loops-grid">
        {loops.map((loop) => (
          <div
            key={loop.id}
            className="loop-card"
            onClick={() => handleLoopClick(loop.id)}
          >
            <div className="loop-card-header">
              <div className="loop-user" onClick={() => window.location.href = `/user/${loop.user_id}`}>
                <div className="loop-avatar">
                  {loop.author ? loop.author.charAt(0).toUpperCase() : '?'}
                </div>
                <span className="loop-username">{loop.author || 'Unknown'}</span>
              </div>
              
              <div className="loop-actions">
                <button 
                  className="loop-action-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(getUploadsUrl(loop.filename));
                  }}
                  title="Скачать"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="loop-player">
              <div className="player-controls">
                <button 
                  className={`play-button ${currentlyPlaying === loop.id && isPlaying ? 'playing' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(loop);
                  }}
                >
                  {currentlyPlaying === loop.id && isPlaying ? (
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
                        className={`waveform-bar ${currentlyPlaying === loop.id && isPlaying && i < 20 ? 'active' : ''}`}
                        style={{
                          height: `${Math.random() * 60 + 20}%`,
                          animation: currentlyPlaying === loop.id && isPlaying ? `waveform 1s ease infinite ${i * 0.05}s` : 'none'
                        }}
                      />
                    ))}
                  </div>
                  {currentlyPlaying === loop.id && isPlaying && <div className="progress-bar" style={{ width: '45%' }} />}
                </div>
              </div>
            </div>

            <div className="loop-info">
              <h3 className="loop-title">{loop.title}</h3>
              <div className="loop-details">
                {loop.bpm && <span className="loop-detail">{loop.bpm} BPM</span>}
                {loop.key && <span className="loop-detail">{loop.key}</span>}
                {loop.genre && <span className="loop-detail">{loop.genre}</span>}
              </div>
              {loop.tags && loop.tags.length > 0 && (
                <div className="loop-tags">
                  {loop.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span key={index} className="loop-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {showAllButton && loops.length > 0 && (
        <div className="subscribed-loops-actions">
          <button className="view-all-button">
            Смотреть все лупы от подписанных артистов
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscribedLoops;
