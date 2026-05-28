import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Pack {
  id: string;
  title: string;
  description?: string;
  price: number;
  status: string;
  sales_count?: number;
  created_at: string;
  purchase_date?: string;
  seller_username?: string;
  seller_hashtag?: string;
}

const ProfileNew: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'purchases' | 'created'>('purchases');
  const [purchasedPacks, setPurchasedPacks] = useState<Pack[]>([]);
  const [createdPacks, setCreatedPacks] = useState<Pack[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);

      const [packsRes, createdRes, balanceRes] = await Promise.all([
        fetch('https://loopera-lpr.vercel.app/api/shop/my/packs', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://loopera-lpr.vercel.app/api/shop/my/created-packs', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://loopera-lpr.vercel.app/api/shop/balance/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const packsData = await packsRes.json();
      const createdData = await createdRes.json();
      const balanceData = await balanceRes.json();

      setPurchasedPacks(packsData.packs || []);
      setCreatedPacks(createdData.packs || []);
      setBalance(balanceData.available_balance || 0);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (packId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to download');

      const data = await res.json();
      alert(`Download URL: ${data.downloadUrl}`);
    } catch (err) {
      alert('Failed to download pack');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>My Profile</h1>

      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Balance: {balance.toLocaleString()} coins</h2>
        <button
          onClick={() => navigate('/deposit')}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Deposit
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('purchases')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'purchases' ? '#007bff' : '#ddd',
            color: activeTab === 'purchases' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Purchases
        </button>
        <button
          onClick={() => setActiveTab('created')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'created' ? '#007bff' : '#ddd',
            color: activeTab === 'created' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Created Packs
        </button>
        <button
          onClick={() => navigate('/create-pack')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Create Pack
        </button>
      </div>

      {error && (
        <div style={{ padding: '15px', backgroundColor: '#fee', color: '#c33', marginBottom: '20px', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      {activeTab === 'purchases' && (
        <div>
          <h2>My Purchases</h2>
          {purchasedPacks.length === 0 ? (
            <p>No purchases yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {purchasedPacks.map((pack) => (
                <div key={pack.id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{pack.title}</h3>
                  {pack.description && <p style={{ margin: '0 0 10px 0', color: '#666' }}>{pack.description}</p>}
                  <p style={{ margin: '0 0 5px 0' }}>Price: {pack.price} coins</p>
                  <p style={{ margin: '0 0 5px 0' }}>Purchased: {pack.purchase_date ? formatDate(pack.purchase_date) : 'N/A'}</p>
                  <p style={{ margin: '0 0 10px 0' }}>Seller: {pack.seller_username || 'Unknown'}</p>
                  <button
                    onClick={() => handleDownload(pack.id)}
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'created' && (
        <div>
          <h2>My Created Packs</h2>
          {createdPacks.length === 0 ? (
            <p>No created packs yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {createdPacks.map((pack) => (
                <div key={pack.id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{pack.title}</h3>
                  {pack.description && <p style={{ margin: '0 0 10px 0', color: '#666' }}>{pack.description}</p>}
                  <p style={{ margin: '0 0 5px 0' }}>Price: {pack.price} coins</p>
                  <p style={{ margin: '0 0 5px 0' }}>Sales: {pack.sales_count || 0}</p>
                  <p style={{ margin: '0 0 10px 0' }}>Status: 
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '5px',
                      backgroundColor: pack.status === 'approved' ? '#d4edda' : pack.status === 'pending' ? '#fff3cd' : '#f8d7da',
                      color: pack.status === 'approved' ? '#155724' : pack.status === 'pending' ? '#856404' : '#721c24'
                    }}>
                      {pack.status === 'approved' ? 'Approved' : pack.status === 'pending' ? 'Pending' : 'Rejected'}
                    </span>
                  </p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>Created: {formatDate(pack.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileNew;
