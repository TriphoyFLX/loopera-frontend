import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLoopPlayerOptional } from '../hooks/useLoopPlayer';
import { api } from '../utils/api';
import LoopCard from './LoopCard';
import styles from './HomePicks.module.css';

type PickLoop = {
  id: number;
  title: string;
  filename: string;
  author?: string;
  cover_url?: string | null;
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  user_id?: number;
  created_at?: string;
};

const VISIBLE = 5;
const ROTATE_MS = 5000;
const POOL_SIZE = 24;

const HomePicks = () => {
  const { token, user } = useAuth();
  const player = useLoopPlayerOptional();
  const [pool, setPool] = useState<PickLoop[]>([]);
  const [offset, setOffset] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const trending = await api.getAllLoops(1, POOL_SIZE, token || undefined, 'trending');
        let next: PickLoop[] = trending?.loops || [];

        if (next.length < VISIBLE) {
          const fresh = await api.getAllLoops(1, POOL_SIZE, token || undefined, 'created_at');
          const seen = new Set(next.map((l) => l.id));
          for (const loop of fresh?.loops || []) {
            if (!seen.has(loop.id)) {
              next.push(loop);
              seen.add(loop.id);
            }
          }
        }

        if (!cancelled) {
          setPool(next);
          setOffset(0);
        }
      } catch {
        if (!cancelled) setPool([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (pool.length <= VISIBLE) return;

    const id = window.setInterval(() => {
      setOffset((prev) => (prev + VISIBLE) % pool.length);
      setFadeKey((k) => k + 1);
    }, ROTATE_MS);

    return () => window.clearInterval(id);
  }, [pool.length]);

  const visible = useMemo(() => {
    if (!pool.length) return [];
    if (pool.length <= VISIBLE) return pool;

    const items: PickLoop[] = [];
    for (let i = 0; i < VISIBLE; i += 1) {
      items.push(pool[(offset + i) % pool.length]);
    }
    return items;
  }, [pool, offset]);

  if (!loading && pool.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>Подборка</h2>
      </div>

      <div className={styles.bleed}>
        <div className={styles.row} key={fadeKey}>
          {loading
            ? Array.from({ length: VISIBLE }).map((_, i) => (
                <div key={i} className={styles.item}>
                  <div className={styles.skeletonCard} aria-hidden>
                    <div className={styles.skeletonCover} />
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLineSm} />
                  </div>
                </div>
              ))
            : visible.map((loop, index) => (
                <div
                  key={`${loop.id}-${offset}-${index}`}
                  className={styles.item}
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <LoopCard
                    loop={loop}
                    currentUserId={user?.id}
                    onPlay={(l) => player?.play(l, visible)}
                    isPlaying={Boolean(player?.isCurrent(loop.id) && player.isPlaying)}
                    isLoading={Boolean(player?.isCurrent(loop.id) && player.isLoading)}
                    queue={visible}
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default HomePicks;
