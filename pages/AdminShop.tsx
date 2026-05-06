import React, { useState, useEffect } from 'react';
import './AdminShop.module.css';

interface Pack {
  id: number;
  title: string;
  description: string;
  price: number;
  username: string;
  hashtag: string;
  avatar_url?: string;
  voice_tag?: string;
  status: string;
  created_at: string;
  loops_count?: number;
  user_created_at?: string;
  email?: string;
  loops?: any[];
  user_stats?: {
    total_packs: number;
    approved_packs: number;
    rejected_packs: number;
    total_sales: number;
    total_revenue: number;
  };
  reports?: any[];
}

interface Withdrawal {
  id: number;
  user_id: number;
  amount: number;
  phone: string;
  bank: string;
  status: string;
  created_at: string;
  username?: string;
  hashtag?: string;
  email?: string;
}

interface Report {
  id: number;
  reporter_name: string;
  reported_user_name?: string;
  pack_title?: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

const AdminShop: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'withdrawals' | 'reports' | 'stats'>('pending');
  const [pendingPacks, setPendingPacks] = useState<Pack[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingPackId, setRejectingPackId] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchPendingPacks();
    if (activeTab === 'withdrawals') fetchWithdrawals();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab]);

  const fetchPendingPacks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/shop/packs/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch pending packs');
      const packs = await response.json();
      setPendingPacks(packs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/shop/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      const data = await response.json();
      setWithdrawals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/shop/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/shop/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchPackDetails = async (packId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/shop/packs/${packId}/moderation`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch pack details');
      const pack = await response.json();
      setSelectedPack(pack);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pack details');
    }
  };

  const handleApprovePack = async (packId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/shop/packs/${packId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to approve pack');
      
      setSuccess('Pack approved successfully');
      fetchPendingPacks();
      setSelectedPack(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve pack');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPack = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/shop/packs/${rejectingPackId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      });

      if (!response.ok) throw new Error('Failed to reject pack');
      
      setSuccess('Pack rejected successfully');
      fetchPendingPacks();
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectingPackId(null);
      setSelectedPack(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject pack');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: number, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/shop/withdrawals/${withdrawalId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`Failed to ${action} withdrawal`);
      
      setSuccess(`Withdrawal ${action}d successfully`);
      fetchWithdrawals();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} withdrawal`);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/shop/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolution: 'Resolved by admin' })
      });

      if (!response.ok) throw new Error('Failed to resolve report');
      
      setSuccess('Report resolved successfully');
      fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve report');
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (packId: number) => {
    setRejectingPackId(packId);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setRejectingPackId(null);
  };

  return (
    <div className="admin-shop-container">
      <div className="admin-header">
        <h1>Shop Administration</h1>
        <p>Manage packs, withdrawals, and reports</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Packs ({pendingPacks.length})
        </button>
        <button
          className={`tab ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          Withdrawals
        </button>
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'pending' && (
          <div className="pending-packs">
            {pendingPacks.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: '48px' }}>📦</span>
                <h3>No pending packs</h3>
                <p>All packs have been reviewed</p>
              </div>
            ) : (
              <div className="packs-list">
                {pendingPacks.map((pack) => (
                  <div key={pack.id} className="pack-item">
                    <div className="pack-info">
                      <h3>{pack.title}</h3>
                      <p className="pack-author">@{pack.hashtag} ({pack.username})</p>
                      <p className="pack-price">{pack.price} coins</p>
                      <p className="pack-date">Created: {new Date(pack.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="pack-actions">
                      <button
                        className="btn-view"
                        onClick={() => fetchPackDetails(pack.id)}
                      >
                        View Details
                      </button>
                      <button
                        className="btn-approve"
                        onClick={() => handleApprovePack(pack.id)}
                        disabled={loading}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => openRejectModal(pack.id)}
                        disabled={loading}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="withdrawals-section">
            {withdrawals.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: '48px' }}>💰</span>
                <h3>No withdrawal requests</h3>
              </div>
            ) : (
              <div className="withdrawals-list">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="withdrawal-item">
                    <div className="withdrawal-info">
                      <h3>{withdrawal.amount} coins</h3>
                      <p>@{withdrawal.hashtag} ({withdrawal.username})</p>
                      <p>{withdrawal.bank} - {withdrawal.phone}</p>
                      <p>Requested: {new Date(withdrawal.created_at).toLocaleDateString()}</p>
                      <span className={`status ${withdrawal.status}`}>
                        {withdrawal.status}
                      </span>
                    </div>
                    {withdrawal.status === 'pending' && (
                      <div className="withdrawal-actions">
                        <button
                          className="btn-approve"
                          onClick={() => handleProcessWithdrawal(withdrawal.id, 'approve')}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleProcessWithdrawal(withdrawal.id, 'reject')}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            {reports.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: '48px' }}>🚨</span>
                <h3>No reports</h3>
              </div>
            ) : (
              <div className="reports-list">
                {reports.map((report) => (
                  <div key={report.id} className="report-item">
                    <div className="report-info">
                      <h3>{report.reason.replace('_', ' ')}</h3>
                      <p>By: {report.reporter_name}</p>
                      {report.pack_title && <p>Pack: {report.pack_title}</p>}
                      {report.reported_user_name && <p>Reported: {report.reported_user_name}</p>}
                      <p>{report.description}</p>
                      <p>Reported: {new Date(report.created_at).toLocaleDateString()}</p>
                      <span className={`status ${report.status}`}>
                        {report.status}
                      </span>
                    </div>
                    {report.status === 'pending' && (
                      <div className="report-actions">
                        <button
                          className="btn-approve"
                          onClick={() => handleResolveReport(report.id)}
                          disabled={loading}
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-section">
            {stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>General Statistics</h3>
                  <div className="stat-item">
                    <span>Total Packs:</span>
                    <span>{stats.general.total_packs}</span>
                  </div>
                  <div className="stat-item">
                    <span>Approved Packs:</span>
                    <span>{stats.general.approved_packs}</span>
                  </div>
                  <div className="stat-item">
                    <span>Pending Packs:</span>
                    <span>{stats.general.pending_packs}</span>
                  </div>
                  <div className="stat-item">
                    <span>Total Revenue:</span>
                    <span>{stats.general.total_revenue} coins</span>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>Weekly Statistics</h3>
                  <div className="stat-item">
                    <span>Weekly Orders:</span>
                    <span>{stats.weekly.weekly_orders}</span>
                  </div>
                  <div className="stat-item">
                    <span>Weekly Revenue:</span>
                    <span>{stats.weekly.weekly_revenue} coins</span>
                  </div>
                  <div className="stat-item">
                    <span>New Packs:</span>
                    <span>{stats.weekly.weekly_packs}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>Top Sellers</h3>
                  {stats.top_sellers.map((seller: any, index: number) => (
                    <div key={index} className="stat-item">
                      <span>@{seller.hashtag}</span>
                      <span>{seller.total_revenue} coins</span>
                    </div>
                  ))}
                </div>

                <div className="stat-card">
                  <h3>Top Packs</h3>
                  {stats.top_packs.map((pack: any, index: number) => (
                    <div key={index} className="stat-item">
                      <span>{pack.title}</span>
                      <span>{pack.sales_count} sales</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="loading">Loading statistics...</div>
            )}
          </div>
        )}
      </div>

      {/* Pack Details Modal */}
      {selectedPack && (
        <div className="modal-overlay" onClick={() => setSelectedPack(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPack.title}</h2>
              <button className="close-btn" onClick={() => setSelectedPack(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="pack-details">
                <p><strong>Author:</strong> @{selectedPack.hashtag} ({selectedPack.username})</p>
                <p><strong>Email:</strong> {selectedPack.email}</p>
                <p><strong>Price:</strong> {selectedPack.price} coins</p>
                <p><strong>Voice Tag:</strong> {selectedPack.voice_tag || 'None'}</p>
                <p><strong>Description:</strong> {selectedPack.description || 'None'}</p>
                <p><strong>Created:</strong> {new Date(selectedPack.created_at).toLocaleDateString()}</p>
                <p><strong>Member Since:</strong> {new Date(selectedPack.user_created_at || '').toLocaleDateString()}</p>
              </div>

              {selectedPack.loops && (
                <div className="loops-section">
                  <h3>Loops ({selectedPack.loops.length})</h3>
                  <div className="loops-list">
                    {selectedPack.loops.map((loop: any) => (
                      <div key={loop.id} className="loop-item">
                        <span>{loop.title}</span>
                        <span>{loop.duration}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPack.user_stats && (
                <div className="user-stats">
                  <h3>User Statistics</h3>
                  <div className="stats-grid-small">
                    <div className="stat-item">
                      <span>Total Packs:</span>
                      <span>{selectedPack.user_stats.total_packs}</span>
                    </div>
                    <div className="stat-item">
                      <span>Approved:</span>
                      <span>{selectedPack.user_stats.approved_packs}</span>
                    </div>
                    <div className="stat-item">
                      <span>Rejected:</span>
                      <span>{selectedPack.user_stats.rejected_packs}</span>
                    </div>
                    <div className="stat-item">
                      <span>Total Sales:</span>
                      <span>{selectedPack.user_stats.total_sales}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedPack.reports && selectedPack.reports.length > 0 && (
                <div className="reports-section">
                  <h3>Reports Against User</h3>
                  {selectedPack.reports.map((report: any) => (
                    <div key={report.id} className="report-item-small">
                      <p><strong>{report.reason}:</strong> {report.description}</p>
                      <p>By: {report.reporter_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn-approve"
                onClick={() => handleApprovePack(selectedPack.id)}
                disabled={loading}
              >
                Approve Pack
              </button>
              <button
                className="btn-reject"
                onClick={() => openRejectModal(selectedPack.id)}
                disabled={loading}
              >
                Reject Pack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={closeRejectModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Pack</h2>
              <button className="close-btn" onClick={closeRejectModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="rejectionReason">Rejection Reason *</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why this pack is being rejected..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={closeRejectModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-reject"
                onClick={handleRejectPack}
                disabled={loading}
              >
                Reject Pack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShop;
