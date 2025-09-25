/**
 * CSP Nonce Helper for Secure Content Security Policy Implementation
 * Replaces unsafe-inline with nonce-based approach
 */

import { generateSecureToken } from './security';

interface CSPConfig {
  nonce?: string;
  reportUri?: string;
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

/**
 * Generates a secure nonce for CSP
 */
export function generateCSPNonce(): string {
  return generateSecureToken(16);
}

/**
 * Creates secure CSP header value
 */
export function createSecureCSP(config: CSPConfig = {}): string {
  const {
    nonce = generateCSPNonce(),
    reportUri,
    upgradeInsecureRequests = true,
    blockAllMixedContent = true
  } = config;

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // Add specific hashes for required inline scripts (e.g., Vite)
      // "'sha256-HASH_HERE'"
    ],
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://fonts.googleapis.com',
      // Add hashes for required inline styles
      // "'sha256-HASH_HERE'"
    ],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      // Development only - remove in production
      ...(import.meta.env.DEV ? ['ws://localhost:*', 'http://localhost:*'] : [])
    ],
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

  // Add optional directives
  if (upgradeInsecureRequests) {
    directives['upgrade-insecure-requests'] = [];
  }

  if (blockAllMixedContent) {
    directives['block-all-mixed-content'] = [];
  }

  if (reportUri) {
    directives['report-uri'] = [reportUri];
    directives['report-to'] = ['csp-endpoint'];
  }

  // Build CSP string
  return Object.entries(directives)
    .map(([directive, values]) =>
      values.length > 0
        ? `${directive} ${values.join(' ')}`
        : directive
    )
    .join('; ');
}

/**
 * Injects CSP meta tag into document head
 */
export function injectCSPMetaTag(nonce?: string): void {
  const csp = createSecureCSP({ nonce });

  // Remove any existing CSP meta tags
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSP) {
    existingCSP.remove();
  }

  // Create new CSP meta tag
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = csp;

  // Insert as first meta tag in head
  const firstMeta = document.querySelector('head meta');
  if (firstMeta) {
    firstMeta.parentNode?.insertBefore(meta, firstMeta);
  } else {
    document.head.appendChild(meta);
  }
}

/**
 * Calculates SHA-256 hash for inline script/style
 * Use this during build to generate hashes for necessary inline content
 */
export async function calculateCSPHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  return `sha256-${hashBase64}`;
}

/**
 * Helper to add nonce to script elements
 */
export function addNonceToScript(script: HTMLScriptElement, nonce: string): void {
  script.setAttribute('nonce', nonce);
}

/**
 * Helper to add nonce to style elements
 */
export function addNonceToStyle(style: HTMLStyleElement | HTMLLinkElement, nonce: string): void {
  style.setAttribute('nonce', nonce);
}

/**
 * CSP Report Handler - sends CSP violations to monitoring service
 */
export function setupCSPReporting(endpoint: string): void {
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (e) => {
    const violation = {
      'document-uri': e.documentURI,
      'violated-directive': e.violatedDirective,
      'effective-directive': e.effectiveDirective,
      'original-policy': e.originalPolicy,
      'disposition': e.disposition,
      'blocked-uri': e.blockedURI,
      'line-number': e.lineNumber,
      'column-number': e.columnNumber,
      'source-file': e.sourceFile,
      'status-code': 0,
      'timestamp': new Date().toISOString()
    };

    // Send violation report to monitoring endpoint
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'csp-report': violation }),
      keepalive: true
    }).catch(console.error);
  });
}

/**
 * Initialize secure CSP for the application
 */
export function initializeSecureCSP(): string {
  const nonce = generateCSPNonce();

  // Store nonce for use by other parts of the app
  (window as any).__CSP_NONCE__ = nonce;

  // Inject CSP meta tag
  if (import.meta.env.PROD) {
    injectCSPMetaTag(nonce);
  }

  // Setup CSP violation reporting
  if (import.meta.env.VITE_CSP_REPORT_URI) {
    setupCSPReporting(import.meta.env.VITE_CSP_REPORT_URI);
  }

  return nonce;
}

// Export for use in main.tsx
export default {
  generateCSPNonce,
  createSecureCSP,
  injectCSPMetaTag,
  calculateCSPHash,
  addNonceToScript,
  addNonceToStyle,
  setupCSPReporting,
  initializeSecureCSP
};