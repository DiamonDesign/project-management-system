// Performance optimization utilities

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function to limit function execution rate
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoization with optional TTL (Time To Live)
 */
export function memoize<T extends (...args: never[]) => unknown>(
  func: T,
  ttl?: number
): T & { cache: Map<string, unknown>; clearCache: () => void } {
  const cache = new Map<string, { value: unknown; timestamp?: number }>();

  const memoizedFunction = function(this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached) {
      // Check TTL if specified
      if (ttl && cached.timestamp && Date.now() - cached.timestamp > ttl) {
        cache.delete(key);
      } else {
        return cached.value;
      }
    }

    const result = func.apply(this, args);
    const entry: { value: unknown; timestamp?: number } = { value: result };
    if (ttl) {
      entry.timestamp = Date.now();
    }
    cache.set(key, entry);

    return result;
  } as T & { cache: Map<string, unknown>; clearCache: () => void };

  memoizedFunction.cache = cache;
  memoizedFunction.clearCache = () => cache.clear();

  return memoizedFunction;
}

/**
 * Batch DOM updates to improve performance
 */
export function batchDOMUpdates(updates: (() => void)[]): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
      resolve();
    });
  });
}

/**
 * Lazy loading with intersection observer
 */
export function createLazyLoader(
  options: IntersectionObserverInit = {}
): {
  observe: (element: Element, callback: () => void) => void;
  disconnect: () => void;
} {
  const callbacks = new Map<Element, () => void>();
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const callback = callbacks.get(entry.target);
        if (callback) {
          callback();
          callbacks.delete(entry.target);
          observer.unobserve(entry.target);
        }
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  });

  return {
    observe: (element: Element, callback: () => void) => {
      callbacks.set(element, callback);
      observer.observe(element);
    },
    disconnect: () => {
      observer.disconnect();
      callbacks.clear();
    },
  };
}

/**
 * Chunked processing for heavy operations
 */
export async function processInChunks<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  chunkSize: number = 100,
  delay: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = chunk.map((item, index) => processor(item, i + index));
    results.push(...chunkResults);
    
    // Allow other tasks to run
    if (i + chunkSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Memory usage monitoring (Chrome only)
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  limit: number;
} | null {
  // @ts-expect-error - performance.memory is Chrome-specific
  if (typeof performance.memory !== 'undefined') {
    // @ts-expect-error - performance.memory is Chrome-specific
    const memory = performance.memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
    };
  }
  return null;
}

/**
 * Performance measurement utility
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (startTime === undefined) {
      throw new Error(`Mark '${startMark}' not found`);
    }
    
    const duration = performance.now() - startTime;
    this.measures.set(name, duration);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  // Measure function execution time
  time<T extends (...args: never[]) => unknown>(
    name: string,
    func: T
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      const startMark = `${name}-start`;
      this.mark(startMark);
      
      const result = func(...args);
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result.then((value) => {
          this.measure(name, startMark);
          return value;
        }) as ReturnType<T>;
      } else {
        this.measure(name, startMark);
        return result;
      }
    };
  }
}

/**
 * Resource prefetching utility
 */
export function prefetchResource(
  url: string,
  type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'
): Promise<void> {
  return new Promise((resolve, reject) => {
    switch (type) {
      case 'script': {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
        break;
      }
        
      case 'style': {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = reject;
        document.head.appendChild(link);
        break;
      }
        
      case 'image': {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
        break;
      }
        
      default:
      case 'fetch': {
        fetch(url, { method: 'GET' })
          .then(() => resolve())
          .catch(reject);
        break;
      }
    }
  });
}

/**
 * Bundle analysis helper (development only)
 */
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;
    
    console.group('📦 Bundle Analysis');
    
    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (src && !src.includes('node_modules')) {
        fetch(src)
          .then(response => response.blob())
          .then(blob => {
            const sizeKB = Math.round(blob.size / 1024);
            totalSize += sizeKB;
            console.log(`${src.split('/').pop()}: ${sizeKB}KB`);
          });
      }
    });
    
    setTimeout(() => {
      console.log(`Total estimated size: ~${totalSize}KB`);
      console.groupEnd();
    }, 1000);
  }
}

/**
 * Create performance observer for Core Web Vitals
 */
export function observeCoreWebVitals(
  callback: (metric: { name: string; value: number; rating: 'good' | 'needs-improvement' | 'poor' }) => void
): void {
  if (typeof PerformanceObserver === 'undefined') return;

  // Cumulative Layout Shift
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const layoutShiftEntry = entry as PerformanceEntry & { 
        hadRecentInput?: boolean; 
        value?: number; 
      };
      if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value !== undefined) {
        const value = layoutShiftEntry.value;
        callback({
          name: 'CLS',
          value,
          rating: value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor'
        });
      }
    }
  }).observe({ entryTypes: ['layout-shift'] });

  // First Input Delay
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const fidEntry = entry as PerformanceEntry & { 
        processingStart?: number; 
      };
      if (fidEntry.processingStart !== undefined) {
        const value = fidEntry.processingStart - entry.startTime;
        callback({
          name: 'FID',
          value,
          rating: value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor'
        });
      }
    }
  }).observe({ entryTypes: ['first-input'] });

  // Largest Contentful Paint
  new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      const value = lastEntry.startTime;
      callback({
        name: 'LCP',
        value,
        rating: value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor'
      });
    }
  }).observe({ entryTypes: ['largest-contentful-paint'] });
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker();