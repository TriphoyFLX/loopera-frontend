import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import PackPurchaseModal, { type PurchasePack } from '../components/PackPurchaseModal';
import PackPrice from '../components/PackPrice';
import MobilePageHeader from '../components/MobilePageHeader';
import MobileSearchBar from '../components/MobileSearchBar';
import { getAssetUrl } from '../utils/urls';
import { downloadPurchasedPack } from '../utils/shopDownload';
import { useAuthGate } from '../hooks/useAuthGate';
import { useI18n } from '../i18n/useI18n';
import { LOOP_COVER_COLORS } from '../utils/loopCover';
import styles from './Shop.module.css';

const QUICK_TAGS = ['trap', 'drill', 'melody', 'drums', 'midi', 'osamason'];

type ViewMode = 'grid' | 'list';

interface Pack {
  id: string | number;
  title: string;
  description?: string;
  price: number;
  original_price?: number;
  final_price?: number;
  discount_percent?: number;
  has_discount?: boolean;
  preview_url?: string;
  voice_tag?: string;
  hashtag?: string;
  username?: string;
  cover_url?: string;
  loops_count?: number;
  avg_rating: number;
  rating_count: number;
  sales_count: number;
  created_at: string;
}

const coverColor = (id: string | number) => {
  const n = typeof id === 'number' ? id : Number(id) || 0;
  return LOOP_COVER_COLORS[Math.abs(Math.trunc(n)) % LOOP_COVER_COLORS.length];
};

const Shop = () => {
  const { t } = useI18n();
  const { requireAuth } = useAuthGate();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search') || '';

  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchFromUrl);
  const [search, setSearch] = useState(searchFromUrl);
  const [activeTag, setActiveTag] = useState(searchFromUrl);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [view, setView] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingPack, setPendingPack] = useState<PurchasePack | null>(null);
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchValue = useMemo(() => {
    if (activeTag) return activeTag;
    return search.trim();
  }, [activeTag, search]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!searchFromUrl) return;
    setQuery(searchFromUrl);
    setSearch(searchFromUrl);
    setActiveTag(searchFromUrl);
    setPage(1);
  }, [searchFromUrl]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(page),
        limit: '24',
        sort,
        order,
        ...(searchValue && { search: searchValue }),
      });
      const res = await fetch(`/api/shop?${params}`);
      if (!res.ok) throw new Error('Не удалось загрузить товары');
      const data = await res.json();
      setPacks(data.packs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      setPacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPacks();
  }, [sort, order, page, searchValue]);

  const applySearch = (value?: string) => {
    const next = (value ?? query).trim();
    setActiveTag(value !== undefined ? next : '');
    setQuery(next);
    setSearch(next);
    setPage(1);
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    setActiveTag('');
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, 350);
  };

  const handleBuyPack = (packId: string) => {
    const pack = packs.find((p) => String(p.id) === String(packId));
    if (!pack) return;
    requireAuth(() => {
      setBuyError(null);
      setPendingPack(pack);
      setConfirmModalOpen(true);
    }, 'buy');
  };

  const handleConfirmPurchase = async (method: 'card' | 'balance') => {
    const pack = pendingPack;
    if (!pack) return;
    const packId = String(pack.id);
    const token = localStorage.getItem('token');
    setBuyBusy(true);
    setBuyError(null);

    try {
      const res = await fetch(`/api/shop/${packId}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_method: method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('shopPage.paymentError'));
      if (data.confirmation_url) {
        localStorage.setItem('pending_payment_id', data.payment_id || '');
        window.location.href = data.confirmation_url;
        return;
      }
      setConfirmModalOpen(false);
      setPendingPack(null);
      setModalMessage('Пак куплен');
      setModalOpen(true);
      try {
        await downloadPurchasedPack(packId, { token, fallbackTitle: pack.title });
      } catch {
        /* ignore */
      }
      void fetchPacks();
      window.location.href = '/profile#purchases';
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : t('shopPage.paymentError'));
    } finally {
      setBuyBusy(false);
    }
  };

  const playPreview = (packId: string, previewUrl: string) => {
    if (!previewUrl) return;
    audioRef.current?.pause();
    audioRef.current = null;
    if (playingPreview === packId) {
      setPlayingPreview(null);
      return;
    }
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    void audio.play();
    audio.onended = () => setPlayingPreview(null);
    setPlayingPreview(packId);
  };

  const openPack = (id: string | number) => navigate(`/shop/pack/${id}`);

  const renderCover = (pack: Pack) =>
    pack.cover_url ? (
      <img src={getAssetUrl(pack.cover_url)} alt="" />
    ) : (
      <div className={styles.coverSolid} style={{ backgroundColor: coverColor(pack.id) }} />
    );

  const isDrumPack = (pack: Pack) => {
    const hay = `${pack.title} ${pack.hashtag || ''} ${pack.voice_tag || ''} ${pack.description || ''}`.toLowerCase();
    return /drum|kit|oneshot|percussion|808|hats/.test(hay);
  };

  const drumPacks = useMemo(() => {
    const drums = packs.filter(isDrumPack);
    return drums.length >= 2 ? drums : packs.slice(0, Math.ceil(packs.length / 2) || packs.length);
  }, [packs]);

  const presetPacks = useMemo(() => {
    const presets = packs.filter((p) => !isDrumPack(p));
    return presets.length >= 2 ? presets : packs.slice(Math.floor(packs.length / 2));
  }, [packs]);

  const formatPrice = (pack: Pack) => {
    const price = pack.final_price ?? pack.price;
    return `₽${Number(price || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderMobileCarousel = (title: string, items: Pack[]) => (
    <section className={styles.mobileSection}>
      <div className={styles.mobileSectionHead}>
        <h2>{title}</h2>
        <Link to="/shop">Смотреть все</Link>
      </div>
      <div className={styles.mobileRail}>
        {items.map((pack) => (
          <article
            key={`${title}-${pack.id}`}
            className={styles.mobileCard}
            onClick={() => openPack(pack.id)}
          >
            <div className={styles.mobileCover}>{renderCover(pack)}</div>
            <h3 className={styles.mobileCardTitle}>{pack.title}</h3>
            <p className={styles.mobileCardAuthor}>{pack.username || pack.hashtag || 'loopera'}</p>
            <button
              type="button"
              className={styles.mobileBuy}
              onClick={(e) => {
                e.stopPropagation();
                handleBuyPack(String(pack.id));
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M6 7h12l-1 13H7L6 7z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              <span>{formatPrice(pack)}</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  return (
    <>
      <div className={styles.page}>
        <div className={styles.mobileChrome}>
          <MobilePageHeader title="Маркетплейс" align="start" />
          <MobileSearchBar
            initialQuery={query}
            filterTo="/shop"
            onSubmitQuery={(q) => applySearch(q)}
          />
          <Link to="/create-pack" className={styles.mobileCreateBtn}>
            Создать пак
          </Link>
          {!loading && packs.length > 0 && (
            <>
              {renderMobileCarousel('Drum Kits', drumPacks)}
              {renderMobileCarousel('Presets', presetPacks)}
            </>
          )}
          {loading && packs.length === 0 && <div className={styles.state}>Загрузка…</div>}
        </div>

        <header className={styles.head}>
          <h1 className={styles.title}>Маркетплейс</h1>
          <Link to="/create-pack" className={styles.createBtn}>
            Создать пак
          </Link>
        </header>

        <div className={`${styles.searchRow} ${styles.desktopShop}`}>
          <form
            className={styles.search}
            onSubmit={(e) => {
              e.preventDefault();
              applySearch(query);
            }}
          >
            <span className={styles.searchIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Искать паки"
              aria-label="Искать паки"
            />
          </form>

          <div className={styles.tags}>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.tag} ${activeTag.toLowerCase() === tag ? styles.tagActive : ''}`}
                onClick={() => applySearch(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.filters} ${styles.desktopShop}`}>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            aria-label="Сортировка"
          >
            <option value="created_at">Новые</option>
            <option value="sales_count">Популярные</option>
            <option value="avg_rating">По рейтингу</option>
            <option value="price">По цене</option>
            <option value="title">По названию</option>
          </select>

          <select
            value={order}
            onChange={(e) => {
              setOrder(e.target.value);
              setPage(1);
            }}
            aria-label="Порядок"
          >
            <option value="DESC">По убыванию</option>
            <option value="ASC">По возрастанию</option>
          </select>

          <div className={styles.viewToggle} role="group" aria-label="Вид">
            <button
              type="button"
              className={view === 'list' ? styles.active : ''}
              onClick={() => setView('list')}
              aria-label="Список"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <button
              type="button"
              className={view === 'grid' ? styles.active : ''}
              onClick={() => setView('grid')}
              aria-label="Сетка"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className={`${styles.state} ${styles.desktopShop}`}>
            <p>{error}</p>
            <button type="button" onClick={() => void fetchPacks()}>
              Попробовать снова
            </button>
          </div>
        )}

        {loading && packs.length === 0 ? (
          <div className={`${styles.state} ${styles.desktopShop}`}>Загрузка…</div>
        ) : packs.length === 0 ? (
          <div className={`${styles.state} ${styles.desktopShop}`}>Ничего не найдено</div>
        ) : view === 'list' ? (
          <div className={`${styles.list} ${styles.desktopShop}`}>
            {packs.map((pack, i) => (
              <div
                key={pack.id}
                className={styles.row}
                onClick={() => openPack(pack.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openPack(pack.id);
                }}
              >
                <span className={styles.rowIndex}>{i + 1 + (page - 1) * 24}</span>
                <div className={styles.rowCover}>{renderCover(pack)}</div>
                <div className={styles.rowInfo}>
                  <p className={styles.rowTitle}>{pack.title}</p>
                  <p className={styles.rowAuthor}>@{pack.username || pack.hashtag || 'loopera'}</p>
                </div>
                <div className={styles.rowPrice}>
                  <PackPrice pack={pack} size="sm" />
                </div>
                <button
                  type="button"
                  className={styles.rowBuy}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyPack(String(pack.id));
                  }}
                >
                  Купить
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${styles.grid} ${styles.desktopShop}`}>
            {packs.map((pack) => {
              const isPlaying = playingPreview === String(pack.id);
              return (
                <article
                  key={pack.id}
                  className={styles.card}
                  onClick={() => openPack(pack.id)}
                >
                  <div className={styles.cardCover}>
                    {(pack.has_discount || (pack.discount_percent ?? 0) > 0) && (
                      <span className={styles.discount}>-{pack.discount_percent}%</span>
                    )}
                    {renderCover(pack)}
                    {pack.preview_url && (
                      <button
                        type="button"
                        className={styles.playBtn}
                        aria-label={isPlaying ? 'Пауза' : 'Превью'}
                        onClick={(e) => {
                          e.stopPropagation();
                          playPreview(String(pack.id), pack.preview_url!);
                        }}
                      >
                        {isPlaying ? (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="5" width="4" height="14" rx="1" />
                            <rect x="14" y="5" width="4" height="14" rx="1" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <h3 className={styles.cardTitle}>{pack.title}</h3>
                  <p className={styles.cardAuthor}>@{pack.username || pack.hashtag || 'loopera'}</p>
                  <div className={styles.cardFooter}>
                    <button
                      type="button"
                      className={styles.buyBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyPack(String(pack.id));
                      }}
                    >
                      Купить
                    </button>
                    <span className={styles.priceMuted}>
                      <PackPrice pack={pack} size="sm" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.more}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Назад
            </button>
            <span className={styles.pageInfo}>
              {page} / {totalPages} · {total}
            </span>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Далее
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <p>{modalMessage}</p>
      </Modal>

      <PackPurchaseModal
        open={confirmModalOpen}
        pack={pendingPack}
        onClose={() => {
          if (buyBusy) return;
          setConfirmModalOpen(false);
          setPendingPack(null);
          setBuyError(null);
        }}
        onPay={handleConfirmPurchase}
        busy={buyBusy}
        error={buyError}
      />
    </>
  );
};

export default Shop;
