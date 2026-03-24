import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
  threshold?: number;
}

export const useInfiniteScroll = ({
  hasNextPage,
  isLoading,
  onLoadMore,
  rootMargin = '100px',
  threshold = 0.1
}: UseInfiniteScrollOptions) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isLoading) {
      setIsIntersecting(true);
      onLoadMore();
      // Небольшая задержка перед следующей загрузкой
      setTimeout(() => setIsIntersecting(false), 500);
    }
  }, [hasNextPage, isLoading, onLoadMore]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin,
      threshold,
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin, threshold]);

  return { observerRef, isIntersecting };
};
