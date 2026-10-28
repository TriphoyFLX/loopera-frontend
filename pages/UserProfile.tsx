import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { chatApi } from '../utils/chatApi';
import { likeApi } from '../utils/likeApi';
import { followsApi } from '../utils/followsApi';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import { useI18n } from '../i18n/useI18n';
import { getAssetUrl } from '../utils/urls';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import { profilePath } from '../utils/routes';
import { buildShareUrl } from '../utils/share';
import { normalizePlanSlug, planDisplayName } from '../utils/plans';
import VerifiedBadge from '../components/VerifiedBadge';
import LoopCard from '../components/LoopCard';
import ShareButton from '../components/ShareButton';
import './UserProfile.css';

interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  created_at: string;
  avatar_url?: string | null;
  hashtag?: string | null;
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
  cover_url?: string | null;
  user_id: number;
  author?: string;
  created_at: string;
}

const UserProfile: React.FC = () => {
  const { t } = useI18n();
  const { nickname } = useParams<{ nickname: string }>();
  const navigate = useNavigate();
  const { token, user: currentUser, logout, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const player = useLoopPlayerOptional();
  const [user, setUser] = useState<User | null>(null);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [likedLoops, setLikedLoops] = useState<Loop[]>([]);
  const [activeTab, setActiveTab] = useState<'loops' | 'liked'>('loops');
  const [loading, setLoading] = useState(true);
  const [likedLoading, setLikedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorPlan, setAuthorPlan] = useState('free');
  const [authorBadge, setAuthorBadge] = useState<'none' | 'basic' | 'pro' | 'business'>('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [profileTheme, setProfileTheme] = useState<{
    accent_color?: string;
    banner_url?: string;
    layout?: string;
    bio?: string;
    show_stats?: boolean;
    featured_loop_id?: number | null;
  }>({});

  const isOwnProfile = Boolean(
    currentUser && user && Number(currentUser.id) === Number(user.id),
  );

  const handleStartChat = async () => {
    try {
      console.log('handleStartChat called');
      if (!currentUser) {
        console.error('User not authenticated');
        return;
      }

      const targetUserId = nickname || currentUser?.username;
      console.log('targetUserId:', targetUserId);
      if (!targetUserId) {
        console.error('No user ID available');
        return;
      }

      // Сначала получаем ID пользователя из API (если targetUserId это username)
      console.log('Fetching user info for:', targetUserId);
      const userResponse = await fetch(`/api/chats/user/${targetUserId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      console.log('User response status:', userResponse.status);
      if (!userResponse.ok) {
        throw new Error(t('userProfilePage.userNotFound'));
      }
      
      const userData = await userResponse.json();
      console.log('User data:', userData);
      const actualUserId = userData.user.id;
      console.log('Actual user ID:', actualUserId);

      // Создаем или получаем существующий чат
      console.log('Creating chat with user ID:', actualUserId);
      await chatApi.createOrGetChat(actualUserId);
      console.log('Chat created successfully');
      
      // Переходим к чатам
      navigate('/chats');
    } catch (error) {
      console.error('Error creating chat:', error);
      // Можно показать ошибку пользователю
    }
  };

  const handlePlay = (loop: Loop) => {
    const queue = activeTab === 'liked' ? likedLoops : loops;
    player?.play(loop, queue);
  };

  const handleDeleteLoop = async (loopId: number) => {
    if (!token || !window.confirm(t('profilePage.deleteLoopConfirm'))) {
      return;
    }
    try {
      await api.deleteLoop(loopId, token);
      setLoops((prev) => prev.filter((l) => l.id !== loopId));
      if (Number(profileTheme.featured_loop_id) === Number(loopId)) {
        setProfileTheme((prev) => ({ ...prev, featured_loop_id: null }));
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : t('profilePage.deleteLoopError'));
    }
  };

  const handlePinLoop = async (loopId: number) => {
    if (!token) return;
    const currentlyPinned = Number(profileTheme.featured_loop_id) === Number(loopId);
    const nextId = currentlyPinned ? null : loopId;
    try {
      const result = await api.updateProfileTheme({ featured_loop_id: nextId }, token);
      setProfileTheme((result.profile_theme || { ...profileTheme, featured_loop_id: nextId }) as typeof profileTheme);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Не удалось закрепить луп');
    }
  };

  const sortedLoops = [...loops].sort((a, b) => {
    const pinned = Number(profileTheme.featured_loop_id);
    if (!Number.isFinite(pinned)) return 0;
    if (Number(a.id) === pinned) return -1;
    if (Number(b.id) === pinned) return 1;
    return 0;
  });

  useEffect(() => {
    const targetUserId = nickname || currentUser?.username;
    if (targetUserId) {
      fetchUserProfile(targetUserId);
      fetchUserLoops(targetUserId);
    }
  }, [nickname, currentUser]);

  useEffect(() => {
    if (user?.username && nickname && /^\d+$/.test(nickname)) {
      navigate(profilePath(user.username), { replace: true });
    }
  }, [user, nickname, navigate]);

  useEffect(() => {
    if (activeTab === 'liked' && currentUser) {
      fetchLikedLoops();
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (!user?.username) return;
    let cancelled = false;
    const loadFollow = async () => {
      try {
        const status = await followsApi.getStatus(user.username);
        if (cancelled) return;
        setIsFollowing(Boolean(status.following));
        setFollowersCount(status.followers_count || 0);
        setFollowingCount(status.following_count || 0);
      } catch {
        if (!cancelled) {
          setIsFollowing(false);
        }
      }
    };
    void loadFollow();
    return () => {
      cancelled = true;
    };
  }, [user?.username, isAuthenticated]);

  const handleToggleFollow = () => {
    if (!user) return;
    requireAuth(async () => {
      if (followBusy || isOwnProfile) return;
      setFollowBusy(true);
      try {
        const result = isFollowing
          ? await followsApi.unfollow(user.username)
          : await followsApi.follow(user.username);
        setIsFollowing(Boolean(result.following));
        setFollowersCount(result.followers_count || 0);
        setFollowingCount(result.following_count || 0);
      } catch (err) {
        console.error('Follow toggle failed:', err);
        alert(err instanceof Error ? err.message : 'Не удалось обновить подписку');
      } finally {
        setFollowBusy(false);
      }
    }, 'default');
  };

  const fetchUserProfile = async (targetUserId: string) => {
    try {
      // Используем API для получения информации о пользователе
      const response = await fetch(`/api/chats/user/${targetUserId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(t('userProfilePage.userNotFound'));
      }
      
      const data = await response.json();
      setUser(data.user);
      try {
        const planData = await api.getAuthorPlan(data.user.id);
        setAuthorPlan(normalizePlanSlug(planData.plan_slug || 'free'));
        const badge = String(planData.badge || 'none').toLowerCase();
        setAuthorBadge(
          badge === 'elite' || badge === 'business'
            ? 'business'
            : badge === 'basic' || badge === 'pro'
              ? badge
              : 'none',
        );
        setProfileTheme((planData.profile_theme || {}) as typeof profileTheme);
      } catch {
        /* ignore plan fetch errors */
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : t('userProfilePage.loadProfileError'));
    }
  };

  const fetchUserLoops = async (targetUserId: string) => {
    try {
      setLoading(true);
      setError(null);

      const userResponse = await fetch(`/api/chats/user/${targetUserId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!userResponse.ok) {
        throw new Error(t('userProfilePage.userNotFound'));
      }

      const userData = await userResponse.json();
      const userId = userData.user.id;

      const response = await api.getLoopsByUser(userId, 1, 100, token || undefined);
      setLoops(response.loops || []);
    } catch (err) {
      console.error('Error fetching user loops:', err);
      setError(err instanceof Error ? err.message : t('userProfilePage.loadLoopsError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedLoops = async () => {
    try {
      setLikedLoading(true);
      const response = await likeApi.getLikedLoops(1, 100);
      setLikedLoops(response.loops as Loop[]);
    } catch (err) {
      console.error('Error fetching liked loops:', err);
    } finally {
      setLikedLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-header">
          <div className="user-profile-header-content">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>{t('userProfilePage.loadingProfile')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-header">
          <div className="user-profile-header-content">
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={() => window.location.reload()} className="retry-button">
                🔄 {t('userProfilePage.retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-profile-page">
        <div className="user-profile-header">
          <div className="user-profile-header-content">
            <div className="not-found">
              <h2>👤 {t('userProfilePage.notFound')}</h2>
              <p>{t('userProfilePage.notFoundDesc', { name: nickname ?? '' })}</p>
              <button onClick={() => navigate('/loops')} className="user-profile-button secondary">
                {t('userProfilePage.backToLoops')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'user-profile-page',
        authorPlan === 'business' ? 'user-profile-page--elite' : '',
        authorPlan === 'pro' || authorPlan === 'basic' ? 'user-profile-page--pro' : '',
        profileTheme.layout === 'cinematic' ? 'layout-cinematic' : '',
        profileTheme.layout === 'glass' ? 'layout-glass' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        profileTheme.accent_color
          ? ({ ['--profile-accent' as string]: profileTheme.accent_color } as React.CSSProperties)
          : undefined
      }
    >
      <div
        className="user-profile-header"
        style={
          profileTheme.banner_url
            ? {
                backgroundImage: `url(${profileTheme.banner_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="user-profile-header-content">
          <div
            className="user-profile-avatar"
            style={
              user.avatar_url
                ? { backgroundImage: `url(${getAssetUrl(user.avatar_url)})` }
                : {
                    backgroundColor:
                      LOOP_COVER_COLORS[Math.abs(user.id) % LOOP_COVER_COLORS.length],
                  }
            }
          >
            {!user.avatar_url &&
              (user.first_name
                ? user.first_name[0].toUpperCase()
                : user.username[0].toUpperCase())}
          </div>
          <div className="user-profile-info">
            <div className="user-profile-name-row">
              <h1 className="user-profile-name">{user.username}</h1>
              {authorBadge !== 'none' && (
                <VerifiedBadge plan={authorBadge} title={planDisplayName(authorBadge)} />
              )}
            </div>
            {profileTheme.bio && <p className="user-profile-bio">{profileTheme.bio}</p>}
            {(profileTheme.show_stats !== false) && (
            <div className="user-profile-stats">
              <div className="user-profile-stat">
                <div className="user-profile-stat-value">{loops.length}</div>
                <div className="user-profile-stat-label">{t('userProfilePage.loopsStat')}</div>
              </div>
              <div className="user-profile-stat">
                <div className="user-profile-stat-value">{followersCount}</div>
                <div className="user-profile-stat-label">{t('userProfilePage.followersStat')}</div>
              </div>
              <div className="user-profile-stat">
                <div className="user-profile-stat-value">{followingCount}</div>
                <div className="user-profile-stat-label">{t('userProfilePage.followingStat')}</div>
              </div>
            </div>
            )}
            <div className="user-profile-join-date">
              {t('userProfilePage.onPlatformSince', {
                date: new Date(user.created_at).toLocaleDateString('ru-RU'),
              })}
            </div>
            
            <div className="user-profile-actions">
              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followBusy}
                  className={`user-profile-button ${isFollowing ? 'secondary following' : 'primary'}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isFollowing ? (
                      <path d="M20 6L9 17l-5-5" />
                    ) : (
                      <>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </>
                    )}
                  </svg>
                  {isFollowing
                    ? t('userProfilePage.unsubscribe')
                    : t('userProfilePage.subscribe')}
                </button>
              )}
              <ShareButton
                title={t('userProfilePage.shareTitle', { name: user.username })}
                text={t('userProfilePage.shareText', { name: user.username })}
                url={buildShareUrl(profilePath(user.username))}
              />
              {!isOwnProfile && (
                <button onClick={handleStartChat} className="user-profile-button secondary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  {t('userProfilePage.startChat')}
                </button>
              )}
              <button onClick={() => navigate('/loops')} className="user-profile-button secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
                {t('userProfilePage.allLoops')}
              </button>
              {isOwnProfile && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="user-profile-button primary"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    {t('userProfilePage.settings')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="user-profile-button"
                    style={{ background: 'rgba(220, 38, 38, 0.2)', borderColor: 'rgba(220, 38, 38, 0.3)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    {t('userProfilePage.logout')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="user-profile-content">
        <div className="user-profile-tabs">
          <button 
            className={`user-profile-tab ${activeTab === 'loops' ? 'active' : ''}`}
            onClick={() => setActiveTab('loops')}
          >
            {t('userProfilePage.tabLoops', { count: loops.length })}
          </button>
          {currentUser && user && currentUser.id === user.id && (
            <button 
              className={`user-profile-tab ${activeTab === 'liked' ? 'active' : ''}`}
              onClick={() => setActiveTab('liked')}
            >
              {t('userProfilePage.tabLiked', { count: likedLoops.length })}
            </button>
          )}
        </div>

        {activeTab === 'loops' ? (
          <div className="user-loops-section">
            <div className="user-loops-header">
              <h2 className="user-loops-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
                {t('userProfilePage.userLoopsTitle', { name: user.username })}
              </h2>
              <div className="user-loops-count">{t('userProfilePage.loopsCount', { count: loops.length })}</div>
            </div>
            
            {loops.length === 0 ? (
              <div className="user-loops-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <h3>{t('userProfilePage.noLoops')}</h3>
                <p>{t('userProfilePage.noLoopsHint')}</p>
              </div>
            ) : (
              <div className="user-loops-grid">
                {sortedLoops.map((loop) => (
                  <LoopCard
                    key={loop.id}
                    loop={{
                      ...loop,
                      author: user?.username || 'Unknown',
                      created_at: loop.created_at,
                      tags: loop.tags || []
                    }}
                    currentUserId={currentUser?.id}
                    onPlay={handlePlay}
                    onDelete={isOwnProfile ? handleDeleteLoop : undefined}
                    onPin={isOwnProfile ? handlePinLoop : undefined}
                    isPinned={Number(profileTheme.featured_loop_id) === Number(loop.id)}
                    queue={sortedLoops}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="user-loops-section">
            <div className="user-loops-header">
              <h2 className="user-loops-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {t('userProfilePage.likedTitle')}
              </h2>
              <div className="user-loops-count">{t('userProfilePage.loopsCount', { count: likedLoops.length })}</div>
            </div>
            
            {likedLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>{t('userProfilePage.loading')}</p>
              </div>
            ) : likedLoops.length === 0 ? (
              <div className="user-loops-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <h3>{t('userProfilePage.noLiked')}</h3>
                <p>{t('userProfilePage.noLikedHint')}</p>
              </div>
            ) : (
              <div className="user-loops-grid">
                {likedLoops.map((loop) => (
                  <LoopCard
                    key={loop.id}
                    loop={{
                      ...loop,
                      author: loop.author || 'Unknown',
                      created_at: loop.created_at,
                      tags: loop.tags || []
                    }}
                    currentUserId={currentUser?.id}
                    onPlay={handlePlay}
                    queue={likedLoops}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
