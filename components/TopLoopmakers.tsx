import React, { useState, useEffect } from 'react';
import { topUsersApi, type TopUser } from '../utils/topUsersApi';
import './TopLoopmakers.css';

interface TopLoopmakersProps {
  limit?: number;
}

const TopLoopmakers: React.FC<TopLoopmakersProps> = ({ limit = 6 }) => {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        setIsLoading(true);
        const response = await topUsersApi.getTopUsers(limit);
        setUsers(response.users);
        setError(null);
      } catch (err) {
        console.error('Error fetching top users:', err);
        setError('Ошибка загрузки топ лупмейкеров');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopUsers();
  }, [limit]);

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'сегодня';
    if (diffDays === 2) return 'вчера';
    if (diffDays <= 7) return `${diffDays} дней назад`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} недель назад`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} месяцев назад`;
    return `${Math.floor(diffDays / 365)} лет назад`;
  };

  if (isLoading) {
    return (
      <div className="top-loopmakers-loading">
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="top-user-card skeleton">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-info"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-loopmakers-error">
        <p>{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="top-loopmakers-empty">
        <p>Пока нет лупмейкеров</p>
      </div>
    );
  }

  return (
    <div className="top-loopmakers">
      <div className="top-users-grid">
        {users.map((user, index) => (
          <div
            key={user.id}
            className="top-user-card"
            onClick={() => window.location.href = `/user/${user.id}`}
          >
            <div className="top-user-rank">
              <span className="rank-number">#{index + 1}</span>
            </div>
            
            <div className="top-user-avatar">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials(user.username)}
                </div>
              )}
            </div>
            
            <div className="top-user-info">
              <h3 className="top-user-name">{user.username}</h3>
              <p className="top-user-hashtag">@{user.hashtag || user.username}</p>
              <p className="top-user-joined">Присоединился {formatDate(user.created_at)}</p>
            </div>
            
            <div className="top-user-stats">
              <div className="stat-item">
                <span className="stat-value">{user.loops_count}</span>
                <span className="stat-label">лупов</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{user.total_likes}</span>
                <span className="stat-label">лайков</span>
              </div>
            </div>
            
            <div className="top-user-rating">
              <div className="rating-stars">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`star ${i < Math.floor(user.avg_rating || 0) ? 'filled' : ''}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
              <span className="rating-value">{(user.avg_rating || 0).toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopLoopmakers;
