/**
 * Simple API Protection
 * Prevents browser extension interference through header sanitization
 * Replaces dangerous iframe-based approach with safe header validation
 */

// Feature flag for easy disable/enable
const API_PROTECTION_ENABLED = import.meta.env.VITE_API_PROTECTION !== 'false';

/**
 * Sanitizes headers to prevent extension interference
 * Removes invalid values that can cause fetch failures
 */
function sanitizeHeaders(headers: HeadersInit | undefined): HeadersInit | undefined {
  if (!headers || !API_PROTECTION_ENABLED) {
    return headers;
  }

  const sanitized: Record<string, string> = {};

  // Handle different header formats
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      if (isValidHeaderValue(value)) {
        sanitized[key] = value.trim();
      }
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      if (isValidHeaderValue(value)) {
        sanitized[key] = value.trim();
      }
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      if (isValidHeaderValue(value)) {
        sanitized[key] = value.trim();
      }
    });
  }

  return sanitized;
}

/**
 * Validates header values to prevent extension pollution
 */
function isValidHeaderValue(value: unknown): value is string {
  return (
    value !== null &&
    value !== undefined &&
    value !== '' &&
    typeof value === 'string' &&
    value.trim().length > 0
  );
}

/**
 * Protected fetch wrapper that sanitizes headers
 * Safe replacement for iframe-based approach
 */
export function createProtectedFetch(): typeof fetch {
  if (!API_PROTECTION_ENABLED) {
    return fetch;
  }

  return function protectedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Only sanitize if init and headers exist
    if (init?.headers) {
      const sanitizedInit = {
        ...init,
        headers: sanitizeHeaders(init.headers)
      };
      return fetch(input, sanitizedInit);
    }

    return fetch(input, init);
  };
}

/**
 * Creates protected Headers constructor
 * Ensures clean header creation without extension interference
 */
export function createProtectedHeaders(): typeof Headers {
  if (!API_PROTECTION_ENABLED) {
    return Headers;
  }

  return class ProtectedHeaders extends Headers {
    constructor(init?: HeadersInit) {
      super(sanitizeHeaders(init));
    }
  };
}

/**
 * Debug logging for troubleshooting
 */
export function logProtectionStatus(): void {
  if (import.meta.env.DEV) {
    console.log('[API Protection]', {
      enabled: API_PROTECTION_ENABLED,
      environment: import.meta.env.MODE,
      userAgent: navigator.userAgent.slice(0, 50) + '...'
    });
  }
}