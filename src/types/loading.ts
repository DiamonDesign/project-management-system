// Progressive Loading State Types
// Replaces simple boolean with rich state machine

export type LoadingPhase =
  | 'initializing'     // App startup
  | 'authenticating'   // Auth check in progress
  | 'enhancing'        // Profile loading
  | 'ready'            // Fully loaded
  | 'error'            // Failed state
  | 'timeout'          // Timed out, user action needed
  | 'retrying'         // User-initiated retry
  | 'degraded';        // Partial functionality available

export type LoadingStrategy =
  | 'blocking'         // Traditional - wait for everything
  | 'progressive'      // Default - render with basics, enhance gradually
  | 'optimistic'       // Assume success, handle errors
  | 'graceful';        // Always provide fallback functionality

export type NetworkQuality = 'fast' | 'medium' | 'slow' | 'offline';

export interface LoadingState {
  // Current phase
  phase: LoadingPhase;

  // Strategy being used
  strategy: LoadingStrategy;

  // Component-specific loading states
  components: {
    session: LoadingPhase;
    profile: LoadingPhase;
    projects: LoadingPhase;
    clients: LoadingPhase;
    tasks: LoadingPhase;
  };

  // Progress tracking
  progress: {
    current: number;    // 0-100
    total: number;      // Expected total operations
    estimated: number;  // Estimated completion time (ms)
  };

  // Network awareness
  network: {
    quality: NetworkQuality;
    rtt: number;        // Round trip time
    adaptiveTimeouts: {
      auth: number;
      profile: number;
      database: number;
    };
  };

  // Error state
  error: {
    code?: string;
    message?: string;
    recoverable: boolean;
    retryCount: number;
    lastRetry?: number;
  } | null;

  // User control
  userControlled: {
    canRetry: boolean;
    canContinue: boolean;    // Continue with degraded functionality
    canSkip: boolean;        // Skip non-essential loading
    autoRetryEnabled: boolean;
  };

  // Timestamps for debugging
  timing: {
    started: number;
    lastUpdate: number;
    phaseStarted: number;
  };
}

export interface LoadingAction {
  type: 'PHASE_CHANGE' | 'PROGRESS_UPDATE' | 'NETWORK_UPDATE' | 'ERROR' | 'RETRY' | 'RESET' | 'STRATEGY_CHANGE';
  payload: any;
  timestamp: number;
}

// Helper types for component-specific loading
export interface ComponentLoadingState {
  phase: LoadingPhase;
  progress: number;
  error?: string;
  canRetry: boolean;
  estimatedTime?: number;
}

// Network quality detection thresholds
export const NETWORK_THRESHOLDS = {
  fast: { rtt: 0, timeout: 2000 },      // < 100ms RTT
  medium: { rtt: 100, timeout: 5000 },   // 100-300ms RTT
  slow: { rtt: 300, timeout: 10000 },    // 300-1000ms RTT
  offline: { rtt: 1000, timeout: 15000 } // > 1000ms RTT
} as const;

// Phase transitions - defines valid state machine transitions
export const VALID_TRANSITIONS: Record<LoadingPhase, LoadingPhase[]> = {
  initializing: ['authenticating', 'error', 'timeout'],
  authenticating: ['enhancing', 'ready', 'error', 'timeout', 'degraded'],
  enhancing: ['ready', 'error', 'timeout', 'degraded'],
  ready: ['retrying', 'error'], // Can error from ready state
  error: ['retrying', 'degraded', 'initializing'],
  timeout: ['retrying', 'degraded', 'ready'],
  retrying: ['authenticating', 'enhancing', 'ready', 'error', 'timeout'],
  degraded: ['retrying', 'enhancing', 'ready', 'error']
};