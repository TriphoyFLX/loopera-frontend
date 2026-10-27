import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssetUrl } from '../utils/urls';
import { profilePath } from '../utils/routes';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import { getPackChargePrice, type PackPriceFields } from './PackPrice';
import styles from './PackPurchaseModal.module.css';

export type PurchasePack = PackPriceFields & {
  id: string | number;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  username?: string | null;
  hashtag?: string | null;
  loops_count?: number | null;
  sales_count?: number | null;
  avg_rating?: number | null;
  rating_count?: number | null;
};

type Props = {
  open: boolean;
  pack: PurchasePack | null;
  onClose: () => void;
  onPay: (method: 'card' | 'balance') => Promise<void> | void;
  busy?: boolean;
  error?: string | null;
};

const coverColor = (id: string | number) => {
  const n = typeof id === 'number' ? id : Number(id) || 0;
  return LOOP_COVER_COLORS[Math.abs(Math.trunc(n)) % LOOP_COVER_COLORS.length];
};

const PackPurchaseModal = ({ open, pack, onClose, onPay, busy = false, error = null }: Props) => {
  const [method, setMethod] = useState<'card' | 'balance'>('card');
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod('card');
    let cancelled = false;
    const load = async () => {
      setBalanceLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/shop/balance/my', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('balance');
        const data = await res.json();
        if (!cancelled) setBalance(Number(data.available_balance || 0));
      } catch {
        if (!cancelled) setBalance(0);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, pack?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open || !pack) return null;

  const price = getPackChargePrice(pack);
  const original = pack.original_price ?? pack.price;
  const hasDiscount = (pack.discount_percent ?? 0) > 0 && price < original;
  const cover = pack.cover_url ? getAssetUrl(pack.cover_url) : '';
  const canPayBalance = balance != null && balance >= price;
  const shortfall = balance != null ? Math.max(0, price - balance) : price;

  return (
    <div className={styles.overlay} onClick={() => !busy && onClose()} role="presentation">
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
      >
        <button type="button" className={styles.close} onClick={onClose} disabled={busy} aria-label="Закрыть">
          ×
        </button>

        <div className={styles.hero}>
          <div
            className={styles.cover}
            style={
              cover
                ? { backgroundImage: `url(${cover})` }
                : { backgroundColor: coverColor(pack.id) }
            }
          />
          <div className={styles.heroFade} aria-hidden />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Покупка пака</p>
            <h2 id="purchase-title" className={styles.title}>{pack.title}</h2>
            {pack.username && (
              <Link to={profilePath(pack.username)} className={styles.author} onClick={onClose}>
                @{pack.username}
                {pack.hashtag ? ` · #${pack.hashtag}` : ''}
              </Link>
            )}
          </div>
        </div>

        <div className={styles.body}>
          {pack.description?.trim() ? (
            <p className={styles.desc}>{pack.description.trim()}</p>
          ) : (
            <p className={styles.descMuted}>Автор не добавил описание — после оплаты пак сразу появится в покупках.</p>
          )}

          <div className={styles.stats}>
            {pack.loops_count != null && (
              <div className={styles.stat}>
                <strong>{pack.loops_count}</strong>
                <span>лупов</span>
              </div>
            )}
            <div className={styles.stat}>
              <strong>{pack.sales_count ?? 0}</strong>
              <span>продаж</span>
            </div>
            <div className={styles.stat}>
              <strong>
                {(pack.avg_rating || 0) > 0 ? Number(pack.avg_rating).toFixed(1) : '—'}
              </strong>
              <span>рейтинг</span>
            </div>
          </div>

          <div className={styles.priceBox}>
            <div>
              <p className={styles.priceLabel}>К оплате</p>
              <div className={styles.priceRow}>
                <span className={styles.price}>{price.toLocaleString('ru-RU')} ₽</span>
                {hasDiscount && (
                  <span className={styles.oldPrice}>{original.toLocaleString('ru-RU')} ₽</span>
                )}
              </div>
            </div>
            {hasDiscount && (
              <span className={styles.badge}>−{pack.discount_percent}%</span>
            )}
          </div>

          <div className={styles.methods}>
            <p className={styles.methodsLabel}>Способ оплаты</p>
            <button
              type="button"
              className={`${styles.method} ${method === 'card' ? styles.methodOn : ''}`}
              onClick={() => setMethod('card')}
              disabled={busy}
            >
              <span className={styles.methodTitle}>Банковская карта</span>
              <span className={styles.methodHint}>ЮKassa · мгновенно после оплаты</span>
            </button>
            <button
              type="button"
              className={`${styles.method} ${method === 'balance' ? styles.methodOn : ''}`}
              onClick={() => setMethod('balance')}
              disabled={busy}
            >
              <span className={styles.methodTitle}>Баланс Loopera</span>
              <span className={styles.methodHint}>
                {balanceLoading
                  ? 'Загрузка баланса…'
                  : `Доступно: ${(balance ?? 0).toLocaleString('ru-RU')} ₽`}
              </span>
            </button>
          </div>

          {method === 'balance' && !canPayBalance && !balanceLoading && (
            <p className={styles.warn}>
              Не хватает {shortfall.toLocaleString('ru-RU')} ₽. Пополни баланс в профиле или оплати картой.
            </p>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <ul className={styles.perks}>
            <li>Мгновенный доступ к скачиванию</li>
            <li>Пак сохраняется в разделе «Покупки»</li>
            <li>Безопасная оплата через ЮKassa</li>
          </ul>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancel} onClick={onClose} disabled={busy}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.pay}
            disabled={busy || (method === 'balance' && !canPayBalance)}
            onClick={() => void onPay(method)}
          >
            {busy
              ? 'Обработка…'
              : method === 'balance'
                ? `Списать ${price.toLocaleString('ru-RU')} ₽`
                : `Оплатить ${price.toLocaleString('ru-RU')} ₽`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackPurchaseModal;
