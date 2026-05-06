import React, { useState, useEffect } from 'react';
import './Shop.module.css';

interface Pack {
  id: number;
  title: string;
  description: string;
  price: number;
  username: string;
  hashtag: string;
  avatar_url?: string;
  voice_tag?: string;
  preview_url?: string;
  avg_rating: number;
  rating_count: number;
  sales_count: number;
  created_at: string;
  loops_count?: number;
}

interface ShopResponse {
  packs: Pack[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const Shop: React.FC = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [playingPreview, setPlayingPreview] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    fetchPacks();
    fetchUserBalance();
  }, [search, sort, order, page]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort,
        order,
        ...(search && { search })
      });

      const response = await fetch(`/api/shop?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch packs');
      }

      const data: ShopResponse = await response.json();
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

      const response = await fetch('/api/shop/balance/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const balance = await response.json();
        setUserBalance(balance.available_balance || 0);
      }
    } catch (err) {
      console.error('Failed to fetch user balance:', err);
    }
  };

  const handleBuyPack = async (packId: number, price: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to purchase packs');
      return;
    }

    if (userBalance < price) {
      alert('Insufficient balance');
      return;
    }

    try {
      const response = await fetch(`/api/shop/${packId}/buy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to purchase pack');
      }

      alert('Pack purchased successfully!');
      setUserBalance(prev => prev - price);
      fetchPacks(); // Refresh packs to update sales count
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to purchase pack');
    }
  };

  const playPreview = (packId: number, previewUrl?: string) => {
    if (!previewUrl) return;
    
    if (playingPreview === packId) {
      setPlayingPreview(null);
    } else {
      setPlayingPreview(packId);
      // Here you would implement actual audio playback
      const audio = new Audio(previewUrl);
      audio.play();
      audio.onended = () => setPlayingPreview(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`star ${i < Math.floor(rating) ? 'star-filled' : 'star-empty'}`}
          >
            {i < Math.floor(rating) ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  if (loading && packs.length === 0) {
    return (
      <div className="shop-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading packs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-container">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={fetchPacks} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-container">
      <header className="shop-header">
        <div className="header-content">
          <div className="title-section">
            <span className="logo">🎵</span>
            <div>
              <h1>Sound Packs Shop</h1>
              <p>Discover amazing loops and sound packs from talented creators</p>
            </div>
          </div>
          {userBalance > 0 && (
            <div className="balance-display">
              <span className="balance-label">Balance:</span>
              <span className="balance-amount">{userBalance} coins</span>
            </div>
          )}
        </div>
      </header>

      <div className="shop-filters">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search packs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-controls">
          <div className="sort-control">
            <span>⚙️</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="created_at">Newest</option>
              <option value="sales_count">Popular</option>
              <option value="avg_rating">Top Rated</option>
              <option value="price">Price</option>
              <option value="title">Name</option>
            </select>
          </div>

          <div className="order-control">
            <select value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="packs-grid">
        {packs.map((pack) => (
          <div key={pack.id} className="pack-card">
            <div className="pack-header">
              <div className="pack-cover">
                {pack.preview_url ? (
                  <button
                    className="preview-button"
                    onClick={() => playPreview(pack.id, pack.preview_url)}
                  >
                    <span className={playingPreview === pack.id ? 'playing' : ''}>
                      {playingPreview === pack.id ? '⏸️' : '▶️'}
                    </span>
                  </button>
                ) : (
                  <div className="no-preview">
                    <span>🎵</span>
                  </div>
                )}
              </div>
              
              <div className="pack-info">
                <h3 className="pack-title">{pack.title}</h3>
                <div className="pack-author">
                  <span>@{pack.hashtag}</span>
                </div>
                
                {pack.voice_tag && (
                  <div className="voice-tag">
                    <span>{pack.voice_tag}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pack-description">
              <p>{pack.description || 'No description available'}</p>
            </div>

            <div className="pack-stats">
              <div className="stat">
                <span>⭐</span>
                <span>{pack.avg_rating.toFixed(1)}</span>
                <span className="stat-count">({pack.rating_count})</span>
              </div>
              
              <div className="stat">
                <span>🛒</span>
                <span>{pack.sales_count}</span>
              </div>
              
              <div className="stat">
                <span>🕒</span>
                <span>{new Date(pack.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pack-rating">
              {renderStars(pack.avg_rating)}
            </div>

            <div className="pack-footer">
              <div className="pack-price">
                <span className="price-amount">{pack.price}</span>
                <span className="price-currency">coins</span>
              </div>
              
              <button
                className="buy-button"
                onClick={() => handleBuyPack(pack.id, pack.price)}
                disabled={userBalance < pack.price}
              >
                {userBalance < pack.price ? 'Insufficient' : 'Buy Pack'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {packs.length === 0 && !loading && (
        <div className="empty-state">
          <span style={{ fontSize: '48px' }}>🎵</span>
          <h3>No packs found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {page} of {totalPages} ({total} packs)
          </span>
          
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;
