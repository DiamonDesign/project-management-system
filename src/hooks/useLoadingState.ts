import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import {
  LoadingState,
  LoadingAction,
  LoadingPhase,
  LoadingStrategy,
  NetworkQuality,
  NETWORK_THRESHOLDS,
  VALID_TRANSITIONS
} from '@/types/loading';
import { logger } from '@/lib/logger';

// Initial state with sensible defaults
const createInitialState = (strategy: LoadingStrategy = 'progressive'): LoadingState => ({
  phase: 'initializing',
  strategy,
  components: {
    session: 'initializing',
    profile: 'initializing',
    projects: 'initializing',
    clients: 'initializing',
    tasks: 'initializing'
  },
  progress: {
    current: 0,
    total: 100,
    estimated: 0
  },
  network: {
    quality: 'medium',
    rtt: 150,
    adaptiveTimeouts: {
      auth: 5000,
      profile: 8000,
      database: 10000
    }
  },
  error: null,
  userControlled: {
    canRetry: false,
    canContinue: false,
    canSkip: false,
    autoRetryEnabled: true
  },
  timing: {
    started: Date.now(),
    lastUpdate: Date.now(),
    phaseStarted: Date.now()
  }
});

// Loading state reducer with validation
function loadingReducer(state: LoadingState, action: LoadingAction): LoadingState {
  const now = Date.now();

  switch (action.type) {
    case 'PHASE_CHANGE': {
      const { phase, component } = action.payload;

      // Validate transition
      if (component) {
        // Component-specific phase change
        return {
          ...state,
          components: {
            ...state.components,
            [component]: phase
          },
          timing: {
            ...state.timing,
            lastUpdate: now
          }
        };
      } else {
        // Global phase change
        if (!VALID_TRANSITIONS[state.phase].includes(phase)) {
          logger.loading(`Invalid phase transition: ${state.phase} -> ${phase}`);
          return state;
        }

        return {
          ...state,
          phase,
          timing: {
            ...state.timing,
            lastUpdate: now,
            phaseStarted: now
          },
          // Update user controls based on phase
          userControlled: {
            ...state.userControlled,
            canRetry: ['error', 'timeout'].includes(phase),
            canContinue: ['timeout', 'error'].includes(phase),
            canSkip: ['enhancing'].includes(phase)
          }
        };
      }
    }

    case 'PROGRESS_UPDATE': {
      const { current, total, estimated } = action.payload;
      return {
        ...state,
        progress: {
          current: Math.min(current, total),
          total,
          estimated: estimated || state.progress.estimated
        },
        timing: {
          ...state.timing,
          lastUpdate: now
        }
      };
    }

    case 'NETWORK_UPDATE': {
      const { rtt } = action.payload;

      // Determine network quality based on RTT
      let quality: NetworkQuality = 'medium';
      let adaptiveTimeouts = { ...state.network.adaptiveTimeouts };

      if (rtt < NETWORK_THRESHOLDS.fast.rtt) {
        quality = 'fast';
        adaptiveTimeouts = {
          auth: 3000,
          profile: 5000,
          database: 7000
        };
      } else if (rtt < NETWORK_THRESHOLDS.medium.rtt) {
        quality = 'medium';
        adaptiveTimeouts = {
          auth: 5000,
          profile: 8000,
          database: 10000
        };
      } else if (rtt < NETWORK_THRESHOLDS.slow.rtt) {
        quality = 'slow';
        adaptiveTimeouts = {
          auth: 8000,
          profile: 12000,
          database: 15000
        };
      } else {
        quality = 'offline';
        adaptiveTimeouts = {
          auth: 12000,
          profile: 18000,
          database: 25000
        };
      }

      return {
        ...state,
        network: {
          quality,
          rtt,
          adaptiveTimeouts
        },
        timing: {
          ...state.timing,
          lastUpdate: now
        }
      };
    }

    case 'ERROR': {
      const { code, message, recoverable } = action.payload;

      return {
        ...state,
        phase: 'error',
        error: {
          code,
          message,
          recoverable,
          retryCount: state.error?.retryCount || 0,
          lastRetry: state.error?.lastRetry
        },
        userControlled: {
          ...state.userControlled,
          canRetry: recoverable,
          canContinue: true
        },
        timing: {
          ...state.timing,
          lastUpdate: now,
          phaseStarted: now
        }
      };
    }

    case 'RETRY': {
      const retryCount = (state.error?.retryCount || 0) + 1;

      return {
        ...state,
        phase: 'retrying',
        error: state.error ? {
          ...state.error,
          retryCount,
          lastRetry: now
        } : null,
        timing: {
          ...state.timing,
          lastUpdate: now,
          phaseStarted: now
        }
      };
    }

    case 'STRATEGY_CHANGE': {
      const { strategy } = action.payload;

      return {
        ...state,
        strategy,
        timing: {
          ...state.timing,
          lastUpdate: now
        }
      };
    }

    case 'RESET': {
      return createInitialState(state.strategy);
    }

    default:
      return state;
  }
}

// Network quality detection
function useNetworkQuality() {
  const [rtt, setRtt] = useState(150);

  useEffect(() => {
    let mounted = true;

    const measureRTT = async () => {
      try {
        const start = performance.now();

        // Use a small image request to measure RTT
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache'
        });

        if (response.ok && mounted) {
          const end = performance.now();
          setRtt(end - start);
        }
      } catch {
        // Network might be offline
        if (mounted) setRtt(2000);
      }
    };

    // Initial measurement
    measureRTT();

    // Periodic measurements
    const interval = setInterval(measureRTT, 30000); // Every 30 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return rtt;
}

// Main hook
export function useLoadingState(initialStrategy: LoadingStrategy = 'progressive') {
  const [state, dispatch] = useReducer(loadingReducer, null, () => createInitialState(initialStrategy));
  const timeoutRef = useRef<NodeJS.Timeout>();
  const rtt = useNetworkQuality();

  // Update network quality when RTT changes
  useEffect(() => {
    dispatch({
      type: 'NETWORK_UPDATE',
      payload: { rtt },
      timestamp: Date.now()
    });
  }, [rtt]);

  // Automatic timeout handling
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout based on current phase and network quality
    const getTimeoutForPhase = () => {
      switch (state.phase) {
        case 'authenticating':
          return state.network.adaptiveTimeouts.auth;
        case 'enhancing':
          return state.network.adaptiveTimeouts.profile;
        default:
          return state.network.adaptiveTimeouts.database;
      }
    };

    if (['authenticating', 'enhancing', 'retrying'].includes(state.phase)) {
      const timeout = getTimeoutForPhase();

      timeoutRef.current = setTimeout(() => {
        logger.loading(`Phase ${state.phase} timed out after ${timeout}ms`);
        dispatch({
          type: 'PHASE_CHANGE',
          payload: { phase: 'timeout' },
          timestamp: Date.now()
        });
      }, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.phase, state.network.adaptiveTimeouts]);

  // Action creators
  const actions = {
    setPhase: useCallback((phase: LoadingPhase, component?: string) => {
      dispatch({
        type: 'PHASE_CHANGE',
        payload: { phase, component },
        timestamp: Date.now()
      });
    }, []),

    updateProgress: useCallback((current: number, total: number = 100, estimated?: number) => {
      dispatch({
        type: 'PROGRESS_UPDATE',
        payload: { current, total, estimated },
        timestamp: Date.now()
      });
    }, []),

    setError: useCallback((code: string, message: string, recoverable: boolean = true) => {
      dispatch({
        type: 'ERROR',
        payload: { code, message, recoverable },
        timestamp: Date.now()
      });
    }, []),

    retry: useCallback(() => {
      dispatch({
        type: 'RETRY',
        payload: {},
        timestamp: Date.now()
      });
    }, []),

    changeStrategy: useCallback((strategy: LoadingStrategy) => {
      dispatch({
        type: 'STRATEGY_CHANGE',
        payload: { strategy },
        timestamp: Date.now()
      });
    }, []),

    reset: useCallback(() => {
      dispatch({
        type: 'RESET',
        payload: {},
        timestamp: Date.now()
      });
    }, [])
  };

  // Computed properties
  const computed = {
    isLoading: ['initializing', 'authenticating', 'enhancing', 'retrying'].includes(state.phase),
    isReady: state.phase === 'ready',
    hasError: state.phase === 'error',
    hasTimedOut: state.phase === 'timeout',
    isDegraded: state.phase === 'degraded',
    canProgress: state.strategy === 'progressive' && !['error'].includes(state.phase),
    shouldBlock: state.strategy === 'blocking' && !['ready', 'degraded'].includes(state.phase),
    networkQuality: state.network.quality,
    progressPercentage: Math.round((state.progress.current / state.progress.total) * 100),
    elapsedTime: Date.now() - state.timing.started,
    phaseElapsedTime: Date.now() - state.timing.phaseStarted
  };

  return {
    state,
    actions,
    computed
  };
}

// Helper hook for component-specific loading
export function useComponentLoading(componentName: keyof LoadingState['components']) {
  const { state, actions } = useLoadingState();

  const setComponentPhase = useCallback((phase: LoadingPhase) => {
    actions.setPhase(phase, componentName);
  }, [actions, componentName]);

  return {
    phase: state.components[componentName],
    setPhase: setComponentPhase,
    isLoading: ['initializing', 'authenticating', 'enhancing', 'retrying'].includes(state.components[componentName]),
    isReady: state.components[componentName] === 'ready'
  };
}