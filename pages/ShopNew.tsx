import React, { useState, useEffect } from 'react';

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
  avg_rating: number;
  rating_count: number;
  sales_count: number;
  created_at: string;
}

const ShopNew: React.FC = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('DESC');

  useEffect(() => {
    fetchPacks();
  }, [sort, order, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchPacks();
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '20', sort, order, ...(search && { search }) });
      const res = await fetch(`https://loopera-lpr.vercel.app/api/shop?${params}`);
      if (!res.ok) throw new Error('Failed to fetch packs');
      const data = await res.json();
      setPacks(data.packs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (packId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to purchase');
      return;
    }

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

      alert('Pack purchased successfully!');
      fetchPacks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to buy pack');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={fetchPacks} style={{ padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Sound Packs Shop</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search packs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', flex: 1 }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
        >
          <option value="created_at">Newest</option>
          <option value="price">Price</option>
          <option value="avg_rating">Rating</option>
          <option value="sales_count">Sales</option>
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
        >
          <option value="DESC">Descending</option>
          <option value="ASC">Ascending</option>
        </select>
      </div>

      {packs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>No packs found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {packs.map((pack) => (
            <div key={pack.id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{pack.title}</h3>
              {pack.description && <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>{pack.description}</p>}
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#007bff' }}>{pack.price} coins</p>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>By {pack.username || 'Unknown'}</p>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
                ⭐ {pack.avg_rating.toFixed(1)} ({pack.rating_count}) | 🛒 {pack.sales_count} sales
              </p>
              <button
                onClick={() => handleBuy(pack.id)}
                style={{
                  marginTop: 'auto',
                  padding: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Buy Pack
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopNew;
