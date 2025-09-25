/**
 * React Hook for Monitoring Integration
 * Provides easy-to-use monitoring capabilities for React components
 */

import { useEffect, useCallback, useRef } from 'react';
import { getMonitoringService } from '@/lib/monitoring';

interface UseMonitoringOptions {
  trackPageViews?: boolean;
  trackUserInteractions?: boolean;
  trackComponentPerformance?: boolean;
}

interface MonitoringHook {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPageView: (path?: string, title?: string) => void;
  setUser: (userId: string, userProperties?: Record<string, any>) => void;
  startTimer: (name: string) => () => void;
  trackComponentMount: (componentName: string) => void;
  trackComponentRender: (componentName: string, renderTime: number) => void;
}

export const useMonitoring = (options: UseMonitoringOptions = {}): MonitoringHook => {
  const {
    trackPageViews = true,
    trackUserInteractions = true,
    trackComponentPerformance = false
  } = options;

  const monitoring = getMonitoringService();
  const timers = useRef<Map<string, number>>(new Map());

  // Track page views on mount and location changes
  useEffect(() => {
    if (trackPageViews && monitoring) {
      monitoring.trackPageView();

      // Track page views on navigation
      const handlePopState = () => {
        setTimeout(() => {
          monitoring.trackPageView();
        }, 0);
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [trackPageViews, monitoring]);

  // Track user interactions
  useEffect(() => {
    if (trackUserInteractions && monitoring) {
      const trackClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        const className = target.className;
        const textContent = target.textContent?.slice(0, 50);

        monitoring.trackEvent('user_interaction', {
          type: 'click',
          tagName,
          className,
          textContent,
          x: event.clientX,
          y: event.clientY
        });
      };

      const trackKeyPress = (event: KeyboardEvent) => {
        monitoring.trackEvent('user_interaction', {
          type: 'keypress',
          key: event.key,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey
        });
      };

      const trackScroll = throttle(() => {
        monitoring.trackEvent('user_interaction', {
          type: 'scroll',
          scrollY: window.scrollY,
          scrollX: window.scrollX,
          documentHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight
        });
      }, 1000);

      document.addEventListener('click', trackClick);
      document.addEventListener('keypress', trackKeyPress);
      window.addEventListener('scroll', trackScroll);

      return () => {
        document.removeEventListener('click', trackClick);
        document.removeEventListener('keypress', trackKeyPress);
        window.removeEventListener('scroll', trackScroll);
      };
    }
  }, [trackUserInteractions, monitoring]);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    monitoring?.trackEvent(eventName, properties);
  }, [monitoring]);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    monitoring?.trackError(error, context);
  }, [monitoring]);

  const trackPageView = useCallback((path?: string, title?: string) => {
    monitoring?.trackPageView(path, title);
  }, [monitoring]);

  const setUser = useCallback((userId: string, userProperties?: Record<string, any>) => {
    monitoring?.setUser(userId, userProperties);
  }, [monitoring]);

  const startTimer = useCallback((name: string) => {
    const startTime = performance.now();
    timers.current.set(name, startTime);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      timers.current.delete(name);

      trackEvent('timer_completed', {
        name,
        duration,
        startTime,
        endTime
      });

      return duration;
    };
  }, [trackEvent]);

  const trackComponentMount = useCallback((componentName: string) => {
    if (trackComponentPerformance) {
      trackEvent('component_mounted', {
        componentName,
        timestamp: performance.now()
      });
    }
  }, [trackEvent, trackComponentPerformance]);

  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    if (trackComponentPerformance) {
      trackEvent('component_render', {
        componentName,
        renderTime,
        timestamp: performance.now()
      });
    }
  }, [trackEvent, trackComponentPerformance]);

  return {
    trackEvent,
    trackError,
    trackPageView,
    setUser,
    startTimer,
    trackComponentMount,
    trackComponentRender
  };
};

/**
 * Higher-Order Component for automatic component performance tracking
 */
export const withMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) => {
  const MonitoredComponent: React.FC<P> = (props) => {
    const { trackComponentMount, trackComponentRender } = useMonitoring({
      trackComponentPerformance: true
    });

    const name = componentName || WrappedComponent.displayName || WrappedComponent.name;
    const renderStartTime = useRef<number>(0);

    useEffect(() => {
      trackComponentMount(name);
    }, [name, trackComponentMount]);

    useEffect(() => {
      renderStartTime.current = performance.now();
    });

    useEffect(() => {
      const renderTime = performance.now() - renderStartTime.current;
      trackComponentRender(name, renderTime);
    });

    return <WrappedComponent {...props} />;
  };

  MonitoredComponent.displayName = `withMonitoring(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return MonitoredComponent;
};

/**
 * Hook for monitoring form interactions and performance
 */
export const useFormMonitoring = (formName: string) => {
  const { trackEvent, trackError } = useMonitoring();

  const trackFormStart = useCallback(() => {
    trackEvent('form_started', {
      formName,
      timestamp: Date.now()
    });
  }, [formName, trackEvent]);

  const trackFormSubmit = useCallback((success: boolean, errors?: string[]) => {
    trackEvent('form_submitted', {
      formName,
      success,
      errors,
      timestamp: Date.now()
    });
  }, [formName, trackEvent]);

  const trackFormFieldFocus = useCallback((fieldName: string) => {
    trackEvent('form_field_focus', {
      formName,
      fieldName,
      timestamp: Date.now()
    });
  }, [formName, trackEvent]);

  const trackFormFieldBlur = useCallback((fieldName: string, value: any) => {
    trackEvent('form_field_blur', {
      formName,
      fieldName,
      hasValue: Boolean(value),
      valueLength: String(value).length,
      timestamp: Date.now()
    });
  }, [formName, trackEvent]);

  const trackFormError = useCallback((error: Error, fieldName?: string) => {
    trackError(error, {
      formName,
      fieldName,
      source: 'form_validation'
    });
  }, [formName, trackError]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormFieldFocus,
    trackFormFieldBlur,
    trackFormError
  };
};

/**
 * Hook for monitoring API calls and network performance
 */
export const useAPIMonitoring = () => {
  const { trackEvent, trackError } = useMonitoring();

  const trackAPICall = useCallback((
    method: string,
    url: string,
    duration: number,
    status: number,
    success: boolean
  ) => {
    trackEvent('api_call', {
      method: method.toUpperCase(),
      url,
      duration,
      status,
      success,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackAPIError = useCallback((error: Error, method: string, url: string) => {
    trackError(error, {
      method: method.toUpperCase(),
      url,
      source: 'api_call'
    });
  }, [trackError]);

  const wrapFetch = useCallback((url: string, options?: RequestInit) => {
    const startTime = performance.now();
    const method = options?.method || 'GET';

    return fetch(url, options)
      .then(response => {
        const duration = performance.now() - startTime;
        trackAPICall(method, url, duration, response.status, response.ok);
        return response;
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        trackAPICall(method, url, duration, 0, false);
        trackAPIError(error, method, url);
        throw error;
      });
  }, [trackAPICall, trackAPIError]);

  return {
    trackAPICall,
    trackAPIError,
    wrapFetch
  };
};

/**
 * Hook for A/B testing integration
 */
export const useABTesting = () => {
  const { trackEvent } = useMonitoring();

  const trackExperiment = useCallback((
    experimentName: string,
    variant: string,
    userId?: string
  ) => {
    trackEvent('ab_test_exposure', {
      experimentName,
      variant,
      userId,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const trackConversion = useCallback((
    experimentName: string,
    variant: string,
    conversionType: string,
    value?: number
  ) => {
    trackEvent('ab_test_conversion', {
      experimentName,
      variant,
      conversionType,
      value,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  return {
    trackExperiment,
    trackConversion
  };
};

/**
 * Utility function for throttling
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}