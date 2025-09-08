import React, { useState, useEffect, useRef, useCallback } from 'react';

// Virtual scrolling hook
export const useVirtualScrolling = <T,>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
  }));

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
    isScrolling,
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '0px',
  freezeOnceVisible = false,
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        if (!hasBeenVisible && isElementIntersecting) {
          setHasBeenVisible(true);
        }

        if (!freezeOnceVisible || !hasBeenVisible) {
          setIsIntersecting(isElementIntersecting);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, freezeOnceVisible, hasBeenVisible]);

  return [ref, isIntersecting, hasBeenVisible] as const;
};

// Image lazy loading with placeholder
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (!isIntersecting || !src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };
    img.src = src;
  }, [src, isIntersecting]);

  return { ref, src: imageSrc, isLoading, error };
};

// Debounced value hook
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const lastRan = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    },
    [callback, delay]
  );
};

// Optimistic updates hook
export const useOptimisticUpdate = <T, U>(
  currentValue: T,
  updateFunction: (value: T, optimisticValue: U) => Promise<T>
) => {
  const [optimisticValue, setOptimisticValue] = useState<T>(currentValue);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const performOptimisticUpdate = useCallback(
    async (newValue: U) => {
      const previousValue = optimisticValue;
      
      // Apply optimistic update immediately
      setOptimisticValue(prev => ({ ...prev, ...newValue } as T));
      setIsPending(true);
      setError(null);

      try {
        const result = await updateFunction(currentValue, newValue);
        setOptimisticValue(result);
      } catch (err) {
        // Revert to previous value on error
        setOptimisticValue(previousValue);
        setError(err instanceof Error ? err : new Error('Update failed'));
      } finally {
        setIsPending(false);
      }
    },
    [currentValue, optimisticValue, updateFunction]
  );

  // Update optimistic value when current value changes externally
  useEffect(() => {
    if (!isPending) {
      setOptimisticValue(currentValue);
    }
  }, [currentValue, isPending]);

  return {
    value: optimisticValue,
    isPending,
    error,
    performOptimisticUpdate,
  };
};

// Bundle size monitoring (development only)
export const useBundleAnalytics = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log bundle information in development
      const logBundleInfo = () => {
        const entries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        console.group('📊 Performance Metrics');
        console.log(`📁 DOM Content Loaded: ${Math.round(entries.domContentLoadedEventEnd - entries.domContentLoadedEventStart)}ms`);
        console.log(`🎨 Load Complete: ${Math.round(entries.loadEventEnd - entries.loadEventStart)}ms`);
        console.log(`🚀 Time to Interactive: ${Math.round(entries.domInteractive - entries.fetchStart)}ms`);
        console.groupEnd();
      };

      if (document.readyState === 'complete') {
        logBundleInfo();
      } else {
        window.addEventListener('load', logBundleInfo);
      }
    }
  }, []);
};

// Memory usage monitoring
export const useMemoryMonitoring = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    if ('memory' in performance && process.env.NODE_ENV === 'development') {
      const updateMemoryInfo = () => {
        const memory = (performance as any).memory;
        if (memory) {
          const used = memory.usedJSHeapSize;
          const total = memory.totalJSHeapSize;
          const percentage = Math.round((used / total) * 100);
          
          setMemoryInfo({ used, total, percentage });
          
          if (percentage > 80) {
            console.warn(`⚠️ High memory usage: ${percentage}%`);
          }
        }
      };

      const interval = setInterval(updateMemoryInfo, 5000);
      updateMemoryInfo();

      return () => clearInterval(interval);
    }
  }, []);

  return memoryInfo;
};

// Preload critical resources
export const useResourcePreloader = (resources: string[]) => {
  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];

    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      // Determine resource type based on extension
      if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(js|ts|tsx|jsx)$/)) {
        link.as = 'script';
      } else if (resource.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
        link.as = 'image';
      } else if (resource.match(/\.(woff|woff2|eot|ttf)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
      preloadLinks.push(link);
    });

    return () => {
      preloadLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [resources]);
};

// Smart prefetching for navigation
export const useSmartPrefetch = () => {
  const prefetchedRoutes = useRef(new Set<string>());

  const prefetchRoute = useCallback((href: string) => {
    if (prefetchedRoutes.current.has(href)) return;

    // Only prefetch on good connections
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && (connection.saveData || connection.effectiveType === 'slow-2g')) {
        return;
      }
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    
    prefetchedRoutes.current.add(href);
  }, []);

  const onLinkHover = useCallback((href: string) => {
    // Prefetch after a small delay to avoid unnecessary requests
    const timeoutId = setTimeout(() => {
      prefetchRoute(href);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [prefetchRoute]);

  return { prefetchRoute, onLinkHover };
};