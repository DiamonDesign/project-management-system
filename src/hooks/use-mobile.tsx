import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const DESKTOP_BREAKPOINT = 1280;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    // Defensive check for window and matchMedia availability
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }
    };
    
    // Use try-catch for addEventListener in case of race conditions
    try {
      mql.addEventListener("change", onChange);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    } catch (error) {
      console.warn('Failed to add media query listener:', error);
      // Fallback: just set initial value
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    
    return () => {
      try {
        mql.removeEventListener("change", onChange);
      } catch (error) {
        console.warn('Failed to remove media query listener:', error);
      }
    };
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    // Defensive check for window and matchMedia availability
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);
    const onChange = () => {
      if (typeof window !== 'undefined') {
        setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT);
      }
    };
    
    try {
      mql.addEventListener("change", onChange);
      setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT);
    } catch (error) {
      console.warn('Failed to add media query listener:', error);
      setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT);
    }
    
    return () => {
      try {
        mql.removeEventListener("change", onChange);
      } catch (error) {
        console.warn('Failed to remove media query listener:', error);
      }
    };
  }, []);

  return !!isTablet;
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const onChange = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isDesktop;
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = React.useState<{
    width: number | undefined;
    height: number | undefined;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  }>({
    width: undefined,
    height: undefined,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  React.useEffect(() => {
    // Defensive check for window availability
    if (typeof window === 'undefined') {
      return;
    }

    const updateSize = () => {
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        width,
        height,
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= DESKTOP_BREAKPOINT,
      });
    };

    try {
      window.addEventListener('resize', updateSize);
      updateSize(); // Initial call
    } catch (error) {
      console.warn('Failed to add resize listener:', error);
      updateSize(); // Still try to get initial size
    }
    
    return () => {
      try {
        window.removeEventListener('resize', updateSize);
      } catch (error) {
        console.warn('Failed to remove resize listener:', error);
      }
    };
  }, []);

  return screenSize;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    // Defensive check for window and matchMedia availability
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    
    try {
      // Use both change event on MediaQueryList and resize on window for better coverage
      media.addEventListener('change', listener);
      window.addEventListener('resize', listener);
    } catch (error) {
      console.warn('Failed to add media query listeners:', error);
      // Fallback: just set initial state
      setMatches(media.matches);
    }
    
    return () => {
      try {
        media.removeEventListener('change', listener);
        window.removeEventListener('resize', listener);
      } catch (error) {
        console.warn('Failed to remove media query listeners:', error);
      }
    };
  }, [matches, query]);

  return matches;
}

// Predefined media queries
export const usePrefersDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const usePrefersHighContrast = () => useMediaQuery('(prefers-contrast: high)');
export const useCanHover = () => useMediaQuery('(hover: hover)');
export const useSupportsTouch = () => useMediaQuery('(pointer: coarse)');