import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../utils/api'
import { subscriptionApi, type Subscription } from '../utils/subscriptionApi'
import LikedLoops from '../components/LikedLoops'
import LoopCard from '../components/LoopCard'
import ArtistSearch from '../components/ArtistSearch'
import type { LoopArtist } from '../utils/searchApi'
import './Profile.css'

interface UserLoop {
  id: number
  title: string
  filename: string
  original_name: string
  file_size: number
  duration: number | null
  bpm: number | null
  key: string | null
  genre: string | null
  tags: string[]
  created_at: string
  updated_at: string
  user_id: number
}

const Profile = () => {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const [userLoops, setUserLoops] = useState<UserLoop[]>([])
  const [isLoadingLoops, setIsLoadingLoops] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true)
  const [isAddingSubscription, setIsAddingSubscription] = useState(false)

  useEffect(() => {
    const fetchUserLoops = async () => {
      if (token) {
        try {
          setIsLoadingLoops(true)
          const response = await api.getUserLoops(token)
          setUserLoops(response.loops)
          console.log('User loops loaded:', response)
        } catch (error) {
          console.error('Error fetching user loops:', error)
        } finally {
          setIsLoadingLoops(false)
        }
      }
    }

    const fetchSubscriptions = async () => {
      try {
        setIsLoadingSubscriptions(true)
        const response = await subscriptionApi.getUserSubscriptions()
        setSubscriptions(response.subscriptions)
        console.log('User subscriptions loaded:', response)
      } catch (error) {
        console.error('Error fetching subscriptions:', error)
      } finally {
        setIsLoadingSubscriptions(false)
      }
    }

    fetchUserLoops()
    fetchSubscriptions()
  }, [token])

  const handleAddSubscription = async (artist: LoopArtist) => {
    try {
      setIsAddingSubscription(true)
      await subscriptionApi.addSubscription(artist.hashtag)
      
      // Обновляем список подписок
      const response = await subscriptionApi.getUserSubscriptions()
      setSubscriptions(response.subscriptions)
      console.log('Subscription added successfully:', artist)
    } catch (error) {
      console.error('Error adding subscription:', error)
      // Можно добавить уведомление об ошибке
    } finally {
      setIsAddingSubscription(false)
    }
  }

  const handleRemoveSubscription = async (subscriptionId: number) => {
    try {
      await subscriptionApi.removeSubscription(subscriptionId)
      
      // Обновляем список подписок
      const response = await subscriptionApi.getUserSubscriptions()
      setSubscriptions(response.subscriptions)
    } catch (error) {
      console.error('Error removing subscription:', error)
      alert(error instanceof Error ? error.message : 'Ошибка удаления подписки')
    }
  }

  const handleDeleteLoop = async (loopId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот луп?')) {
      return
    }

    try {
      await api.deleteLoop(loopId, token || '')
      
      // Обновляем список лупов
      if (token) {
        const response = await api.getUserLoops(token)
        setUserLoops(response.loops)
      }
    } catch (error) {
      console.error('Error deleting loop:', error)
      alert(error instanceof Error ? error.message : 'Ошибка удаления лупа')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="profile-page">
      {/* Профиль хедер */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-large">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{user.username}</h1>
            <p className="profile-email">{user.email}</p>
            <p className="profile-join-date">
              Присоединился {user.createdAt ? formatDate(user.createdAt) : 'недавно'}
            </p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="profile-content">
        {/* Левая колонка */}
        <div>
          {/* Ваши лупы */}
          <div className="profile-section">
            <h2 className="profile-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              Ваши лупы
            </h2>
            {isLoadingLoops ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <p>Загрузка...</p>
              </div>
            ) : userLoops.length > 0 ? (
              <div className="loops-grid">
                {userLoops.map((loop) => (
                  <LoopCard
                    key={loop.id}
                    loop={{
                      ...loop,
                      author: user?.username || 'Unknown',
                      user_id: user?.id || 0,
                      created_at: loop.created_at || new Date().toISOString(),
                      tags: loop.tags || []
                    }}
                    currentUserId={user?.id}
                    onDelete={handleDeleteLoop}
                    showLike={true}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <p>У вас пока нет лупов</p>
              </div>
            )}
          </div>

          {/* Подписки на артистов */}
          <div className="profile-section">
            <h2 className="profile-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="m22 21-3-3 3-3"></path>
              </svg>
              Подписки на артистов
            </h2>
            
            {/* Форма добавления подписки */}
            <ArtistSearch 
              onSelect={handleAddSubscription}
              disabled={isAddingSubscription}
              placeholder="Введите имя или хештег артиста..."
            />

            {/* Список подписок */}
            {isLoadingSubscriptions ? (
              <div className="empty-state">
                <p>Загрузка подписок...</p>
              </div>
            ) : subscriptions.length > 0 ? (
              <div className="subscriptions-list">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="subscription-item">
                    <div className="subscription-info">
                      <span className="subscription-hashtag">#{subscription.artist_hashtag}</span>
                      <span className="subscription-date">
                        Подписан {new Date(subscription.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveSubscription(subscription.id)}
                      className="subscription-remove-button"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <p>У вас пока нет подписок</p>
                <p>Подпишитесь на артистов, чтобы видеть их лупы</p>
              </div>
            )}
          </div>

          {/* Понравившиеся лупы */}
          <div className="profile-section">
            <h2 className="profile-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Ваши избранные
            </h2>
            <LikedLoops limit={3} showAllButton={false} />
          </div>
        </div>

        {/* Правая колонка */}
        <div>
          {/* Кнопка выхода */}
          <div className="profile-section">
            <h2 className="profile-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Управление
            </h2>
            <div className="action-buttons">
              <button className="btn btn-danger" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
