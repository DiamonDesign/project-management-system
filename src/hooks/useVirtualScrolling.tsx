import { useState, useEffect, useCallback, useMemo } from 'react';

interface VirtualScrollingOptions {
  containerHeight: number;
  itemHeight: number;
  buffer?: number;
  overscan?: number;
}

interface VirtualScrollingResult<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  scrollElementProps: {
    style: React.CSSProperties;
    onScroll: (e: React.UIEvent<HTMLElement>) => void;
  };
  virtualListProps: {
    style: React.CSSProperties;
  };
}

export function useVirtualScrolling<T>(
  items: T[],
  options: VirtualScrollingOptions
): VirtualScrollingResult<T> {
  const { containerHeight, itemHeight, buffer = 5, overscan = 5 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const virtualizedData = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    // Add buffer for smoother scrolling
    const startIndex = Math.max(0, visibleStart - buffer);
    const endIndex = Math.min(items.length - 1, visibleEnd + buffer);
    
    // Add overscan for performance
    const overscanStart = Math.max(0, startIndex - overscan);
    const overscanEnd = Math.min(items.length - 1, endIndex + overscan);

    const visibleItems = items.slice(overscanStart, overscanEnd + 1);
    const offsetY = overscanStart * itemHeight;

    return {
      visibleItems,
      startIndex: overscanStart,
      endIndex: overscanEnd,
      totalHeight,
      offsetY,
    };
  }, [items, itemHeight, scrollTop, containerHeight, buffer, overscan]);

  const scrollElementProps = useMemo(() => ({
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
    },
    onScroll: handleScroll,
  }), [containerHeight, handleScroll]);

  const virtualListProps = useMemo(() => ({
    style: {
      height: virtualizedData.totalHeight,
      position: 'relative' as const,
    },
  }), [virtualizedData.totalHeight]);

  return {
    ...virtualizedData,
    scrollElementProps,
    virtualListProps,
  };
}

// Hook for infinite scrolling
interface InfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll(
  callback: () => void,
  options: InfiniteScrollOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px' } = options;
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const targetRef = useCallback((node: HTMLElement | null) => {
    setTargetElement(node);
  }, []);

  useEffect(() => {
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(targetElement);

    return () => {
      observer.disconnect();
    };
  }, [targetElement, callback, threshold, rootMargin]);

  return { targetRef };
}

// Virtual list component
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  buffer?: number;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  buffer = 5,
  overscan = 5,
}: VirtualListProps<T>) {
  const {
    visibleItems,
    startIndex,
    offsetY,
    scrollElementProps,
    virtualListProps,
  } = useVirtualScrolling(items, {
    containerHeight,
    itemHeight,
    buffer,
    overscan,
  });

  return (
    <div {...scrollElementProps} className={className}>
      <div {...virtualListProps}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            width: '100%',
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Grid virtualization for 2D scrolling
interface VirtualGridOptions {
  containerWidth: number;
  containerHeight: number;
  itemWidth: number;
  itemHeight: number;
  buffer?: number;
}

export function useVirtualGrid<T>(
  items: T[],
  options: VirtualGridOptions
) {
  const { containerWidth, containerHeight, itemWidth, itemHeight, buffer = 2 } = options;
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    setScrollLeft(target.scrollLeft);
    setScrollTop(target.scrollTop);
  }, []);

  const virtualizedData = useMemo(() => {
    const itemsPerRow = Math.floor(containerWidth / itemWidth);
    const totalRows = Math.ceil(items.length / itemsPerRow);
    
    const visibleRowStart = Math.floor(scrollTop / itemHeight);
    const visibleRowEnd = Math.min(
      visibleRowStart + Math.ceil(containerHeight / itemHeight),
      totalRows - 1
    );

    const startRow = Math.max(0, visibleRowStart - buffer);
    const endRow = Math.min(totalRows - 1, visibleRowEnd + buffer);

    const visibleItems: T[] = [];
    const itemPositions: Array<{ x: number; y: number; index: number }> = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index < items.length) {
          visibleItems.push(items[index]);
          itemPositions.push({
            x: col * itemWidth,
            y: row * itemHeight,
            index,
          });
        }
      }
    }

    return {
      visibleItems,
      itemPositions,
      totalHeight: totalRows * itemHeight,
      totalWidth: containerWidth,
    };
  }, [items, containerWidth, containerHeight, itemWidth, itemHeight, scrollTop, buffer]);

  const scrollElementProps = {
    style: {
      width: containerWidth,
      height: containerHeight,
      overflow: 'auto' as const,
    },
    onScroll: handleScroll,
  };

  const virtualGridProps = {
    style: {
      height: virtualizedData.totalHeight,
      width: virtualizedData.totalWidth,
      position: 'relative' as const,
    },
  };

  return {
    ...virtualizedData,
    scrollElementProps,
    virtualGridProps,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    renderTime: number;
    memoryUsage?: number;
  }>({
    renderTime: 0,
  });

  const measureRender = useCallback(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const renderTime = end - start;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        // @ts-expect-error - performance.memory is a Chrome-specific feature
        memoryUsage: typeof performance.memory !== 'undefined' ? performance.memory.usedJSHeapSize : undefined,
      }));
    };
  }, []);

  return { metrics, measureRender };
}