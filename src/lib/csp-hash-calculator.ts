/**
 * CSP Hash Calculator - Runtime and Build-time Hash Generation
 * Calculates SHA-256 hashes for known inline content to enable strict CSP
 */

import { calculateContentHash } from './adaptive-csp';

// Known inline content patterns that need hashing
export const INLINE_CONTENT_PATTERNS = {
  // Vite HMR client - extracted from @vite/client
  viteHmrClient: `
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => console.log('[vite] before update'));
    }
  `,

  // Sonner toast base styles - critical for positioning
  sonnerBaseStyles: `
    .sonner-toast {
      pointer-events: auto;
      position: relative;
      touch-action: none;
      user-select: none;
    }
  `,

  // Sonner animation styles - for smooth transitions
  sonnerAnimations: `
    @keyframes sonner-in {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes sonner-out {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(0.8); opacity: 0; }
    }
  `,

  // PWA service worker registration
  pwaRegistration: `
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  `,

  // Error boundary inline styles
  errorBoundaryStyles: `
    .error-boundary {
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
  `,

  // Vite dev client initialization
  viteDevClient: `
    window.__vite_plugin_react_preamble_installed__ = true;
  `
};

/**
 * Cache for calculated hashes to avoid recalculation
 */
const hashCache = new Map<string, string>();

/**
 * Calculate hash for content with caching
 */
export async function getContentHash(key: string, content: string): Promise<string> {
  const cacheKey = `${key}:${content.length}:${content.slice(0, 50)}`;

  if (hashCache.has(cacheKey)) {
    return hashCache.get(cacheKey)!;
  }

  const hash = await calculateContentHash(content.trim());
  hashCache.set(cacheKey, hash);
  return hash;
}

/**
 * Pre-calculate all known inline content hashes
 */
export async function calculateTrustedHashes(): Promise<Record<string, string | string[]>> {
  const hashes: Record<string, string | string[]> = {};

  // Calculate individual hashes
  for (const [key, content] of Object.entries(INLINE_CONTENT_PATTERNS)) {
    try {
      hashes[key] = await getContentHash(key, content);
    } catch (error) {
      console.warn(`Failed to calculate hash for ${key}:`, error);
      hashes[key] = ''; // Fallback empty hash
    }
  }

  // Group related hashes
  hashes.viteHmr = [hashes.viteHmrClient, hashes.viteDevClient].filter(Boolean) as string[];
  hashes.sonnerStyles = [hashes.sonnerBaseStyles, hashes.sonnerAnimations].filter(Boolean) as string[];

  return hashes;
}

/**
 * Runtime hash calculation for dynamic content
 */
export class RuntimeHashCalculator {
  private dynamicHashes = new Set<string>();
  private observer?: MutationObserver;

  constructor() {
    this.setupMutationObserver();
  }

  /**
   * Calculate hash for dynamically added inline styles/scripts
   */
  async calculateDynamicHash(element: HTMLScriptElement | HTMLStyleElement): Promise<string> {
    const content = element.textContent || element.innerHTML || '';
    if (!content.trim()) return '';

    const hash = await calculateContentHash(content);
    this.dynamicHashes.add(hash);

    // In development, log new dynamic hashes for potential inclusion
    if (import.meta.env?.DEV) {
      console.log(`🔢 Dynamic content hash: ${hash.substring(0, 12)}... for:`,
        content.substring(0, 100) + (content.length > 100 ? '...' : ''));
    }

    return hash;
  }

  /**
   * Get all current dynamic hashes
   */
  getDynamicHashes(): string[] {
    return Array.from(this.dynamicHashes);
  }

  /**
   * Monitor DOM for new inline content
   */
  private setupMutationObserver(): void {
    if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check for inline scripts and styles
            if (element.tagName === 'SCRIPT' && !element.getAttribute('src')) {
              this.calculateDynamicHash(element as HTMLScriptElement);
            }
            if (element.tagName === 'STYLE') {
              this.calculateDynamicHash(element as HTMLStyleElement);
            }

            // Check child elements
            const inlineScripts = element.querySelectorAll('script:not([src])');
            const inlineStyles = element.querySelectorAll('style');

            inlineScripts.forEach((script) =>
              this.calculateDynamicHash(script as HTMLScriptElement));
            inlineStyles.forEach((style) =>
              this.calculateDynamicHash(style as HTMLStyleElement));
          }
        });
      });
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Clean up observer
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
}

/**
 * Global runtime hash calculator instance
 */
export const runtimeHashCalculator = typeof window !== 'undefined'
  ? new RuntimeHashCalculator()
  : null;

/**
 * Initialize hash calculation system
 */
export async function initializeHashCalculation(): Promise<{
  trustedHashes: Record<string, string | string[]>;
  runtimeCalculator: RuntimeHashCalculator | null;
}> {
  const trustedHashes = await calculateTrustedHashes();

  if (import.meta.env?.DEV) {
    console.log('🔢 Calculated trusted hashes:', Object.keys(trustedHashes));
  }

  return {
    trustedHashes,
    runtimeCalculator: runtimeHashCalculator
  };
}

// Export for build-time usage
export { INLINE_CONTENT_PATTERNS as BUILD_TIME_PATTERNS };