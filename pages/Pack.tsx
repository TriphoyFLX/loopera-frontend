import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUploadsUrl } from '../utils/urls';
import Modal from '../components/Modal';
import styles from './Pack.module.css';

interface Pack {
  id: string;
  title: string;
  description?: string;
  price: number;
  preview_url?: string;
  preview_url_2?: string;
  voice_tag?: string;
  hashtag?: string;
  username?: string;
  avatar_url?: string;
  cover_url?: string;
  user_id?: number;
  avg_rating: number;
  rating_count: number;
  sales_count?: number;
  created_at: string;
  loops_count?: number;
  status?: string;
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

const Pack: React.FC = () => {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [pack, setPack] = useState<Pack | null>(null);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [isPurchased, setIsPurchased] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyModalMessage, setBuyModalMessage] = useState('');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  useEffect(() => {
    fetchPack();
    fetchUserBalance();
  }, [packId]);

  const fetchPack = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}`, {
        headers: getHeaders()
      });
      const data = await response.json();
      setPack(data);
      setLoops(data.loops || []);
      
      // Check if user has purchased this pack
      if (currentUser) {
        const purchaseResponse = await fetch(`https://loopera-lpr.vercel.app/api/shop/user-packs`, {
          headers: getHeaders()
        });
        const purchaseData = await purchaseResponse.json();
        const userPacks = purchaseData.packs || [];
        setIsPurchased(userPacks.some((p: Pack) => p.id === packId));
      }
    } catch (err) {
      console.error('Error fetching pack:', err);
      setError('Failed to load pack');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('https://loopera-lpr.vercel.app/api/shop/balance/my', {
        headers: getHeaders()
      });
      const data = await response.json();
      setUserBalance(data.available_balance || 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const handleBuyPack = () => {
    if (!currentUser) {
      setBuyModalMessage('Пожалуйста, войдите в систему для покупки паков');
      setBuyModalOpen(true);
      return;
    }

    if (isPurchased) {
      setBuyModalMessage('Вы уже владеете этим паком');
      setBuyModalOpen(true);
      return;
    }

    if (userBalance < (pack?.price || 0)) {
      setBuyModalMessage(`Недостаточно средств. У вас ${userBalance} коинов, нужно ${pack?.price} коинов`);
      setBuyModalOpen(true);
      return;
    }

    setBuyModalMessage(`Купить "${pack?.title}" за ${pack?.price} коинов?`);
    setBuyModalOpen(true);
  };

  const handleConfirmBuy = async () => {
    setBuyModalOpen(false);
    try {
      const response = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}/buy`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase pack');
      }
      setIsPurchased(true);
      fetchUserBalance();
      // Открываем модальное окно для оценки
      setRatingModalOpen(true);
    } catch (err: any) {
      console.error('Error buying pack:', err);
      setBuyModalMessage(err.message || 'Не удалось купить пак');
      setBuyModalOpen(true);
    }
  };

  const handleRatePack = async () => {
    if (selectedRating === 0) {
      alert('Пожалуйста, выберите оценку');
      return;
    }

    try {
      const response = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}/rate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rating: selectedRating })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to rate pack');
      }
      setRatingModalOpen(false);
      setSelectedRating(0);
      setBuyModalMessage('Спасибо за вашу оценку!');
      setBuyModalOpen(true);
    } catch (err: any) {
      console.error('Error rating pack:', err);
      alert(err.message || 'Не удалось оценить пак');
    }
  };

  const handlePlay = async (loop: Loop) => {
    try {
      if (currentlyPlaying === loop.id && isPlaying) {
        // Pause if clicking the same loop
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
        return;
      }

      setAudioLoading(loop.id);
      setCurrentlyPlaying(loop.id);
      setIsPlaying(true);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(getUploadsUrl(loop.filename));
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
      };

      audio.onerror = () => {
        setAudioLoading(null);
        setIsPlaying(false);
        alert('Error playing audio');
      };

      await audio.play();
      setAudioLoading(null);
    } catch (err) {
      console.error('Error playing audio:', err);
      setAudioLoading(null);
      setIsPlaying(false);
      alert('Error playing audio');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (error || !pack) {
    return <div className={styles.error}>{error || 'Pack not found'}</div>;
  }

  return (
    <div className={styles.packContainer}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/shop')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Shop
        </button>
        <div className={styles.packInfo}>
          <h1 className={styles.packTitle}>{pack.title}</h1>
          {pack.voice_tag && (
            <span className={styles.voiceTag}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              {pack.voice_tag}
            </span>
          )}
        </div>
        <div className={styles.author}>
          <span>by </span>
          <span 
            className={styles.authorLink}
            onClick={() => pack.user_id && navigate(`/profile/${pack.user_id}`)}
          >
            {pack.username || pack.hashtag || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Left Column - Pack Details */}
        <div className={styles.details}>
          {pack.cover_url && (
            <div className={styles.coverDisplay}>
              <img src={`https://loopera-lpr.vercel.app${pack.cover_url}`} alt={pack.title} />
            </div>
          )}
          {pack.description && (
            <div className={styles.description}>
              <h3>Description</h3>
              <p>{pack.description}</p>
            </div>
          )}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Цена</span>
              <span className={styles.statValue}>{pack.price} коинов</span>
            </div>
            {pack.loops_count && (
              <div className={styles.stat}>
                <span className={styles.statLabel}>Лупов</span>
                <span className={styles.statValue}>{pack.loops_count}</span>
              </div>
            )}
            <div className={styles.stat}>
              <span className={styles.statLabel}>Создан</span>
              <span className={styles.statValue}>
                {new Date(pack.created_at).toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {pack.preview_url && (
            <div className={styles.preview}>
              <h3>Preview</h3>
              <button
                className={styles.previewBtn}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                  }
                  const audio = new Audio(pack.preview_url);
                  audioRef.current = audio;
                  audio.play();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Play Preview
              </button>
            </div>
          )}

          {!isPurchased && (
            <button className={styles.buyBtn} onClick={handleBuyPack}>
              Купить за {pack.price} коинов
            </button>
          )}

          {isPurchased && (
            <div className={styles.owned}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Вы владеете этим паком
            </div>
          )}
        </div>

        {/* Right Column - Description */}
        <div className={styles.loopsSection}>
          <h3 className={styles.loopsTitle}>ОПИСАНИЕ ТОВАРА</h3>
          {pack.description ? (
            <p className={styles.descriptionText}>{pack.description}</p>
          ) : (
            <p className={styles.noLoops}>Описание отсутствует</p>
          )}
        </div>

        {/* Loops Section */}
        {loops.length > 0 && (
          <div className={styles.loopsSection}>
            <h3 className={styles.loopsTitle}>
              {isPurchased ? 'Лупы для скачивания' : 'Включенные лупы'}
            </h3>
            <div className={styles.loopsList}>
              {loops.map((loop) => (
                <div key={loop.id} className={styles.loopItem}>
                  <div className={styles.loopInfo}>
                    <span className={styles.loopTitle}>{loop.title}</span>
                    {loop.bpm && <span className={styles.loopBpm}>{loop.bpm} BPM</span>}
                    {loop.key && <span className={styles.loopKey}>{loop.key}</span>}
                    {loop.genre && <span className={styles.loopGenre}>{loop.genre}</span>}
                  </div>
                  {isPurchased ? (
                    <a
                      href={getUploadsUrl(loop.filename)}
                      download={loop.original_name}
                      className={styles.downloadLink}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Скачать
                    </a>
                  ) : (
                    <button
                      className={styles.playBtn}
                      onClick={() => handlePlay(loop)}
                      disabled={audioLoading === loop.id}
                    >
                      {audioLoading === loop.id ? (
                        '...'
                      ) : currentlyPlaying === loop.id && isPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        title={buyModalMessage.includes('Купить') ? 'Подтверждение покупки' : 'Уведомление'}
        onConfirm={buyModalMessage.includes('Купить') ? handleConfirmBuy : undefined}
        confirmText={buyModalMessage.includes('Купить') ? 'Купить' : undefined}
        cancelText="Отмена"
      >
        <p>{buyModalMessage}</p>
      </Modal>

      <Modal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title="Оцените пак"
        onConfirm={handleRatePack}
        confirmText="Отправить оценку"
        cancelText="Пропустить"
      >
        <div className={styles.ratingModalContent}>
          <p>Как вам пакет? Оцените от 1 до 5 звезд:</p>
          <div className={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`${styles.ratingStar} ${star <= selectedRating ? styles.active : ''}`}
                onClick={() => setSelectedRating(star)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Pack;
