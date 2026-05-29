import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../utils/api'
import { subscriptionApi, type Subscription } from '../utils/subscriptionApi'
import LikedLoops from '../components/LikedLoops'
import LoopCard from '../components/LoopCard'
import ArtistSearch from '../components/ArtistSearch'
import Modal from '../components/Modal'
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
  const [balance, setBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('RUB')
  const [purchasedPacks, setPurchasedPacks] = useState<any[]>([])
  const [isLoadingPacks, setIsLoadingPacks] = useState(true)
  const [createdPacks, setCreatedPacks] = useState<any[]>([])
  const [isLoadingCreatedPacks, setIsLoadingCreatedPacks] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState('')

  const handleTopUp = () => {
    const amount = parseInt(topUpAmount)
    if (!amount || amount < 200) {
      setModalMessage('Минимальная сумма пополнения: 200 коинов')
      setModalOpen(true)
      return
    }

    const message = `Здравствуйте! Хочу пополнить баланс на loopera на ${amount} коинов. Валюта: ${selectedCurrency}. Мой никнейм: ${user?.username || 'не указан'}. Ожидаю реквизиты.`
    const telegramUrl = `https://t.me/triphoyprod?text=${encodeURIComponent(message)}`
    window.open(telegramUrl, '_blank')
    setShowTopUpModal(false)
    setTopUpAmount('')
  }

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount)
    if (!amount || amount < 1000) {
      setModalMessage('Минимальная сумма вывода: 1000 коинов')
      setModalOpen(true)
      return
    }

    if (amount > balance) {
      setModalMessage('Недостаточно средств на балансе')
      setModalOpen(true)
      return
    }

    const commission = Math.round(amount * 0.2) // 20% commission
    const netAmount = amount - commission

    const message = `Здравствуйте! Хочу вывести ${amount} коинов с loopera (${netAmount} коинов после вычета 20% комиссии = ${commission} коинов). Валюта: ${selectedCurrency}. Мой никнейм: ${user?.username || 'не указан'}. Требуется видео: зайдите на профиль, покажите баланс, обновите страницу.`
    const telegramUrl = `https://t.me/triphoyprod?text=${encodeURIComponent(message)}`
    window.open(telegramUrl, '_blank')
    setShowWithdrawModal(false)
    setWithdrawAmount('')
  }

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

    const fetchBalance = async () => {
      if (token) {
        try {
          setIsLoadingBalance(true)
          const response = await fetch('https://loopera-lpr.vercel.app/api/shop/balance/my', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setBalance(data.available_balance || 0)
        } catch (error) {
          console.error('Error fetching balance:', error)
        } finally {
          setIsLoadingBalance(false)
        }
      }
    }

    const fetchPurchasedPacks = async () => {
      if (token) {
        try {
          setIsLoadingPacks(true)
          const response = await fetch('https://loopera-lpr.vercel.app/api/shop/my/packs', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setPurchasedPacks(data.packs || [])
        } catch (error) {
          console.error('Error fetching purchased packs:', error)
        } finally {
          setIsLoadingPacks(false)
        }
      }
    }

    const fetchCreatedPacks = async () => {
      if (token) {
        try {
          setIsLoadingCreatedPacks(true)
          const response = await fetch('https://loopera-lpr.vercel.app/api/shop/my/created-packs', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          console.log('Created packs response status:', response.status);
          const data = await response.json()
          console.log('Created packs data:', data);
          setCreatedPacks(data.packs || [])
        } catch (error) {
          console.error('Error fetching created packs:', error)
        } finally {
          setIsLoadingCreatedPacks(false)
        }
      }
    }

    const fetchTransactionHistory = async () => {
      if (token) {
        try {
          setIsLoadingTransactions(true)
          const response = await fetch('https://loopera-lpr.vercel.app/api/shop/history', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          setTransactions(data.transactions || [])
        } catch (error) {
          console.error('Error fetching transaction history:', error)
        } finally {
          setIsLoadingTransactions(false)
        }
      }
    }

    fetchUserLoops()
    fetchSubscriptions()
    fetchBalance()
    fetchPurchasedPacks()
    fetchCreatedPacks()
    fetchTransactionHistory()
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
      setModalMessage(error instanceof Error ? error.message : 'Ошибка удаления подписки')
      setModalOpen(true)
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
      setModalMessage(error instanceof Error ? error.message : 'Ошибка удаления лупа')
      setModalOpen(true)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const handleDownloadPack = async (packId: number) => {
    try {
      const response = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download pack')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pack-${packId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      setModalMessage('Ошибка скачивания пака')
      setModalOpen(true)
    }
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
    <>
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
            <div className="profile-balance">
              <span className="balance-icon">💎</span>
              <span className="balance-amount">{isLoadingBalance ? '...' : balance.toLocaleString()} coins</span>
              <button className="deposit-button" onClick={() => setShowTopUpModal(true)}>
                Пополнить
              </button>
              <button className="withdraw-button" onClick={() => setShowWithdrawModal(true)}>
                Вывести
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top-up modal */}
      {showTopUpModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-large">
            <h2>💎 Пополнить баланс</h2>
            <div className="modal-conditions">
              <h3>Условия пополнения:</h3>
              <ul>
                <li>1 коин = 1 единица выбранной валюты (рубль/доллар/евро/фунт)</li>
                <li>Минимальная сумма пополнения: 1 коин</li>
                <li>После нажатия "Хочу пополнить" вы будете перенаправлены в Telegram</li>
                <li>Администратор предоставит реквизиты для оплаты</li>
                <li>После оплаты администратор начислит коины на ваш баланс</li>
                <li>Пополнение происходит вручную, обычно в течение 24 часов</li>
              </ul>
              <p className="modal-note">⚠️ Пожалуйста, указывайте корректную сумму. После отправки заявки изменить её будет невозможно.</p>
            </div>
            <div className="currency-selector">
              <label>Выберите валюту:</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                <option value="RUB">🇷🇺 Российский рубль (RUB)</option>
                <option value="USD">🇺🇸 Доллар США (USD)</option>
                <option value="EUR">🇪🇺 Евро (EUR)</option>
                <option value="GBP">🇬🇧 Британский фунт (GBP)</option>
              </select>
            </div>
            <input
              type="number"
              min="1"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Сумма в коинах"
            />
            {topUpAmount && parseInt(topUpAmount) > 0 && (
              <div className="commission-info">
                <p>К оплате: {parseInt(topUpAmount)} {selectedCurrency}</p>
              </div>
            )}
            <div className="modal-buttons">
              <button onClick={handleTopUp}>Хочу пополнить на {topUpAmount || '0'} коинов</button>
              <button onClick={() => setShowTopUpModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {showWithdrawModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-large">
            <h2>💸 Вывести средства</h2>
            <div className="modal-conditions">
              <h3>Условия вывода:</h3>
              <ul>
                <li>1 коин = 1 единица выбранной валюты (рубль/доллар/евро/фунт)</li>
                <li>Минимальная сумма вывода: 1 коин</li>
                <li>Комиссия за вывод: 20%</li>
                <li>После нажатия "Хочу вывести" вы будете перенаправлены в Telegram</li>
                <li>Администратор запросит реквизиты для вывода</li>
                <li>После проверки администратор отправит средства за вычетом комиссии</li>
                <li>Вывод происходит вручную, обычно в течение 24-48 часов</li>
              </ul>
              <p className="modal-note">⚠️ Пожалуйста, указывайте корректную сумму. После отправки заявки изменить её будет невозможно.</p>
            </div>
            <div className="currency-selector">
              <label>Выберите валюту:</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                <option value="RUB">🇷🇺 Российский рубль (RUB)</option>
                <option value="USD">🇺🇸 Доллар США (USD)</option>
                <option value="EUR">🇪🇺 Евро (EUR)</option>
                <option value="GBP">🇬🇧 Британский фунт (GBP)</option>
              </select>
            </div>
            <input
              type="number"
              min="1"
              max={balance}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Сумма в коинах"
            />
            {withdrawAmount && parseInt(withdrawAmount) > 0 && (
              <div className="commission-info">
                <p>Комиссия (20%): {Math.round(parseInt(withdrawAmount) * 0.2)} коинов</p>
                <p>К получению: {parseInt(withdrawAmount) - Math.round(parseInt(withdrawAmount) * 0.2)} коинов = {parseInt(withdrawAmount) - Math.round(parseInt(withdrawAmount) * 0.2)} {selectedCurrency}</p>
              </div>
            )}
            <div className="modal-buttons">
              <button onClick={handleWithdraw}>Хочу вывести {withdrawAmount || '0'} коинов</button>
              <button onClick={() => setShowWithdrawModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

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

          {/* Купленные паки */}
          <div id="purchases" className="profile-section">
            <h2 className="profile-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              Покупки
            </h2>
            {isLoadingPacks ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <p>Загрузка...</p>
              </div>
            ) : purchasedPacks.length > 0 ? (
              <div className="purchased-packs-list">
                {purchasedPacks.map((pack) => (
                  <div key={pack.id} className="purchased-pack-item">
                    <div className="pack-info">
                      <h3>{pack.title}</h3>
                      <p>{pack.description}</p>
                      <p className="pack-price">{pack.price} coins</p>
                      <p className="pack-seller">Продавец: {pack.seller_username || 'Неизвестно'}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadPack(pack.id)}
                      className="download-button"
                    >
                      Скачать
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <p>У вас пока нет покупок</p>
              </div>
            )}
          </div>

          {/* Ваши паки */}
          <div className="profile-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="profile-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                Ваши паки
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => navigate('/create-pack')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Создать пак
                </button>
                <button
                  onClick={() => navigate('/shop')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Перейти в магазин
                </button>
              </div>
            </div>
            {isLoadingCreatedPacks ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <p>Загрузка...</p>
              </div>
            ) : createdPacks.length > 0 ? (
              <div className="purchased-packs-list">
                {createdPacks.map((pack) => (
                  <div key={pack.id} className="purchased-pack-item">
                    <div className="pack-info">
                      <h3>{pack.title}</h3>
                      <p>{pack.description}</p>
                      <p className="pack-price">{pack.price} coins</p>
                      <p className="purchase-count">{pack.purchase_count || 0} покупок</p>
                    </div>
                    <span className={`pack-status pack-status-${pack.status}`}>
                      {pack.status === 'approved' ? 'Одобрено' : pack.status === 'pending' ? 'На модерации' : 'Отклонено'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <p>У вас пока нет созданных паков</p>
              </div>
            )}
          </div>

          {/* История транзакций */}
          <div className="profile-section">
            <h2 className="profile-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              История продаж
            </h2>
            {isLoadingTransactions ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <p>Загрузка...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="transactions-list">
                {transactions.map((tx) => (
                  <div key={tx.invoice_id} className="transaction-item">
                    <div className="transaction-info">
                      <span className={`transaction-type transaction-type-${tx.type}`}>
                        {tx.type === 'purchase' && '🛒 Покупка'}
                        {tx.type === 'sale' && '💰 Продажа'}
                        {tx.type === 'topup' && '⬆️ Пополнение'}
                        {tx.type === 'withdrawal' && '⬇️ Вывод'}
                      </span>
                      <span className="transaction-description">{tx.description}</span>
                      <span className="transaction-date">
                        {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <span className={`transaction-amount ${tx.type === 'purchase' || tx.type === 'withdrawal' ? 'negative' : 'positive'}`}>
                      {tx.type === 'purchase' || tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} {tx.currency}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <p>У вас пока нет транзакций</p>
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

    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Уведомление">
      <p>{modalMessage}</p>
    </Modal>
    </>
  )
}

export default Profile
