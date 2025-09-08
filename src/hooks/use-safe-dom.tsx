import React, { useEffect, useCallback } from 'react';

/**
 * Safe DOM utility hooks to prevent "Cannot read properties of null" errors
 * These hooks provide defensive programming for DOM operations
 */

export const useSafeEventListener = (
  target: EventTarget | null,
  event: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
) => {
  useEffect(() => {
    if (!target || typeof target.addEventListener !== 'function') {
      return;
    }

    try {
      target.addEventListener(event, handler, options);
      
      return () => {
        try {
          target.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn(`Failed to remove ${event} listener:`, error);
        }
      };
    } catch (error) {
      console.warn(`Failed to add ${event} listener:`, error);
    }
  }, [target, event, handler, options]);
};

export const useSafeDocumentListener = (
  event: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
) => {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    try {
      document.addEventListener(event, handler, options);
      
      return () => {
        try {
          document.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn(`Failed to remove document ${event} listener:`, error);
        }
      };
    } catch (error) {
      console.warn(`Failed to add document ${event} listener:`, error);
    }
  }, [event, handler, options]);
};

export const useSafeWindowListener = (
  event: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions
) => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.addEventListener(event, handler, options);
      
      return () => {
        try {
          window.removeEventListener(event, handler, options);
        } catch (error) {
          console.warn(`Failed to remove window ${event} listener:`, error);
        }
      };
    } catch (error) {
      console.warn(`Failed to add window ${event} listener:`, error);
    }
  }, [event, handler, options]);
};

export const useSafeMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    try {
      const mediaQueryList = window.matchMedia(query);
      setMatches(mediaQueryList.matches);

      const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
      
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener('change', handler);
        return () => {
          try {
            mediaQueryList.removeEventListener('change', handler);
          } catch (error) {
            console.warn('Failed to remove media query listener:', error);
          }
        };
      } else {
        // Fallback for older browsers
        mediaQueryList.addListener(handler);
        return () => {
          try {
            mediaQueryList.removeListener(handler);
          } catch (error) {
            console.warn('Failed to remove media query listener (legacy):', error);
          }
        };
      }
    } catch (error) {
      console.warn('Failed to setup media query:', error);
      return;
    }
  }, [query]);

  return matches;
};

export const useSafeDOMOperation = () => {
  return useCallback((operation: () => void, errorMessage?: string) => {
    try {
      operation();
    } catch (error) {
      console.warn(errorMessage || 'DOM operation failed:', error);
    }
  }, []);
};

