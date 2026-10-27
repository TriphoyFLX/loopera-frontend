import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useI18n } from '../i18n/useI18n';
import { getAssetUrl, getUploadsUrl } from '../utils/urls';
import { profilePath, packSharePath, parsePackId } from '../utils/routes';
import { buildShareUrl } from '../utils/share';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import Modal from '../components/Modal';
import PackPurchaseModal from '../components/PackPurchaseModal';
import { getPackChargePrice } from '../components/PackPrice';
import { downloadPurchasedPack } from '../utils/shopDownload';
import styles from './Pack.module.css';

interface PackData {
  id: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  final_price?: number;
  discount_percent?: number;
  has_discount?: boolean;
  preview_url?: string;
  preview_url_2?: string;
  voice_tag?: string;
  hashtag?: string;
  username?: string;
  cover_url?: string;
  user_id?: number;
  avg_rating: number;
  rating_count: number;
  sales_count?: number;
  created_at: string;
  loops_count?: number;
}

interface LoopItem {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  bpm?: number;
  key?: string;
  genre?: string;
}

const formatPublished = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Янв.', 'Фев.', 'Мар.', 'Апр.', 'Мая', 'Июн.', 'Июл.', 'Авг.', 'Сен.', 'Окт.', 'Ноя.', 'Дек.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const coverColor = (id: string | number) => {
  const n = typeof id === 'number' ? id : Number(id) || 0;
  return LOOP_COVER_COLORS[Math.abs(Math.trunc(n)) % LOOP_COVER_COLORS.length];
};

const Pack = () => {
  const { packId: rawPackId } = useParams<{ packId: string }>();
  const packId = parsePackId(rawPackId);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { requireAuth } = useAuthGate();
  const { t } = useI18n();

  const [pack, setPack] = useState<PackData | null>(null);
  const [loops, setLoops] = useState<LoopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const fetchPack = async () => {
    if (!packId) {
      setError(t('packPage.notFound'));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/shop/${packId}`, { headers: getHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Не удалось загрузить пак');
      setPack(data);
      setLoops(data.loops || []);

      if (currentUser) {
        const purchaseResponse = await fetch('/api/shop/my/packs', { headers: getHeaders() });
        if (purchaseResponse.ok) {
          const purchaseData = await purchaseResponse.json();
          setIsPurchased((purchaseData.packs || []).some((p: PackData) => String(p.id) === String(packId)));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить пак');
      setPack(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rawPackId && packId && rawPackId !== packId) {
      navigate(`/shop/pack/${packId}`, { replace: true });
      return;
    }
    void fetchPack();
    return () => {
      audioRef.current?.pause();
    };
  }, [rawPackId, packId, currentUser?.id]);

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
    setCurrentlyPlaying(null);
    setPreviewPlaying(false);
  };

  const playPreview = () => {
    if (!pack?.preview_url) return;
    if (previewPlaying) {
      stopAudio();
      return;
    }
    stopAudio();
    const audio = new Audio(pack.preview_url);
    audioRef.current = audio;
    audio.onended = () => setPreviewPlaying(false);
    void audio.play();
    setPreviewPlaying(true);
  };

  const handlePlayLoop = async (loop: LoopItem) => {
    if (currentlyPlaying === loop.id && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    stopAudio();
    setCurrentlyPlaying(loop.id);
    setIsPlaying(true);
    const audio = new Audio(getUploadsUrl(loop.filename));
    audioRef.current = audio;
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    };
    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
      setCurrentlyPlaying(null);
    }
  };

  const handleBuyPack = () => {
    if (isPurchased) return;
    requireAuth(() => {
      setBuyError(null);
      setBuyModalOpen(true);
    }, 'buy');
  };

  const handleConfirmBuy = async (method: 'card' | 'balance') => {
    if (!packId) return;
    setBuyBusy(true);
    setBuyError(null);
    try {
      const response = await fetch(`/api/shop/${packId}/buy`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ payment_method: method }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to purchase pack');
      if (data.confirmation_url) {
        localStorage.setItem('pending_payment_id', data.payment_id || '');
        window.location.href = data.confirmation_url;
        return;
      }
      setBuyModalOpen(false);
      setIsPurchased(true);
      try {
        const token = localStorage.getItem('token');
        await downloadPurchasedPack(packId, {
          token,
          fallbackTitle: pack?.title,
        });
      } catch {
        /* ignore */
      }
      setRatingModalOpen(true);
    } catch (err: unknown) {
      setBuyError(err instanceof Error ? err.message : t('shopPage.paymentError'));
    } finally {
      setBuyBusy(false);
    }
  };

  const handleRatePack = async () => {
    if (selectedRating === 0) return;
    try {
      const response = await fetch(`/api/shop/${packId}/rate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rating: selectedRating }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to rate pack');
      setRatingModalOpen(false);
      setSelectedRating(0);
      setInfoModalMessage('Спасибо за вашу оценку!');
      setInfoModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Не удалось оценить пак');
    }
  };

  const copyLink = async () => {
    if (!pack) return;
    try {
      await navigator.clipboard.writeText(buildShareUrl(packSharePath(pack.id)));
      setMenuOpen(false);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Загрузка…</p>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/shop')}>
          ← К маркетплейсу
        </button>
        <p className={styles.error}>{error || t('packPage.notFound')}</p>
      </div>
    );
  }

  const coverUrl = pack.cover_url ? getAssetUrl(pack.cover_url) : null;
  const tags = [pack.voice_tag, pack.hashtag].filter(Boolean) as string[];
  const price = getPackChargePrice(pack);
  const sales = Number(pack.sales_count || 0);
  const rating = Number(pack.avg_rating || 0);

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Маркетплейс</h1>
      </header>

      <section className={styles.hero}>
        <button
          type="button"
          className={styles.coverWrap}
          onClick={pack.preview_url ? playPreview : undefined}
          aria-label={previewPlaying ? 'Пауза' : 'Превью'}
        >
          <div
            className={styles.cover}
            style={
              coverUrl
                ? { backgroundImage: `url(${coverUrl})` }
                : { backgroundColor: coverColor(pack.id) }
            }
          />
          <div className={styles.coverFade} />
          <div className={styles.coverMeta}>
            <span className={styles.coverTitle}>{pack.title}</span>
            <Link
              to={profilePath(pack.username)}
              className={styles.coverAuthor}
              onClick={(e) => e.stopPropagation()}
            >
              @{pack.username || pack.hashtag || 'loopera'}
            </Link>
          </div>
          {pack.preview_url && (
            <span className={styles.coverPlay}>
              {previewPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </span>
          )}
          {(pack.has_discount || (pack.discount_percent ?? 0) > 0) && (
            <span className={styles.discount}>-{pack.discount_percent}%</span>
          )}
        </button>

        <div className={styles.heroBody}>
          <div className={styles.blockLabel}>Описание</div>
          <p className={styles.description}>
            {pack.description || 'Саунд-пак для битов на Loopera.'}
          </p>

          {tags.length > 0 && (
            <>
              <div className={styles.blockLabel}>Теги</div>
              <div className={styles.tags}>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.tag}
                    onClick={() => navigate(`/shop?search=${encodeURIComponent(tag)}`)}
                  >
                    #{tag.replace(/^#/, '')}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{price} ₽</strong>
              <span>Цена</span>
            </div>
            <div className={styles.stat}>
              <strong>{loops.length || pack.loops_count || 0}</strong>
              <span>Лупов</span>
            </div>
            <div className={styles.stat}>
              <strong>{sales}</strong>
              <span>Продаж</span>
            </div>
            <div className={styles.stat}>
              <strong>{rating > 0 ? rating.toFixed(1) : '—'}</strong>
              <span>Рейтинг</span>
            </div>
          </div>

          <div className={styles.metaLine}>
            <span>Опубликован {formatPublished(pack.created_at)}</span>
          </div>

          <div className={styles.heroActions}>
            {isPurchased ? (
              <div className={styles.owned}>Куплено</div>
            ) : (
              <button type="button" className={styles.buyBtn} onClick={handleBuyPack}>
                Купить за {price} ₽
              </button>
            )}

            <div className={styles.moreWrap}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Ещё"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
              </button>
              {menuOpen && (
                <div className={styles.menu}>
                  <button type="button" onClick={copyLink}>Копировать ссылку</button>
                  <Link to={profilePath(pack.username)} onClick={() => setMenuOpen(false)}>
                    Профиль автора
                  </Link>
                  {isPurchased && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setRatingModalOpen(true);
                      }}
                    >
                      Оценить пак
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {loops.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Лупы в паке</h2>
          <div className={styles.loopsBox}>
            {loops.map((loop, i) => {
              const playing = currentlyPlaying === loop.id && isPlaying;
              const meta = [loop.bpm ? `${loop.bpm}bpm` : null, loop.key || null, loop.genre || null]
                .filter(Boolean)
                .join(' ');
              return (
                <div key={loop.id} className={`${styles.loopRow} ${playing ? styles.loopPlaying : ''}`}>
                  <button
                    type="button"
                    className={styles.loopIndex}
                    onClick={() => void handlePlayLoop(loop)}
                    aria-label={playing ? 'Пауза' : 'Играть'}
                  >
                    {playing ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <>
                        <span className={styles.loopNum}>{i + 1}</span>
                        <svg viewBox="0 0 24 24" fill="currentColor" className={styles.loopPlayIcon}>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </>
                    )}
                  </button>

                  <div
                    className={styles.loopCover}
                    style={{ backgroundColor: coverColor(loop.id) }}
                    aria-hidden
                  />

                  <div className={styles.loopInfo}>
                    <span className={styles.loopTitle}>{loop.title}</span>
                    {meta && <span className={styles.loopMeta}>{meta}</span>}
                  </div>

                  {isPurchased ? (
                    <a
                      className={styles.loopDownload}
                      href={getUploadsUrl(loop.filename)}
                      download={loop.original_name}
                    >
                      Скачать
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={styles.loopPlayBtn}
                      onClick={() => void handlePlayLoop(loop)}
                    >
                      {playing ? 'Пауза' : 'Слушать'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <PackPurchaseModal
        open={buyModalOpen}
        pack={pack}
        onClose={() => !buyBusy && setBuyModalOpen(false)}
        onPay={handleConfirmBuy}
        busy={buyBusy}
        error={buyError}
      />

      <Modal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)}>
        <p>{infoModalMessage}</p>
      </Modal>

      <Modal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        title={t('packPage.ratingTitle')}
        onConfirm={handleRatePack}
        confirmText={t('verification.confirm')}
        cancelText={t('shopPage.cancel')}
      >
        <div className={styles.ratingModal}>
          <p>Оцените пак от 1 до 5</p>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.star} ${star <= selectedRating ? styles.starOn : ''}`}
                onClick={() => setSelectedRating(star)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Pack;
