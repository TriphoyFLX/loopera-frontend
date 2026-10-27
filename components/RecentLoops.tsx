import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import LoopCard from './LoopCard';
import { useI18n } from '../i18n/useI18n';
import './RecentLoops.css';

interface Loop {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  file_size: number;
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  tags?: string[];
  user_id: number;
  author?: string;
  cover_url?: string | null;
  created_at: string;
}

interface RecentLoopsProps {
  title?: string;
  limit?: number;
  showAllButton?: boolean;
  type?: 'all' | 'my';
  sortBy?: 'created_at' | 'likes' | 'trending' | 'discover' | 'for_you';
  tag?: string;
  genre?: string;
  minBpm?: number;
  maxBpm?: number;
  key?: string;
  search?: string;
  mood?: string;
  highlightLoopId?: number;
  /** Horizontal overflow carousel for Home */
  variant?: 'grid' | 'carousel';
  hideInternalHeader?: boolean;
}

const RecentLoops: React.FC<RecentLoopsProps> = ({
  title,
  limit = 10,
  showAllButton = true,
  type = 'all',
  sortBy = 'created_at',
  tag,
  genre,
  minBpm,
  maxBpm,
  key,
  search,
  mood,
  highlightLoopId,
  variant = 'grid',
  hideInternalHeader = false,
}) => {
  const { t } = useI18n();
  const sectionTitle = title ?? t('recentLoops.defaultTitle');
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const { token, user } = useAuth();
  const player = useLoopPlayerOptional();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchLoops = async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      let data;
      if (type === 'my' && token) {
        data = await api.getUserLoops(token, pageNum, limit);
      } else if (sortBy === 'for_you' && token) {
        data = await api.getForYouLoops(pageNum, limit, token);
      } else {
        data = await api.getAllLoops(
          pageNum,
          limit,
          token || undefined,
          sortBy,
          tag,
          genre,
          minBpm,
          maxBpm,
          key,
          search,
          mood,
        );
      }
      const nextLoops = data.loops || [];
      setLoops((prev) => (append ? [...prev, ...nextLoops] : nextLoops));
      setHasMore(Boolean(data.pagination?.hasMore ?? nextLoops.length === limit));
      if (data.pagination?.total != null) setTotalCount(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('recentLoops.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadMoreLoops = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      void fetchLoops(nextPage, true);
    }
  };

  const { observerRef } = useInfiniteScroll({
    hasNextPage: hasMore,
    isLoading: loading,
    onLoadMore: loadMoreLoops,
    rootMargin: '100px',
    threshold: 0.1,
  });

  useEffect(() => {
    setPage(1);
    void fetchLoops(1, false);
  }, [limit, type, sortBy, tag, genre, minBpm, maxBpm, key, search, mood]);

  useEffect(() => {
    if (!highlightLoopId || loading || loops.length === 0) return;
    const targetLoop = loops.find((loop) => loop.id === highlightLoopId);
    if (!targetLoop) return;
    document.getElementById(`loop-card-${highlightLoopId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    player?.play(targetLoop, loops);
  }, [highlightLoopId, loading, loops, player]);

  useEffect(() => {
    if (observerRef.current && loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
  }, [observerRef]);

  const handleDeleteLoop = async (id: number) => {
    if (!token) return;
    try {
      await api.deleteLoop(id, token);
      setLoops((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && loops.length === 0) {
    return (
      <div>
        {sectionTitle ? <h2 className="section-title">{sectionTitle}</h2> : null}
        <div className="loading-spinner">
          <div className="spinner" />
          <p>{t('recentLoops.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {sectionTitle ? <h2 className="section-title">{sectionTitle}</h2> : null}
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => fetchLoops()} className="retry-button">
            {t('recentLoops.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (loops.length === 0) {
    return (
      <div>
        {sectionTitle ? <h2 className="section-title">{sectionTitle}</h2> : null}
        <div className="empty-state">
          <p>{type === 'my' ? t('recentLoops.emptyMy') : t('recentLoops.emptyAll')}</p>
          <p>{type === 'my' ? t('recentLoops.emptyMyHint') : t('recentLoops.emptyAllHint')}</p>
        </div>
      </div>
    );
  }

  const isCarousel = variant === 'carousel';

  return (
    <div className={isCarousel ? 'recent-loops recent-loops--carousel' : 'recent-loops'}>
      {!hideInternalHeader && (sectionTitle || showAllButton) && (
        <div className="section-header">
          {sectionTitle ? <h2 className="section-title">{sectionTitle}</h2> : <span />}
          {showAllButton && (
            <Link to="/loops" className="view-all-button">
              Все лупы
            </Link>
          )}
        </div>
      )}

      <div className={isCarousel ? 'loops-carousel-bleed' : undefined}>
        <div className={isCarousel ? 'loops-carousel' : 'loops-grid'}>
          {loops.map((loop) => (
            <div key={loop.id} className={isCarousel ? 'loops-carousel-item' : undefined}>
              <LoopCard
                loop={loop}
                currentUserId={user?.id}
                onDelete={type === 'my' ? handleDeleteLoop : undefined}
                onPlay={(l) => player?.play(l, loops)}
                isPlaying={Boolean(player?.isCurrent(loop.id) && player.isPlaying)}
                isLoading={Boolean(player?.isCurrent(loop.id) && player.isLoading)}
                queue={loops}
              />
            </div>
          ))}
        </div>
      </div>

      {!isCarousel && <div ref={loadMoreRef} className="load-more-trigger" />}

      {!isCarousel && showAllButton && loops.length >= limit && (
        <div className="section-footer">
          <span className="loops-count">
            {totalCount !== null
              ? t('recentLoops.shown', { shown: loops.length, total: totalCount })
              : t('recentLoops.loaded', { count: loops.length })}
          </span>
          <button className="load-more-button" onClick={loadMoreLoops} disabled={!hasMore}>
            {hasMore ? t('recentLoops.loadMore') : t('recentLoops.allLoaded')}
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentLoops;
