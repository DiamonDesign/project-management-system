import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AccessibilityContextType {
  prefersReducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  prefersHighContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  prefersDarkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  setFontSize: (size: 'small' | 'normal' | 'large' | 'extra-large') => void;
  focusVisible: boolean;
  setFocusVisible: (visible: boolean) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  // Initialize states from localStorage or system preferences
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    const saved = localStorage.getItem('accessibility-reduced-motion');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [prefersHighContrast, setPrefersHighContrast] = useState(() => {
    const saved = localStorage.getItem('accessibility-high-contrast');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-contrast: high)').matches;
  });

  const [prefersDarkMode, setPrefersDarkMode] = useState(() => {
    const saved = localStorage.getItem('accessibility-dark-mode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [fontSize, setFontSizeState] = useState<'small' | 'normal' | 'large' | 'extra-large'>(() => {
    const saved = localStorage.getItem('accessibility-font-size');
    return (saved as any) || 'normal';
  });

  const [focusVisible, setFocusVisible] = useState(() => {
    const saved = localStorage.getItem('accessibility-focus-visible');
    if (saved !== null) return JSON.parse(saved);
    return true;
  });

  // Listen for system preference changes
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('accessibility-reduced-motion') === null) {
        setPrefersReducedMotion(e.matches);
      }
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('accessibility-high-contrast') === null) {
        setPrefersHighContrast(e.matches);
      }
    };

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('accessibility-dark-mode') === null) {
        setPrefersDarkMode(e.matches);
      }
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    darkModeQuery.addEventListener('change', handleDarkModeChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Reduced motion
    if (prefersReducedMotion) {
      root.style.setProperty('--duration-fast', '0.01ms');
      root.style.setProperty('--duration-base', '0.01ms');
      root.style.setProperty('--duration-slow', '0.01ms');
      root.style.setProperty('--duration-slower', '0.01ms');
    } else {
      root.style.removeProperty('--duration-fast');
      root.style.removeProperty('--duration-base');
      root.style.removeProperty('--duration-slow');
      root.style.removeProperty('--duration-slower');
    }
    
    // High contrast
    if (prefersHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Dark mode
    if (prefersDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Font size
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-extra-large');
    root.classList.add(`font-${fontSize}`);
    
    // Focus visible
    if (!focusVisible) {
      root.classList.add('no-focus-visible');
    } else {
      root.classList.remove('no-focus-visible');
    }
  }, [prefersReducedMotion, prefersHighContrast, prefersDarkMode, fontSize, focusVisible]);
  
  const setReducedMotion = (enabled: boolean) => {
    setPrefersReducedMotion(enabled);
    localStorage.setItem('accessibility-reduced-motion', enabled.toString());
  };
  
  const setHighContrast = (enabled: boolean) => {
    setPrefersHighContrast(enabled);
    localStorage.setItem('accessibility-high-contrast', enabled.toString());
  };
  
  const setDarkMode = (enabled: boolean) => {
    setPrefersDarkMode(enabled);
    localStorage.setItem('accessibility-dark-mode', enabled.toString());
  };
  
  const setFontSize = (size: 'small' | 'normal' | 'large' | 'extra-large') => {
    setFontSizeState(size);
    localStorage.setItem('accessibility-font-size', size);
  };
  
  const setFocusVisibleState = (visible: boolean) => {
    setFocusVisible(visible);
    localStorage.setItem('accessibility-focus-visible', visible.toString());
  };
  
  // Screen reader announcements
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };
  
  return (
    <AccessibilityContext.Provider
      value={{
        prefersReducedMotion,
        setReducedMotion,
        prefersHighContrast,
        setHighContrast,
        prefersDarkMode,
        setDarkMode,
        fontSize,
        setFontSize,
        focusVisible,
        setFocusVisible: setFocusVisibleState,
        announce,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Custom hook for keyboard navigation
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content
      if (event.key === 'Tab' && event.shiftKey && event.target === document.body) {
        const skipLink = document.getElementById('skip-to-main');
        if (skipLink) {
          skipLink.focus();
          event.preventDefault();
        }
      }
      
      // Escape key to close modals/dropdowns
      if (event.key === 'Escape') {
        const focusedElement = document.activeElement as HTMLElement;
        if (focusedElement && focusedElement.closest('[role="dialog"]')) {
          const closeButton = focusedElement.closest('[role="dialog"]')?.querySelector('[data-close]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

// Custom hook for focus management
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
  const trapFocus = () => {
    if (!containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  };
  
  return { trapFocus };
};

// Custom hook for screen reader announcements
export const useScreenReader = () => {
  const { announce } = useAccessibility();
  
  const announceNavigation = (page: string) => {
    announce(`Navegaste a ${page}`);
  };
  
  const announceAction = (action: string) => {
    announce(action, 'assertive');
  };
  
  const announceError = (error: string) => {
    announce(`Error: ${error}`, 'assertive');
  };
  
  const announceSuccess = (message: string) => {
    announce(`Éxito: ${message}`);
  };
  
  return {
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess,
  };
};