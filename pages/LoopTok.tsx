import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthGate } from '../hooks/useAuthGate';
import { useI18n } from '../i18n/useI18n';
import { api } from '../utils/api';
import { getLoopTokUrl } from '../utils/urls';
import { LOOPTOK_MAX_BYTES } from '../utils/audioTrim';
import LoopTokTrimModal from '../components/LoopTokTrimModal';
import PaywallModal, { isPlanLimitError } from '../components/PaywallModal';
import styles from './LoopTok.module.css';

export type LoopTokPost = {
  id: number;
  title: string;
  caption?: string | null;
  filename: string;
  mime_type?: string | null;
  duration?: number | null;
  bpm?: number | null;
  key?: string | null;
  like_count: number;
  comment_count?: number;
  share_count?: number;
  is_liked: boolean;
  view_count?: number;
  created_at: string;
  loop_id?: number | null;
  loop?: {
    id: number;
    title: string;
    filename?: string;
    bpm?: number | null;
    key?: string | null;
    author_username?: string;
  } | null;
  author: {
    id: number;
    username: string;
    avatar_url?: string | null;
    hashtag?: string | null;
  };
};

type Comment = {
  id: number;
  body: string;
  created_at: string;
  author: { id: number; username: string; avatar_url?: string | null };
};

type UserLoopOption = {
  id: number;
  title: string;
  bpm?: number | null;
  key?: string | null;
  filename?: string;
};

function isVideoClip(post: LoopTokPost): boolean {
  const mime = (post.mime_type || '').toLowerCase();
  const name = (post.filename || '').toLowerCase();
  return mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm');
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n || 0);
}

function LoopTokClip({
  post,
  active,
  canDelete,
  onNeedAuth,
  onLiked,
  onOpenComments,
  onDeleted,
}: {
  post: LoopTokPost;
  active: boolean;
  canDelete: boolean;
  onNeedAuth: () => void;
  onLiked: (id: number, liked: boolean, count: number) => void;
  onOpenComments: (post: LoopTokPost) => void;
  onDeleted: (id: number) => void;
}) {
  const { t } = useI18n();
  const { token } = useAuth();
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const viewedRef = useRef(false);
  const video = isVideoClip(post);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    if (active) {
      media.currentTime = 0;
      void media.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      if (!viewedRef.current) {
        viewedRef.current = true;
        void api.trackLoopTokView(post.id).catch(() => undefined);
      }
    } else {
      media.pause();
      setPlaying(false);
    }
  }, [active, post.id]);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) {
      void media.play();
      setPlaying(true);
    } else {
      media.pause();
      setPlaying(false);
    }
  };

  const toggleLike = async () => {
    if (!token) {
      onNeedAuth();
      return;
    }
    try {
      const res = await api.toggleLoopTokLike(post.id, token);
      onLiked(post.id, res.liked, res.like_count);
    } catch {
      // ignore
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/looptok?v=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      void api.trackLoopTokShare(post.id).catch(() => undefined);
    } catch {
      // user cancelled
    }
  };

  const deletePost = async () => {
    if (!token || !canDelete || deleting) return;
    if (!window.confirm(t('looptok.deleteConfirm'))) return;

    setDeleting(true);
    try {
      await api.deleteLoopTokPost(post.id, token);
      mediaRef.current?.pause();
      onDeleted(post.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('looptok.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className={styles.clip} data-active={active ? '1' : '0'}>
      <div className={styles.phone}>
        {video ? (
          <video
            ref={(el) => {
              mediaRef.current = el;
            }}
            className={styles.video}
            src={getLoopTokUrl(post.filename)}
            loop
            playsInline
            preload={active ? 'auto' : 'metadata'}
            onClick={togglePlay}
          />
        ) : (
          <button type="button" className={styles.audioStage} onClick={togglePlay}>
            <div className={`${styles.pulse} ${playing ? styles.pulseOn : ''}`} />
            <span className={styles.playGlyph} aria-hidden>
              {playing ? (
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5-11-6.5z" />
                </svg>
              )}
            </span>
            <audio
              ref={(el) => {
                mediaRef.current = el;
              }}
              src={getLoopTokUrl(post.filename)}
              loop
              preload={active ? 'auto' : 'none'}
            />
          </button>
        )}

        <div className={styles.gradient} />

        <div className={styles.sideRail}>
          <Link to={`/${post.author.username}`} className={styles.avatar}>
            {post.author.avatar_url ? (
              <img src={post.author.avatar_url} alt="" />
            ) : (
              <span>{post.author.username.slice(0, 1).toUpperCase()}</span>
            )}
          </Link>

          <button type="button" className={styles.railBtn} onClick={toggleLike}>
            <span className={post.is_liked ? styles.heartOn : styles.iconBtn}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill={post.is_liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9">
                <path d="M12 20s-7-4.4-7-9.2A4.2 4.2 0 0112 7.1a4.2 4.2 0 017 3.7C19 15.6 12 20 12 20z" />
              </svg>
            </span>
            <small>{formatCount(post.like_count)}</small>
          </button>

          <button type="button" className={styles.railBtn} onClick={() => onOpenComments(post)}>
            <span className={styles.iconBtn}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M5 6.5A2.5 2.5 0 017.5 4h9A2.5 2.5 0 0119 6.5v7A2.5 2.5 0 0116.5 16H10l-4.5 3.2V6.5z" />
              </svg>
            </span>
            <small>{formatCount(post.comment_count || 0)}</small>
          </button>

          <button type="button" className={styles.railBtn} onClick={sharePost}>
            <span className={styles.iconBtn}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M12 4v10" />
                <path d="M8.5 7.5L12 4l3.5 3.5" />
                <path d="M6 13v4.5A2.5 2.5 0 008.5 20h7a2.5 2.5 0 002.5-2.5V13" />
              </svg>
            </span>
            <small>{formatCount(post.share_count || 0)}</small>
          </button>

          {canDelete && (
            <button
              type="button"
              className={styles.railBtn}
              onClick={() => void deletePost()}
              disabled={deleting}
              aria-label={t('looptok.delete')}
            >
              <span className={styles.deleteBtn}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </span>
              <small>{deleting ? '…' : t('looptok.delete')}</small>
            </button>
          )}
        </div>

        <div className={styles.bottomMeta}>
          <Link to={`/${post.author.username}`} className={styles.author}>
            @{post.author.username}
          </Link>
          <h2 className={styles.title}>{post.title}</h2>
          {post.caption ? <p className={styles.caption}>{post.caption}</p> : null}

          {(post.bpm || post.key) && (
            <div className={styles.chips}>
              {post.bpm ? <span>{post.bpm} BPM</span> : null}
              {post.key ? <span>{post.key}</span> : null}
            </div>
          )}

          {post.loop && (
            <Link to={`/${post.loop.author_username || post.author.username}`} className={styles.soundBar}>
              <span className={styles.soundIcon} aria-hidden>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path d="M9 18V6l10-2v12" />
                  <circle cx="7" cy="18" r="2.5" />
                  <circle cx="17" cy="16" r="2.5" />
                </svg>
              </span>
              <span>
                {t('looptok.usedLoop')}: <strong>{post.loop.title}</strong>
                {post.loop.bpm ? ` · ${post.loop.bpm} BPM` : ''}
              </span>
            </Link>
          )}
        </div>

        {!playing && video && (
          <button type="button" className={styles.centerPlay} onClick={togglePlay} aria-label={t('looptok.play')}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5.5v13l11-6.5-11-6.5z" />
            </svg>
          </button>
        )}
      </div>
    </article>
  );
}

export default function LoopTok() {
  const { t } = useI18n();
  const { token, user } = useAuth();
  const { requireAuth } = useAuthGate();
  const [posts, setPosts] = useState<LoopTokPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'fyp' | 'latest'>('fyp');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [trimFile, setTrimFile] = useState<File | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [attachedLoopId, setAttachedLoopId] = useState<number | ''>('');
  const [myLoops, setMyLoops] = useState<UserLoopOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string | undefined>();
  const [clipDuration, setClipDuration] = useState<number | null>(null);
  const [commentsPost, setCommentsPost] = useState<LoopTokPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadFeed = useCallback(
    async (nextPage: number, replace = false, feedMode = mode) => {
      setLoading(true);
      try {
        const data = await api.getLoopTokFeed(nextPage, 8, token || undefined, feedMode);
        setPosts((prev) => (replace ? data.posts : [...prev, ...data.posts]));
        setHasMore(data.pagination.hasMore);
        setPage(nextPage);
        if (replace && data.posts[0]) setActiveId(data.posts[0].id);
      } catch {
        if (replace) setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [token, mode],
  );

  useEffect(() => {
    void loadFeed(1, true, mode);
  }, [loadFeed, mode]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const nodes = root.querySelectorAll<HTMLElement>('[data-clip-id]');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.55)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = Number(visible.target.getAttribute('data-clip-id'));
          if (Number.isFinite(id)) setActiveId(id);
        }
      },
      { root, threshold: [0.55, 0.75] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [posts]);

  const onScroll = () => {
    const root = scrollerRef.current;
    if (!root || loading || !hasMore) return;
    if (root.scrollTop + root.clientHeight > root.scrollHeight - root.clientHeight * 1.4) {
      void loadFeed(page + 1, false, mode);
    }
  };

  const openUpload = () => {
    requireAuth(async () => {
      setShowUpload(true);
      if (token) {
        try {
          const data = await api.getUserLoops(token, 1, 40);
          const list = Array.isArray(data) ? data : data.loops || data.data || [];
          setMyLoops(list as UserLoopOption[]);
        } catch {
          setMyLoops([]);
        }
      }
    }, 'upload');
  };

  const onPickFile = (file: File | null) => {
    if (!file) return;
    setUploadError('');
    const isVideo =
      file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name);

    if (file.size > LOOPTOK_MAX_BYTES) {
      if (isVideo) {
        setUploadError(t('looptok.videoTooLarge'));
        return;
      }
      setTrimFile(file);
      return;
    }
    setPendingFile(file);
    setClipDuration(null);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 80));
    }
  };

  const onTrimConfirm = (file: File, duration: number) => {
    setTrimFile(null);
    setPendingFile(file);
    setClipDuration(duration);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 80));
    }
  };

  const submitUpload = async () => {
    if (!token || !pendingFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('clip', pendingFile);
      form.append('title', title.trim() || pendingFile.name);
      if (caption.trim()) form.append('caption', caption.trim());
      if (clipDuration) form.append('duration', String(clipDuration));
      if (attachedLoopId) form.append('loop_id', String(attachedLoopId));

      const res = await api.uploadLoopTok(form, token);
      setShowUpload(false);
      setPendingFile(null);
      setTitle('');
      setCaption('');
      setAttachedLoopId('');
      setClipDuration(null);
      setPosts((prev) => [res.post, ...prev]);
      setActiveId(res.post.id);
      scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (isPlanLimitError(err)) {
        setPaywallMessage(err.message);
        setPaywallOpen(true);
      } else {
        setUploadError(err instanceof Error ? err.message : t('looptok.uploadFailed'));
      }
    } finally {
      setUploading(false);
    }
  };

  const openComments = async (post: LoopTokPost) => {
    setCommentsPost(post);
    setCommentText('');
    setCommentsLoading(true);
    try {
      const data = await api.getLoopTokComments(post.id);
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendComment = async () => {
    if (!commentsPost) return;
    if (!token) {
      requireAuth(() => undefined, 'default');
      return;
    }
    const body = commentText.trim();
    if (!body) return;
    try {
      const res = await api.addLoopTokComment(commentsPost.id, body, token);
      setComments((prev) => [res.comment, ...prev]);
      setCommentText('');
      setPosts((prev) =>
        prev.map((p) =>
          p.id === commentsPost.id ? { ...p, comment_count: res.comment_count } : p,
        ),
      );
      setCommentsPost((prev) =>
        prev ? { ...prev, comment_count: res.comment_count } : prev,
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topControls}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={mode === 'latest' ? styles.tabOn : styles.tab}
              onClick={() => setMode('latest')}
            >
              {t('looptok.tabLatest')}
            </button>
            <button
              type="button"
              className={mode === 'fyp' ? styles.tabOn : styles.tab}
              onClick={() => setMode('fyp')}
            >
              {t('looptok.tabFyp')}
            </button>
          </div>
          <button
            type="button"
            className={styles.uploadFab}
            onClick={openUpload}
            aria-label={t('looptok.promote')}
          >
            +
          </button>
        </div>
      </header>

      <div className={styles.feed} ref={scrollerRef} onScroll={onScroll}>
        {posts.length === 0 && !loading ? (
          <div className={styles.empty}>
            <h2>{t('looptok.emptyTitle')}</h2>
            <p>{t('looptok.emptyHint')}</p>
            <button type="button" className={styles.emptyCta} onClick={openUpload}>
              {t('looptok.promote')}
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className={styles.snap} data-clip-id={post.id}>
              <LoopTokClip
                post={post}
                active={activeId === post.id}
                canDelete={Boolean(user?.id && post.author.id === user.id)}
                onNeedAuth={() => requireAuth(() => undefined, 'default')}
                onLiked={(id, liked, count) => {
                  setPosts((prev) =>
                    prev.map((p) =>
                      p.id === id ? { ...p, is_liked: liked, like_count: count } : p,
                    ),
                  );
                }}
                onOpenComments={openComments}
                onDeleted={(id) => {
                  setPosts((prev) => {
                    const next = prev.filter((p) => p.id !== id);
                    if (activeId === id) {
                      setActiveId(next[0]?.id ?? null);
                    }
                    return next;
                  });
                }}
              />
            </div>
          ))
        )}
        {loading && <div className={styles.loading}>{t('loading.default')}</div>}
      </div>

      {showUpload && (
        <div className={styles.sheetOverlay} onClick={(e) => e.target === e.currentTarget && setShowUpload(false)}>
          <div className={styles.sheet}>
            <div className={styles.sheetHandle} />
            <header className={styles.sheetHead}>
              <h2>{t('looptok.uploadTitle')}</h2>
              <button type="button" onClick={() => setShowUpload(false)}>×</button>
            </header>
            <p className={styles.sheetHint}>{t('looptok.uploadHint')}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/mp4,video/webm,.mp3,.wav,.ogg,.m4a,.mp4,.flac,.aac,.webm"
              hidden
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />

            <button type="button" className={styles.pickBtn} onClick={() => fileInputRef.current?.click()}>
              {pendingFile ? pendingFile.name : t('looptok.pickFile')}
            </button>

            <label className={styles.field}>
              {t('looptok.titleLabel')}
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </label>

            <label className={styles.field}>
              {t('looptok.captionLabel')}
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} rows={3} />
            </label>

            <label className={styles.field}>
              {t('looptok.attachLoop')}
              <select
                value={attachedLoopId}
                onChange={(e) => setAttachedLoopId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">{t('looptok.attachLoopNone')}</option>
                {myLoops.map((loop) => (
                  <option key={loop.id} value={loop.id}>
                    {loop.title}
                    {loop.bpm ? ` · ${loop.bpm} BPM` : ''}
                  </option>
                ))}
              </select>
            </label>

            {uploadError && <p className={styles.error}>{uploadError}</p>}

            <button
              type="button"
              className={styles.submitBtn}
              disabled={!pendingFile || uploading}
              onClick={submitUpload}
            >
              {uploading ? t('looptok.uploading') : t('looptok.publish')}
            </button>
          </div>
        </div>
      )}

      {commentsPost && (
        <div className={styles.sheetOverlay} onClick={(e) => e.target === e.currentTarget && setCommentsPost(null)}>
          <div className={`${styles.sheet} ${styles.commentsSheet}`}>
            <div className={styles.sheetHandle} />
            <header className={styles.sheetHead}>
              <h2>
                {t('looptok.comments')} · {formatCount(commentsPost.comment_count || comments.length)}
              </h2>
              <button type="button" onClick={() => setCommentsPost(null)}>×</button>
            </header>

            <div className={styles.commentsList}>
              {commentsLoading && <p className={styles.muted}>{t('loading.default')}</p>}
              {!commentsLoading && comments.length === 0 && (
                <p className={styles.muted}>{t('looptok.noComments')}</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className={styles.commentRow}>
                  <Link to={`/${c.author.username}`} className={styles.commentAvatar}>
                    {c.author.username.slice(0, 1).toUpperCase()}
                  </Link>
                  <div>
                    <strong>@{c.author.username}</strong>
                    <p>{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.commentComposer}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('looptok.commentPlaceholder')}
                maxLength={500}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void sendComment();
                }}
              />
              <button type="button" onClick={sendComment} disabled={!commentText.trim()}>
                {t('looptok.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {trimFile && (
        <LoopTokTrimModal
          open
          file={trimFile}
          onClose={() => setTrimFile(null)}
          onConfirm={onTrimConfirm}
        />
      )}
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        action="looptok"
        message={paywallMessage}
      />
    </div>
  );
}
