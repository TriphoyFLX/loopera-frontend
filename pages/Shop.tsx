import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import styles from './Shop.module.css';

interface PackCardProps {
  pack: Pack;
  playingPreview: string | null;
  onPlay: (id: string, url: string) => void;
  onBuy: (id: string) => void;
}

const PackCard: React.FC<PackCardProps> = ({ pack, playingPreview, onPlay, onBuy }) => {
  const isPlaying = playingPreview === pack.id;
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/shop/pack/${pack.id}`);
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.cardImage}>
        {pack.cover_url ? (
          <img src={`https://loopera-lpr.vercel.app${pack.cover_url}`} alt={pack.title} />
        ) : (
          <div style={{ fontSize: '3rem', opacity: 0.3 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
        )}
        {pack.preview_url && (
          <div className={styles.playOverlay}>
            <button
              className={styles.playBtn}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(pack.id, pack.preview_url!);
              }}
              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      <div className={styles.cardContent}>
        <div className={styles.packName}>{pack.title}</div>
        <div className={styles.packArtist}>@{pack.username || pack.hashtag || 'Unknown'}</div>

        <div className={styles.cardFooter}>
          <div className={styles.price}>{pack.price.toFixed(2)}</div>
          <button
            className={styles.buyBtn}
            onClick={(e) => {
              e.stopPropagation();
              onBuy(pack.id);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Buy
          </button>
        </div>
      </div>
    </div>
  );
};

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
  avg_rating: number;
  rating_count: number;
  sales_count: number;
  created_at: string;
  loops_count?: number;
}

const Shop = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchPacks();
    fetchUserBalance();
  }, [sort, order, page]);

  useEffect(() => {
    clearTimeout(searchTimeout.current!);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchPacks();
    }, 380);
    return () => clearTimeout(searchTimeout.current!);
  }, [search]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '20', sort, order, ...(search && { search }) });
      const res = await fetch(`https://loopera-lpr.vercel.app/api/shop?${params}`);
      if (!res.ok) throw new Error('Failed to fetch packs');
      const data = await res.json();
      setPacks(data.packs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('https://loopera-lpr.vercel.app/api/shop/balance/my', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const b = await res.json();
        setUserBalance(b.available_balance || 0);
      }
    } catch {}
  };

  const handleBuyPack = async (packId: string) => {
    const token = localStorage.getItem('token');
    if (!token) { setModalMessage('Please login to buy packs'); setModalOpen(true); return; }

    // Find the pack to get price
    const pack = packs.find(p => p.id === packId);
    if (!pack) return;

    // Show confirm modal
    setConfirmMessage(`Купить "${pack.title}" за ${pack.price} коинов?`);
    setPendingPackId(packId);
    setConfirmModalOpen(true);
  };

  const handleConfirmPurchase = async () => {
    setConfirmModalOpen(false);
    const packId = pendingPackId;
    if (!packId) return;

    const token = localStorage.getItem('token');
    const pack = packs.find(p => p.id === packId);
    if (!pack) return;

    try {
      const res = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to buy pack');
      }

      const data = await res.json();

      if (data.message) {
        setModalMessage('Pack purchased successfully!');
        setModalOpen(true);

        // Auto-download the pack
        try {
          const downloadRes = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}/download`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (downloadRes.ok) {
            const blob = await downloadRes.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${pack.title}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } catch (downloadErr) {
          console.error('Auto-download failed:', downloadErr);
        }

        fetchUserBalance();
        fetchPacks();

        // Redirect to profile purchases section
        window.location.href = '/profile#purchases';
      }
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : 'Failed to buy pack');
      setModalOpen(true);
    }
  };

  const playPreview = (packId: string, previewUrl: string) => {
    if (!previewUrl) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingPreview === packId) { setPlayingPreview(null); return; }
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    audio.play();
    audio.onended = () => setPlayingPreview(null);
    setPlayingPreview(packId);
  };

  if (loading && packs.length === 0) {
    return (
      <div className={styles.shopContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading packs…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.shopContainer}>
        <div className={styles.error}>
          <p className={styles.errorMsg}>⚠ {error}</p>
          <button className={styles.retryBtn} onClick={fetchPacks}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.shopContainer}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Sound Packs</h1>
          <div className={styles.headerActions}>
            <a href="/create-pack" className={styles.createBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Create Pack</span>
            </a>
            {userBalance > 0 && (
              <div className={styles.balance}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span className={styles.balanceAmount}>{userBalance.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles.filters}>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search packs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className={styles.select} value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          <option value="created_at">Newest</option>
          <option value="sales_count">Popular</option>
          <option value="avg_rating">Top Rated</option>
          <option value="price">Price</option>
          <option value="title">Name</option>
        </select>

        <select className={styles.select} value={order} onChange={e => { setOrder(e.target.value); setPage(1); }}>
          <option value="DESC">↓ Desc</option>
          <option value="ASC">↑ Asc</option>
        </select>

        {total > 0 && (
          <span className={styles.total}>{total} packs</span>
        )}
      </div>

      {packs.length === 0 && !loading ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3>No packs found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              playingPreview={playingPreview}
              onPlay={playPreview}
              onBuy={handleBuyPack}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </button>
          <span className={styles.pageInfo}>Page {page} / {totalPages} · {total} packs</span>
          <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      )}
    </div>

    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Уведомление">
      <p>{modalMessage}</p>
    </Modal>

    <Modal 
      isOpen={confirmModalOpen} 
      onClose={() => setConfirmModalOpen(false)} 
      title="Подтверждение покупки"
      onConfirm={handleConfirmPurchase}
      confirmText="Купить"
      cancelText="Отмена"
    >
      <p>{confirmMessage}</p>
    </Modal>
    </>
  );
};

export default Shop;