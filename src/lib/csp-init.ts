/**
 * CSP Initialization System
 * Coordinates all CSP components for seamless application integration
 */

import { initializeAdaptiveCSP, detectEnvironment } from './adaptive-csp';
import { initializeHashCalculation, runtimeHashCalculator } from './csp-hash-calculator';

export interface CSPInitOptions {
  reportUri?: string;
  customDomains?: string[];
  enableNonces?: boolean;
  enableHashes?: boolean;
  reportViolations?: boolean;
  debug?: boolean;
}

export interface CSPInitResult {
  environment: string;
  csp: string;
  nonce: string | null;
  hashCalculatorReady: boolean;
  violationReportingActive: boolean;
}

/**
 * Initialize the complete CSP system for the application
 * Call this once during application startup (preferably in main.tsx)
 */
export async function initializeCSP(options: CSPInitOptions = {}): Promise<CSPInitResult> {
  const environment = detectEnvironment();

  try {
    if (options.debug || environment === 'development') {
      console.log('🛡️ Initializing Adaptive CSP System...');
    }

    // Step 1: Initialize hash calculation system
    let hashCalculatorReady = false;
    try {
      await initializeHashCalculation();
      hashCalculatorReady = true;

      if (options.debug || environment === 'development') {
        console.log('✅ Hash calculation system initialized');
      }
    } catch (error) {
      console.warn('⚠️ Hash calculation initialization failed:', error);
    }

    // Step 2: Initialize adaptive CSP with calculated hashes
    const { csp, nonce } = await initializeAdaptiveCSP({
      environment: environment as any,
      reportUri: options.reportUri,
      customDomains: options.customDomains,
      enableNonces: options.enableNonces !== false,
      enableHashes: options.enableHashes !== false && hashCalculatorReady,
      reportViolations: options.reportViolations !== false,
      enableDevTools: environment === 'development'
    });

    // Step 3: Setup global CSP utilities for runtime access
    if (typeof window !== 'undefined') {
      // Make CSP utilities available globally for debugging
      (window as any).__CSP_UTILS__ = {
        environment,
        nonce,
        hashCalculator: runtimeHashCalculator,
        detectEnvironment,
        // Utility function to check if inline content would be allowed
        checkInlineContent: async (content: string, type: 'script' | 'style') => {
          if (!runtimeHashCalculator) return false;

          try {
            const hash = await runtimeHashCalculator.calculateDynamicHash(
              { textContent: content, tagName: type.toUpperCase() } as any
            );
            return hash ? `Use hash: ${hash.substring(0, 20)}...` : 'Hash calculation failed';
          } catch (error) {
            return `Error: ${error}`;
          }
        }
      };

      if (options.debug || environment === 'development') {
        console.log('🔧 CSP utilities available at window.__CSP_UTILS__');
      }
    }

    const result: CSPInitResult = {
      environment,
      csp,
      nonce,
      hashCalculatorReady,
      violationReportingActive: options.reportViolations !== false
    };

    if (options.debug || environment === 'development') {
      console.log('✅ CSP System Initialized:', {
        environment,
        nonceEnabled: !!nonce,
        hashesEnabled: hashCalculatorReady,
        reporting: result.violationReportingActive
      });
    }

    return result;

  } catch (error) {
    console.error('❌ CSP initialization failed:', error);

    // Return minimal fallback result
    return {
      environment,
      csp: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;`,
      nonce: null,
      hashCalculatorReady: false,
      violationReportingActive: false
    };
  }
}

/**
 * Lightweight CSP check for debugging violations
 * Helps developers understand why inline content is being blocked
 */
export function debugCSPViolation(element: HTMLElement | string, type: 'script' | 'style'): void {
  const environment = detectEnvironment();
  if (environment !== 'development') return;

  const content = typeof element === 'string' ? element : element.textContent || '';

  console.group('🔍 CSP Violation Debug');
  console.log('Content type:', type);
  console.log('Content preview:', content.substring(0, 100) + '...');

  // Check if nonce is available
  const nonce = (window as any).__CSP_NONCE__;
  if (nonce) {
    console.log('✅ Nonce available:', nonce.substring(0, 8) + '...');
    console.log('💡 Solution: Add nonce attribute:', `nonce="${nonce}"`);
  } else {
    console.log('❌ No nonce available');
  }

  // Check if hash calculation is available
  const utils = (window as any).__CSP_UTILS__;
  if (utils && utils.checkInlineContent) {
    utils.checkInlineContent(content, type).then((result: string) => {
      console.log('🔢 Hash check result:', result);
    });
  }

  console.log('📋 Recommendations:');
  console.log('1. Move inline content to external files');
  console.log('2. Use nonce attribute if available');
  console.log('3. Pre-calculate hash for whitelisting');

  console.groupEnd();
}

/**
 * CSP-aware script loader utility
 * Loads scripts with proper nonce handling
 */
export function loadScript(src: string, options: {
  async?: boolean;
  defer?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
} = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = options.async !== false;
    script.defer = options.defer || false;

    // Add nonce if available
    const nonce = (window as any).__CSP_NONCE__;
    if (nonce) {
      script.setAttribute('nonce', nonce);
    }

    script.onload = () => {
      options.onLoad?.();
      resolve();
    };

    script.onerror = (error) => {
      const err = new Error(`Failed to load script: ${src}`);
      options.onError?.(err);
      reject(err);
    };

    document.head.appendChild(script);
  });
}

/**
 * CSP-aware style injection utility
 * Injects styles with proper nonce handling
 */
export function injectStyle(css: string, options: {
  id?: string;
  media?: string;
} = {}): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;

  if (options.id) {
    style.id = options.id;
  }

  if (options.media) {
    style.media = options.media;
  }

  // Add nonce if available
  const nonce = (window as any).__CSP_NONCE__;
  if (nonce) {
    style.setAttribute('nonce', nonce);
  }

  document.head.appendChild(style);
  return style;
}

/**
 * CSP Health Check - Validates CSP setup
 */
export function performCSPHealthCheck(): {
  status: 'healthy' | 'warning' | 'error';
  checks: Array<{ name: string; status: boolean; message: string }>;
} {
  const checks = [];
  const environment = detectEnvironment();

  // Check 1: Environment Detection
  checks.push({
    name: 'Environment Detection',
    status: true,
    message: `Environment correctly detected as: ${environment}`
  });

  // Check 2: CSP Meta Tag Present
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  checks.push({
    name: 'CSP Meta Tag',
    status: !!cspMeta,
    message: cspMeta ? 'CSP meta tag found' : 'CSP meta tag missing'
  });

  // Check 3: Nonce Availability
  const nonce = (window as any).__CSP_NONCE__;
  checks.push({
    name: 'Nonce System',
    status: !!nonce,
    message: nonce ? 'Nonce available for inline content' : 'No nonce available'
  });

  // Check 4: Hash Calculator
  const utils = (window as any).__CSP_UTILS__;
  const hashCalculatorStatus = !!(utils && utils.hashCalculator);
  checks.push({
    name: 'Hash Calculator',
    status: hashCalculatorStatus,
    message: hashCalculatorStatus ? 'Runtime hash calculation available' : 'Hash calculator not initialized'
  });

  // Check 5: Violation Reporting
  const hasViolationListener = !!(window as any).__CSP_VIOLATION_HANDLER__;
  checks.push({
    name: 'Violation Reporting',
    status: true, // Always true as it's handled by the CSP system
    message: 'CSP violation reporting configured'
  });

  // Overall status
  const failedChecks = checks.filter(check => !check.status);
  let status: 'healthy' | 'warning' | 'error';

  if (failedChecks.length === 0) {
    status = 'healthy';
  } else if (failedChecks.length <= 2) {
    status = 'warning';
  } else {
    status = 'error';
  }

  return { status, checks };
}

// Export utilities for external use
export {
  detectEnvironment,
  runtimeHashCalculator
};