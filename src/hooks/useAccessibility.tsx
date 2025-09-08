import { useEffect, useRef, useState, useCallback } from 'react';

// Hook for focus management
export function useFocusManagement() {
  const focusTrapRef = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((element: HTMLElement) => {
    focusTrapRef.current = element;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
      
      if (e.key === 'Escape') {
        const closeButton = element.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
        closeButton?.click();
      }
    };

    element.addEventListener('keydown', handleKeydown);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeydown);
      focusTrapRef.current = null;
    };
  }, []);

  const releaseFocus = useCallback(() => {
    if (focusTrapRef.current) {
      focusTrapRef.current = null;
    }
  }, []);

  return { trapFocus, releaseFocus };
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) {
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        onEnter?.();
        break;
      case 'Escape':
        onEscape?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onArrowDown?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onArrowRight?.();
        break;
    }
  }, [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);

  return { handleKeydown };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);

    // Create a live region for the announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Remove the live region after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  return { announce, announcements, clearAnnouncements };
}

// Hook for high contrast mode detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
}

// Hook for reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for color scheme preference
export function useColorScheme() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
}

// Hook for ARIA live regions
export function useAriaLive() {
  const liveRef = useRef<HTMLDivElement | null>(null);

  const updateLiveRegion = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRef.current) {
      liveRef.current.setAttribute('aria-live', priority);
      liveRef.current.textContent = message;
    }
  }, []);

  const LiveRegion = useCallback(({ className = 'sr-only' }: { className?: string }) => (
    <div
      ref={liveRef}
      aria-live="polite"
      aria-atomic="true"
      className={className}
    />
  ), []);

  return { updateLiveRegion, LiveRegion };
}

// Hook for accessible modal/dialog management
export function useModal(isOpen: boolean, onClose?: () => void) {
  const modalRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const { trapFocus, releaseFocus } = useFocusManagement();

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Set up focus trap
      if (modalRef.current) {
        const cleanup = trapFocus(modalRef.current);
        return cleanup;
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Return focus to previously focused element
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
      
      releaseFocus();
    }
  }, [isOpen, trapFocus, releaseFocus]);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  }, [isOpen, handleKeydown]);

  return { modalRef };
}

// Hook for accessible form validation
export function useAccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announce } = useScreenReader();

  const validateField = useCallback((fieldName: string, value: unknown, validator: (value: unknown) => string | null) => {
    const error = validator(value);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }));

    if (error) {
      announce(`Error in ${fieldName}: ${error}`, 'assertive');
    }

    return !error;
  }, [announce]);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  }, []);

  const hasErrors = Object.values(errors).some(error => error !== '');

  return {
    errors,
    validateField,
    clearFieldError,
    hasErrors,
  };
}

// Hook for accessible drag and drop
export function useAccessibleDragDrop() {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropZones, setDropZones] = useState<string[]>([]);
  const { announce } = useScreenReader();

  const startDrag = useCallback((itemId: string, itemName: string) => {
    setDraggedItem(itemId);
    announce(`Started dragging ${itemName}`, 'assertive');
  }, [announce]);

  const endDrag = useCallback(() => {
    if (draggedItem) {
      setDraggedItem(null);
      announce('Drag operation completed', 'polite');
    }
  }, [draggedItem, announce]);

  const registerDropZone = useCallback((zoneId: string) => {
    setDropZones(prev => [...prev, zoneId]);
  }, []);

  const unregisterDropZone = useCallback((zoneId: string) => {
    setDropZones(prev => prev.filter(id => id !== zoneId));
  }, []);

  const handleKeyboardDrop = useCallback((
    sourceId: string,
    targetId: string,
    sourceName: string,
    targetName: string,
    onDrop: (sourceId: string, targetId: string) => void
  ) => {
    onDrop(sourceId, targetId);
    announce(`Moved ${sourceName} to ${targetName}`, 'assertive');
  }, [announce]);

  return {
    draggedItem,
    dropZones,
    startDrag,
    endDrag,
    registerDropZone,
    unregisterDropZone,
    handleKeyboardDrop,
  };
}

// Utility function for generating unique IDs for ARIA relationships
export function useUniqueId(prefix: string = 'accessibility'): string {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
}