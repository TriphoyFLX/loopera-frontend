import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import { useI18n } from '../i18n/useI18n';
import { api } from '../utils/api';
import { likeApi } from '../utils/likeApi';
import { profilePath, loopDetailPath, loopSharePath } from '../utils/routes';
import { buildShareUrl } from '../utils/share';
import { getLoopCoverUrl, getLoopCoverColor } from '../utils/loopCover';
import { getAssetUrl } from '../utils/urls';
import LoopCover from '../components/LoopCover';
import DownloadRulesModal from '../components/DownloadRulesModal';
import PaywallModal, { isPlanLimitError, type PaywallAction } from '../components/PaywallModal';
import AuthPrompt from '../components/AuthPrompt';
import styles from './LoopDetail.module.css';

type LoopDetailData = {
  id: number;
  title: string;
  filename: string;
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  tags?: string[] | string;
  duration?: number;
  author?: string;
  author_id?: number;
  user_id?: number;
  created_at?: string;
  like_count?: number;
  comment_count?: number;
  download_count?: number;
  cover_url?: string | null;
  description?: string | null;
};

type Comment = {
  id: number;
  body: string;
  created_at: string;
  likes_count?: number;
  liked_by_me?: boolean;
  author: { id: number; username: string; avatar_url?: string };
};

const parseTags = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return raw.split(/[,#\s]+/).map((t) => t.replace(/^#/, '').trim()).filter(Boolean);
    }
  }
  return [];
};

const formatPlays = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return String(n);
};

const formatPublished = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Янв.', 'Фев.', 'Мар.', 'Апр.', 'Мая', 'Июн.', 'Июл.', 'Авг.', 'Сен.', 'Окт.', 'Ноя.', 'Дек.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const RelatedCard = ({
  loop,
  queue,
  onDownload,
}: {
  loop: any;
  queue: any[];
  onDownload: (loop: any) => void;
}) => {
  const navigate = useNavigate();
  const player = useLoopPlayerOptional();
  const meta = [loop.bpm ? `${loop.bpm}bpm` : null, loop.key || null].filter(Boolean).join(' ');

  return (
    <article className={styles.relCard}>
      <div className={styles.relCover}>
        <button
          type="button"
          className={styles.relCoverOpen}
          onClick={() => navigate(loopDetailPath(loop.id))}
          aria-label={loop.title}
        >
          <LoopCover loop={loop} rounded="xl" alt="" />
        </button>
        <button
          type="button"
          className={styles.relPlay}
          onClick={() => player?.play(loop, queue)}
          aria-label="Играть"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </button>
      </div>
      <button type="button" className={styles.relTitle} onClick={() => navigate(loopDetailPath(loop.id))}>
        {loop.title || 'Untitled'}
      </button>
      <button
        type="button"
        className={styles.relAuthor}
        onClick={() => { window.location.href = profilePath(loop.author); }}
      >
        {loop.author || 'loopera'}
      </button>
      <div className={styles.relFooter}>
        <button type="button" className={styles.relDownload} onClick={() => onDownload(loop)}>
          Скачать
        </button>
        <span className={styles.relMeta}>{meta || '—'}</span>
      </div>
    </article>
  );
};

const LoopDetail = () => {
  const { loopId } = useParams<{ loopId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { token, user, isAuthenticated } = useAuth();
  const { requireAuth } = useAuthGate();
  const player = useLoopPlayerOptional();

  const [loop, setLoop] = useState<LoopDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [authorLoops, setAuthorLoops] = useState<any[]>([]);
  const [similarLoops, setSimilarLoops] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState<LoopDetailData | any | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallAction, setPaywallAction] = useState<PaywallAction>('download');
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteBudget, setPromoteBudget] = useState('100');
  const [promoteBusy, setPromoteBusy] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState<string | null>(null);
  const [adMeta, setAdMeta] = useState<{ cost_per_impression: number; min_budget: number } | null>(null);

  const id = Number(loopId);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError(t('loopDetail.invalid'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.getLoopById(id);
      const current = data.loop as LoopDetailData;
      setLoop(current);
      setLikesCount(current?.like_count || 0);
      setCommentTotal(current?.comment_count || 0);

      const commentsData = await api.getLoopComments(id);
      setComments(commentsData.comments || []);
      setCommentTotal(commentsData.total ?? current?.comment_count ?? 0);

      if (user?.id) {
        try {
          const status = await likeApi.getLikeStatus(id);
          setIsLiked(status.liked);
          setLikesCount(status.likes_count);
        } catch {
          /* ignore */
        }
      }

      const authorKey = current.author || current.user_id;
      if (authorKey) {
        try {
          const authorData = await api.getLoopsByUser(authorKey, 1, 8, token || undefined);
          setAuthorLoops((authorData.loops || []).filter((l: any) => l.id !== current.id).slice(0, 4));
        } catch {
          setAuthorLoops([]);
        }
      }

      try {
        const similar = await api.getAllLoops(
          1,
          8,
          token || undefined,
          'trending',
          undefined,
          current.genre || undefined,
        );
        setSimilarLoops((similar.loops || []).filter((l: any) => l.id !== current.id).slice(0, 4));
      } catch {
        setSimilarLoops([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loopDetail.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t, user?.id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const tags = useMemo(() => parseTags(loop?.tags), [loop?.tags]);

  const description = useMemo(() => {
    if (!loop) return '';
    if (loop.description) return loop.description;
    const parts = [
      loop.genre ? `${loop.genre} type beat` : null,
      tags.length ? `с тегами ${tags.slice(0, 3).map((t) => `#${t}`).join(' ')}` : null,
    ].filter(Boolean);
    return parts.length
      ? `${loop.title} — ${parts.join(', ')}.`
      : 'Луп для бита на Loopera.';
  }, [loop, tags]);

  const coverUrl = loop ? getLoopCoverUrl(loop) : null;
  const coverColor = getLoopCoverColor(loop?.id ?? 1);
  const isPlaying = Boolean(loop && player?.isCurrent(loop.id) && player.isPlaying);

  const openDownload = (target: any) => {
    if (!requireAuth(() => {}, 'download')) return;
    setDownloadTarget(target);
    setShowDownloadModal(true);
  };

  const handleDownloadConfirm = async () => {
    if (!token || !downloadTarget) return;
    setDownloading(true);
    try {
      await api.downloadLoop(downloadTarget.id, token, downloadTarget.title);
      setShowDownloadModal(false);
    } catch (err) {
      if (isPlanLimitError(err)) {
        setPaywallAction('download');
        setPaywallMessage(err instanceof Error ? err.message : undefined);
        setPaywallOpen(true);
        setShowDownloadModal(false);
      } else {
        alert(err instanceof Error ? err.message : t('loopDetail.downloadError'));
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleLike = async () => {
    if (!requireAuth(() => {}, 'like')) return;
    try {
      const result = await likeApi.toggleLike(id);
      setIsLiked(result.liked);
      setLikesCount(result.likes_count);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlay = () => {
    if (!loop) return;
    player?.play(loop, [loop, ...authorLoops, ...similarLoops]);
  };

  const handleSendComment = async () => {
    if (!requireAuth(() => {}, 'default')) return;
    if (!token || !commentText.trim()) return;
    setCommentSending(true);
    try {
      const data = await api.addLoopComment(id, commentText.trim(), token);
      setComments((prev) => [
        { ...data.comment, likes_count: 0, liked_by_me: false },
        ...prev,
      ]);
      setCommentTotal(data.comment_count ?? commentTotal + 1);
      setCommentText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : t('loopDetail.commentError'));
    } finally {
      setCommentSending(false);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (!requireAuth(() => {}, 'like')) return;
    if (!token) return;
    try {
      const result = await api.toggleLoopCommentLike(commentId, token);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, liked_by_me: result.liked, likes_count: result.likes_count }
            : c,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(loopSharePath(id)));
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

  if (error || !loop) {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/loops')}>
          ← К лупам
        </button>
        <p className={styles.error}>{error || t('loopDetail.notFound')}</p>
      </div>
    );
  }

  const plays = Number(loop.download_count || 0);
  const isOwner = Boolean(
    user &&
      (Number(user.id) === Number(loop.user_id) ||
        Number(user.id) === Number(loop.author_id) ||
        (user.username && loop.author && user.username === loop.author)),
  );

  const openPromote = async () => {
    setPromoteMsg(null);
    setPromoteOpen(true);
    try {
      const meta = await api.getLoopAdsMeta();
      setAdMeta({
        cost_per_impression: meta.cost_per_impression,
        min_budget: meta.min_budget,
      });
      setPromoteBudget(String(Math.max(meta.min_budget || 50, 100)));
    } catch {
      setAdMeta({ cost_per_impression: 2, min_budget: 50 });
    }
  };

  const submitPromote = async () => {
    if (!loop) return;
    const budget = parseInt(promoteBudget, 10);
    if (!Number.isFinite(budget)) {
      setPromoteMsg('Укажи бюджет');
      return;
    }
    try {
      setPromoteBusy(true);
      setPromoteMsg(null);
      const res = await api.createLoopAd(loop.id, budget);
      const remaining = res?.remaining ?? budget;
      const cost = res?.cost_per_impression ?? adMeta?.cost_per_impression ?? 2;
      setPromoteMsg(
        `Кампания запущена. ~${Math.floor(remaining / cost)} показов в ленте (Ad).`,
      );
    } catch (err) {
      setPromoteMsg(err instanceof Error ? err.message : 'Не удалось запустить рекламу');
    } finally {
      setPromoteBusy(false);
    }
  };

  const handleDeleteOwnLoop = async () => {
    if (!token || !loop) return;
    if (!window.confirm(t('profilePage.deleteLoopConfirm'))) return;
    try {
      await api.deleteLoop(loop.id, token);
      navigate('/profile', { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : t('profilePage.deleteLoopError'));
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Лупы</h1>
      </header>

      {/* Mobile Figma detail shell */}
      <section className={styles.mobileDetail}>
        <div
          className={styles.mobileHero}
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : { backgroundColor: coverColor }}
        >
          <div className={styles.mobileHeroFade} />
          <button type="button" className={styles.mobileTopBtn} onClick={() => navigate(-1)} aria-label="Назад">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.mobileTopBtn} ${styles.mobileTopBtnRight}`}
            aria-label="Ещё"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="12" cy="19" r="1.6" />
            </svg>
          </button>
          {menuOpen && (
            <div className={styles.mobileMenu}>
              <button type="button" onClick={copyLink}>Копировать ссылку</button>
              <Link to={profilePath(loop.author)} onClick={() => setMenuOpen(false)}>
                Профиль автора
              </Link>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void openPromote();
                  }}
                >
                  Рекламировать
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void handleDeleteOwnLoop();
                  }}
                >
                  Удалить луп
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            className={styles.mobilePlay}
            onClick={handlePlay}
            aria-label={isPlaying ? 'Пауза' : 'Играть'}
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
        </div>

        <h1 className={styles.mobileTitle}>{loop.title || 'Название'}</h1>
        <Link to={profilePath(loop.author)} className={styles.mobileAuthor}>
          {loop.author || 'Автор'}
        </Link>

        <div className={styles.mobileIcons}>
          <button type="button" className={`${styles.mobileIcon} ${isLiked ? styles.liked : ''}`} onClick={handleLike} aria-label="Лайк">
            <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <a href="#comments" className={styles.mobileIcon} aria-label="Комментарии">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </a>
          <button type="button" className={styles.mobileIcon} onClick={() => navigate('/liked')} aria-label="Добавить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className={styles.mobileIcon} onClick={copyLink} aria-label="Поделиться">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
              <path d="M16 6l-4-4-4 4M12 2v14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          className={styles.mobileDownload}
          onClick={() => openDownload(loop)}
          disabled={downloading}
        >
          Скачать
        </button>

        <h2 className={styles.mobileBlockTitle}>Детали лупа</h2>
        <div className={styles.mobileStats}>
          <div><span>БПМ</span><strong>{loop.bpm || '—'}</strong></div>
          <div><span>Опубликован</span><strong>{formatPublished(loop.created_at)}</strong></div>
          <div><span>Жанр</span><strong>{loop.genre || '—'}</strong></div>
          <div><span>Ключ</span><strong>{loop.key || '—'}</strong></div>
          <div><span>Прослушиваний</span><strong>{formatPlays(plays)}</strong></div>
          <div><span>Настроение</span><strong>{loop.mood || '—'}</strong></div>
        </div>

        <h2 className={styles.mobileBlockTitle}>Описание</h2>
        <p className={styles.mobileDesc}>{description}</p>

        {tags.length > 0 && (
          <>
            <h2 className={styles.mobileBlockTitle}>Хэштеги</h2>
            <div className={styles.mobileTags}>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={styles.mobileTag}
                  onClick={() => navigate(`/loops?tag=${encodeURIComponent(tag)}`)}
                >
                  #{tag.replace(/^#/, '')}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className={`${styles.hero} ${styles.desktopHero}`}>
        <button type="button" className={styles.coverWrap} onClick={handlePlay} aria-label={isPlaying ? 'Пауза' : 'Играть'}>
          <div
            className={styles.cover}
            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : { backgroundColor: coverColor }}
          />
          <div className={styles.coverFade} />
          <div className={styles.coverMeta}>
            <span className={styles.coverTitle}>{loop.title || 'Название'}</span>
            <Link
              to={profilePath(loop.author)}
              className={styles.coverAuthor}
              onClick={(e) => e.stopPropagation()}
            >
              {loop.author || 'Автор'}
            </Link>
          </div>
          <span className={styles.coverPlay}>
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
          </span>
        </button>

        <div className={styles.heroBody}>
          <div className={styles.blockLabel}>Описание</div>
          <p className={styles.description}>{description}</p>

          {tags.length > 0 && (
            <>
              <div className={styles.blockLabel}>Теги</div>
              <div className={styles.tags}>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.tag}
                    onClick={() => navigate(`/loops?tag=${encodeURIComponent(tag)}`)}
                  >
                    #{tag.replace(/^#/, '')}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{loop.bpm || '—'}</strong>
              <span>BPM</span>
            </div>
            <div className={styles.stat}>
              <strong>{loop.key || '—'}</strong>
              <span>Key</span>
            </div>
            <div className={styles.stat}>
              <strong>{formatPlays(plays)}</strong>
              <span>Плеи</span>
            </div>
            <div className={styles.stat}>
              <strong>{formatPublished(loop.created_at)}</strong>
              <span>Опубликован</span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={`${styles.iconBtn} ${isLiked ? styles.liked : ''}`}
              onClick={handleLike}
              aria-label={isLiked ? 'Убрать лайк' : 'Лайк'}
            >
              <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {likesCount > 0 && <span className={styles.likeCount}>{likesCount}</span>}
            </button>

            <button
              type="button"
              className={styles.download}
              onClick={() => openDownload(loop)}
              disabled={downloading}
            >
              Скачать
            </button>

            {isOwner && (
              <button type="button" className={styles.promoteBtn} onClick={() => void openPromote()}>
                Рекламировать
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
                  <Link to={profilePath(loop.author)} onClick={() => setMenuOpen(false)}>
                    Профиль автора
                  </Link>
                  {isOwner && (
                    <button type="button" onClick={() => void handleDeleteOwnLoop()}>
                      Удалить луп
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {authorLoops.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeadRow}>
            <h2 className={styles.sectionTitle}>От автора</h2>
            <Link to={profilePath(loop.author)} className={styles.seeAll}>
              Смотреть все
            </Link>
          </div>
          <div className={styles.relGrid}>
            {authorLoops.map((item) => (
              <RelatedCard
                key={item.id}
                loop={item}
                queue={authorLoops}
                onDownload={openDownload}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.section} id="comments">
        <h2 className={styles.sectionTitle}>
          Коментарии
          {commentTotal > 0 && <span className={styles.count}>{commentTotal}</span>}
        </h2>

        <div className={styles.commentsBox}>
          {!isAuthenticated && (
            <div className={styles.authWrap}>
              <AuthPrompt feature="default" />
            </div>
          )}

          <div className={styles.commentForm}>
            <input
              className={styles.commentInput}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Написать комментарий…"
              maxLength={500}
              disabled={!isAuthenticated}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={handleSendComment}
              disabled={commentSending || !commentText.trim()}
            >
              Отправить
            </button>
          </div>

          {comments.length === 0 ? (
            <p className={styles.muted}>Пока нет комментариев</p>
          ) : (
            <ul className={styles.commentList}>
              {comments.map((c) => (
                <li key={c.id} className={styles.commentItem}>
                  <div
                    className={styles.avatar}
                    style={
                      c.author.avatar_url
                        ? { backgroundImage: `url(${getAssetUrl(c.author.avatar_url)})` }
                        : { backgroundColor: getLoopCoverColor(c.author.id) }
                    }
                    aria-hidden
                  >
                    {!c.author.avatar_url &&
                      (c.author.username || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className={styles.commentBody}>
                    <Link to={profilePath(c.author.username)} className={styles.commentUser}>
                      {c.author.username}
                    </Link>
                    <p className={styles.commentText}>{c.body}</p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.commentHeart} ${c.liked_by_me ? styles.commentHeartOn : ''}`}
                    onClick={() => void handleCommentLike(c.id)}
                    aria-label="Лайк"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={c.liked_by_me ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {(c.likes_count || 0) > 0 && (
                      <span className={styles.commentLikeCount}>{c.likes_count}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {similarLoops.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Похожие лупы</h2>
          <div className={styles.relGrid}>
            {similarLoops.map((item) => (
              <RelatedCard
                key={item.id}
                loop={item}
                queue={similarLoops}
                onDownload={openDownload}
              />
            ))}
          </div>
        </section>
      )}

      <DownloadRulesModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownloadConfirm}
        loopTitle={downloadTarget?.title}
      />
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        action={paywallAction}
        message={paywallMessage}
      />

      {promoteOpen && (
        <div
          className={styles.promoteOverlay}
          role="presentation"
          onClick={() => setPromoteOpen(false)}
        >
          <div
            className={styles.promoteModal}
            role="dialog"
            aria-modal="true"
            aria-label="Реклама лупа"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.promoteTitle}>Рекламировать луп</h3>
            <p className={styles.promoteText}>
              Луп будет иногда попадаться в ленте как обычный, с пометкой{' '}
              <strong>Ad</strong> на обложке.
            </p>
            <p className={styles.promoteMeta}>
              {adMeta?.cost_per_impression ?? 2} ₽ за показ · минимум{' '}
              {adMeta?.min_budget ?? 50} ₽ · списывается с баланса
            </p>
            <label className={styles.promoteLabel}>
              Бюджет, ₽
              <input
                type="number"
                min={adMeta?.min_budget ?? 50}
                step={10}
                value={promoteBudget}
                onChange={(e) => setPromoteBudget(e.target.value)}
                disabled={promoteBusy}
              />
            </label>
            {promoteMsg && <p className={styles.promoteMsg}>{promoteMsg}</p>}
            <div className={styles.promoteActions}>
              <button
                type="button"
                className={styles.promoteCancel}
                onClick={() => setPromoteOpen(false)}
                disabled={promoteBusy}
              >
                Закрыть
              </button>
              <button
                type="button"
                className={styles.promoteSubmit}
                onClick={() => void submitPromote()}
                disabled={promoteBusy}
              >
                {promoteBusy ? 'Запуск…' : 'Запустить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoopDetail;
