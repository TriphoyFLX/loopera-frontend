import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../utils/api'
import { subscriptionApi, type Subscription } from '../utils/subscriptionApi'
import LikedLoops from '../components/LikedLoops'
import LoopCard from '../components/LoopCard'
import ArtistPreferencesPicker from '../components/ArtistPreferencesPicker'
import Modal from '../components/Modal'
import { artistTypesApi } from '../utils/artistTypesApi'
import { downloadPurchasedPack } from '../utils/shopDownload'
import { getAssetUrl } from '../utils/urls'
import { LOOP_COVER_COLORS } from '../utils/loopCover'
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer'
import { useI18n } from '../i18n/useI18n'
import {
  canEditAccent,
  canEditFullTheme,
  isPaidPlan,
  normalizePlanSlug,
  planDisplayName,
} from '../utils/plans'
import { profilePath } from '../utils/routes'
import MobilePageHeader from '../components/MobilePageHeader'
import VerifiedBadge from '../components/VerifiedBadge'
import styles from './Profile.module.css'

type BillingUsage = {
  uploads_count: number
  downloads_count: number
  looptok_count: number
  limits: {
    uploadsPerPeriod: number
    downloadsPerPeriod: number
    looptokPerPeriod: number
    customProfile?: boolean
    accentOnly?: boolean
  }
  remaining: { uploads: number; downloads: number; looptok: number }
}

type ProfileTheme = {
  accent_color?: string
  banner_url?: string
  layout?: 'classic' | 'cinematic' | 'glass'
  bio?: string
  show_stats?: boolean
  featured_loop_id?: number | null
}

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
  const { t } = useI18n()
  const { user, logout, token, updateUser } = useAuth()
  const navigate = useNavigate()
  const player = useLoopPlayerOptional()
  const [userLoops, setUserLoops] = useState<UserLoop[]>([])
  const [isLoadingLoops, setIsLoadingLoops] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true)
  const [preferencesSaved, setPreferencesSaved] = useState(false)
  const [balance, setBalance] = useState<number>(0)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('500')
  const [topUpBusy, setTopUpBusy] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPhone, setWithdrawPhone] = useState('')
  const [withdrawBank, setWithdrawBank] = useState('')
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
  const [planSlug, setPlanSlug] = useState('free')
  const [usage, setUsage] = useState<BillingUsage | null>(null)
  const [profileTheme, setProfileTheme] = useState<ProfileTheme>({})
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeMsg, setThemeMsg] = useState('')
  const [billingLoading, setBillingLoading] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'plan' | 'theme' | 'types' | 'history'>('plan')
  const [contentTab, setContentTab] = useState<'loops' | 'purchases' | 'packs' | 'liked'>('loops')
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount, 10)
    if (!Number.isFinite(amount) || amount < 100) {
      setModalMessage('Минимум пополнения — 100 ₽')
      setModalOpen(true)
      return
    }
    if (amount > 100000) {
      setModalMessage('Максимум за раз — 100 000 ₽')
      setModalOpen(true)
      return
    }
    setTopUpBusy(true)
    try {
      const response = await fetch('/api/shop/balance/top-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Не удалось создать пополнение')
      if (data.confirmation_url) {
        localStorage.setItem('pending_topup_payment_id', data.payment_id || '')
        window.location.href = data.confirmation_url
        return
      }
      throw new Error('Нет ссылки на оплату')
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : 'Ошибка пополнения')
      setModalOpen(true)
    } finally {
      setTopUpBusy(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount)
    if (!amount || amount < 1000) {
      setModalMessage(t('profilePage.minWithdraw'))
      setModalOpen(true)
      return
    }

    if (amount > balance) {
      setModalMessage(t('profilePage.insufficientBalance'))
      setModalOpen(true)
      return
    }

    if (!withdrawPhone.trim() || !withdrawBank.trim()) {
      setModalMessage(t('profilePage.providePhoneBank'))
      setModalOpen(true)
      return
    }

    try {
      const response = await fetch('/api/shop/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          phone: withdrawPhone.trim(),
          bank: withdrawBank.trim(),
          withdrawal_method: withdrawMethod,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || t('profilePage.withdrawError'))
      }

      setShowWithdrawModal(false)
      setWithdrawAmount('')
      setWithdrawPhone('')
      setWithdrawBank('')
      setModalMessage(t('profilePage.withdrawSuccess'))
      setModalOpen(true)

      const balanceRes = await fetch('/api/shop/balance/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json()
        setBalance(balanceData.available_balance || 0)
      }
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : t('profilePage.withdrawError'))
      setModalOpen(true)
    }
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

    const fetchBilling = async () => {
      if (!token) return
      try {
        setBillingLoading(true)
        const data = await api.getMyBilling(token)
        setPlanSlug(normalizePlanSlug(data.subscription?.slug || 'free'))
        setUsage(data.usage || null)
        setProfileTheme((data.profile_theme || {}) as ProfileTheme)
      } catch (error) {
        console.error('Error fetching billing:', error)
      } finally {
        setBillingLoading(false)
      }
    }

    fetchUserLoops()
    fetchSubscriptions()
    fetchBalance()
    fetchPurchasedPacks()
    fetchCreatedPacks()
    fetchTransactionHistory()
    fetchBilling()
  }, [token])

  const handleSaveTheme = async () => {
    if (!token) return
    try {
      setThemeSaving(true)
      setThemeMsg('')
      const result = await api.updateProfileTheme(profileTheme as Record<string, unknown>, token)
      setProfileTheme((result.profile_theme || profileTheme) as ProfileTheme)
      setThemeMsg(t('billingSection.themeSaved'))
    } catch (error) {
      setThemeMsg(error instanceof Error ? error.message : t('billingSection.themeError'))
    } finally {
      setThemeSaving(false)
    }
  }

  const usageBar = (used: number, limit: number) => {
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
    return (
      <div className={styles.usageBarTrack}>
        <div className={styles.usageBarFill} style={{ width: `${pct}%` }} />
      </div>
    )
  }

  const handleSavePreferences = async (artists: string[]) => {
    const result = await artistTypesApi.updateArtistPreferences(artists)
    const response = await subscriptionApi.getUserSubscriptions()
    setSubscriptions(response.subscriptions)
    setPreferencesSaved(true)
    window.setTimeout(() => setPreferencesSaved(false), 2500)
    if (result.user && user) {
      updateUser({ ...user, onboarding_completed: true })
    }
  }

  const handleDeleteLoop = async (loopId: number) => {
    if (!window.confirm(t('profilePage.deleteLoopConfirm'))) {
      return
    }

    try {
      await api.deleteLoop(loopId, token || '')
      
      // Обновляем список лупов
      if (token) {
        const response = await api.getUserLoops(token)
        setUserLoops(response.loops)
      }
      if (Number(profileTheme.featured_loop_id) === Number(loopId)) {
        setProfileTheme((prev) => ({ ...prev, featured_loop_id: null }))
      }
    } catch (error) {
      console.error('Error deleting loop:', error)
      setModalMessage(error instanceof Error ? error.message : t('profilePage.deleteLoopError'))
      setModalOpen(true)
    }
  }

  const handlePinLoop = async (loopId: number) => {
    if (!token) return
    const currentlyPinned = Number(profileTheme.featured_loop_id) === Number(loopId)
    const nextId = currentlyPinned ? null : loopId
    try {
      const result = await api.updateProfileTheme({ featured_loop_id: nextId }, token)
      setProfileTheme((result.profile_theme || { ...profileTheme, featured_loop_id: nextId }) as ProfileTheme)
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : 'Не удалось закрепить луп')
      setModalOpen(true)
    }
  }

  const sortedUserLoops = [...userLoops].sort((a, b) => {
    const pinned = Number(profileTheme.featured_loop_id)
    if (!Number.isFinite(pinned)) return 0
    if (Number(a.id) === pinned) return -1
    if (Number(b.id) === pinned) return 1
    return 0
  })

  const handlePlay = (loop: UserLoop) => {
    const queue = sortedUserLoops.map((item) => ({
      ...item,
      author: user?.username || 'Unknown',
      user_id: user?.id || item.user_id,
    }))
    player?.play(
      {
        ...loop,
        author: user?.username || 'Unknown',
        user_id: user?.id || loop.user_id,
      },
      queue,
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const handleDownloadPack = async (packId: number, packTitle?: string) => {
    try {
      await downloadPurchasedPack(packId, { token, fallbackTitle: packTitle })
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : t('profilePage.downloadError'))
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
      setModalMessage(t('profilePage.selectRating'))
      setModalOpen(true)
      return
    }

    try {
      const response = await fetch(`/api/shop/${selectedPackForRating.id}/rate`, {
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
      setModalMessage(t('profilePage.thanksRating'))
      setModalOpen(true)
    } catch (err: any) {
      console.error('Error rating pack:', err)
      setModalMessage(err.message || t('profilePage.rateError'))
      setModalOpen(true)
    }
  }

  const handleDeletePack = async (packId: number) => {
    if (!window.confirm(t('profilePage.deletePackConfirm'))) {
      return
    }

    try {
      const response = await fetch(`/api/shop/${packId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete pack')
      }

      setModalMessage(t('profilePage.packDeleted'))
      setModalOpen(true)

      // Обновляем список созданных паков
      if (token) {
        const data = await api.getUserCreatedPacks(token)
        setCreatedPacks(data.packs || [])
      }
    } catch (error) {
      setModalMessage(error instanceof Error ? error.message : t('profilePage.deletePackError'))
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

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token || !user) return

    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      setModalMessage(t('profilePage.avatarTypeError'))
      setModalOpen(true)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setModalMessage(t('profilePage.avatarSizeError'))
      setModalOpen(true)
      return
    }

    try {
      setAvatarUploading(true)
      const result = await api.uploadAvatar(file, token)
      const next = result.user
        ? {
            ...user,
            ...result.user,
            avatar_url: result.user.avatar_url ?? result.avatar_url,
            createdAt: result.user.created_at || user.createdAt,
          }
        : { ...user, avatar_url: result.avatar_url }
      updateUser(next)
      setModalMessage(t('profilePage.avatarUpdated'))
      setModalOpen(true)
    } catch (err) {
      setModalMessage(err instanceof Error ? err.message : t('profilePage.avatarError'))
      setModalOpen(true)
    } finally {
      setAvatarUploading(false)
    }
  }

  if (!user) {
    return <div>{t('profilePage.loading')}</div>
  }

  const avatarSrc = user.avatar_url ? getAssetUrl(user.avatar_url) : ''
  const avatarFallback =
    LOOP_COVER_COLORS[Math.abs(user.id) % LOOP_COVER_COLORS.length]

  return (
    <>
      <div className={styles.profileContainer}>
        <div className={styles.mobileChrome}>
          <MobilePageHeader title="Профиль" align="start" />
        </div>
        <div className={styles.hero}>
          <div className={styles.heroMain}>
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label={t('profilePage.changeAvatar')}
            >
              <div
                className={styles.avatar}
                style={
                  avatarSrc
                    ? { backgroundImage: `url(${avatarSrc})` }
                    : { backgroundColor: avatarFallback }
                }
              >
                {!avatarSrc && user.username.charAt(0).toUpperCase()}
              </div>
              <span className={styles.avatarOverlay}>
                {avatarUploading ? '…' : t('profilePage.changeAvatar')}
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.avatarInput}
              onChange={handleAvatarChange}
            />

            <div className={styles.info}>
              <div className={styles.nameRow}>
                <h1 className={styles.username}>{user.username}</h1>
                {isPaidPlan(planSlug) && (
                  <VerifiedBadge plan={planSlug} title={planDisplayName(planSlug)} />
                )}
                <span
                  className={`${styles.planChip} ${
                    planSlug === 'business'
                      ? styles.plan_elite
                      : planSlug === 'pro' || planSlug === 'basic'
                        ? styles.plan_pro
                        : ''
                  }`}
                >
                  {planDisplayName(planSlug)}
                </span>
              </div>
              <p className={styles.joinDate}>
                {t('profilePage.joined', {
                  date: user.createdAt || user.created_at
                    ? formatDate(String(user.createdAt || user.created_at))
                    : t('profilePage.joinedRecently'),
                })}
              </p>
              <div className={styles.balanceSection}>
                <div className={styles.balance}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <span className={styles.balanceAmount}>
                    {isLoadingBalance ? '...' : `${balance.toLocaleString()} ₽`}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setShowTopUpModal(true)}
                >
                  Пополнить
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.secondary}`}
                  onClick={() => setShowWithdrawModal(true)}
                >
                  {t('profilePage.withdraw')}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.settingsBtn}
              onClick={() => setSettingsOpen(true)}
              aria-label="Настройки"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Настройки</span>
            </button>
            <button
              type="button"
              className={`${styles.settingsBtn} ${styles.secondaryAction}`}
              onClick={() => navigate(profilePath(user.username))}
            >
              Публичный профиль
            </button>
          </div>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Разделы профиля">
          {(
            [
              ['loops', t('profilePage.yourLoops')],
              ['purchases', t('profilePage.purchases')],
              ['packs', t('profilePage.yourPacks')],
              ['liked', t('profilePage.favorites')],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={contentTab === id}
              className={`${styles.tab} ${contentTab === id ? styles.tabActive : ''}`}
              onClick={() => setContentTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {contentTab === 'loops' && (
            <div className={styles.panel}>
              {isLoadingLoops ? (
                <div className={styles.emptyState}><p>{t('profilePage.loading')}</p></div>
              ) : userLoops.length > 0 ? (
                <div className={styles.loopsGrid}>
                  {sortedUserLoops.map((loop) => (
                    <LoopCard
                      key={loop.id}
                      loop={{
                        ...loop,
                        author: user?.username || 'Unknown',
                        user_id: user?.id || 0,
                        created_at: loop.created_at || new Date().toISOString(),
                        tags: loop.tags || [],
                      }}
                      currentUserId={user?.id}
                      onDelete={handleDeleteLoop}
                      onPin={handlePinLoop}
                      isPinned={Number(profileTheme.featured_loop_id) === Number(loop.id)}
                      onPlay={handlePlay}
                      queue={sortedUserLoops}
                      showLike={true}
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}><p>{t('profilePage.noLoops')}</p></div>
              )}
            </div>
          )}

          {contentTab === 'purchases' && (
            <div id="purchases" className={styles.panel}>
              {isLoadingPacks ? (
                <div className={styles.emptyState}><p>{t('profilePage.loading')}</p></div>
              ) : purchasedPacks.length > 0 ? (
                <div className={styles.packsList}>
                  {purchasedPacks.map((pack) => (
                    <div key={pack.id} className={styles.packItem}>
                      <div className={styles.packInfo}>
                        <h3>{pack.title}</h3>
                        <p>{pack.description}</p>
                        <p className={styles.packPrice}>{pack.price} ₽</p>
                        <p>{t('profilePage.seller', { name: pack.seller_username || t('profilePage.unknown') })}</p>
                      </div>
                      <div className={styles.packActions}>
                        <button type="button" onClick={() => navigate(`/shop/purchase/${pack.id}`)}>
                          {t('profilePage.open')}
                        </button>
                        <button type="button" onClick={() => handleDownloadPack(pack.id, pack.title)}>
                          {t('profilePage.download')}
                        </button>
                        <button type="button" onClick={() => handleRatePack(pack)}>
                          {t('profilePage.rate')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}><p>{t('profilePage.noPurchases')}</p></div>
              )}
            </div>
          )}

          {contentTab === 'packs' && (
            <div className={styles.panel}>
              <div className={styles.sectionActions}>
                <button type="button" onClick={() => navigate('/create-pack')} className={styles.actionBtn}>
                  {t('profilePage.createPack')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className={`${styles.actionBtn} ${styles.secondary}`}
                >
                  {t('profilePage.goToShop')}
                </button>
              </div>
              {isLoadingCreatedPacks ? (
                <div className={styles.emptyState}><p>{t('profilePage.loading')}</p></div>
              ) : createdPacks.length > 0 ? (
                <div className={styles.packsList}>
                  {createdPacks.map((pack) => (
                    <div key={pack.id} className={styles.packItem}>
                      <div className={styles.packInfo}>
                        <h3>{pack.title}</h3>
                        <p>{pack.description}</p>
                        <p className={styles.packPrice}>{pack.price} ₽</p>
                        <p>{t('profilePage.salesCount', { count: pack.sales_count || 0 })}</p>
                      </div>
                      <div className={styles.packSide}>
                        <span
                          className={`${styles.packStatus} ${
                            styles[`packStatus${pack.status.charAt(0).toUpperCase() + pack.status.slice(1)}`]
                          }`}
                        >
                          {pack.status === 'approved'
                            ? t('profilePage.statusApproved')
                            : pack.status === 'pending'
                              ? t('profilePage.statusPending')
                              : t('profilePage.statusRejected')}
                        </span>
                        {(pack.sales_count === 0 || !pack.sales_count) && (
                          <button type="button" onClick={() => handleDeletePack(pack.id)} className={styles.deleteBtn}>
                            {t('profilePage.delete')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}><p>{t('profilePage.noCreatedPacks')}</p></div>
              )}
            </div>
          )}

          {contentTab === 'liked' && (
            <div className={styles.panel}>
              <LikedLoops limit={12} showAllButton={false} />
            </div>
          )}
        </div>

        {showTopUpModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalScrollContent}>
                <h2>Пополнить баланс</h2>
                <p className={styles.modalNote}>
                  Деньги сразу попадут на баланс Loopera — ими можно покупать паки без повторного ввода карты.
                  Оплата через ЮKassa.
                </p>
                <div className={styles.currencySelector}>
                  <label>Сумма</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {[300, 500, 1000, 2000, 5000].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`${styles.actionBtn} ${styles.secondary}`}
                        onClick={() => setTopUpAmount(String(n))}
                      >
                        {n} ₽
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={100}
                    max={100000}
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Сумма, ₽"
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.actionBtn} onClick={handleTopUp} disabled={topUpBusy}>
                  {topUpBusy ? 'Создание платежа…' : `Пополнить на ${topUpAmount || '0'} ₽`}
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.secondary}`}
                  onClick={() => setShowTopUpModal(false)}
                  disabled={topUpBusy}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {showWithdrawModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalScrollContent}>
                <h2>{t('profilePage.withdrawTitle')}</h2>
                <div className={styles.modalConditions}>
                  <h3>{t('profilePage.conditionsTitle')}</h3>
                  <ul>
                    <li>{t('profilePage.condition1')}</li>
                    <li>{t('profilePage.condition2')}</li>
                    <li>{t('profilePage.condition3')}</li>
                    <li>{t('profilePage.condition4')}</li>
                    <li>{t('profilePage.condition5')}</li>
                    <li>{t('profilePage.condition6')}</li>
                  </ul>
                  <p className={styles.modalNote}>{t('profilePage.modalNote')}</p>
                </div>
                <div className={styles.currencySelector}>
                  <label>{t('profilePage.methodLabel')}</label>
                  <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)}>
                    <option value="sbp">{t('profilePage.methodSbp')}</option>
                    <option value="card">{t('profilePage.methodCard')}</option>
                    <option value="paypal">{t('profilePage.methodPaypal')}</option>
                  </select>
                </div>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder={t('profilePage.phonePlaceholder')}
                />
                <input
                  type="text"
                  value={withdrawBank}
                  onChange={(e) => setWithdrawBank(e.target.value)}
                  placeholder={t('profilePage.bankPlaceholder')}
                />
                <input
                  type="number"
                  min="1000"
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={t('profilePage.amountPlaceholder')}
                />
                {withdrawAmount && parseInt(withdrawAmount) > 0 && (
                  <div className={styles.commissionInfo}>
                    {(() => {
                      const amount = parseInt(withdrawAmount)
                      const platformCommission = Math.round(amount * 0.15)
                      let methodCommission = 0
                      let methodText = ''
                      switch (withdrawMethod) {
                        case 'paypal':
                          methodCommission = Math.round(amount * 0.05)
                          methodText = t('profilePage.methodPaypal')
                          break
                        case 'card':
                          methodCommission = Math.round(amount * 0.02)
                          methodText = t('profilePage.methodCard')
                          break
                        default:
                          methodCommission = 0
                          methodText = t('profilePage.methodSbp')
                          break
                      }
                      const totalCommission = platformCommission + methodCommission
                      const netAmount = amount - totalCommission
                      return (
                        <>
                          <p>{t('profilePage.platformCommission', { amount: platformCommission })}</p>
                          <p>{t('profilePage.methodCommission', { method: methodText, amount: methodCommission })}</p>
                          <p>{t('profilePage.totalCommission', { amount: totalCommission })}</p>
                          <p>{t('profilePage.netAmount', { amount: netAmount })}</p>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
              <div className={styles.modalButtons}>
                <button type="button" onClick={handleWithdraw}>
                  {t('profilePage.withdrawBtn', { amount: withdrawAmount || '0' })}
                </button>
                <button type="button" onClick={() => setShowWithdrawModal(false)}>
                  {t('profilePage.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {settingsOpen && createPortal(
          <div className={styles.drawerOverlay} onClick={() => setSettingsOpen(false)} role="presentation">
            <aside
              className={styles.drawer}
              role="dialog"
              aria-modal="true"
              aria-label="Настройки профиля"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.drawerHead}>
                <h2>Настройки</h2>
                <button type="button" className={styles.drawerClose} onClick={() => setSettingsOpen(false)} aria-label="Закрыть">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className={styles.drawerTabs}>
                {(
                  [
                    ['plan', t('billingSection.title')],
                    ['theme', t('billingSection.themeTitle')],
                    ['types', t('profilePage.myTypes')],
                    ['history', t('profilePage.salesHistory')],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.drawerTab} ${settingsTab === id ? styles.drawerTabActive : ''}`}
                    onClick={() => setSettingsTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className={styles.drawerBody}>
                {settingsTab === 'plan' && (
                  <div className={styles.drawerSection}>
                    {billingLoading ? (
                      <p className={styles.sectionHint}>{t('common.loading')}</p>
                    ) : (
                      <>
                        <div className={styles.billingPlanRow}>
                          <div>
                            <span className={styles.billingLabel}>{t('billingSection.plan')}</span>
                            <span
                              className={`${styles.planBadge} ${
                                planSlug === 'business'
                                  ? styles.plan_elite
                                  : planSlug === 'pro' || planSlug === 'basic'
                                    ? styles.plan_pro
                                    : ''
                              }`}
                            >
                              {planDisplayName(planSlug)}
                            </span>
                          </div>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.secondary}`}
                            onClick={() => navigate('/pricing')}
                          >
                            {planSlug === 'business' ? t('billingSection.manage') : t('billingSection.upgrade')}
                          </button>
                        </div>
                        {usage && (
                          <div className={styles.usageGrid}>
                            <p className={styles.sectionHint}>{t('billingSection.usage')}</p>
                            <div className={styles.usageItem}>
                              <div className={styles.usageMeta}>
                                <span>{t('billingSection.uploads')}</span>
                                <span>
                                  {usage.uploads_count}/{usage.limits.uploadsPerPeriod}
                                </span>
                              </div>
                              {usageBar(usage.uploads_count, usage.limits.uploadsPerPeriod)}
                            </div>
                            <div className={styles.usageItem}>
                              <div className={styles.usageMeta}>
                                <span>{t('billingSection.downloads')}</span>
                                <span>
                                  {usage.downloads_count}/{usage.limits.downloadsPerPeriod}
                                </span>
                              </div>
                              {usageBar(usage.downloads_count, usage.limits.downloadsPerPeriod)}
                            </div>
                            <div className={styles.usageItem}>
                              <div className={styles.usageMeta}>
                                <span>{t('billingSection.looptok')}</span>
                                <span>
                                  {usage.looptok_count}/{usage.limits.looptokPerPeriod}
                                </span>
                              </div>
                              {usageBar(usage.looptok_count, usage.limits.looptokPerPeriod)}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {settingsTab === 'theme' && (
                  <div className={styles.drawerSection}>
                    {!canEditAccent(planSlug) ? (
                      <p className={styles.sectionHint}>{t('billingSection.eliteOnly')}</p>
                    ) : (
                      <div className={styles.themeEditor}>
                        {!canEditFullTheme(planSlug) && (
                          <p className={styles.sectionHint}>{t('billingSection.eliteOnly')}</p>
                        )}
                        <label className={styles.themeField}>
                          {t('billingSection.accent')}
                          <input
                            type="color"
                            value={profileTheme.accent_color || '#ff2d55'}
                            onChange={(e) =>
                              setProfileTheme((prev) => ({ ...prev, accent_color: e.target.value }))
                            }
                          />
                        </label>
                        {canEditFullTheme(planSlug) && (
                          <>
                            <label className={styles.themeField}>
                              {t('billingSection.layout')}
                              <select
                                value={profileTheme.layout || 'classic'}
                                onChange={(e) =>
                                  setProfileTheme((prev) => ({
                                    ...prev,
                                    layout: e.target.value as ProfileTheme['layout'],
                                  }))
                                }
                              >
                                <option value="classic">{t('billingSection.layoutClassic')}</option>
                                <option value="cinematic">{t('billingSection.layoutCinematic')}</option>
                                <option value="glass">{t('billingSection.layoutGlass')}</option>
                              </select>
                            </label>
                            <label className={styles.themeField}>
                              {t('billingSection.bannerUrl')}
                              <input
                                type="url"
                                value={profileTheme.banner_url || ''}
                                onChange={(e) =>
                                  setProfileTheme((prev) => ({ ...prev, banner_url: e.target.value }))
                                }
                                placeholder="https://…"
                              />
                            </label>
                            <label className={styles.themeField}>
                              {t('billingSection.bio')}
                              <textarea
                                value={profileTheme.bio || ''}
                                maxLength={280}
                                rows={3}
                                onChange={(e) =>
                                  setProfileTheme((prev) => ({ ...prev, bio: e.target.value }))
                                }
                              />
                            </label>
                            <label className={styles.themeCheck}>
                              <input
                                type="checkbox"
                                checked={profileTheme.show_stats !== false}
                                onChange={(e) =>
                                  setProfileTheme((prev) => ({ ...prev, show_stats: e.target.checked }))
                                }
                              />
                              {t('billingSection.showStats')}
                            </label>
                          </>
                        )}
                        <button
                          type="button"
                          className={styles.actionBtn}
                          disabled={themeSaving}
                          onClick={handleSaveTheme}
                        >
                          {themeSaving ? t('common.loading') : t('billingSection.saveTheme')}
                        </button>
                        {themeMsg && <p className={styles.preferencesSaved}>{themeMsg}</p>}
                      </div>
                    )}
                  </div>
                )}

                {settingsTab === 'types' && (
                  <div className={styles.drawerSection}>
                    {isLoadingSubscriptions ? (
                      <p className={styles.sectionHint}>{t('profilePage.loading')}</p>
                    ) : (
                      <>
                        <ArtistPreferencesPicker
                          initialSelected={subscriptions.map((item) => item.artist_hashtag)}
                          submitLabel={t('profilePage.saveTypes')}
                          onSave={handleSavePreferences}
                        />
                        {preferencesSaved && (
                          <p className={styles.preferencesSaved}>{t('profilePage.typesSaved')}</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {settingsTab === 'history' && (
                  <div className={styles.drawerSection}>
                    {isLoadingTransactions ? (
                      <p className={styles.sectionHint}>{t('profilePage.loading')}</p>
                    ) : transactions.length > 0 ? (
                      <div className={styles.packsList}>
                        {transactions.map((tx) => (
                          <div key={tx.invoice_id} className={styles.packItem}>
                            <div className={styles.packInfo}>
                              <span className={styles.txType}>
                                {tx.type === 'purchase' && t('profilePage.txPurchase')}
                                {tx.type === 'sale' && t('profilePage.txSale')}
                                {tx.type === 'topup' && t('profilePage.txTopup')}
                                {tx.type === 'withdrawal' && t('profilePage.txWithdrawal')}
                              </span>
                              <span className={styles.txDesc}>{tx.description}</span>
                              <span className={styles.txDate}>
                                {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                            <span
                              className={`${styles.txAmount} ${
                                tx.type === 'purchase' || tx.type === 'withdrawal'
                                  ? styles.txNeg
                                  : styles.txPos
                              }`}
                            >
                              {tx.type === 'purchase' || tx.type === 'withdrawal' ? '-' : '+'}
                              {tx.amount} ₽
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyState}><p>{t('profilePage.noTransactions')}</p></div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.drawerFoot}>
                <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                  {t('profilePage.logout')}
                </button>
              </div>
            </aside>
          </div>,
          document.body,
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t('profilePage.notification')}>
        <p>{modalMessage}</p>
      </Modal>

      <Modal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title={t('profilePage.ratePack')}
        onConfirm={handleConfirmRating}
        confirmText={t('profilePage.submitRating')}
        cancelText={t('profilePage.skip')}
      >
        <div className="rating-modal-content">
          <p>{t('profilePage.ratePrompt')}</p>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
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
