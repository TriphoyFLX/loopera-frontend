import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatApi } from '../utils/chatApi';
import { getAssetUrl } from '../utils/urls';
import { profilePath, packSharePath, parsePackId } from '../utils/routes';
import { buildShareUrl } from '../utils/share';
import ShareButton from '../components/ShareButton';
import { downloadPurchasedPack } from '../utils/shopDownload';
import { useI18n } from '../i18n/useI18n';
import Modal from '../components/Modal';
import styles from './PurchaseSuccess.module.css';

interface Pack {
  id: number;
  title: string;
  description?: string;
  price: number;
  cover_url?: string;
  username?: string;
  hashtag?: string;
  avatar_url?: string;
  user_id: number;
  loops?: { id: number; title: string }[];
}

type PageState = 'loading' | 'pending' | 'ready' | 'error';

const PurchaseSuccess = () => {
  const { t } = useI18n();
  const { packId: rawPackId } = useParams<{ packId: string }>();
  const packId = parsePackId(rawPackId);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [pack, setPack] = useState<Pack | null>(null);
  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [purchasedAt, setPurchasedAt] = useState<string | null>(null);
  const [orderAmount, setOrderAmount] = useState<number | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const headers = useCallback(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  useEffect(() => {
    if (rawPackId && packId && rawPackId !== packId) {
      const query = searchParams.toString();
      navigate(`/shop/purchase/${packId}${query ? `?${query}` : ''}`, { replace: true });
    }
  }, [rawPackId, packId, navigate, searchParams]);

  const checkPurchased = useCallback(async (): Promise<boolean> => {
    const res = await fetch('/api/shop/user-packs', { headers: headers() });
    if (!res.ok) return false;
    const data = await res.json();
    return (data.packs || []).some((p: { id: number | string }) => String(p.id) === String(packId));
  }, [headers, packId]);

  const confirmPayment = useCallback(async (): Promise<boolean> => {
    const paymentId = localStorage.getItem('pending_payment_id');
    if (!paymentId) return checkPurchased();

    const res = await fetch('/api/shop/payments/confirm', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ payment_id: paymentId }),
    });
    const data = await res.json();
    if (data.purchased) {
      localStorage.removeItem('pending_payment_id');
      return true;
    }
    return data.status === 'succeeded' ? checkPurchased() : false;
  }, [checkPurchased, headers]);

  const loadPack = useCallback(async () => {
    const res = await fetch(`/api/shop/${packId}`, { headers: headers() });
    if (!res.ok) throw new Error('Товар не найден');
    return res.json() as Promise<Pack>;
  }, [headers, packId]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;

    const init = async () => {
      if (!packId || !token) {
        setState('error');
        setError('Войдите в аккаунт, чтобы получить покупку');
        return;
      }

      try {
        const packData = await loadPack();
        if (cancelled) return;
        setPack(packData);
        setOrderAmount(packData.price);

        const fromPayment = searchParams.get('payment') === 'success';
        let purchased = await checkPurchased();

        if (!purchased && fromPayment) {
          setState('pending');
          while (!purchased && attempts < maxAttempts && !cancelled) {
            purchased = await confirmPayment();
            if (!purchased) {
              attempts += 1;
              await new Promise((r) => setTimeout(r, 2000));
            }
          }
        }

        if (cancelled) return;

        if (purchased) {
          setState('ready');
          const historyRes = await fetch('/api/shop/history', { headers: headers() });
          if (historyRes.ok) {
            const history = await historyRes.json();
            const tx = (history.transactions || []).find(
              (t: { type: string; description?: string }) =>
                t.type === 'purchase' && t.description === packData.title
            );
            if (tx?.created_at) setPurchasedAt(tx.created_at);
            if (tx?.amount) setOrderAmount(Number(tx.amount));
          }
        } else if (fromPayment) {
          setState('pending');
          setError('Оплата обрабатывается. Обновите страницу через минуту.');
        } else {
          setState('error');
          setError('У вас нет доступа к этому товару. Сначала оплатите пак.');
        }
      } catch (e) {
        if (!cancelled) {
          setState('error');
          setError(e instanceof Error ? e.message : 'Ошибка загрузки');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [packId, token, searchParams, checkPurchased, confirmPayment, loadPack, headers]);

  const handleDownload = async () => {
    if (!pack) return;
    setDownloading(true);
    try {
      await downloadPurchasedPack(pack.id, { token, fallbackTitle: pack.title });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка скачивания. Попробуйте ещё раз или напишите продавцу.');
    } finally {
      setDownloading(false);
    }
  };

  const handleChatSeller = async () => {
    if (!pack?.user_id) return;
    setChatLoading(true);
    try {
      const { chat } = await chatApi.createOrGetChat(pack.user_id);
      navigate(`/chats/${chat.id}`);
    } catch {
      alert('Не удалось открыть чат. Попробуйте из раздела «Сообщения».');
    } finally {
      setChatLoading(false);
    }
  };

  const handleRate = async () => {
    if (!pack || selectedRating === 0) return;
    try {
      const res = await fetch(`/api/shop/${pack.id}/rate`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ rating: selectedRating }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка оценки');
      }
      setRatingModalOpen(false);
      setSelectedRating(0);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Не удалось отправить оценку');
    }
  };

  if (state === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.pending}>
          <div className={styles.spinner} />
          <p>{t('loading.default')}</p>
        </div>
      </div>
    );
  }

  if (state === 'error' || !pack) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p>{error || 'Что-то пошло не так'}</p>
          <button type="button" onClick={() => navigate('/shop')}>{t('purchasePage.backToShop')}</button>
        </div>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className={styles.page}>
        <div className={styles.pending}>
          <div className={styles.spinner} />
          <p>Обрабатываем оплату…</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            Обычно это занимает несколько секунд
          </p>
          <button type="button" className={styles.actionBtn} style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>
            Обновить
          </button>
        </div>
      </div>
    );
  }

  const sellerDisplay = pack.hashtag ? `@${pack.hashtag}` : pack.username || 'Продавец';

  return (
    <div className={styles.page}>
      <div className={styles.successBanner}>
        <div className={styles.successIcon}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className={styles.successTitle}>{t('purchasePage.success')}</h1>
        <p className={styles.successSubtitle}>Товар доступен для скачивания</p>
      </div>

      <div className={styles.card}>
        <div className={styles.productRow}>
          {pack.cover_url ? (
            <img src={getAssetUrl(pack.cover_url)} alt="" className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}
          <div className={styles.productInfo}>
            <h2 className={styles.productTitle}>{pack.title}</h2>
            {pack.description && (
              <p className={styles.productMeta}>{pack.description.slice(0, 120)}{pack.description.length > 120 ? '…' : ''}</p>
            )}
            <span className={styles.priceTag}>{orderAmount ?? pack.price} ₽</span>
            {pack.loops && pack.loops.length > 0 && (
              <p className={styles.productMeta}>{pack.loops.length} лупов в паке</p>
            )}
          </div>
        </div>
        <div className={styles.sellerRow}>
          {pack.avatar_url ? (
            <img src={getAssetUrl(pack.avatar_url)} alt="" className={styles.sellerAvatar} />
          ) : (
            <div className={styles.sellerAvatar} />
          )}
          <div>
            <div className={styles.sellerLabel}>Продавец</div>
            <div className={styles.sellerName}>{sellerDisplay}</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={styles.downloadBtn}
        onClick={handleDownload}
        disabled={downloading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {downloading ? t('loading.default') : t('purchasePage.download')}
      </button>

      <a
        href="https://t.me/looperamanager"
        target="_blank"
        rel="noreferrer"
        className={styles.managerLink}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
        <span>
          Вопросы по покупке? Напишите менеджеру <strong>@looperamanager</strong>
        </span>
      </a>

      <div className={styles.actionsGrid}>
        <button type="button" className={styles.actionBtnWide} onClick={handleChatSeller} disabled={chatLoading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {chatLoading ? t('loading.default') : t('purchasePage.messageSeller')}
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => navigate(profilePath(pack.username))}>
          Профиль продавца
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => setRatingModalOpen(true)}>
          Оценить товар
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => navigate('/profile#purchases')}>
          Мои покупки
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => navigate(`/shop/pack/${pack.id}`)}>
          Страница товара
        </button>
        <div className={styles.shareRow}>
          <ShareButton
            title={pack.title}
            text={t('shopPage.shareText', { title: pack.title, price: pack.price })}
            url={buildShareUrl(packSharePath(pack.id))}
            label={t('packPage.share')}
          />
        </div>
      </div>

      <div className={`${styles.card} ${styles.orderDetails}`}>
        <h3>{t('purchasePage.orderDetails')}</h3>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Статус</span>
          <span className={`${styles.detailValue} ${styles.statusPaid}`}>Оплачен</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Сумма</span>
          <span className={styles.detailValue}>{orderAmount ?? pack.price} ₽</span>
        </div>
        {purchasedAt && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Дата</span>
            <span className={styles.detailValue}>
              {new Date(purchasedAt).toLocaleString('ru-RU')}
            </span>
          </div>
        )}
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Товар</span>
          <span className={styles.detailValue}>#{pack.id}</span>
        </div>
      </div>

      <div className={styles.card}>
        <h3>{t('purchasePage.tipsTitle')}</h3>
        <ul className={styles.tips}>
          <li>Сохраните архив — повторное скачивание доступно в профиле</li>
          <li>Если файл не открывается или неполный — напишите продавцу в чат</li>
          <li>
            По вопросам оплаты и доступа: Telegram{' '}
            <a href="https://t.me/looperamanager" target="_blank" rel="noreferrer">@looperamanager</a>
            {' '}или support@loopera.ru
          </li>
        </ul>
      </div>

      <Modal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title="Оцените покупку"
        onConfirm={handleRate}
        confirmText="Отправить"
      >
        <p style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{pack.title}</p>
        <div className={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`${styles.starBtn} ${selectedRating >= star ? styles.starBtnActive : ''}`}
              onClick={() => setSelectedRating(star)}
            >
              ★
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseSuccess;
