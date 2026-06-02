import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUploadsUrl } from '../utils/urls';
import './Pack.css';

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

  const handleBuyPack = async () => {
    if (!currentUser) {
      alert('Please login to purchase packs');
      navigate('/auth');
      return;
    }

    if (isPurchased) {
      alert('You already own this pack');
      return;
    }

    if (userBalance < (pack?.price || 0)) {
      alert('Insufficient balance');
      return;
    }

    if (!confirm(`Buy "${pack?.title}" for ${pack?.price} coins?`)) {
      return;
    }

    try {
      const response = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}/buy`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase pack');
      }
      alert('Pack purchased successfully!');
      setIsPurchased(true);
      fetchUserBalance();
    } catch (err: any) {
      console.error('Error buying pack:', err);
      alert(err.message || 'Failed to purchase pack');
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
    return <div className="pack-loading">Loading...</div>;
  }

  if (error || !pack) {
    return <div className="pack-error">{error || 'Pack not found'}</div>;
  }

  return (
    <div className="pack-root">
      <div className="pack-container">
        {/* Header */}
        <div className="pack-header">
          <button className="pack-back-btn" onClick={() => navigate('/shop')}>
            ← Back to Shop
          </button>
          <div className="pack-info">
            <h1 className="pack-title">{pack.title}</h1>
            {pack.voice_tag && <span className="pack-voice-tag">{pack.voice_tag}</span>}
          </div>
          <div className="pack-author">
            <span>by </span>
            <span 
              className="pack-author-link"
              onClick={() => pack.user_id && navigate(`/profile/${pack.user_id}`)}
            >
              {pack.username || pack.hashtag || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="pack-content">
          {/* Left Column - Pack Details */}
          <div className="pack-details">
            {pack.description && (
              <div className="pack-description">
                <h3>Description</h3>
                <p>{pack.description}</p>
              </div>
            )}

            <div className="pack-stats">
              <div className="pack-stat">
                <span className="pack-stat-label">Price</span>
                <span className="pack-stat-value">{pack.price} coins</span>
              </div>
              <div className="pack-stat">
                <span className="pack-stat-label">Rating</span>
                <span className="pack-stat-value">
                  {Number(pack.avg_rating || 0).toFixed(1)} ⭐
                  <span className="pack-stat-sub">({pack.rating_count} reviews)</span>
                </span>
              </div>
              <div className="pack-stat">
                <span className="pack-stat-label">Sales</span>
                <span className="pack-stat-value">{pack.sales_count}</span>
              </div>
              {pack.loops_count && (
                <div className="pack-stat">
                  <span className="pack-stat-label">Loops</span>
                  <span className="pack-stat-value">{pack.loops_count}</span>
                </div>
              )}
              <div className="pack-stat">
                <span className="pack-stat-label">Created</span>
                <span className="pack-stat-value">
                  {new Date(pack.created_at).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
            </div>

            {pack.preview_url && (
              <div className="pack-preview">
                <h3>Preview</h3>
                <button
                  className="pack-preview-btn"
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.pause();
                    }
                    const audio = new Audio(pack.preview_url);
                    audioRef.current = audio;
                    audio.play();
                  }}
                >
                  ▶ Play Preview
                </button>
              </div>
            )}

            {!isPurchased && (
              <button className="pack-buy-btn" onClick={handleBuyPack}>
                Buy for {pack.price} coins
              </button>
            )}

            {isPurchased && (
              <div className="pack-owned">
                <span>✓ You own this pack</span>
              </div>
            )}
          </div>

          {/* Right Column - Loops */}
          <div className="pack-loops">
            <h3 className="pack-loops-title">
              {isPurchased ? 'Downloadable Loops' : 'Included Loops'}
            </h3>
            {loops.length === 0 ? (
              <p className="pack-no-loops">No loops in this pack</p>
            ) : (
              <div className="pack-loops-list">
                {loops.map((loop) => (
                  <div key={loop.id} className="pack-loop-item">
                    <div className="pack-loop-info">
                      <span className="pack-loop-title">{loop.title}</span>
                      {loop.bpm && <span className="pack-loop-bpm">{loop.bpm} BPM</span>}
                      {loop.key && <span className="pack-loop-key">{loop.key}</span>}
                      {loop.genre && <span className="pack-loop-genre">{loop.genre}</span>}
                    </div>
                    {isPurchased ? (
                      <a
                        href={getUploadsUrl(loop.filename)}
                        download={loop.original_name}
                        className="pack-loop-download"
                      >
                        ⬇ Download
                      </a>
                    ) : (
                      <button
                        className="pack-loop-play"
                        onClick={() => handlePlay(loop)}
                        disabled={audioLoading === loop.id}
                      >
                        {audioLoading === loop.id ? '...' : currentlyPlaying === loop.id && isPlaying ? '⏸' : '▶'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pack;
