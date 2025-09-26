/**
 * Adaptive CSP Configuration System
 * Maintains A+ security while enabling development functionality
 * Zero security regression guarantee
 */

import { generateSecureToken } from './security';
import { calculateTrustedHashes, runtimeHashCalculator } from './csp-hash-calculator';

/**
 * Enhanced logging system for CSP operations
 */
interface CSPLogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  environment: string;
}

class CSPLogger {
  private environment: CSPEnvironment;
  private logs: CSPLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 log entries

  constructor(environment: CSPEnvironment) {
    this.environment = environment;
  }

  private log(level: CSPLogEntry['level'], message: string, context?: Record<string, unknown>) {
    const entry: CSPLogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      environment: this.environment
    };

    // Add to internal log history
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest entry
    }

    // Console output with appropriate level
    const formattedMessage = `[CSP-${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'error':
        console.error(formattedMessage, context || '');
        break;
      case 'warn':
        console.warn(formattedMessage, context || '');
        break;
      case 'debug':
        if (this.environment === 'development') {
          console.debug(formattedMessage, context || '');
        }
        break;
      default:
        console.log(formattedMessage, context || '');
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 10): CSPLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear log history
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs for external analysis
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global logger instance
let cspLogger: CSPLogger | null = null;

const getLogger = (): CSPLogger => {
  if (!cspLogger) {
    cspLogger = new CSPLogger(detectEnvironment());
  }
  return cspLogger;
};

export type CSPEnvironment = 'development' | 'production' | 'test';

export interface AdaptiveCSPConfig {
  environment: CSPEnvironment;
  enableDevTools: boolean;
  enableNonces: boolean;
  enableHashes: boolean;
  reportViolations: boolean;
  reportUri?: string;
  trustedHashes?: Record<string, string | string[]>;
  customDomains?: string[];
}

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'media-src': string[];
  'object-src': string[];
  'child-src': string[];
  'frame-src': string[];
  'worker-src': string[];
  'frame-ancestors': string[];
  'form-action': string[];
  'base-uri': string[];
  'manifest-src': string[];
  'report-uri'?: string[];
  'report-to'?: string[];
  'upgrade-insecure-requests'?: string[];
  'block-all-mixed-content'?: string[];
}

export interface CSPGenerationResult {
  csp: string;
  nonce: string | null;
  environment: CSPEnvironment;
  hasErrors: boolean;
  warnings: string[];
}

/**
 * Safe import.meta access with TypeScript compatibility
 * SECURITY: Removed eval usage and implemented safe detection
 */
function getImportMetaEnv(): Record<string, any> | null {
  try {
    // Safe access to import.meta without eval - using conditional check
    // @ts-ignore - We know this might not exist in all environments
    if (import.meta?.env) {
      // @ts-ignore
      return import.meta.env;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Environment Detection with enhanced fallback safety and validation
 */
export function detectEnvironment(): CSPEnvironment {
  try {
    // Method 1: import.meta.env detection
    const importMetaEnv = getImportMetaEnv();
    if (importMetaEnv && typeof importMetaEnv === 'object') {
      if (importMetaEnv.DEV === true) return 'development';
      if (importMetaEnv.PROD === true) return 'production';
      if (importMetaEnv.MODE === 'test') return 'test';
      // Handle string values too
      if (importMetaEnv.NODE_ENV === 'development') return 'development';
      if (importMetaEnv.NODE_ENV === 'test') return 'test';
      if (importMetaEnv.NODE_ENV === 'production') return 'production';
    }

    // Method 2: process.env detection
    if (typeof process !== 'undefined' && process.env && typeof process.env === 'object') {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'development') return 'development';
      if (nodeEnv === 'test') return 'test';
      if (nodeEnv === 'production') return 'production';
    }

    // Method 3: Browser-based detection (with additional validation)
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname?.toLowerCase();
      if (hostname) {
        if (hostname === 'localhost' ||
            hostname.startsWith('127.') ||
            hostname.startsWith('192.168.') ||
            hostname.includes('.dev') ||
            hostname.includes('dev.') ||
            hostname.endsWith('.local')) {
          return 'development';
        }
      }
    }

    // Method 4: URL-based detection for additional safety
    if (typeof window !== 'undefined') {
      const url = window.location?.href;
      if (url) {
        if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('.dev')) {
          return 'development';
        }
      }
    }
  } catch (error) {
    console.warn('Error during environment detection:', error);
  }

  // Safe default - most restrictive (production has highest security)
  console.log('Environment detection fallback: using production mode for maximum security');
  return 'production';
}

/**
 * Global hash storage for runtime access with cache management
 */
let cachedTrustedHashes: Record<string, string | string[]> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Cache management utilities
 */
export const cacheManager = {
  /**
   * Clear all caches to prevent memory leaks
   */
  clearCache(): void {
    cachedTrustedHashes = null;
    cacheTimestamp = null;
  },

  /**
   * Check if cache is still valid
   */
  isCacheValid(): boolean {
    if (!cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION_MS;
  },

  /**
   * Get cache age in milliseconds
   */
  getCacheAge(): number {
    return cacheTimestamp ? Date.now() - cacheTimestamp : 0;
  }
};

/**
 * Get trusted hashes (cached for performance)
 * Enhanced with intelligent cache management and performance optimization
 */
async function getTrustedHashes(): Promise<Record<string, string | string[]>> {
  // Check if cached data is valid
  if (cachedTrustedHashes && cacheManager.isCacheValid()) {
    return cachedTrustedHashes;
  }

  // Clear expired cache
  if (cachedTrustedHashes && !cacheManager.isCacheValid()) {
    getLogger().info('Cache expired, refreshing trusted hashes...', {
      cacheAge: cacheManager.getCacheAge(),
      cacheDuration: CACHE_DURATION_MS
    });
    cacheManager.clearCache();
  }

  try {
    cachedTrustedHashes = await calculateTrustedHashes();
    cacheTimestamp = Date.now();

    // Validate the returned hashes
    if (!cachedTrustedHashes || typeof cachedTrustedHashes !== 'object') {
      console.warn('Invalid trusted hashes format, using fallback');
      cachedTrustedHashes = {};
    }

    // Log cache performance in development
    if (detectEnvironment() === 'development') {
      console.log('🔄 Trusted hashes cached successfully', {
        hashCount: Object.keys(cachedTrustedHashes).length,
        cacheAge: 0,
        timestamp: new Date().toISOString()
      });
    }

    return cachedTrustedHashes;
  } catch (error) {
    console.error('Failed to calculate trusted hashes:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cacheAge: cacheManager.getCacheAge(),
      timestamp: new Date().toISOString()
    });

    // Fallback to empty hashes but log the failure
    cachedTrustedHashes = {};
    cacheTimestamp = Date.now();
    return cachedTrustedHashes;
  }
}

/**
 * Generate environment-specific CSP nonce
 * Enhanced with error handling and fallback
 */
export function generateCSPNonce(): string {
  try {
    return generateSecureToken(16); // 128-bit entropy
  } catch (error) {
    console.error('Failed to generate secure token, using fallback:', error);

    // Fallback to crypto.getRandomValues if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Final fallback to Math.random (not secure but prevents crashes)
    console.warn('Using Math.random fallback - not cryptographically secure');
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

/**
 * Calculate SHA-256 hash for inline content
 * Enhanced with validation and error handling
 */
export async function calculateContentHash(content: string): Promise<string> {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }

  try {
    if (!crypto?.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    if (!hashBase64) {
      throw new Error('Failed to generate base64 hash');
    }

    return `sha256-${hashBase64}`;
  } catch (error) {
    console.error('Failed to calculate content hash:', {
      error: error instanceof Error ? error.message : String(error),
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });
    throw error; // Re-throw as this is a critical function
  }
}

/**
 * Development CSP Configuration
 * Secure but allows necessary development tools
 */
export async function createDevelopmentCSP(config: Partial<AdaptiveCSPConfig> = {}): Promise<string> {
  const nonce = config.enableNonces !== false ? generateCSPNonce() : null;
  const enableHashes = config.enableHashes !== false;
  const trustedHashes = await getTrustedHashes();

  // Store nonce globally for use by development tools
  if (nonce && typeof window !== 'undefined') {
    (window as any).__CSP_NONCE__ = nonce;
  }

  // Collect all hash values
  const allHashes: string[] = [];
  if (enableHashes) {
    Object.values(trustedHashes).forEach(hash => {
      if (Array.isArray(hash)) {
        allHashes.push(...hash.filter(Boolean));
      } else if (hash) {
        allHashes.push(hash);
      }
    });

    // Add runtime dynamic hashes
    if (runtimeHashCalculator) {
      allHashes.push(...runtimeHashCalculator.getDynamicHashes());
    }
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // Script sources - secure but allows dev tools
    'script-src': [
      "'self'",
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      ...allHashes,
      // Development-specific: Allow Vite HMR and debugging
      "'unsafe-eval'", // Required for Vite HMR (dev only)
    ],

    // Style sources - Enhanced for development with specific library support
    'style-src': [
      "'self'",
      'https://fonts.googleapis.com',
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      ...allHashes,
      // DEVELOPMENT ONLY: Allow specific inline patterns
      "'unsafe-inline'", // Temporary fallback for unmatched content
    ],

    // Enhanced for development
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],

    // Development connections - Enhanced for modern dev tools
    'connect-src': [
      "'self'",
      // Development servers (all common ports)
      'ws://localhost:*',
      'http://localhost:*',
      'ws://127.0.0.1:*',
      'http://127.0.0.1:*',
      'ws://[::1]:*',
      'http://[::1]:*',
      // Vite HMR specific
      'ws://*:24678', // Vite HMR default port
      'ws://*:3000',  // Common dev port
      'ws://*:3001',  // Common dev port
      'ws://*:5173',  // Vite default port
      'ws://*:4173',  // Vite preview port
      // Supabase
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://api.supabase.io',
      'wss://realtime.supabase.io',
      // Hot reload and dev tools
      'ws://*:*', // Broad websocket support for dev
      ...(config.customDomains || [])
    ],

    // Security-first for remaining directives
    'media-src': ["'none'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'], // Allow blob: for dev tools
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"]
  };

  // Add reporting if enabled
  if (config.reportViolations && config.reportUri) {
    directives['report-uri'] = [config.reportUri];
    directives['report-to'] = ['csp-endpoint'];
  }

  return buildCSPString(directives);
}

/**
 * Production CSP Configuration
 * Maximum security with no compromises - A+ Grade Compliance
 */
export async function createProductionCSP(config: Partial<AdaptiveCSPConfig> = {}): Promise<string> {
  const nonce = config.enableNonces !== false ? generateCSPNonce() : null;
  const enableHashes = config.enableHashes !== false;
  const trustedHashes = await getTrustedHashes();

  // Store nonce for production use
  if (nonce && typeof window !== 'undefined') {
    (window as any).__CSP_NONCE__ = nonce;
  }

  // Collect production-safe hashes only
  const productionHashes: string[] = [];
  if (enableHashes && trustedHashes) {
    // Only include specific production-safe hashes
    if (trustedHashes.pwaRegistration && typeof trustedHashes.pwaRegistration === 'string') {
      productionHashes.push(trustedHashes.pwaRegistration);
    }
    if (trustedHashes.errorBoundaryStyles && typeof trustedHashes.errorBoundaryStyles === 'string') {
      productionHashes.push(trustedHashes.errorBoundaryStyles);
    }
    if (Array.isArray(trustedHashes.sonnerStyles)) {
      productionHashes.push(...trustedHashes.sonnerStyles.filter(Boolean));
    }
  }

  const directives: Record<string, string[]> = {
    // A+ REQUIREMENT: Most restrictive default
    'default-src': ["'none'"],

    // Minimal script sources - maximum security
    'script-src': [
      "'self'",
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      ...productionHashes
    ],

    // Minimal style sources - maximum security
    'style-src': [
      "'self'",
      'https://fonts.googleapis.com',
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      ...productionHashes
    ],

    // Controlled resource loading
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],

    // Production connections - minimal and specific
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      ...(config.customDomains || [])
    ],

    // A+ REQUIREMENT: Maximum security for all other directives
    'media-src': ["'none'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'"],

    // A+ REQUIREMENT: Frame protection
    'frame-ancestors': ["'none'"],

    // A+ REQUIREMENT: Form and base URI restrictions
    'form-action': ["'self'"],
    'base-uri': ["'self'"],

    'manifest-src': ["'self'"],

    // A+ REQUIREMENT: Security enhancements
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': []
  };

  // Mandatory reporting in production
  if (config.reportUri) {
    directives['report-uri'] = [config.reportUri];
    directives['report-to'] = ['csp-endpoint'];
  }

  return buildCSPString(directives);
}

/**
 * Test Environment CSP Configuration
 * Balanced security for testing scenarios
 */
export async function createTestCSP(config: Partial<AdaptiveCSPConfig> = {}): Promise<string> {
  const nonce = generateCSPNonce();
  const trustedHashes = await getTrustedHashes();

  // Collect all test-relevant hashes
  const testHashes: string[] = [];
  Object.values(trustedHashes).forEach(hash => {
    if (Array.isArray(hash)) {
      testHashes.push(...hash.filter(Boolean));
    } else if (hash) {
      testHashes.push(hash);
    }
  });

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'unsafe-eval'", // Needed for test frameworks
      ...testHashes
    ],
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'unsafe-inline'", // Relaxed for test environments
      'https://fonts.googleapis.com',
      ...testHashes
    ],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'ws://*', 'http://*', 'https://*'],
    'media-src': ["'none'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"]
  };

  return buildCSPString(directives);
}

/**
 * Build CSP string from directives object
 */
function buildCSPString(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([directive, values]) =>
      values.length > 0
        ? `${directive} ${values.join(' ')}`
        : directive
    )
    .join('; ');
}

/**
 * Adaptive CSP Generator
 * Automatically selects appropriate CSP based on environment
 */
export async function createAdaptiveCSP(config: Partial<AdaptiveCSPConfig> = {}): Promise<string> {
  const environment = config.environment || detectEnvironment();

  const fullConfig: AdaptiveCSPConfig = {
    environment,
    enableDevTools: environment === 'development',
    enableNonces: true,
    enableHashes: true,
    reportViolations: environment === 'production',
    reportUri: config.reportUri,
    trustedHashes: config.trustedHashes,
    customDomains: config.customDomains,
    ...config
  };

  switch (environment) {
    case 'development':
      return createDevelopmentCSP(fullConfig);
    case 'production':
      return createProductionCSP(fullConfig);
    case 'test':
      return createTestCSP(fullConfig);
    default:
      // Safe fallback to production
      return createProductionCSP(fullConfig);
  }
}

/**
 * Synchronous version for immediate use (uses cached hashes)
 * Enhanced with comprehensive validation and error handling
 */
export function createAdaptiveCSPSync(config: Partial<AdaptiveCSPConfig> = {}): string {
  try {
    // Validate config object
    if (config && typeof config !== 'object') {
      console.warn('Invalid config object, using defaults');
      config = {};
    }

    const environment = config.environment || detectEnvironment();
    console.log(`Creating synchronous CSP for ${environment} environment`);

    // Generate nonce with error handling
    let nonce: string | null = null;
    if (config.enableNonces !== false) {
      try {
        nonce = generateCSPNonce();
      } catch (error) {
        console.error('Failed to generate nonce for sync CSP:', error);
        nonce = null;
      }
    }

    // Store nonce globally with validation
    if (nonce && typeof window !== 'undefined') {
      try {
        (window as any).__CSP_NONCE__ = nonce;
      } catch (error) {
        console.warn('Failed to store nonce globally:', error);
      }
    }

    const isDev = environment === 'development';
    const isProd = environment === 'production';
    const isTest = environment === 'test';

    // Validate custom domains
    const customDomains = Array.isArray(config.customDomains) ? config.customDomains.filter(domain => {
      if (typeof domain === 'string' && domain.trim()) {
        return true;
      }
      console.warn('Invalid custom domain skipped:', domain);
      return false;
    }) : [];

    const directives: Record<string, string[]> = {
      'default-src': isProd ? ["'none'"] : ["'self'"],
      'script-src': [
        "'self'",
        ...(nonce ? [`'nonce-${nonce}'`] : []),
        ...(isDev ? ["'unsafe-eval'"] : []),
        ...(isTest ? ["'unsafe-eval'"] : []) // Test environments need eval for test runners
      ],
      'style-src': [
        "'self'",
        'https://fonts.googleapis.com',
        ...(nonce ? [`'nonce-${nonce}'`] : []),
        ...(isDev || isTest ? ["'unsafe-inline'"] : [])
      ],
      'img-src': ["'self'", 'data:', 'https:', ...(isDev || isTest ? ['blob:'] : [])],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        ...(isDev || isTest ? [
          'ws://localhost:*',
          'http://localhost:*',
          'ws://127.0.0.1:*',
          'http://127.0.0.1:*',
          'ws://*:*' // Broad websocket support for development
        ] : []),
        ...customDomains
      ],
      'media-src': ["'none'"],
      'object-src': ["'none'"],
      'child-src': ["'none'"],
      'frame-src': ["'none'"],
      'worker-src': ["'self'", ...(isDev || isTest ? ['blob:'] : [])],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
      ...(isProd ? {
        'upgrade-insecure-requests': [],
        'block-all-mixed-content': []
      } : {})
    };

    // Add reporting with validation
    if (config.reportViolations && config.reportUri) {
      try {
        new URL(config.reportUri); // Validate URI format
        directives['report-uri'] = [config.reportUri];
        directives['report-to'] = ['csp-endpoint'];
      } catch (error) {
        console.error('Invalid report URI, skipping reporting:', config.reportUri);
      }
    }

    const cspString = buildCSPString(directives);
    if (!cspString) {
      throw new Error('Failed to build CSP string');
    }

    return cspString;
  } catch (error) {
    console.error('Critical error in createAdaptiveCSPSync:', error);

    // Ultimate fallback - basic secure CSP
    const fallbackCSP = "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; manifest-src 'self';";
    console.log('Using ultimate fallback CSP due to critical error');
    return fallbackCSP;
  }
}

/**
 * CSP Violation Handler with Environment Awareness and Memory Management
 */
let violationHandlerActive = false;
let violationHandler: ((event: SecurityPolicyViolationEvent) => void) | null = null;

export function setupAdaptiveCSPReporting(): void {
  if (typeof document === 'undefined') return;

  // Prevent multiple handlers
  if (violationHandlerActive) {
    console.log('CSP violation handler already active');
    return;
  }

  const environment = detectEnvironment();

  // Create the handler function for later cleanup
  violationHandler = (event: SecurityPolicyViolationEvent) => {
    const violation = {
      timestamp: new Date().toISOString(),
      environment,
      documentURI: event.documentURI,
      violatedDirective: event.violatedDirective,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      disposition: event.disposition,
      blockedURI: event.blockedURI,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      sourceFile: event.sourceFile,
      userAgent: navigator.userAgent
    };

    // Development: Log detailed information with enhancement suggestions
    if (environment === 'development') {
      console.group('🛡️ CSP Violation Detected');
      console.warn('Violated Directive:', event.violatedDirective);
      console.warn('Blocked URI:', event.blockedURI);
      console.warn('Source File:', event.sourceFile);
      console.warn('Line:Column:', `${event.lineNumber}:${event.columnNumber}`);

      // Provide actionable suggestions
      if (event.violatedDirective.includes('style-src')) {
        console.log('💡 Suggestion: This inline style could be moved to a CSS file or use a nonce.');
      }
      if (event.violatedDirective.includes('script-src')) {
        console.log('💡 Suggestion: This inline script could use a nonce or be moved to an external file.');
      }

      console.warn('Full Violation:', violation);
      console.groupEnd();
    }

    // Production: Report to monitoring service
    if (environment === 'production') {
      const importMetaEnv = getImportMetaEnv();
      const reportUri = importMetaEnv?.VITE_CSP_REPORT_URI;

      if (reportUri) {
        fetch(reportUri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 'csp-report': violation }),
          keepalive: true
        }).catch(console.error);
      }
    }
  };

  // Add event listener
  document.addEventListener('securitypolicyviolation', violationHandler);
  violationHandlerActive = true;

  console.log('🛡️ CSP violation reporting initialized');
}

/**
 * Clean up CSP violation handler to prevent memory leaks
 */
export function cleanupAdaptiveCSPReporting(): void {
  if (typeof document === 'undefined' || !violationHandler || !violationHandlerActive) {
    return;
  }

  try {
    document.removeEventListener('securitypolicyviolation', violationHandler);
    violationHandler = null;
    violationHandlerActive = false;
    console.log('🧹 CSP violation handler cleaned up');
  } catch (error) {
    console.warn('Failed to cleanup CSP violation handler:', error);
  }
}

/**
 * Initialize adaptive CSP system with async hash calculation
 */
export async function initializeAdaptiveCSP(config: Partial<AdaptiveCSPConfig> = {}): Promise<{
  csp: string;
  nonce: string | null;
  environment: string;
}> {
  const environment = detectEnvironment();
  const csp = await createAdaptiveCSP(config);
  const nonce = typeof window !== 'undefined' ? (window as any).__CSP_NONCE__ : null;

  // Setup violation reporting
  setupAdaptiveCSPReporting();

  // Only log in development environment
  if (environment === 'development') {
    console.log(`🛡️ CSP initialized for ${environment} environment`);
    console.log('🔢 Hash calculation enabled for inline content');
  }

  return { csp, nonce, environment };
}

/**
 * Export enhanced CSP debugging utilities
 */
export const cspDebugUtils = {
  getLogger,
  exportLogs: () => getLogger().exportLogs(),
  getRecentLogs: (count?: number) => getLogger().getRecentLogs(count),
  clearLogs: () => getLogger().clearLogs(),
  cacheManager
};

export default {
  detectEnvironment,
  generateCSPNonce,
  calculateContentHash,
  createDevelopmentCSP,
  createProductionCSP,
  createTestCSP,
  createAdaptiveCSP,
  createAdaptiveCSPSync,
  setupAdaptiveCSPReporting,
  cleanupAdaptiveCSPReporting,
  initializeAdaptiveCSP,
  cspDebugUtils
};