/**
 * CSP-Aware UI Utilities
 * Provides CSP-compliant configurations for common UI components
 */

import { toast as sonnerToast } from 'sonner';

/**
 * CSP-compliant toast configuration
 * Ensures Sonner toasts work with strict CSP
 */
export function createCSPAwareToast() {
  // Get current nonce if available
  const nonce = (window as any).__CSP_NONCE__;

  return {
    /**
     * Show success toast with CSP compliance
     */
    success: (message: string, options?: any) => {
      return sonnerToast.success(message, {
        ...options,
        // Add custom styling that works with CSP
        style: {
          // Use CSS custom properties instead of inline styles
          background: 'var(--success-bg, #10b981)',
          color: 'var(--success-text, white)',
          border: '1px solid var(--success-border, #059669)',
          ...options?.style
        },
        // Ensure any custom content respects CSP
        unstyled: false
      });
    },

    /**
     * Show error toast with CSP compliance
     */
    error: (message: string, options?: any) => {
      return sonnerToast.error(message, {
        ...options,
        style: {
          background: 'var(--error-bg, #ef4444)',
          color: 'var(--error-text, white)',
          border: '1px solid var(--error-border, #dc2626)',
          ...options?.style
        },
        unstyled: false
      });
    },

    /**
     * Show info toast with CSP compliance
     */
    info: (message: string, options?: any) => {
      return sonnerToast.info(message, {
        ...options,
        style: {
          background: 'var(--info-bg, #3b82f6)',
          color: 'var(--info-text, white)',
          border: '1px solid var(--info-border, #2563eb)',
          ...options?.style
        },
        unstyled: false
      });
    },

    /**
     * Show warning toast with CSP compliance
     */
    warning: (message: string, options?: any) => {
      return sonnerToast.warning(message, {
        ...options,
        style: {
          background: 'var(--warning-bg, #f59e0b)',
          color: 'var(--warning-text, white)',
          border: '1px solid var(--warning-border, #d97706)',
          ...options?.style
        },
        unstyled: false
      });
    },

    /**
     * Show loading toast with CSP compliance
     */
    loading: (message: string, options?: any) => {
      return sonnerToast.loading(message, {
        ...options,
        style: {
          background: 'var(--loading-bg, #6b7280)',
          color: 'var(--loading-text, white)',
          border: '1px solid var(--loading-border, #4b5563)',
          ...options?.style
        },
        unstyled: false
      });
    },

    /**
     * Dismiss toast
     */
    dismiss: (toastId?: string | number) => {
      return sonnerToast.dismiss(toastId);
    },

    /**
     * Promise-based toast with CSP compliance
     */
    promise: <T>(
      promise: Promise<T>,
      opts: {
        loading?: string;
        success?: string | ((data: T) => string);
        error?: string | ((error: any) => string);
      }
    ) => {
      return sonnerToast.promise(promise, {
        ...opts,
        style: {
          // Default styling that respects CSP
          '--toaster-color': 'var(--foreground)',
          '--toaster-bg': 'var(--background)',
          '--toaster-border': 'var(--border)',
        }
      });
    }
  };
}

/**
 * CSP-aware dynamic style injection
 * Safely injects styles that work with CSP nonces
 */
export function injectCSPAwareStyles(css: string, id?: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;

  if (id) {
    style.id = id;

    // Remove existing style with same ID
    const existing = document.getElementById(id);
    if (existing && existing.tagName === 'STYLE') {
      existing.remove();
    }
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
 * CSP-compliant toast styles
 * Inject these styles once during app initialization
 */
export function setupToastStyles(): void {
  const toastStyles = `
    /* CSP-compliant toast styling */
    :root {
      --success-bg: #10b981;
      --success-text: white;
      --success-border: #059669;

      --error-bg: #ef4444;
      --error-text: white;
      --error-border: #dc2626;

      --info-bg: #3b82f6;
      --info-text: white;
      --info-border: #2563eb;

      --warning-bg: #f59e0b;
      --warning-text: white;
      --warning-border: #d97706;

      --loading-bg: #6b7280;
      --loading-text: white;
      --loading-border: #4b5563;
    }

    /* Sonner toast customizations that respect CSP */
    .sonner-toast {
      border-radius: 0.5rem !important;
      font-weight: 500 !important;
      backdrop-filter: blur(8px) !important;
      animation: sonner-slide-in 0.3s ease-out !important;
    }

    .sonner-toast[data-type="success"] {
      background: var(--success-bg) !important;
      color: var(--success-text) !important;
      border: 1px solid var(--success-border) !important;
    }

    .sonner-toast[data-type="error"] {
      background: var(--error-bg) !important;
      color: var(--error-text) !important;
      border: 1px solid var(--error-border) !important;
    }

    .sonner-toast[data-type="info"] {
      background: var(--info-bg) !important;
      color: var(--info-text) !important;
      border: 1px solid var(--info-border) !important;
    }

    .sonner-toast[data-type="warning"] {
      background: var(--warning-bg) !important;
      color: var(--warning-text) !important;
      border: 1px solid var(--warning-border) !important;
    }

    .sonner-toast[data-type="loading"] {
      background: var(--loading-bg) !important;
      color: var(--loading-text) !important;
      border: 1px solid var(--loading-border) !important;
    }

    /* CSP-compliant animations */
    @keyframes sonner-slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes sonner-slide-out {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      :root {
        --success-bg: #065f46;
        --success-text: #ecfdf5;
        --success-border: #10b981;

        --error-bg: #7f1d1d;
        --error-text: #fef2f2;
        --error-border: #ef4444;

        --info-bg: #1e3a8a;
        --info-text: #eff6ff;
        --info-border: #3b82f6;

        --warning-bg: #92400e;
        --warning-text: #fffbeb;
        --warning-border: #f59e0b;

        --loading-bg: #374151;
        --loading-text: #f9fafb;
        --loading-border: #6b7280;
      }
    }
  `;

  injectCSPAwareStyles(toastStyles, 'csp-toast-styles');
}

/**
 * CSP-aware script loader for dynamic imports
 * Loads external scripts with proper nonce handling
 */
export function loadScriptWithCSP(
  src: string,
  options: {
    async?: boolean;
    defer?: boolean;
    integrity?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = options.async !== false;
    script.defer = options.defer || false;

    if (options.integrity) {
      script.integrity = options.integrity;
    }

    if (options.crossOrigin) {
      script.crossOrigin = options.crossOrigin;
    }

    // Add nonce if available
    const nonce = (window as any).__CSP_NONCE__;
    if (nonce) {
      script.setAttribute('nonce', nonce);
    }

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * CSP-aware inline event handler replacement
 * Provides safe event handling without inline attributes
 */
export function attachCSPAwareEventListeners(): void {
  // Find all elements with data-csp-* attributes and attach listeners
  const elements = document.querySelectorAll('[data-csp-click]');

  elements.forEach(element => {
    const action = element.getAttribute('data-csp-click');
    if (action && typeof (window as any)[action] === 'function') {
      element.addEventListener('click', (window as any)[action]);
    }
  });
}

/**
 * Create CSP-compliant Toaster component configuration
 */
export function getCSPToasterConfig() {
  return {
    position: 'top-right' as const,
    duration: 4000,
    closeButton: true,
    richColors: true,
    expand: false,
    visibleToasts: 5,
    // Theme configuration that respects CSP
    theme: 'system' as const,
    // Custom styling via CSS variables (CSP-safe)
    style: {
      '--toaster-color': 'var(--foreground)',
      '--toaster-bg': 'var(--background)',
      '--toaster-border': 'var(--border)',
    },
    // Ensure animations use CSS classes, not inline styles
    className: 'sonner-toaster',
    toastOptions: {
      className: 'sonner-toast',
      duration: 4000,
      style: {
        background: 'var(--background)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
      }
    }
  };
}

// Export the configured toast instance
export const toast = createCSPAwareToast();