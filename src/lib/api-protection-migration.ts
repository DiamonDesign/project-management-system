/**
 * SAFE MIGRATION: API Protection v1 -> v2
 *
 * This migration strategy ensures zero-downtime transition with automatic fallback
 * and comprehensive error handling for production environments.
 */

import { createProtectedFetch as createProtectedFetchV1, logProtectionStatus as logV1Status } from './api-protection';
import {
  createProtectedFetch as createProtectedFetchV2,
  createProtectedHeaders as createProtectedHeadersV2,
  sanitizeHeaders as sanitizeHeadersV2,
  logProtectionStatus as logV2Status,
  getProtectionMetrics
} from './api-protection-v2';

// Migration configuration
interface MigrationConfig {
  enabled: boolean;
  version: 'v1' | 'v2' | 'auto';
  canaryPercentage: number; // 0-100
  fallbackToV1: boolean;
  enableMetrics: boolean;
  strictMode: boolean;
}

// Default migration configuration
const defaultConfig: MigrationConfig = {
  enabled: import.meta.env.VITE_API_PROTECTION_MIGRATION !== 'false',
  version: (import.meta.env.VITE_API_PROTECTION_VERSION as 'v1' | 'v2') || 'auto',
  canaryPercentage: parseInt(import.meta.env.VITE_API_PROTECTION_CANARY || '0', 10),
  fallbackToV1: import.meta.env.VITE_API_PROTECTION_FALLBACK !== 'false',
  enableMetrics: import.meta.env.VITE_API_PROTECTION_METRICS === 'true',
  strictMode: import.meta.env.VITE_API_PROTECTION_STRICT === 'true'
};

// Migration state tracking
interface MigrationState {
  activeVersion: 'v1' | 'v2';
  totalRequests: number;
  v1Requests: number;
  v2Requests: number;
  v2Failures: number;
  lastFailureTime: number;
  circuitBreakerOpen: boolean;
}

const migrationState: MigrationState = {
  activeVersion: 'v1',
  totalRequests: 0,
  v1Requests: 0,
  v2Requests: 0,
  v2Failures: 0,
  lastFailureTime: 0,
  circuitBreakerOpen: false
};

/**
 * Determines which version to use based on configuration and state
 */
function selectVersion(config: MigrationConfig): 'v1' | 'v2' {
  // Explicit version selection
  if (config.version === 'v1' || config.version === 'v2') {
    return config.version;
  }

  // Circuit breaker check
  if (migrationState.circuitBreakerOpen) {
    const timeSinceFailure = Date.now() - migrationState.lastFailureTime;
    if (timeSinceFailure < 300000) { // 5 minutes
      return 'v1'; // Use v1 when circuit breaker is open
    } else {
      migrationState.circuitBreakerOpen = false; // Reset after timeout
    }
  }

  // Auto selection with canary rollout
  if (config.version === 'auto' && config.canaryPercentage > 0) {
    const userId = getCurrentUserId();
    const userBucket = getUserBucket(userId);

    if (userBucket <= config.canaryPercentage) {
      return 'v2';
    }
  }

  return 'v1'; // Default to v1
}

/**
 * Gets current user ID for consistent canary bucketing
 */
function getCurrentUserId(): string {
  // Try to get user ID from various sources
  try {
    // From authentication context
    const userContext = (globalThis as any).__USER_CONTEXT__;
    if (userContext?.userId) return userContext.userId;

    // From localStorage
    const storedUser = localStorage.getItem('user_id');
    if (storedUser) return storedUser;

    // From session
    const sessionUser = sessionStorage.getItem('user_id');
    if (sessionUser) return sessionUser;

    // Fallback to browser fingerprint
    return generateBrowserFingerprint();
  } catch {
    return 'anonymous';
  }
}

/**
 * Generates consistent user bucket (0-100) for canary rollout
 */
function getUserBucket(userId: string): number {
  // Simple hash function for consistent bucketing
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Generates browser fingerprint for anonymous users
 */
function generateBrowserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('fingerprint', 0, 0);

  return btoa(JSON.stringify({
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
    canvas: canvas.toDataURL()
  })).slice(0, 32);
}

/**
 * Records migration metrics
 */
function recordMigrationMetric(version: 'v1' | 'v2', success: boolean, error?: Error): void {
  migrationState.totalRequests++;

  if (version === 'v1') {
    migrationState.v1Requests++;
  } else {
    migrationState.v2Requests++;

    if (!success) {
      migrationState.v2Failures++;
      migrationState.lastFailureTime = Date.now();

      // Check if we should open circuit breaker
      const failureRate = migrationState.v2Failures / migrationState.v2Requests;
      if (failureRate > 0.1 && migrationState.v2Requests > 10) { // >10% failure rate after 10 requests
        migrationState.circuitBreakerOpen = true;
        console.error('[API Protection Migration] Circuit breaker opened due to high failure rate:', failureRate);
      }

      if (error && import.meta.env.DEV) {
        console.error('[API Protection Migration] v2 failure:', error);
      }
    }
  }

  // Log metrics periodically
  if (migrationState.totalRequests % 100 === 0 && import.meta.env.DEV) {
    console.log('[API Protection Migration] Metrics:', {
      total: migrationState.totalRequests,
      v1: migrationState.v1Requests,
      v2: migrationState.v2Requests,
      v2FailureRate: migrationState.v2Requests > 0 ? migrationState.v2Failures / migrationState.v2Requests : 0,
      circuitBreakerOpen: migrationState.circuitBreakerOpen
    });
  }
}

/**
 * Safe header sanitization with automatic fallback
 */
export function sanitizeHeaders(headers: HeadersInit | undefined): HeadersInit | undefined {
  if (!defaultConfig.enabled) {
    return headers;
  }

  const version = selectVersion(defaultConfig);
  migrationState.activeVersion = version;

  if (version === 'v1') {
    recordMigrationMetric('v1', true);
    // v1 doesn't have exposed sanitizeHeaders, so return headers as-is
    return headers;
  }

  // Try v2 with fallback to v1
  try {
    const result = sanitizeHeadersV2(headers);
    recordMigrationMetric('v2', true);
    return result;
  } catch (error) {
    recordMigrationMetric('v2', false, error as Error);

    if (defaultConfig.fallbackToV1) {
      console.warn('[API Protection Migration] v2 failed, falling back to v1:', error);
      return headers; // v1 behavior - return original
    }

    throw error;
  }
}

/**
 * Safe protected fetch with automatic fallback
 */
export function createProtectedFetch(): typeof fetch {
  if (!defaultConfig.enabled) {
    return fetch;
  }

  return function migrationProtectedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const version = selectVersion(defaultConfig);
    migrationState.activeVersion = version;

    if (version === 'v1') {
      const protectedFetchV1 = createProtectedFetchV1();
      recordMigrationMetric('v1', true);
      return protectedFetchV1(input, init);
    }

    // Try v2 with fallback to v1
    try {
      const protectedFetchV2 = createProtectedFetchV2();
      const result = protectedFetchV2(input, init);
      recordMigrationMetric('v2', true);
      return result;
    } catch (error) {
      recordMigrationMetric('v2', false, error as Error);

      if (defaultConfig.fallbackToV1) {
        console.warn('[API Protection Migration] v2 fetch failed, falling back to v1:', error);
        const protectedFetchV1 = createProtectedFetchV1();
        return protectedFetchV1(input, init);
      }

      throw error;
    }
  };
}

/**
 * Safe protected Headers with automatic fallback
 */
export function createProtectedHeaders(): typeof Headers {
  if (!defaultConfig.enabled) {
    return Headers;
  }

  const version = selectVersion(defaultConfig);

  if (version === 'v1') {
    // v1 doesn't have Headers constructor protection, return native
    return Headers;
  }

  // Try v2 with fallback to native Headers
  try {
    return createProtectedHeadersV2();
  } catch (error) {
    console.warn('[API Protection Migration] v2 Headers failed, falling back to native:', error);
    return Headers;
  }
}

/**
 * Migration status and metrics
 */
export function getMigrationStatus(): {
  config: MigrationConfig;
  state: MigrationState;
  v2Metrics?: ReturnType<typeof getProtectionMetrics>;
} {
  const status = {
    config: defaultConfig,
    state: migrationState,
  };

  // Include v2 metrics if v2 is active
  if (migrationState.activeVersion === 'v2') {
    try {
      status.v2Metrics = getProtectionMetrics();
    } catch (error) {
      // v2 metrics not available
    }
  }

  return status;
}

/**
 * Force migration to specific version (for testing)
 */
export function forceMigrationVersion(version: 'v1' | 'v2' | 'auto'): void {
  if (import.meta.env.DEV) {
    defaultConfig.version = version;
    console.log(`[API Protection Migration] Forced to version: ${version}`);
  }
}

/**
 * Reset migration state (for testing)
 */
export function resetMigrationState(): void {
  if (import.meta.env.DEV) {
    Object.assign(migrationState, {
      activeVersion: 'v1',
      totalRequests: 0,
      v1Requests: 0,
      v2Requests: 0,
      v2Failures: 0,
      lastFailureTime: 0,
      circuitBreakerOpen: false
    });
    console.log('[API Protection Migration] State reset');
  }
}

/**
 * Enhanced logging that covers both versions
 */
export function logProtectionStatus(): void {
  const status = getMigrationStatus();

  console.log('[API Protection Migration] Status:', {
    migrationEnabled: status.config.enabled,
    activeVersion: status.state.activeVersion,
    canaryPercentage: status.config.canaryPercentage,
    metrics: {
      totalRequests: status.state.totalRequests,
      v1Requests: status.state.v1Requests,
      v2Requests: status.state.v2Requests,
      v2FailureRate: status.state.v2Requests > 0
        ? (status.state.v2Failures / status.state.v2Requests).toFixed(4)
        : '0.0000',
      circuitBreakerOpen: status.state.circuitBreakerOpen
    }
  });

  // Log version-specific status
  if (status.state.activeVersion === 'v1') {
    logV1Status();
  } else {
    logV2Status();
  }

  // Log v2 detailed metrics if available
  if (status.v2Metrics && import.meta.env.DEV) {
    console.log('[API Protection v2] Detailed Metrics:', status.v2Metrics);
  }
}

// Initialize migration on module load
if (import.meta.env.DEV) {
  console.log('[API Protection Migration] Initialized with config:', defaultConfig);
}

// Expose migration status to global scope for debugging
if (import.meta.env.DEV) {
  (globalThis as any).__API_PROTECTION_MIGRATION__ = {
    getStatus: getMigrationStatus,
    forceVersion: forceMigrationVersion,
    resetState: resetMigrationState,
    logStatus: logProtectionStatus
  };
}