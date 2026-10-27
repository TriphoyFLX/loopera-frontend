import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getUploadsUrl } from '../utils/urls';
import { api } from '../utils/api';
import { tokenStorage } from '../utils/tokenStorage';

export type PlayerLoop = {
  id: number;
  title?: string;
  author?: string;
  filename: string;
  cover_url?: string | null;
  bpm?: number | null;
  key?: string | null;
  user_id?: number;
};

type LoopPlayerContextValue = {
  current: PlayerLoop | null;
  queue: PlayerLoop[];
  isPlaying: boolean;
  isLoading: boolean;
  play: (loop: PlayerLoop, queue?: PlayerLoop[]) => void;
  toggle: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  isCurrent: (id: number) => boolean;
};

const LoopPlayerContext = createContext<LoopPlayerContextValue | null>(null);

export function LoopPlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PlayerLoop | null>(null);
  const [queue, setQueue] = useState<PlayerLoop[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionRef = useRef<{
    loopId: number;
    accumulated: number;
    startedAt: number | null;
    duration: number | null;
    reported: boolean;
  } | null>(null);

  const flushPlay = useCallback((forceComplete = false) => {
    const session = sessionRef.current;
    if (!session || session.reported) return;

    let listened = session.accumulated;
    if (session.startedAt != null) {
      listened += (Date.now() - session.startedAt) / 1000;
      session.startedAt = null;
    }
    session.accumulated = listened;

    if (listened < 1) return;

    session.reported = true;
    const duration = session.duration ?? undefined;
    const completed =
      forceComplete ||
      (duration != null && duration > 0 && listened >= Math.max(1, duration * 0.85));

    void api.trackLoopPlay(
      session.loopId,
      {
        listened_seconds: Math.round(listened * 10) / 10,
        duration_seconds: duration,
        completed,
      },
      tokenStorage.getToken() || undefined,
    );
  }, []);

  const markPlaying = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    if (session.startedAt == null) session.startedAt = Date.now();
  }, []);

  const markPaused = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.startedAt == null) return;
    session.accumulated += (Date.now() - session.startedAt) / 1000;
    session.startedAt = null;
  }, []);

  const cleanupAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = '';
    audioRef.current = null;
  }, []);

  useEffect(() => () => {
    flushPlay();
    cleanupAudio();
  }, [cleanupAudio, flushPlay]);

  const start = useCallback(
    (loop: PlayerLoop) => {
      flushPlay();
      cleanupAudio();
      setCurrent(loop);
      setIsLoading(true);
      setIsPlaying(false);

      sessionRef.current = {
        loopId: loop.id,
        accumulated: 0,
        startedAt: null,
        duration: null,
        reported: false,
      };

      if (!loop?.filename) {
        setIsLoading(false);
        setIsPlaying(false);
        console.error('Loop has no filename', loop);
        return;
      }

      const src = getUploadsUrl(loop.filename);
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;
      audioRef.current = audio;

      const onCanPlay = () => {
        setIsLoading(false);
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          if (sessionRef.current?.loopId === loop.id) {
            sessionRef.current.duration = audio.duration;
          }
        }
        void audio.play().then(() => {
          setIsPlaying(true);
          markPlaying();
        }).catch((err) => {
          console.error('Audio play failed:', err, src);
          setIsPlaying(false);
          setIsLoading(false);
        });
      };
      const onEnded = () => {
        markPaused();
        flushPlay(true);
        setIsPlaying(false);
        setQueue((prev) => {
          const idx = prev.findIndex((l) => l.id === loop.id);
          const nextLoop = idx >= 0 ? prev[idx + 1] : undefined;
          if (nextLoop) {
            void Promise.resolve().then(() => start(nextLoop));
          }
          return prev;
        });
      };
      const onError = () => {
        console.error('Audio load error:', src, audio.error);
        markPaused();
        flushPlay();
        setIsPlaying(false);
        setIsLoading(false);
      };

      audio.addEventListener('canplay', onCanPlay, { once: true });
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.load();
    },
    [cleanupAudio, flushPlay, markPaused, markPlaying],
  );

  const play = useCallback(
    (loop: PlayerLoop, nextQueue?: PlayerLoop[]) => {
      if (nextQueue) setQueue(nextQueue);
      if (current?.id === loop.id && audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          markPaused();
          setIsPlaying(false);
        } else {
          void audioRef.current.play().then(() => {
            setIsPlaying(true);
            markPlaying();
          }).catch(() => setIsPlaying(false));
        }
        return;
      }
      start(loop);
    },
    [current?.id, isPlaying, markPaused, markPlaying, start],
  );

  const toggle = useCallback(() => {
    if (!current) return;
    play(current);
  }, [current, play]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    markPaused();
    setIsPlaying(false);
  }, [markPaused]);

  const next = useCallback(() => {
    if (!current || !queue.length) return;
    const idx = queue.findIndex((l) => l.id === current.id);
    const nextLoop = queue[idx + 1] || queue[0];
    if (nextLoop) start(nextLoop);
  }, [current, queue, start]);

  const prev = useCallback(() => {
    if (!current || !queue.length) return;
    const idx = queue.findIndex((l) => l.id === current.id);
    const prevLoop = queue[idx - 1] || queue[queue.length - 1];
    if (prevLoop) start(prevLoop);
  }, [current, queue, start]);

  const value = useMemo<LoopPlayerContextValue>(
    () => ({
      current,
      queue,
      isPlaying,
      isLoading,
      play,
      toggle,
      pause,
      next,
      prev,
      isCurrent: (id: number) => current?.id === id,
    }),
    [current, queue, isPlaying, isLoading, play, toggle, pause, next, prev],
  );

  return <LoopPlayerContext.Provider value={value}>{children}</LoopPlayerContext.Provider>;
}

export function useLoopPlayer() {
  const ctx = useContext(LoopPlayerContext);
  if (!ctx) {
    throw new Error('useLoopPlayer must be used within LoopPlayerProvider');
  }
  return ctx;
}

export function useLoopPlayerOptional() {
  return useContext(LoopPlayerContext);
}
