import { useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  disabled = false
}: UsePullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate refresh progress (0 to 1)
  const refreshProgress = Math.min(pullDistance / threshold, 1);

  const bind = useDrag(
    ({ down, movement: [, my], velocity: [, vy], direction: [, dy] }) => {
      // Only trigger if:
      // 1. Not disabled
      // 2. Pulling down (positive direction)  
      // 3. Container is at top (scrollTop === 0)
      // 4. Not already refreshing
      const container = containerRef.current;
      if (disabled || isRefreshing || !container) return;

      const isAtTop = container.scrollTop === 0;
      const isPullingDown = dy > 0;

      if (!isAtTop || !isPullingDown) {
        setPullDistance(0);
        return;
      }

      if (down) {
        // Update pull distance during drag
        const distance = Math.max(0, my);
        setPullDistance(distance);
      } else {
        // Released - check if should refresh
        if (pullDistance >= threshold && vy > 0.1) {
          setIsRefreshing(true);
          onRefresh().finally(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          });
        } else {
          // Reset if didn't reach threshold
          setPullDistance(0);
        }
      }
    },
    {
      filterTaps: true,
      axis: 'y',
      threshold: 10,
      rubberband: true
    }
  );

  // Reset state on cleanup
  useEffect(() => {
    return () => {
      setPullDistance(0);
      setIsRefreshing(false);
    };
  }, []);

  return {
    bind,
    containerRef,
    isRefreshing,
    pullDistance,
    refreshProgress,
    shouldShowIndicator: pullDistance > 20 || isRefreshing
  };
};