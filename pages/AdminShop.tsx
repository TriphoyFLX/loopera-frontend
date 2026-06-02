import React, { useState, useEffect } from 'react';
import styles from './AdminShop.module.css';

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

  const handleDeletePack = async (packId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пак? Это действие нельзя отменить.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pack');
      }

      setSuccess('Pack deleted successfully');
      fetchPendingPacks();
      setSelectedPack(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pack');
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
    <div className={styles.adminShopContainer}>
      <div className={styles.adminHeader}>
        <h1>Администрирование Shop</h1>
        <p>Управление паками, выводами и жалобами</p>
      </div>

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          {success}
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className={styles.adminTabs}>
        <button
          className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Паки на модерации ({pendingPacks.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'withdrawals' ? styles.active : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          Заявки на вывод
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'reports' ? styles.active : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Жалобы ({reports.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Статистика
        </button>
      </div>

      <div className={styles.adminContent}>
        {activeTab === 'pending' && (
          <div className={styles.pendingPacks}>
            {pendingPacks.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <h3>Нет паков на модерации</h3>
                <p>Все паки рассмотрены</p>
              </div>
            ) : (
              <div className={styles.packsList}>
                {pendingPacks.map((pack) => (
                  <div key={pack.id} className={styles.packItem}>
                    <div className={styles.packInfo}>
                      <h3>{pack.title}</h3>
                      <p className={styles.packAuthor}>@{pack.hashtag} ({pack.username})</p>
                      <p className={styles.packPrice}>{pack.price} coins</p>
                      <p className={styles.packDate}>Создан: {new Date(pack.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={styles.packActions}>
                      <button
                        className={styles.btnView}
                        onClick={() => fetchPackDetails(pack.id)}
                      >
                        Просмотр
                      </button>
                      <button
                        className={styles.btnApprove}
                        onClick={() => handleApprovePack(pack.id)}
                        disabled={loading}
                      >
                        Одобрить
                      </button>
                      <button
                        className={styles.btnReject}
                        onClick={() => openRejectModal(pack.id)}
                        disabled={loading}
                      >
                        Отклонить
                      </button>
                      <button
                        className={styles.btnReject}
                        onClick={() => handleDeletePack(pack.id)}
                        disabled={loading}
                        style={{ backgroundColor: '#dc3545' }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className={styles.withdrawalsSection}>
            {withdrawals.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <h3>Нет заявок на вывод</h3>
              </div>
            ) : (
              <div className={styles.withdrawalsList}>
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className={styles.withdrawalItem}>
                    <div className={styles.withdrawalInfo}>
                      <h3>{withdrawal.amount} coins</h3>
                      <p>@{withdrawal.hashtag} ({withdrawal.username})</p>
                      <p>{withdrawal.bank} - {withdrawal.phone}</p>
                      <p>Запрошено: {new Date(withdrawal.created_at).toLocaleDateString()}</p>
                      <span className={`${styles.status} ${styles[withdrawal.status]}`}>
                        {withdrawal.status}
                      </span>
                    </div>
                    {withdrawal.status === 'pending' && (
                      <div className={styles.withdrawalActions}>
                        <button
                          className={styles.btnApprove}
                          onClick={() => handleProcessWithdrawal(withdrawal.id, 'approve')}
                          disabled={loading}
                        >
                          Одобрить
                        </button>
                        <button
                          className={styles.btnReject}
                          onClick={() => handleProcessWithdrawal(withdrawal.id, 'reject')}
                          disabled={loading}
                        >
                          Отклонить
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
          <div className={styles.reportsSection}>
            {reports.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <h3>Нет жалоб</h3>
              </div>
            ) : (
              <div className={styles.reportsList}>
                {reports.map((report) => (
                  <div key={report.id} className={styles.reportItem}>
                    <div className={styles.reportInfo}>
                      <h3>{report.reason.replace('_', ' ')}</h3>
                      <p>От: {report.reporter_name}</p>
                      {report.pack_title && <p>Пак: {report.pack_title}</p>}
                      {report.reported_user_name && <p>Жалоба на: {report.reported_user_name}</p>}
                      <p>{report.description}</p>
                      <p>Отправлено: {new Date(report.created_at).toLocaleDateString()}</p>
                      <span className={`${styles.status} ${styles[report.status]}`}>
                        {report.status}
                      </span>
                    </div>
                    {report.status === 'pending' && (
                      <div className={styles.reportActions}>
                        <button
                          className={styles.btnApprove}
                          onClick={() => handleResolveReport(report.id)}
                          disabled={loading}
                        >
                          Решить
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
          <div className={styles.statsSection}>
            {stats ? (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Общая статистика</h3>
                  <div className={styles.statItem}>
                    <span>Всего паков:</span>
                    <span>{stats.general.total_packs}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Одобрено паков:</span>
                    <span>{stats.general.approved_packs}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>На модерации:</span>
                    <span>{stats.general.pending_packs}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Общий доход:</span>
                    <span>{stats.general.total_revenue} coins</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <h3>Недельная статистика</h3>
                  <div className={styles.statItem}>
                    <span>Заказов за неделю:</span>
                    <span>{stats.weekly.weekly_orders}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Доход за неделю:</span>
                    <span>{stats.weekly.weekly_revenue} coins</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Новых паков:</span>
                    <span>{stats.weekly.weekly_packs}</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <h3>Топ продавцов</h3>
                  {stats.top_sellers.map((seller: any, index: number) => (
                    <div key={index} className={styles.statItem}>
                      <span>@{seller.hashtag}</span>
                      <span>{seller.total_revenue} coins</span>
                    </div>
                  ))}
                </div>

                <div className={styles.statCard}>
                  <h3>Топ паков</h3>
                  {stats.top_packs.map((pack: any, index: number) => (
                    <div key={index} className={styles.statItem}>
                      <span>{pack.title}</span>
                      <span>{pack.sales_count} продаж</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.loading}>Загрузка статистики...</div>
            )}
          </div>
        )}
      </div>

      {/* Pack Details Modal */}
      {selectedPack && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPack(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedPack.title}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedPack(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.packDetails}>
                <p><strong>Автор:</strong> @{selectedPack.hashtag} ({selectedPack.username})</p>
                <p><strong>Email:</strong> {selectedPack.email}</p>
                <p><strong>Цена:</strong> {selectedPack.price} coins</p>
                <p><strong>Voice Tag:</strong> {selectedPack.voice_tag || 'Нет'}</p>
                <p><strong>Описание:</strong> {selectedPack.description || 'Нет'}</p>
                <p><strong>Создан:</strong> {new Date(selectedPack.created_at).toLocaleDateString()}</p>
                <p><strong>Участник с:</strong> {new Date(selectedPack.user_created_at || '').toLocaleDateString()}</p>
              </div>

              {selectedPack.loops && (
                <div className={styles.loopsSection}>
                  <h3>Лупы ({selectedPack.loops.length})</h3>
                  <div className={styles.loopsList}>
                    {selectedPack.loops.map((loop: any) => (
                      <div key={loop.id} className={styles.loopItem}>
                        <span>{loop.title}</span>
                        <span>{loop.duration}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPack.user_stats && (
                <div className={styles.userStats}>
                  <h3>Статистика пользователя</h3>
                  <div className={styles.statsGridSmall}>
                    <div className={styles.statItem}>
                      <span>Всего паков:</span>
                      <span>{selectedPack.user_stats.total_packs}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span>Одобрено:</span>
                      <span>{selectedPack.user_stats.approved_packs}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span>Отклонено:</span>
                      <span>{selectedPack.user_stats.rejected_packs}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span>Всего продаж:</span>
                      <span>{selectedPack.user_stats.total_sales}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedPack.reports && selectedPack.reports.length > 0 && (
                <div className={styles.reportsSection}>
                  <h3>Жалобы на пользователя</h3>
                  {selectedPack.reports.map((report: any) => (
                    <div key={report.id} className={styles.reportItemSmall}>
                      <p><strong>{report.reason}:</strong> {report.description}</p>
                      <p>От: {report.reporter_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnApprove}
                onClick={() => handleApprovePack(selectedPack.id)}
                disabled={loading}
              >
                Одобрить пак
              </button>
              <button
                className={styles.btnReject}
                onClick={() => openRejectModal(selectedPack.id)}
                disabled={loading}
              >
                Отклонить пак
              </button>
              <button
                className={styles.btnReject}
                onClick={() => handleDeletePack(selectedPack.id)}
                disabled={loading}
                style={{ backgroundColor: '#dc3545' }}
              >
                Удалить пак
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className={styles.modalOverlay} onClick={closeRejectModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Отклонить пак</h2>
              <button className={styles.closeBtn} onClick={closeRejectModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="rejectionReason">Причина отклонения *</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Пожалуйста, объясните, почему этот пак отклоняется..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={closeRejectModal}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                className={styles.btnReject}
                onClick={handleRejectPack}
                disabled={loading}
              >
                Отклонить пак
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShop;
