import React, { createContext, useContext, ReactNode } from 'react';
import { useLoadingState } from '@/hooks/useLoadingState';
import { LoadingState, LoadingPhase, LoadingStrategy } from '@/types/loading';
import { logger } from '@/lib/logger';

interface LoadingContextType {
  // State
  state: LoadingState;

  // Actions
  setPhase: (phase: LoadingPhase, component?: string) => void;
  updateProgress: (current: number, total?: number, estimated?: number) => void;
  setError: (code: string, message: string, recoverable?: boolean) => void;
  retry: () => void;
  changeStrategy: (strategy: LoadingStrategy) => void;
  reset: () => void;

  // Computed
  isLoading: boolean;
  isReady: boolean;
  hasError: boolean;
  hasTimedOut: boolean;
  isDegraded: boolean;
  canProgress: boolean;
  shouldBlock: boolean;
  networkQuality: string;
  progressPercentage: number;
  elapsedTime: number;
  phaseElapsedTime: number;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

interface LoadingProviderProps {
  children: ReactNode;
  strategy?: LoadingStrategy;
  fallback?: ReactNode;
}

export const LoadingProvider = ({
  children,
  strategy = 'progressive',
  fallback
}: LoadingProviderProps) => {
  const { state, actions, computed } = useLoadingState(strategy);

  // Log important phase changes
  React.useEffect(() => {
    logger.loading(`Loading phase changed to: ${state.phase}`, {
      strategy: state.strategy,
      networkQuality: state.network.quality,
      progress: state.progress,
      elapsedTime: computed.elapsedTime
    });
  }, [state.phase]);

  const contextValue: LoadingContextType = {
    state,
    ...actions,
    ...computed
  };

  // Progressive rendering: render children even while loading (non-blocking)
  if (strategy === 'progressive') {
    return (
      <LoadingContext.Provider value={contextValue}>
        {children}
      </LoadingContext.Provider>
    );
  }

  // Blocking strategy: wait for ready state
  if (strategy === 'blocking' && !computed.isReady && !computed.isDegraded) {
    return (
      <LoadingContext.Provider value={contextValue}>
        {fallback || <div>Loading...</div>}
      </LoadingContext.Provider>
    );
  }

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook to use loading context
export const useLoading = () => {
  const context = useContext(LoadingContext);

  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }

  return context;
};

// Component-specific loading hook
export const useComponentLoading = (componentName: keyof LoadingState['components']) => {
  const { state, setPhase } = useLoading();

  const setComponentPhase = React.useCallback((phase: LoadingPhase) => {
    setPhase(phase, componentName);
  }, [setPhase, componentName]);

  return {
    phase: state.components[componentName],
    setPhase: setComponentPhase,
    isLoading: ['initializing', 'authenticating', 'enhancing', 'retrying'].includes(
      state.components[componentName]
    ),
    isReady: state.components[componentName] === 'ready',
    hasError: state.components[componentName] === 'error',
    isDegraded: state.components[componentName] === 'degraded'
  };
};

// Loading boundary component for graceful degradation
interface LoadingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  strategy?: 'blocking' | 'progressive' | 'graceful';
}

export const LoadingBoundary = ({
  children,
  fallback,
  onError,
  strategy = 'progressive'
}: LoadingBoundaryProps) => {
  const [hasError, setHasError] = React.useState(false);
  const { hasError: contextHasError, isDegraded, isLoading } = useLoading();

  React.useEffect(() => {
    if (contextHasError && onError) {
      onError(new Error('Loading context error'));
    }
  }, [contextHasError, onError]);

  // Reset error when loading state changes
  React.useEffect(() => {
    if (isLoading && hasError) {
      setHasError(false);
    }
  }, [isLoading, hasError]);

  // Error boundary fallback
  if (hasError || (strategy === 'blocking' && contextHasError)) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-medium mb-2">Loading Error</h3>
        <p className="text-red-600 text-sm mb-3">
          Something went wrong while loading this component.
        </p>
        <button
          onClick={() => setHasError(false)}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Progressive strategy: render children with degraded functionality
  if (strategy === 'progressive' || isDegraded) {
    return <>{children}</>;
  }

  // Graceful strategy: provide fallback while loading
  if (strategy === 'graceful' && isLoading) {
    return <>{fallback || children}</>;
  }

  return <>{children}</>;
};