import { useCallback, useEffect, useState } from 'react';

// Haptic feedback patterns
export type HapticPattern = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'selection'
  | 'impact'
  | 'notification';

// Haptic feedback configuration
interface HapticConfig {
  enabled: boolean;
  intensity: number; // 0-1
  respectUserPreference: boolean;
  fallbackToVibration: boolean;
}

interface HapticCapabilities {
  supportsHaptics: boolean;
  supportsVibration: boolean;
  hasReducedMotion: boolean;
  isMobile: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export const useHapticFeedback = (config: Partial<HapticConfig> = {}) => {
  const defaultConfig: HapticConfig = {
    enabled: true,
    intensity: 1,
    respectUserPreference: true,
    fallbackToVibration: true,
    ...config
  };

  const [capabilities, setCapabilities] = useState<HapticCapabilities>({
    supportsHaptics: false,
    supportsVibration: false,
    hasReducedMotion: false,
    isMobile: false,
    platform: 'unknown'
  });

  // Detect platform and capabilities
  useEffect(() => {
    const detectCapabilities = () => {
      const userAgent = navigator.userAgent;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
      const isAndroid = /Android/i.test(userAgent);
      
      const platform: HapticCapabilities['platform'] = 
        isIOS ? 'ios' : 
        isAndroid ? 'android' : 
        isMobile ? 'unknown' : 'desktop';

      const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Check for haptic feedback support
      const supportsHaptics = 'vibrate' in navigator && (
        // iOS Haptic Engine (requires iOS 10+)
        isIOS ||
        // Android supports vibration API which we can use for haptic-like feedback
        isAndroid ||
        // Some desktop browsers support gamepad haptics
        'getGamepads' in navigator
      );

      const supportsVibration = 'vibrate' in navigator;

      setCapabilities({
        supportsHaptics,
        supportsVibration,
        hasReducedMotion,
        isMobile,
        platform
      });
    };

    detectCapabilities();

    // Listen for reduced motion preference changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = detectCapabilities;
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Haptic feedback patterns mapping
  const getHapticPattern = useCallback((pattern: HapticPattern): number | number[] => {
    const { platform } = capabilities;
    const intensity = defaultConfig.intensity;

    switch (pattern) {
      case 'light':
        return platform === 'ios' ? 10 * intensity : [20];
        
      case 'medium':
        return platform === 'ios' ? 20 * intensity : [40];
        
      case 'heavy':
        return platform === 'ios' ? 30 * intensity : [60];
        
      case 'success':
        return platform === 'ios' ? [10, 50, 10] : [50, 100, 50];
        
      case 'warning':
        return platform === 'ios' ? [20, 100, 20] : [100, 50, 100];
        
      case 'error':
        return platform === 'ios' ? [50, 100, 50, 100, 50] : [200, 100, 200];
        
      case 'selection':
        return platform === 'ios' ? 5 * intensity : [10];
        
      case 'impact':
        return platform === 'ios' ? 15 * intensity : [30];
        
      case 'notification':
        return platform === 'ios' ? [20, 50, 20] : [100, 50, 100];
        
      default:
        return [20];
    }
  }, [capabilities, defaultConfig.intensity]);

  // Main haptic feedback function
  const haptic = useCallback((pattern: HapticPattern) => {
    // Check if feedback should be disabled
    if (!defaultConfig.enabled || 
        (defaultConfig.respectUserPreference && capabilities.hasReducedMotion) ||
        (!capabilities.supportsHaptics && !capabilities.supportsVibration)) {
      return;
    }

    try {
      const hapticPattern = getHapticPattern(pattern);

      if (capabilities.platform === 'ios' && capabilities.supportsHaptics) {
        // iOS Haptic Engine (requires iOS 10+)
        if ('vibrate' in navigator) {
          if (Array.isArray(hapticPattern)) {
            navigator.vibrate(hapticPattern);
          } else {
            navigator.vibrate(hapticPattern);
          }
        }
      } else if (capabilities.supportsVibration && defaultConfig.fallbackToVibration) {
        // Fallback to vibration API
        if (Array.isArray(hapticPattern)) {
          navigator.vibrate(hapticPattern);
        } else {
          navigator.vibrate(hapticPattern);
        }
      }
    } catch (error) {
      console.debug('[Haptic] Feedback failed:', error);
    }
  }, [capabilities, defaultConfig, getHapticPattern]);

  // Convenience methods for common patterns
  const light = useCallback(() => haptic('light'), [haptic]);
  const medium = useCallback(() => haptic('medium'), [haptic]);
  const heavy = useCallback(() => haptic('heavy'), [haptic]);
  const success = useCallback(() => haptic('success'), [haptic]);
  const warning = useCallback(() => haptic('warning'), [haptic]);
  const error = useCallback(() => haptic('error'), [haptic]);
  const selection = useCallback(() => haptic('selection'), [haptic]);
  const impact = useCallback(() => haptic('impact'), [haptic]);
  const notification = useCallback(() => haptic('notification'), [haptic]);

  return {
    haptic,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    impact,
    notification,
    capabilities,
    isEnabled: defaultConfig.enabled && !capabilities.hasReducedMotion && 
               (capabilities.supportsHaptics || capabilities.supportsVibration)
  };
};

// Higher-order component to add haptic feedback to any component
export interface WithHapticProps {
  onHapticTrigger?: (pattern: HapticPattern) => void;
  hapticPattern?: HapticPattern;
  hapticOnClick?: boolean;
  hapticOnHover?: boolean;
  hapticOnFocus?: boolean;
}

export function withHapticFeedback<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<HTMLElement, P & WithHapticProps>((props, ref) => {
    const {
      onHapticTrigger,
      hapticPattern = 'light',
      hapticOnClick = false,
      hapticOnHover = false,
      hapticOnFocus = false,
      ...otherProps
    } = props;

    const { haptic } = useHapticFeedback();

    const triggerHaptic = useCallback((pattern: HapticPattern = hapticPattern) => {
      haptic(pattern);
      onHapticTrigger?.(pattern);
    }, [haptic, hapticPattern, onHapticTrigger]);

    const enhancedProps = {
      ...otherProps,
      onClick: hapticOnClick 
        ? (e: React.MouseEvent) => {
            triggerHaptic();
            (otherProps as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
          }
        : (otherProps as { onClick?: (e: React.MouseEvent) => void }).onClick,
      onMouseEnter: hapticOnHover
        ? (e: React.MouseEvent) => {
            triggerHaptic('selection');
            (otherProps as { onMouseEnter?: (e: React.MouseEvent) => void }).onMouseEnter?.(e);
          }
        : (otherProps as { onMouseEnter?: (e: React.MouseEvent) => void }).onMouseEnter,
      onFocus: hapticOnFocus
        ? (e: React.FocusEvent) => {
            triggerHaptic('selection');
            (otherProps as { onFocus?: (e: React.FocusEvent) => void }).onFocus?.(e);
          }
        : (otherProps as { onFocus?: (e: React.FocusEvent) => void }).onFocus,
    };

    return <Component {...enhancedProps as P} ref={ref} />;
  });
}

// Context for managing global haptic settings
import React, { createContext, useContext } from 'react';

interface HapticContextValue {
  globalConfig: HapticConfig;
  updateConfig: (config: Partial<HapticConfig>) => void;
  capabilities: HapticCapabilities;
}

const HapticContext = createContext<HapticContextValue | undefined>(undefined);

export const HapticProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: Partial<HapticConfig>;
}> = ({ children, initialConfig }) => {
  const [globalConfig, setGlobalConfig] = useState<HapticConfig>({
    enabled: true,
    intensity: 1,
    respectUserPreference: true,
    fallbackToVibration: true,
    ...initialConfig
  });

  const { capabilities } = useHapticFeedback(globalConfig);

  const updateConfig = useCallback((config: Partial<HapticConfig>) => {
    setGlobalConfig(prev => ({ ...prev, ...config }));
  }, []);

  return (
    <HapticContext.Provider value={{ globalConfig, updateConfig, capabilities }}>
      {children}
    </HapticContext.Provider>
  );
};

export const useHapticContext = () => {
  const context = useContext(HapticContext);
  if (!context) {
    throw new Error('useHapticContext must be used within a HapticProvider');
  }
  return context;
};