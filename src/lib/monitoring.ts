/**
 * Comprehensive Production Monitoring & Observability System
 * Integrates error tracking, performance monitoring, and user analytics
 * Built for production-grade monitoring with minimal performance impact
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

// Monitoring configuration
interface MonitoringConfig {
  sentryDsn?: string;
  enableRUM: boolean;
  enableAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  sampleRate: number;
  environment: 'development' | 'staging' | 'production';
  version: string;
}

// Performance thresholds for alerting
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 }
} as const;

class MonitoringService {
  private config: MonitoringConfig;
  private sessionId: string;
  private userId?: string;
  private performanceBuffer: Metric[] = [];

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize monitoring services
   */
  private initialize(): void {
    if (this.config.environment === 'production') {
      this.initializeSentry();
    }

    if (this.config.enableRUM) {
      this.initializeRUM();
    }

    if (this.config.enablePerformanceMonitoring) {
      this.initializePerformanceMonitoring();
    }

    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandlers();
  }

  /**
   * Initialize Sentry for error tracking
   */
  private async initializeSentry(): Promise<void> {
    try {
      const { init, configureScope, setUser } = await import('@sentry/react');
      const { BrowserTracing } = await import('@sentry/tracing');

      init({
        dsn: this.config.sentryDsn,
        environment: this.config.environment,
        release: this.config.version,
        sampleRate: this.config.sampleRate,
        tracesSampleRate: this.config.environment === 'production' ? 0.1 : 1.0,
        integrations: [
          new BrowserTracing({
            tracingOrigins: [window.location.hostname, /^\//],
            routingInstrumentation: (customStartTransaction) => {
              // Custom routing instrumentation for React Router
              if (window.history?.pushState) {
                const originalPushState = window.history.pushState;
                window.history.pushState = function (...args) {
                  originalPushState.apply(window.history, args);
                  customStartTransaction({ name: window.location.pathname, op: 'navigation' });
                };
              }
            },
          }),
        ],
        beforeSend: (event) => {
          // Filter out development errors and irrelevant errors
          if (this.config.environment === 'development') {
            return null;
          }

          // Filter out common non-critical errors
          const ignoredErrors = [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'Script error.',
            'Network request failed'
          ];

          if (ignoredErrors.some(ignored => event.message?.includes(ignored))) {
            return null;
          }

          return event;
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Filter out noisy breadcrumbs
          if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
            return null;
          }
          return breadcrumb;
        }
      });

      configureScope((scope) => {
        scope.setTag('sessionId', this.sessionId);
        scope.setContext('device', {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine
        });
      });

    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Initialize Real User Monitoring (RUM)
   */
  private initializeRUM(): void {
    // Core Web Vitals monitoring
    this.measureCoreWebVitals();

    // Custom performance metrics
    this.measureCustomMetrics();

    // Resource timing monitoring
    this.measureResourceTiming();

    // Navigation timing
    this.measureNavigationTiming();
  }

  /**
   * Measure Core Web Vitals
   */
  private measureCoreWebVitals(): void {
    getCLS(this.handleMetric.bind(this), true);
    getFID(this.handleMetric.bind(this));
    getFCP(this.handleMetric.bind(this));
    getLCP(this.handleMetric.bind(this), true);
    getTTFB(this.handleMetric.bind(this));
  }

  /**
   * Handle performance metrics
   */
  private handleMetric(metric: Metric): void {
    this.performanceBuffer.push(metric);

    // Check thresholds and trigger alerts if necessary
    this.checkPerformanceThresholds(metric);

    // Send to analytics service
    this.sendMetricToAnalytics(metric);

    // Batch send metrics to reduce network calls
    if (this.performanceBuffer.length >= 10) {
      this.flushPerformanceBuffer();
    }
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  private checkPerformanceThresholds(metric: Metric): void {
    const threshold = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!threshold) return;

    let rating: 'good' | 'needs-improvement' | 'poor';

    if (metric.value <= threshold.good) {
      rating = 'good';
    } else if (metric.value <= threshold.poor) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    if (rating === 'poor') {
      this.trackEvent('performance_alert', {
        metric: metric.name,
        value: metric.value,
        threshold: threshold.poor,
        rating,
        url: window.location.href
      });
    }
  }

  /**
   * Initialize Performance Monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor long tasks
    this.monitorLongTasks();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor network conditions
    this.monitorNetworkConditions();

    // Monitor page visibility changes
    this.monitorPageVisibility();
  }

  /**
   * Monitor long tasks that block the main thread
   */
  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.trackEvent('long_task', {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name || 'unknown'
              });
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.debug('Long task monitoring not supported');
      }
    }
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;

      setInterval(() => {
        const memoryUsage = {
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit
        };

        // Alert if memory usage is high
        const memoryUsagePercentage = memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit;
        if (memoryUsagePercentage > 0.8) {
          this.trackEvent('high_memory_usage', {
            ...memoryUsage,
            percentage: memoryUsagePercentage * 100
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Monitor network conditions
   */
  private monitorNetworkConditions(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      this.trackEvent('network_conditions', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      });

      // Monitor connection changes
      connection.addEventListener('change', () => {
        this.trackEvent('network_change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
  }

  /**
   * Monitor page visibility changes
   */
  private monitorPageVisibility(): void {
    let visibilityStart = Date.now();
    let isVisible = !document.hidden;

    document.addEventListener('visibilitychange', () => {
      const now = Date.now();

      if (document.hidden && isVisible) {
        // Page became hidden
        const visibleDuration = now - visibilityStart;
        this.trackEvent('page_hidden', {
          visibleDuration,
          url: window.location.href
        });
        isVisible = false;
      } else if (!document.hidden && !isVisible) {
        // Page became visible
        visibilityStart = now;
        this.trackEvent('page_visible', {
          url: window.location.href
        });
        isVisible = true;
      }
    });

    // Track session duration on page unload
    window.addEventListener('beforeunload', () => {
      if (isVisible) {
        const sessionDuration = Date.now() - visibilityStart;
        this.trackEvent('session_end', {
          sessionDuration,
          url: window.location.href
        });
      }
    });
  }

  /**
   * Custom metrics measurement
   */
  private measureCustomMetrics(): void {
    // Time to Interactive (custom implementation)
    this.measureTimeToInteractive();

    // First Input Delay using custom observer
    this.measureFirstInputDelay();

    // React rendering performance
    this.measureReactPerformance();
  }

  /**
   * Measure Time to Interactive
   */
  private measureTimeToInteractive(): void {
    window.addEventListener('load', () => {
      // Simple TTI approximation - when no long tasks for 5 seconds after DOM load
      setTimeout(() => {
        const navigationStart = performance.timing.navigationStart;
        const tti = Date.now() - navigationStart;

        this.trackEvent('time_to_interactive', {
          value: tti,
          url: window.location.href
        });
      }, 5000);
    });
  }

  /**
   * Measure First Input Delay manually
   */
  private measureFirstInputDelay(): void {
    let firstInputTime: number | null = null;

    const recordFirstInput = (event: Event) => {
      if (firstInputTime === null) {
        firstInputTime = performance.now();

        requestIdleCallback(() => {
          const fid = performance.now() - firstInputTime!;
          this.trackEvent('first_input_delay_manual', {
            value: fid,
            eventType: event.type,
            url: window.location.href
          });
        });

        // Remove listeners after first input
        ['click', 'mousedown', 'keydown', 'touchstart'].forEach(eventType => {
          document.removeEventListener(eventType, recordFirstInput, true);
        });
      }
    };

    // Listen for first input
    ['click', 'mousedown', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, recordFirstInput, true);
    });
  }

  /**
   * Measure React rendering performance
   */
  private measureReactPerformance(): void {
    // Use React DevTools profiler data if available
    if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
      const reactDevTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

      // Monitor React commits
      reactDevTools.onCommitFiberRoot = (id: number, root: any, priorityLevel: any) => {
        if (root.current) {
          const commitTime = performance.now();
          this.trackEvent('react_commit', {
            commitTime,
            priorityLevel,
            url: window.location.href
          });
        }
      };
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      this.trackError(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'global_error_handler'
      });
    });
  }

  /**
   * Setup unhandled promise rejection handlers
   */
  private setupUnhandledRejectionHandlers(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        source: 'unhandled_rejection',
        reason: event.reason
      });
    });
  }

  /**
   * Measure resource timing
   */
  private measureResourceTiming(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const resourceTiming = entry as PerformanceResourceTiming;

          // Track slow resources
          if (resourceTiming.duration > 1000) { // Slower than 1 second
            this.trackEvent('slow_resource', {
              name: resourceTiming.name,
              duration: resourceTiming.duration,
              size: resourceTiming.transferSize,
              type: resourceTiming.initiatorType
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Measure navigation timing
   */
  private measureNavigationTiming(): void {
    window.addEventListener('load', () => {
      const timing = performance.timing;
      const navigation = performance.navigation;

      const metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ssl: timing.requestStart - timing.secureConnectionStart,
        ttfb: timing.responseStart - timing.requestStart,
        download: timing.responseEnd - timing.responseStart,
        domProcessing: timing.domComplete - timing.domLoading,
        onload: timing.loadEventEnd - timing.loadEventStart,
        total: timing.loadEventEnd - timing.navigationStart,
        navigationType: navigation.type,
        redirectCount: navigation.redirectCount
      };

      this.trackEvent('navigation_timing', metrics);
    });
  }

  /**
   * Send metric to analytics service
   */
  private sendMetricToAnalytics(metric: Metric): void {
    if (!this.config.enableAnalytics) return;

    // Send to Google Analytics 4 if available
    if ('gtag' in window) {
      (window as any).gtag('event', metric.name, {
        custom_parameter_1: metric.value,
        custom_parameter_2: metric.id,
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)
      });
    }

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics('performance_metric', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: this.getMetricRating(metric),
      url: window.location.href,
      timestamp: Date.now()
    });
  }

  /**
   * Get metric rating (good, needs improvement, poor)
   */
  private getMetricRating(metric: Metric): string {
    const threshold = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!threshold) return 'unknown';

    if (metric.value <= threshold.good) return 'good';
    if (metric.value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Public API Methods
   */

  /**
   * Track custom event
   */
  public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    const eventData = {
      event: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: this.config.environment,
        version: this.config.version
      }
    };

    // Send to multiple analytics services
    this.sendToCustomAnalytics(eventName, eventData);

    // Send to Google Analytics if available
    if ('gtag' in window && this.config.enableAnalytics) {
      (window as any).gtag('event', eventName, properties);
    }
  }

  /**
   * Track error
   */
  public trackError(error: Error, context: Record<string, any> = {}): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: {
        ...context,
        sessionId: this.sessionId,
        userId: this.userId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }
    };

    // Send to Sentry if available
    if ('Sentry' in window) {
      (window as any).Sentry.captureException(error, {
        extra: context
      });
    }

    // Send to custom error tracking
    this.sendToCustomAnalytics('error', errorData);

    console.error('Tracked error:', errorData);
  }

  /**
   * Set user information
   */
  public setUser(userId: string, userProperties: Record<string, any> = {}): void {
    this.userId = userId;

    // Update Sentry user context
    if ('Sentry' in window) {
      (window as any).Sentry.setUser({
        id: userId,
        ...userProperties
      });
    }

    // Track user identification
    this.trackEvent('user_identified', {
      userId,
      ...userProperties
    });
  }

  /**
   * Track page view
   */
  public trackPageView(path?: string, title?: string): void {
    const pageData = {
      path: path || window.location.pathname,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    };

    this.trackEvent('page_view', pageData);
  }

  /**
   * Flush performance buffer
   */
  private flushPerformanceBuffer(): void {
    if (this.performanceBuffer.length === 0) return;

    this.sendToCustomAnalytics('performance_batch', {
      metrics: this.performanceBuffer.splice(0)
    });
  }

  /**
   * Send data to custom analytics endpoint
   */
  private sendToCustomAnalytics(eventType: string, data: any): void {
    // Use navigator.sendBeacon for reliability, fallback to fetch
    const payload = JSON.stringify({
      eventType,
      data,
      meta: {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        environment: this.config.environment
      }
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics', blob);
      } else {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch((error) => {
          console.debug('Analytics request failed:', error);
        });
      }
    } catch (error) {
      console.debug('Failed to send analytics:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and flush remaining data
   */
  public destroy(): void {
    this.flushPerformanceBuffer();
  }
}

// Create singleton instance
let monitoringService: MonitoringService | null = null;

/**
 * Initialize monitoring service
 */
export const initializeMonitoring = (config: Partial<MonitoringConfig> = {}): MonitoringService => {
  const fullConfig: MonitoringConfig = {
    enableRUM: true,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    sampleRate: 1.0,
    environment: (import.meta.env.VITE_NODE_ENV as any) || 'development',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    ...config
  };

  if (!monitoringService) {
    monitoringService = new MonitoringService(fullConfig);
  }

  return monitoringService;
};

/**
 * Get monitoring service instance
 */
export const getMonitoringService = (): MonitoringService | null => {
  return monitoringService;
};

export type { MonitoringConfig };
export { PERFORMANCE_THRESHOLDS };