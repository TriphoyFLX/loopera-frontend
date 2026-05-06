import React, { useState, useEffect, useRef } from 'react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .shop-root {
    --bg-base: #07070f;
    --bg-surface: #0d0d1c;
    --bg-card: #0f0f20;
    --bg-card-hover: #141428;
    --border-subtle: rgba(255,255,255,0.06);
    --border-mid: rgba(255,255,255,0.1);
    --border-accent: rgba(124,58,237,0.5);
    --accent-violet: #7c3aed;
    --accent-violet-light: #9d67f5;
    --accent-cyan: #06d6f5;
    --accent-cyan-dim: rgba(6,214,245,0.15);
    --text-primary: #f0eeff;
    --text-secondary: #8b84b0;
    --text-muted: #4a4570;
    --gradient-brand: linear-gradient(135deg, #7c3aed 0%, #06d6f5 100%);
    --gradient-card-shine: linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,214,245,0.04) 100%);
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
    font-family: var(--font-body);
    background: var(--bg-base);
    color: var(--text-primary);
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  .shop-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(124,58,237,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 110%, rgba(6,214,245,0.08) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  .shop-root > * { position: relative; z-index: 1; }

  /* ---- HEADER ---- */
  .sh-header {
    padding: 2rem 2.5rem 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
    max-width: 1400px;
    margin: 0 auto;
  }

  .sh-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .sh-logo {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--gradient-brand);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    box-shadow: 0 0 30px rgba(124,58,237,0.4);
  }

  .sh-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    background: var(--gradient-brand);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }

  .sh-subtitle {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin-top: 4px;
    letter-spacing: 0.02em;
  }

  .sh-balance {
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 50px;
    padding: 0.5rem 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
  }

  .sh-balance-icon { font-size: 16px; }
  .sh-balance-label { color: var(--text-secondary); font-weight: 400; }
  .sh-balance-amount {
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--accent-violet-light);
    font-size: 0.95rem;
  }

  /* ---- FILTERS ---- */
  .sh-filters {
    max-width: 1400px;
    margin: 1.75rem auto 0;
    padding: 0 2.5rem;
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .sh-search {
    flex: 1;
    min-width: 240px;
    position: relative;
  }

  .sh-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 15px;
    color: var(--text-muted);
    pointer-events: none;
  }

  .sh-search input {
    width: 100%;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 0.65rem 1rem 0.65rem 2.6rem;
    font-family: var(--font-body);
    font-size: 0.88rem;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .sh-search input::placeholder { color: var(--text-muted); }

  .sh-search input:focus {
    border-color: var(--border-accent);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }

  .sh-selects {
    display: flex;
    gap: 0.65rem;
  }

  .sh-select-wrap {
    position: relative;
  }

  .sh-select-wrap select {
    appearance: none;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 0.65rem 2.2rem 0.65rem 1rem;
    font-family: var(--font-body);
    font-size: 0.83rem;
    color: var(--text-secondary);
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
  }

  .sh-select-wrap select:focus,
  .sh-select-wrap select:hover { border-color: var(--border-mid); color: var(--text-primary); }

  .sh-select-arrow {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 11px;
    color: var(--text-muted);
  }

  .sh-total-badge {
    font-size: 0.78rem;
    color: var(--text-muted);
    white-space: nowrap;
    padding: 0.5rem 0;
  }

  .sh-total-badge strong { color: var(--text-secondary); font-weight: 500; }

  /* ---- GRID ---- */
  .sh-grid {
    max-width: 1400px;
    margin: 2rem auto 0;
    padding: 0 2.5rem 3rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  /* ---- PACK CARD ---- */
  .sh-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: transform 0.25s cubic-bezier(.22,.61,.36,1), border-color 0.25s, box-shadow 0.25s;
    animation: cardIn 0.45s cubic-bezier(.22,.61,.36,1) both;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .sh-card:hover {
    transform: translateY(-4px) scale(1.01);
    border-color: rgba(124,58,237,0.35);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.08);
  }

  .sh-card-cover {
    height: 120px;
    background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,214,245,0.08) 100%);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--border-subtle);
    overflow: hidden;
  }

  .sh-card-cover::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 40%, rgba(15,15,32,0.7) 100%);
  }

  .sh-waveform {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 48px;
    opacity: 0.35;
  }

  .sh-waveform span {
    display: block;
    width: 3px;
    border-radius: 3px;
    background: var(--accent-violet-light);
    animation: wave 1.2s ease-in-out infinite;
  }

  @keyframes wave {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.4); }
  }

  .sh-play-btn {
    position: absolute;
    z-index: 2;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--gradient-brand);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: #fff;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(124,58,237,0.5);
  }

  .sh-play-btn:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(124,58,237,0.7); }

  .sh-play-btn.playing {
    animation: pulsePurple 1.5s ease-in-out infinite;
  }

  @keyframes pulsePurple {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.6); }
    50% { box-shadow: 0 0 0 12px rgba(124,58,237,0); }
  }

  .sh-no-preview {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    position: relative;
    z-index: 2;
  }

  .sh-card-body {
    padding: 1.1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .sh-card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .sh-pack-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.3;
    letter-spacing: -0.015em;
  }

  .sh-voice-tag {
    font-size: 0.7rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 20px;
    background: rgba(6,214,245,0.12);
    border: 1px solid rgba(6,214,245,0.2);
    color: var(--accent-cyan);
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .sh-pack-author {
    font-size: 0.78rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 3px;
  }

  .sh-pack-author-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent-violet);
    opacity: 0.6;
  }

  .sh-desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-weight: 300;
  }

  .sh-stats {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .sh-stat {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.75rem;
    color: var(--text-muted);
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border-subtle);
    padding: 4px 9px;
    border-radius: 8px;
  }

  .sh-stat-val { color: var(--text-secondary); font-weight: 500; }

  .sh-stars {
    display: flex;
    gap: 2px;
  }

  .sh-star {
    font-size: 12px;
    line-height: 1;
  }

  .sh-card-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: rgba(0,0,0,0.2);
  }

  .sh-price {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }

  .sh-price-amount {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .sh-price-unit {
    font-size: 0.73rem;
    color: var(--text-muted);
    font-weight: 400;
  }

  .sh-buy-btn {
    position: relative;
    overflow: hidden;
    padding: 0.55rem 1.2rem;
    border-radius: 12px;
    border: none;
    font-family: var(--font-display);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    background: var(--gradient-brand);
    color: #fff;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(124,58,237,0.35);
  }

  .sh-buy-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 70%);
    transform: translateX(-100%);
    transition: transform 0.5s;
  }

  .sh-buy-btn:hover::before { transform: translateX(100%); }
  .sh-buy-btn:hover { box-shadow: 0 6px 24px rgba(124,58,237,0.55); transform: translateY(-1px); }
  .sh-buy-btn:active { transform: translateY(0) scale(0.97); }

  .sh-buy-btn:disabled {
    background: rgba(255,255,255,0.06);
    color: var(--text-muted);
    cursor: not-allowed;
    box-shadow: none;
    border: 1px solid var(--border-subtle);
  }
  .sh-buy-btn:disabled::before { display: none; }

  /* ---- PAGINATION ---- */
  .sh-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 0 2.5rem 3rem;
  }

  .sh-page-btn {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 0.55rem 1.4rem;
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }

  .sh-page-btn:hover:not(:disabled) {
    border-color: var(--border-accent);
    color: var(--text-primary);
    background: rgba(124,58,237,0.08);
  }

  .sh-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .sh-page-info {
    font-size: 0.82rem;
    color: var(--text-muted);
    min-width: 160px;
    text-align: center;
  }

  /* ---- STATES ---- */
  .sh-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1.5rem;
  }

  .sh-spinner {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid rgba(124,58,237,0.15);
    border-top-color: var(--accent-violet);
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .sh-loading-text {
    font-size: 0.85rem;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-size: 0.72rem;
  }

  .sh-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
  }

  .sh-error-msg {
    color: #f87171;
    font-size: 0.9rem;
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
  }

  .sh-retry-btn {
    background: transparent;
    border: 1px solid var(--border-mid);
    border-radius: 12px;
    padding: 0.55rem 1.4rem;
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
  }
  .sh-retry-btn:hover { border-color: var(--border-accent); color: var(--text-primary); }

  .sh-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    gap: 0.75rem;
  }

  .sh-empty-icon {
    font-size: 3rem;
    opacity: 0.25;
  }

  .sh-empty h3 {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--text-secondary);
  }

  .sh-empty p { font-size: 0.82rem; color: var(--text-muted); }

  /* ---- DIVIDER ---- */
  .sh-section-bar {
    max-width: 1400px;
    margin: 2rem auto 0;
    padding: 0 2.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .sh-section-label {
    font-family: var(--font-display);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .sh-section-line {
    flex: 1;
    height: 1px;
    background: var(--border-subtle);
  }
`;

const WaveformBars = () => (
  <div className="sh-waveform">
    {[40,70,55,80,45,60,75,50,65,40,80,55,45,70,60].map((h, i) => (
      <span key={i} style={{
        height: `${h}%`,
        animationDelay: `${i * 0.08}s`,
        opacity: 0.5 + (i % 3) * 0.15
      }} />
    ))}
  </div>
);

interface StarRatingProps {
  rating: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => (
  <div className="sh-stars">
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className="sh-star">
        {i < Math.floor(rating) ? '★' : '☆'}
      </span>
    ))}
  </div>
);

interface PackCardProps {
  pack: Pack;
  playingPreview: string | null;
  onPlay: (id: string, url: string) => void;
  onBuy: (id: string, price: number) => void;
  userBalance: number;
  idx: number;
}

const PackCard: React.FC<PackCardProps> = ({ pack, playingPreview, onPlay, onBuy, userBalance, idx }) => {
  const isPlaying = playingPreview === pack.id;
  const canBuy = userBalance >= pack.price;

  return (
    <div className="sh-card" style={{ animationDelay: `${idx * 0.04}s` }}>
      <div className="sh-card-cover">
        <WaveformBars />
        {pack.preview_url ? (
          <button
            className={`sh-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => onPlay(pack.id, pack.preview_url!)}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        ) : (
          <div className="sh-no-preview">🎵</div>
        )}
      </div>

      <div className="sh-card-body">
        <div>
          <div className="sh-card-head">
            <span className="sh-pack-title">{pack.title}</span>
            {pack.voice_tag && <span className="sh-voice-tag">{pack.voice_tag}</span>}
          </div>
          <div className="sh-pack-author">
            <span className="sh-pack-author-dot" />
            <span>@{pack.hashtag}</span>
          </div>
        </div>

        {pack.description && (
          <p className="sh-desc">{pack.description}</p>
        )}

        <div className="sh-stats">
          <div className="sh-stat">
            <span>⭐</span>
            <span className="sh-stat-val">{(pack.avg_rating || 0).toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({pack.rating_count})</span>
          </div>
          <div className="sh-stat">
            <span>🛒</span>
            <span className="sh-stat-val">{pack.sales_count}</span>
          </div>
          <div className="sh-stat">
            <span>🕒</span>
            <span className="sh-stat-val">{pack.created_at ? new Date(pack.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
          </div>
          {pack.loops_count && (
            <div className="sh-stat">
              <span>🔁</span>
              <span className="sh-stat-val">{pack.loops_count}</span>
            </div>
          )}
        </div>

        <StarRating rating={pack.avg_rating} />
      </div>

      <div className="sh-card-footer">
        <div className="sh-price">
          <span className="sh-price-amount">{pack.price}</span>
          <span className="sh-price-unit">coins</span>
        </div>
        <button
          className="sh-buy-btn"
          onClick={() => onBuy(pack.id, pack.price)}
          disabled={!canBuy}
        >
          {canBuy ? 'Buy Pack' : 'No funds'}
        </button>
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
  voice_tag?: string;
  hashtag: string;
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
      const res = await fetch(`/api/shop?${params}`);
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
      const res = await fetch('/api/shop/balance/my', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const b = await res.json();
        setUserBalance(b.available_balance || 0);
      }
    } catch {}
  };

  const handleBuyPack = async (packId: string, price: number) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login to purchase packs'); return; }
    if (userBalance < price) { alert('Insufficient balance'); return; }
    try {
      const res = await fetch(`/api/shop/${packId}/buy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to purchase'); }
      alert('Pack purchased successfully!');
      setUserBalance(prev => prev - price);
      fetchPacks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to purchase pack');
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
      <div className="shop-root">
        <style>{STYLES}</style>
        <div className="sh-loading">
          <div className="sh-spinner" />
          <p className="sh-loading-text">Loading packs…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-root">
        <style>{STYLES}</style>
        <div className="sh-error">
          <p className="sh-error-msg">⚠ {error}</p>
          <button className="sh-retry-btn" onClick={fetchPacks}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-root">
      <style>{STYLES}</style>

      <header className="sh-header">
        <div className="sh-brand">
          <div className="sh-logo">🎵</div>
          <div>
            <h1 className="sh-title">SoundPacks</h1>
            <p className="sh-subtitle">Premium loops & samples from top creators</p>
          </div>
        </div>
        {userBalance > 0 && (
          <div className="sh-balance">
            <span className="sh-balance-icon">💎</span>
            <span className="sh-balance-label">Balance</span>
            <span className="sh-balance-amount">{userBalance.toLocaleString()} coins</span>
          </div>
        )}
      </header>

      <div className="sh-filters">
        <div className="sh-search">
          <span className="sh-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search packs, creators, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sh-selects">
          <div className="sh-select-wrap">
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
              <option value="created_at">Newest</option>
              <option value="sales_count">Popular</option>
              <option value="avg_rating">Top Rated</option>
              <option value="price">Price</option>
              <option value="title">Name</option>
            </select>
            <span className="sh-select-arrow">▾</span>
          </div>
          <div className="sh-select-wrap">
            <select value={order} onChange={e => { setOrder(e.target.value); setPage(1); }}>
              <option value="DESC">↓ Desc</option>
              <option value="ASC">↑ Asc</option>
            </select>
            <span className="sh-select-arrow">▾</span>
          </div>
        </div>

        {total > 0 && (
          <span className="sh-total-badge"><strong>{total}</strong> packs</span>
        )}
      </div>

      <div className="sh-section-bar">
        <span className="sh-section-label">Marketplace</span>
        <div className="sh-section-line" />
        {loading && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.15)', borderTopColor: 'var(--accent-violet)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
      </div>

      {packs.length === 0 && !loading ? (
        <div className="sh-empty">
          <div className="sh-empty-icon">🎵</div>
          <h3>No packs found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="sh-grid">
          {packs.map((pack, idx) => (
            <PackCard
              key={pack.id}
              pack={pack}
              idx={idx}
              playingPreview={playingPreview}
              onPlay={playPreview}
              onBuy={handleBuyPack}
              userBalance={userBalance}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="sh-pagination">
          <button className="sh-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </button>
          <span className="sh-page-info">Page {page} / {totalPages} · {total} packs</span>
          <button className="sh-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;