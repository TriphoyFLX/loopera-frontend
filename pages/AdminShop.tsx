import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
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
  sales_count?: number;
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

const statusClass = (status: string) => {
  if (status === 'pending') return styles.pending;
  if (status === 'approved' || status === 'completed') return styles.approved;
  if (status === 'rejected' || status === 'deleted') return styles.rejected;
  return '';
};

const AdminShop: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'withdrawals' | 'reports' | 'stats'>('all');
  const [allPacks, setAllPacks] = useState<Pack[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'deleted'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPacks, setTotalPacks] = useState(0);

  useEffect(() => {
    if (activeTab === 'all') fetchAllPacks();
    if (activeTab === 'withdrawals') fetchWithdrawals();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab, currentPage, statusFilter]);

  const fetchAllPacks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = `/api/admin/shop/packs/all?page=${currentPage}&limit=50&status=${statusFilter}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch all packs');
      }

      const data = await response.json();
      setAllPacks(data.packs);
      setTotalPacks(data.pagination.totalPacks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/shop/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch withdrawals');
      setWithdrawals(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/shop/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch reports');
      setReports(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/shop/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');
      setStats(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    }
  };

  const fetchPackDetails = async (packId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/shop/packs/${packId}/moderation`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch pack details');
      setSelectedPack(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pack details');
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: number, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/shop/withdrawals/${withdrawalId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolution: 'Resolved by admin' }),
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

      const response = await fetch(`/api/shop/${packId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pack');
      }

      setSuccess('Pack deleted successfully');
      fetchAllPacks();
      setSelectedPack(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pack');
    } finally {
      setLoading(false);
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Магазин</h1>
      </header>

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Close">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')} aria-label="Close">
            ×
          </button>
        </div>
      )}

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Паки ({totalPacks})
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'withdrawals' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('withdrawals')}
          >
            Выводы
          </button>
        )}
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'reports' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Жалобы ({pendingReports})
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'stats' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Статистика
        </button>
      </div>

      <div className={styles.panel}>
        {activeTab === 'all' && (
          <>
            <div className={styles.filterBar}>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  setCurrentPage(1);
                }}
              >
                <option value="all">Все статусы</option>
                <option value="approved">Опубликовано</option>
                <option value="rejected">Отклонено</option>
                <option value="deleted">Удалено</option>
              </select>
            </div>

            {allPacks.length === 0 ? (
              <div className={styles.empty}>
                <h3>Нет паков</h3>
                <p>По выбранному фильтру ничего не найдено</p>
              </div>
            ) : (
              <div className={styles.list}>
                {allPacks.map((pack) => (
                  <div key={pack.id} className={styles.item}>
                    <div className={styles.itemBody}>
                      <h3 className={styles.itemTitle}>{pack.title}</h3>
                      <div className={styles.itemMeta}>
                        <span>
                          <strong>@{pack.hashtag || pack.username}</strong>
                        </span>
                        <span className={styles.price}>{pack.price} ₽</span>
                        <span>{new Date(pack.created_at).toLocaleDateString('ru-RU')}</span>
                        <span className={`${styles.status} ${statusClass(pack.status)}`}>{pack.status}</span>
                        <span>Продаж: {pack.sales_count || 0}</span>
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button type="button" className={styles.btn} onClick={() => fetchPackDetails(pack.id)}>
                        Просмотр
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => handleDeletePack(pack.id)}
                          disabled={loading}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPacks > 50 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Назад
                </button>
                <span>
                  {currentPage} / {Math.ceil(totalPacks / 50)}
                </span>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage * 50 >= totalPacks}
                >
                  Вперёд
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'withdrawals' && (
          <>
            {withdrawals.length === 0 ? (
              <div className={styles.empty}>
                <h3>Нет заявок на вывод</h3>
                <p>Новые заявки появятся здесь</p>
              </div>
            ) : (
              <div className={styles.list}>
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className={styles.item}>
                    <div className={styles.itemBody}>
                      <h3 className={styles.itemTitle}>{withdrawal.amount} ₽</h3>
                      <div className={styles.itemMeta}>
                        <span>
                          <strong>@{withdrawal.hashtag || withdrawal.username}</strong>
                        </span>
                        <span>
                          {withdrawal.bank} · {withdrawal.phone}
                        </span>
                        <span>{new Date(withdrawal.created_at).toLocaleDateString('ru-RU')}</span>
                        <span className={`${styles.status} ${statusClass(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </div>
                    {withdrawal.status === 'pending' && (
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          onClick={() => handleProcessWithdrawal(withdrawal.id, 'approve')}
                          disabled={loading}
                        >
                          Одобрить
                        </button>
                        <button
                          type="button"
                          className={styles.btnDanger}
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
          </>
        )}

        {activeTab === 'reports' && (
          <>
            {reports.length === 0 ? (
              <div className={styles.empty}>
                <h3>Нет жалоб</h3>
                <p>Жалобы пользователей появятся здесь</p>
              </div>
            ) : (
              <div className={styles.list}>
                {reports.map((report) => (
                  <div key={report.id} className={styles.item}>
                    <div className={styles.itemBody}>
                      <h3 className={styles.itemTitle}>{report.reason.replace(/_/g, ' ')}</h3>
                      <div className={styles.itemMeta}>
                        <span>От: {report.reporter_name}</span>
                        {report.pack_title && <span>Пак: {report.pack_title}</span>}
                        {report.reported_user_name && <span>На: {report.reported_user_name}</span>}
                        <span>{new Date(report.created_at).toLocaleDateString('ru-RU')}</span>
                        <span className={`${styles.status} ${statusClass(report.status)}`}>{report.status}</span>
                      </div>
                      {report.description && <p className={styles.itemMeta}>{report.description}</p>}
                    </div>
                    {report.status === 'pending' && (
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.btnPrimary}
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
          </>
        )}

        {activeTab === 'stats' && (
          <>
            {stats ? (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>Общая статистика</h3>
                  <div className={styles.statItem}>
                    <span>Всего паков</span>
                    <span>{stats.general.total_packs}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Опубликовано</span>
                    <span>{stats.general.approved_packs}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Общий доход</span>
                    <span>{stats.general.total_revenue} ₽</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <h3>Неделя</h3>
                  <div className={styles.statItem}>
                    <span>Заказы</span>
                    <span>{stats.weekly.weekly_orders}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Доход</span>
                    <span>{stats.weekly.weekly_revenue} ₽</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Новые паки</span>
                    <span>{stats.weekly.weekly_packs}</span>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <h3>Топ продавцов</h3>
                  {(stats.top_sellers || []).map((seller: any, index: number) => (
                    <div key={index} className={styles.statItem}>
                      <span>@{seller.hashtag}</span>
                      <span>{seller.total_revenue} ₽</span>
                    </div>
                  ))}
                </div>

                <div className={styles.statCard}>
                  <h3>Топ паков</h3>
                  {(stats.top_packs || []).map((pack: any, index: number) => (
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
          </>
        )}
      </div>

      {selectedPack && (
        <div className={styles.modalOverlay} onClick={() => setSelectedPack(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedPack.title}</h2>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedPack(null)}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Автор</span>
                  <span className={styles.detailValue}>
                    @{selectedPack.hashtag} ({selectedPack.username})
                  </span>
                </div>
                {isAdmin && selectedPack.email && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{selectedPack.email}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Цена</span>
                  <span className={styles.detailValue}>{selectedPack.price} ₽</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Voice Tag</span>
                  <span className={styles.detailValue}>{selectedPack.voice_tag || 'Нет'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Описание</span>
                  <span className={styles.detailValue}>{selectedPack.description || 'Нет'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Создан</span>
                  <span className={styles.detailValue}>
                    {new Date(selectedPack.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>На платформе</span>
                  <span className={styles.detailValue}>
                    {selectedPack.user_created_at
                      ? new Date(selectedPack.user_created_at).toLocaleDateString('ru-RU')
                      : '—'}
                  </span>
                </div>
              </div>

              {selectedPack.loops && selectedPack.loops.length > 0 && (
                <div>
                  <h3 className={styles.sectionTitle}>Лупы · {selectedPack.loops.length}</h3>
                  <div className={styles.loopsList}>
                    {selectedPack.loops.map((loop: any) => (
                      <div key={loop.id} className={styles.loopItem}>
                        <span>{loop.title}</span>
                        <span>{loop.duration ? `${loop.duration}s` : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPack.user_stats && (
                <div>
                  <h3 className={styles.sectionTitle}>Статистика автора</h3>
                  <div className={styles.statsGridSmall}>
                    <div className={styles.statItem}>
                      <span>Всего паков</span>
                      <span>{selectedPack.user_stats.total_packs}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span>Опубликовано</span>
                      <span>{selectedPack.user_stats.approved_packs}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span>Продажи</span>
                      <span>{selectedPack.user_stats.total_sales}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedPack.reports && selectedPack.reports.length > 0 && (
                <div>
                  <h3 className={styles.sectionTitle}>Жалобы</h3>
                  {selectedPack.reports.map((report: any) => (
                    <div key={report.id} className={styles.reportMini}>
                      <p>
                        <strong>{report.reason}:</strong> {report.description}
                      </p>
                      <p>От: {report.reporter_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              {isAdmin && (
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => handleDeletePack(selectedPack.id)}
                  disabled={loading}
                >
                  Удалить пак
                </button>
              )}
              <button type="button" className={styles.btnGhost} onClick={() => setSelectedPack(null)}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShop;
