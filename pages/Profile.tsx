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
import styles from './Profile.module.css'

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
  const [withdrawMethod, setWithdrawMethod] = useState('sbp')
  const [purchasedPacks, setPurchasedPacks] = useState<any[]>([])
  const [isLoadingPacks, setIsLoadingPacks] = useState(true)
  const [createdPacks, setCreatedPacks] = useState<any[]>([])
  const [isLoadingCreatedPacks, setIsLoadingCreatedPacks] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [selectedPackForRating, setSelectedPackForRating] = useState<any>(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState('')

  const handleTopUp = () => {
    const amount = parseInt(topUpAmount)
    if (!amount || amount < 200) {
      setModalMessage('Минимальная сумма пополнения: 200 коинов')
      setModalOpen(true)
      return
    }

    const platformCommission = Math.round(amount * 0.03) // 3% платформа
    const totalAmount = amount + platformCommission

    const message = `Здравствуйте! Хочу пополнить баланс на loopera на ${amount} коинов (с учетом 3% комиссии платформы = ${platformCommission} коинов, к оплате ${totalAmount} ${selectedCurrency}). Валюта: ${selectedCurrency}. Мой никнейм: ${user?.username || 'не указан'}. Ожидаю реквизиты.`
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

    // Расчет комиссии: 15% платформа + метод%
    const platformCommission = Math.round(amount * 0.15) // 15% платформа
    let methodCommission = 0
    let methodName = ''
    switch (withdrawMethod) {
      case 'paypal':
        methodCommission = Math.round(amount * 0.05) // 5% PayPal
        methodName = 'PayPal'
        break
      case 'card':
        methodCommission = Math.round(amount * 0.02) // 2% Карта
        methodName = 'Банковская карта РФ'
        break
      case 'sbp':
      default:
        methodCommission = 0 // 0% СБП
        methodName = 'СБП'
        break
    }
    const commission = platformCommission + methodCommission

    const netAmount = amount - commission

    const message = `Здравствуйте! Хочу вывести ${amount} коинов с loopera через ${methodName} (${netAmount} коинов после вычета комиссии = ${commission} коинов). Валюта: ${selectedCurrency}. Мой никнейм: ${user?.username || 'не указан'}. Требуется видео: зайдите на профиль, покажите баланс, обновите страницу.`
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
          const data = await api.getUserBalance(token)
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
          const data = await api.getUserPurchasedPacks(token)
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
          const data = await api.getUserCreatedPacks(token)
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
          const data = await api.getTransactionHistory(token)
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

  const handleRatePack = (pack: any) => {
    setSelectedPackForRating(pack)
    setSelectedRating(0)
    setRatingModalOpen(true)
  }

  const handleConfirmRating = async () => {
    if (selectedRating === 0) {
      setModalMessage('Пожалуйста, выберите оценку')
      setModalOpen(true)
      return
    }

    try {
      const response = await fetch(`https://loopera-lpr.vercel.app/api/shop/${selectedPackForRating.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: selectedRating })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to rate pack')
      }
      setRatingModalOpen(false)
      setSelectedPackForRating(null)
      setSelectedRating(0)
      setModalMessage('Спасибо за вашу оценку!')
      setModalOpen(true)
    } catch (err: any) {
      console.error('Error rating pack:', err)
      setModalMessage(err.message || 'Не удалось оценить пак')
      setModalOpen(true)
    }
  }

  const handleDeletePack = async (packId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот пак? Это действие нельзя отменить.')) {
      return
    }

    try {
      const response = await fetch(`https://loopera-lpr.vercel.app/api/shop/${packId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete pack')
      }

      setModalMessage('Пак успешно удален')
      setModalOpen(true)

      // Обновляем список созданных паков
      if (token) {
        const data = await api.getUserCreatedPacks(token)
        setCreatedPacks(data.packs || [])
      }
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : 'Ошибка удаления пака')
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
      <div className={styles.profileContainer}>
        {/* Профиль хедер */}
        <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.avatar}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className={styles.info}>
            <h1 className={styles.username}>{user.username}</h1>
            <p className={styles.email}>{user.email}</p>
            <p className={styles.joinDate}>
              Присоединился {user.createdAt ? formatDate(user.createdAt) : 'недавно'}
            </p>
            <div className={styles.balanceSection}>
              <div className={styles.balance}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span className={styles.balanceAmount}>{isLoadingBalance ? '...' : balance.toLocaleString()}</span>
              </div>
              <button className={styles.actionBtn} onClick={() => setShowTopUpModal(true)}>
                Пополнить
              </button>
              <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => setShowWithdrawModal(true)}>
                Вывести
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top-up modal */}
      {showTopUpModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalScrollContent}>
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Пополнить баланс
              </h2>
              <div className={styles.modalConditions}>
                <h3>Условия пополнения:</h3>
                <ul>
                  <li>1 коин = 1 единица выбранной валюты (рубль/доллар/евро/фунт)</li>
                  <li>Минимальная сумма пополнения: 200 коинов</li>
                  <li>После нажатия "Хочу пополнить" вы будете перенаправлены в Telegram</li>
                  <li>Администратор предоставит реквизиты для оплаты</li>
                  <li>После оплаты администратор начислит коины на ваш баланс</li>
                  <li>Пополнение происходит вручную, обычно в течение 24 часов</li>
                </ul>
                <p className={styles.modalNote}>Пожалуйста, указывайте корректную сумму. После отправки заявки изменить её будет невозможно.</p>
              </div>
              <div className={styles.currencySelector}>
                <label>Выберите валюту:</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="RUB">Российский рубль (RUB)</option>
                  <option value="USD">Доллар США (USD)</option>
                  <option value="EUR">Евро (EUR)</option>
                  <option value="GBP">Британский фунт (GBP)</option>
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
                <div className={styles.commissionInfo}>
                  {(() => {
                    const amount = parseInt(topUpAmount)
                    const platformCommission = Math.round(amount * 0.03) // 3% платформа
                    const totalAmount = amount + platformCommission
                    return (
                      <>
                        <p>Сумма пополнения: {amount} коинов</p>
                        <p>Комиссия платформы (3%): {platformCommission} коинов</p>
                        <p>К оплате: {totalAmount} {selectedCurrency}</p>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
            <div className={styles.modalButtons}>
              <button onClick={handleTopUp}>Хочу пополнить на {topUpAmount || '0'} коинов</button>
              <button onClick={() => setShowTopUpModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      {showWithdrawModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalScrollContent}>
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Вывести средства
              </h2>
              <div className={styles.modalConditions}>
                <h3>Условия вывода:</h3>
                <ul>
                  <li>1 коин = 1 единица выбранной валюты (рубль/доллар/евро/фунт)</li>
                  <li>Минимальная сумма вывода: 1000 коинов</li>
                  <li>Комиссия зависит от метода вывода</li>
                  <li>После нажатия "Хочу вывести" вы будете перенаправлены в Telegram</li>
                  <li>Администратор запросит реквизиты для вывода</li>
                  <li>После проверки администратор отправит средства за вычетом комиссии</li>
                  <li>Вывод происходит вручную, обычно в течение 24-48 часов</li>
                </ul>
                <p className={styles.modalNote}>Пожалуйста, указывайте корректную сумму. После отправки заявки изменить её будет невозможно.</p>
              </div>
              <div className={styles.currencySelector}>
                <label>Выберите валюту:</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="RUB">Российский рубль (RUB)</option>
                  <option value="USD">Доллар США (USD)</option>
                  <option value="EUR">Евро (EUR)</option>
                  <option value="GBP">Британский фунт (GBP)</option>
                </select>
              </div>
              <div className={styles.currencySelector}>
                <label>Способ вывода:</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                >
                  <option value="sbp">СБП (0% комиссия)</option>
                  <option value="card">Банковская карта РФ (+2% комиссия)</option>
                  <option value="paypal">PayPal (+5% комиссия)</option>
                </select>
              </div>
              <input
                type="number"
                min="1000"
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Сумма в коинах"
              />
              {withdrawAmount && parseInt(withdrawAmount) > 0 && (
                <div className={styles.commissionInfo}>
                  {(() => {
                    const amount = parseInt(withdrawAmount)
                    const platformCommission = Math.round(amount * 0.15) // 15% платформа
                    let methodCommission = 0
                    let methodText = ''
                    switch (withdrawMethod) {
                      case 'paypal':
                        methodCommission = Math.round(amount * 0.05)
                        methodText = '5% (PayPal)'
                        break
                      case 'card':
                        methodCommission = Math.round(amount * 0.02)
                        methodText = '2% (Карта РФ)'
                        break
                      case 'sbp':
                      default:
                        methodCommission = 0
                        methodText = '0% (СБП)'
                        break
                    }
                    const totalCommission = platformCommission + methodCommission
                    const netAmount = amount - totalCommission
                    return (
                      <>
                        <p>Комиссия платформы (15%): {platformCommission} коинов</p>
                        <p>Комиссия метода ({methodText}): {methodCommission} коинов</p>
                        <p>Итого комиссия: {totalCommission} коинов</p>
                        <p>К получению: {netAmount} коинов = {netAmount} {selectedCurrency}</p>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
            <div className={styles.modalButtons}>
              <button onClick={handleWithdraw}>Хочу вывести {withdrawAmount || '0'} коинов</button>
              <button onClick={() => setShowWithdrawModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <div>
        {/* Ваши лупы */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            Ваши лупы
          </h2>
          {isLoadingLoops ? (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <p>Загрузка...</p>
            </div>
          ) : userLoops.length > 0 ? (
            <div className={styles.loopsGrid}>
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
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <p>У вас пока нет лупов</p>
            </div>
          )}
        </div>

        {/* Подписки на артистов */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className={styles.emptyState}>
              <p>Загрузка подписок...</p>
            </div>
          ) : subscriptions.length > 0 ? (
            <div className={styles.subscriptionsList}>
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className={styles.subscriptionItem}>
                  <div className={styles.subscriptionInfo}>
                    <span className={styles.subscriptionHashtag}>#{subscription.artist_hashtag}</span>
                    <span className={styles.subscriptionDate}>
                      Подписан {new Date(subscription.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSubscription(subscription.id)}
                    className={styles.removeBtn}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <p>У вас пока нет подписок</p>
              <p>Подпишитесь на артистов, чтобы видеть их лупы</p>
            </div>
          )}
        </div>

        {/* Купленные паки */}
        <div id="purchases" className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Покупки
          </h2>
          {isLoadingPacks ? (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <p>Загрузка...</p>
            </div>
          ) : purchasedPacks.length > 0 ? (
            <div className={styles.packsList}>
              {purchasedPacks.map((pack) => (
                <div key={pack.id} className={styles.packItem}>
                  <div className={styles.packInfo}>
                    <h3>{pack.title}</h3>
                    <p>{pack.description}</p>
                    <p className={styles.packPrice}>{pack.price} coins</p>
                    <p>Продавец: {pack.seller_username || 'Неизвестно'}</p>
                  </div>
                  <div className={styles.packActions}>
                    <button
                      onClick={() => handleDownloadPack(pack.id)}
                    >
                      Скачать
                    </button>
                    <button
                      onClick={() => handleRatePack(pack)}
                    >
                      Оценить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <p>У вас пока нет покупок</p>
            </div>
          )}
        </div>

        {/* Ваши паки */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Ваши паки
            </h2>
            <div className={styles.sectionActions}>
              <button
                onClick={() => navigate('/create-pack')}
                className={styles.actionBtn}
              >
                Создать пак
              </button>
              <button
                onClick={() => navigate('/shop')}
                className={`${styles.actionBtn} ${styles.secondary}`}
              >
                Перейти в магазин
              </button>
            </div>
          </div>
          {isLoadingCreatedPacks ? (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <p>Загрузка...</p>
            </div>
          ) : createdPacks.length > 0 ? (
            <div className={styles.packsList}>
              {createdPacks.map((pack) => (
                <div key={pack.id} className={styles.packItem}>
                  <div className={styles.packInfo}>
                    <h3>{pack.title}</h3>
                    <p>{pack.description}</p>
                    <p className={styles.packPrice}>{pack.price} coins</p>
                    <p>{pack.sales_count || 0} покупок</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <span className={`${styles.packStatus} ${styles[`packStatus${pack.status.charAt(0).toUpperCase() + pack.status.slice(1)}`]}`}>
                        {pack.status === 'approved' ? 'Одобрено' : pack.status === 'pending' ? 'На модерации' : 'Отклонено'}
                      </span>
                      {(pack.sales_count === 0 || !pack.sales_count) && (
                        <button
                          onClick={() => handleDeletePack(pack.id)}
                          className={styles.deleteBtn}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <p>У вас пока нет созданных паков</p>
              </div>
            )}
          </div>

          {/* История транзакций */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              История продаж
            </h2>
            {isLoadingTransactions ? (
              <div className={styles.emptyState}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
                <p>Загрузка...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className={styles.packsList}>
                {transactions.map((tx) => (
                  <div key={tx.invoice_id} className={styles.packItem}>
                    <div className={styles.packInfo}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {tx.type === 'purchase' && (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                              <circle cx="9" cy="21" r="1"></circle>
                              <circle cx="20" cy="21" r="1"></circle>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Покупка
                          </>
                        )}
                        {tx.type === 'sale' && (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                              <line x1="12" y1="1" x2="12" y2="23"></line>
                              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            Продажа
                          </>
                        )}
                        {tx.type === 'topup' && (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Пополнение
                          </>
                        )}
                        {tx.type === 'withdrawal' && (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Вывод
                          </>
                        )}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tx.description}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600, color: tx.type === 'purchase' || tx.type === 'withdrawal' ? '#ef4444' : '#22c55e' }}>
                      {tx.type === 'purchase' || tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} {tx.currency}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <p>У вас пока нет транзакций</p>
              </div>
            )}
          </div>

          {/* Понравившиеся лупы */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Ваши избранные
            </h2>
            <LikedLoops limit={3} showAllButton={false} />
          </div>
        </div>

        {/* Кнопка выхода */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Управление
          </h2>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Выйти
          </button>
        </div>
      </div>

    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Уведомление">
      <p>{modalMessage}</p>
    </Modal>

    <Modal
      isOpen={ratingModalOpen}
      onClose={() => setRatingModalOpen(false)}
      title="Оцените пак"
      onConfirm={handleConfirmRating}
      confirmText="Отправить оценку"
      cancelText="Пропустить"
    >
      <div className="rating-modal-content">
        <p>Как вам пакет? Оцените от 1 до 5 звезд:</p>
        <div className="rating-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`rating-star ${star <= selectedRating ? 'active' : ''}`}
              onClick={() => setSelectedRating(star)}
            >
              ★
            </button>
          ))}
        </div>
      </div>
    </Modal>
    </>
  )
}

export default Profile
