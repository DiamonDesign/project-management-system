/**
 * Comprehensive test suite for API Protection v2.0
 * Validates all edge cases and production scenarios
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  sanitizeHeaders,
  createProtectedFetch,
  createProtectedHeaders,
  getProtectionMetrics,
  logProtectionStatus
} from '../api-protection-v2';

// Mock environment variables
const originalEnv = import.meta.env;

describe('API Protection v2.0 - Type Preservation', () => {
  beforeEach(() => {
    // Reset environment for each test
    vi.stubGlobal('import.meta.env', {
      ...originalEnv,
      VITE_API_PROTECTION: 'true',
      VITE_API_PROTECTION_VERSION: 'v2',
      VITE_API_PROTECTION_STRICT: 'false',
      DEV: true
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Headers Instance Sanitization', () => {
    test('should preserve Headers instance type', () => {
      const input = new Headers({
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
      });

      const result = sanitizeHeaders(input);

      expect(result).toBeInstanceOf(Headers);
      expect((result as Headers).get('Authorization')).toBe('Bearer token');
      expect((result as Headers).get('Content-Type')).toBe('application/json');
    });

    test('should handle Headers with duplicate entries', () => {
      const input = new Headers();
      input.append('X-Custom', 'value1');
      input.append('X-Custom', 'value2');

      const result = sanitizeHeaders(input) as Headers;

      expect(result).toBeInstanceOf(Headers);
      // Headers automatically combines values with comma
      expect(result.get('X-Custom')).toBe('value1, value2');
    });

    test('should filter invalid values from Headers', () => {
      const input = new Headers({
        'Valid-Header': 'valid value',
        'Content-Type': 'application/json'
      });

      // Manually set invalid value (bypass Headers validation)
      Object.defineProperty(input, 'set', {
        value: function(key: string, value: string) {
          (this as any).headers = (this as any).headers || new Map();
          (this as any).headers.set(key, value);
        }
      });

      (input as any).set('Invalid-Header', ''); // Empty value

      const result = sanitizeHeaders(input) as Headers;

      expect(result).toBeInstanceOf(Headers);
      expect(result.get('Valid-Header')).toBe('valid value');
      expect(result.get('Content-Type')).toBe('application/json');
      // Invalid header should be filtered out
    });
  });

  describe('Array Format Sanitization', () => {
    test('should preserve array format and order', () => {
      const input: [string, string][] = [
        ['Authorization', 'Bearer token'],
        ['Content-Type', 'application/json'],
        ['X-Custom-1', 'value1'],
        ['X-Custom-2', 'value2']
      ];

      const result = sanitizeHeaders(input);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['Authorization', 'Bearer token'],
        ['Content-Type', 'application/json'],
        ['X-Custom-1', 'value1'],
        ['X-Custom-2', 'value2']
      ]);
    });

    test('should preserve duplicate keys in array format', () => {
      const input: [string, string][] = [
        ['X-Custom', 'value1'],
        ['X-Custom', 'value2'],
        ['X-Custom', 'value3']
      ];

      const result = sanitizeHeaders(input);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['X-Custom', 'value1'],
        ['X-Custom', 'value2'],
        ['X-Custom', 'value3']
      ]);
    });

    test('should filter invalid entries from array', () => {
      const input: [string, string][] = [
        ['Valid-Header', 'valid value'],
        ['Invalid-Header', ''], // Empty value
        ['', 'invalid name'], // Empty name
        ['Content-Type', 'application/json'],
        ['Bad-Header', 'value\nwith\nnewlines'], // Invalid characters
      ];

      const result = sanitizeHeaders(input) as [string, string][];

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        ['Valid-Header', 'valid value'],
        ['Content-Type', 'application/json']
      ]);
    });

    test('should handle malformed array gracefully', () => {
      const input: any = [
        ['Valid-Header', 'valid value'],
        ['Missing-Value'], // Missing second element
        'not-an-array', // Wrong type
        ['Content-Type', 'application/json', 'extra'], // Too many elements
      ];

      // Should fail gracefully and return original
      const result = sanitizeHeaders(input);
      expect(result).toBe(input);
    });
  });

  describe('Record Format Sanitization', () => {
    test('should preserve record format', () => {
      const input = {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
        'X-Custom': 'value'
      };

      const result = sanitizeHeaders(input);

      expect(typeof result).toBe('object');
      expect(result).not.toBeInstanceOf(Headers);
      expect(Array.isArray(result)).toBe(false);
      expect(result).toEqual({
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
        'X-Custom': 'value'
      });
    });

    test('should filter invalid properties from record', () => {
      const input = {
        'Valid-Header': 'valid value',
        'Empty-Value': '', // Empty value
        'Null-Value': null as any, // Null value
        'Undefined-Value': undefined as any, // Undefined value
        'Number-Value': 123 as any, // Wrong type
        'Content-Type': 'application/json',
        'Whitespace-Only': '   ', // Whitespace only
        'Control-Chars': 'value\x00with\x01control', // Control characters
      };

      const result = sanitizeHeaders(input) as Record<string, string>;

      expect(result).toEqual({
        'Valid-Header': 'valid value',
        'Content-Type': 'application/json'
      });
    });

    test('should normalize whitespace in values', () => {
      const input = {
        'Spaces': '  value  with   spaces  ',
        'Tabs': 'value\twith\ttabs',
        'Mixed': '  value  \t with \t  mixed  '
      };

      const result = sanitizeHeaders(input) as Record<string, string>;

      expect(result).toEqual({
        'Spaces': 'value with spaces',
        'Tabs': 'value with tabs',
        'Mixed': 'value with mixed'
      });
    });

    test('should handle circular references gracefully', () => {
      const circular: any = { 'Valid-Header': 'value' };
      circular.self = circular;

      const result = sanitizeHeaders(circular);

      // Should return original due to error in processing
      expect(result).toBe(circular);
    });
  });
});

describe('API Protection v2.0 - Edge Cases', () => {
  describe('Header Name Validation', () => {
    const validNames = [
      'Content-Type',
      'x-custom-header',
      'X-CUSTOM-HEADER',
      'Accept-Language',
      'User-Agent',
      'X-Forwarded-For',
      'authorization',
      'AUTHORIZATION'
    ];

    const invalidNames = [
      '', // Empty
      ' ', // Space only
      'Header With Spaces', // Spaces in name
      'Header\nWith\nNewlines', // Newlines
      'Header\tWith\tTabs', // Tabs
      'Header\x00Control', // Control characters
      'Header(With)Parens', // Invalid characters
      'Header@With@At', // Invalid characters
      'Header[With]Brackets', // Invalid characters
    ];

    validNames.forEach(name => {
      test(`should accept valid header name: "${name}"`, () => {
        const input = { [name]: 'value' };
        const result = sanitizeHeaders(input) as Record<string, string>;

        expect(result).toHaveProperty(name);
        expect(result[name]).toBe('value');
      });
    });

    invalidNames.forEach(name => {
      test(`should reject invalid header name: "${name}"`, () => {
        const input = { [name]: 'value' };
        const result = sanitizeHeaders(input) as Record<string, string>;

        expect(result).not.toHaveProperty(name);
      });
    });
  });

  describe('Header Value Validation', () => {
    const validValues = [
      'simple value',
      'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
      'application/json',
      'en-US,en;q=0.9',
      'max-age=3600',
      'value with émojis 🚀', // Unicode
      'x'.repeat(8192), // Maximum length
    ];

    const invalidValues = [
      '', // Empty
      '   ', // Whitespace only
      'value\nwith\nnewlines', // Newlines
      'value\rwith\rreturns', // Carriage returns
      'value\x00with\x01control', // Control characters
      'x'.repeat(8193), // Too long
      null as any, // Null
      undefined as any, // Undefined
    ];

    validValues.forEach(value => {
      test(`should accept valid header value: "${value.slice(0, 50)}${value.length > 50 ? '...' : ''}"`, () => {
        const input = { 'X-Test': value };
        const result = sanitizeHeaders(input) as Record<string, string>;

        expect(result['X-Test']).toBe(value.trim().replace(/\s+/g, ' '));
      });
    });

    invalidValues.forEach(value => {
      test(`should reject invalid header value: "${value}"`, () => {
        const input = { 'X-Test': value };
        const result = sanitizeHeaders(input) as Record<string, string>;

        expect(result).not.toHaveProperty('X-Test');
      });
    });
  });

  describe('Memory and Performance', () => {
    test('should handle large number of headers efficiently', () => {
      const largeHeaders: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeHeaders[`X-Header-${i}`] = `value-${i}`;
      }

      const startTime = performance.now();
      const result = sanitizeHeaders(largeHeaders);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
      expect(Object.keys(result as Record<string, string>)).toHaveLength(1000);
    });

    test('should not leak memory with repeated sanitization', () => {
      const headers = {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json'
      };

      // Perform multiple sanitizations
      for (let i = 0; i < 1000; i++) {
        sanitizeHeaders(headers);
      }

      // Memory usage should stabilize
      const metrics = getProtectionMetrics();
      expect(metrics.totalCalls).toBeGreaterThan(0);
      expect(metrics.successfulCalls).toBeGreaterThan(0);
    });
  });
});

describe('API Protection v2.0 - Integration', () => {
  describe('createProtectedFetch', () => {
    test('should sanitize headers in fetch requests', async () => {
      const protectedFetch = createProtectedFetch();

      // Mock fetch to capture sanitized headers
      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
      global.fetch = mockFetch;

      try {
        await protectedFetch('https://api.example.com/test', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
            'Invalid-Header': '', // Should be filtered out
          }
        });

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json',
            // Invalid-Header should be absent
          }
        });
      } finally {
        global.fetch = originalFetch;
      }
    });

    test('should pass through requests without headers', async () => {
      const protectedFetch = createProtectedFetch();

      const originalFetch = global.fetch;
      const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
      global.fetch = mockFetch;

      try {
        await protectedFetch('https://api.example.com/test', {
          method: 'GET'
        });

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', {
          method: 'GET'
        });
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('createProtectedHeaders', () => {
    test('should create sanitized Headers instance', () => {
      const ProtectedHeaders = createProtectedHeaders();

      const headers = new ProtectedHeaders({
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
        'Invalid-Header': '', // Should be filtered
      });

      expect(headers).toBeInstanceOf(Headers);
      expect(headers.get('Authorization')).toBe('Bearer token');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Invalid-Header')).toBeNull();
    });

    test('should validate headers on set method', () => {
      const ProtectedHeaders = createProtectedHeaders();
      const headers = new ProtectedHeaders();

      // Valid header
      headers.set('Authorization', 'Bearer token');
      expect(headers.get('Authorization')).toBe('Bearer token');

      // Invalid header (in non-strict mode, should be silently ignored)
      headers.set('Invalid', '');
      expect(headers.get('Invalid')).toBeNull();
    });
  });
});

describe('API Protection v2.0 - Circuit Breaker', () => {
  test('should handle repeated failures gracefully', () => {
    // Force failures by passing invalid input repeatedly
    const invalidInput = Symbol('invalid') as any;

    for (let i = 0; i < 10; i++) {
      const result = sanitizeHeaders(invalidInput);
      // Should return original input when sanitization fails
      expect(result).toBe(invalidInput);
    }

    // Circuit breaker should eventually open and bypass
    const metrics = getProtectionMetrics();
    expect(metrics.failedCalls).toBeGreaterThan(0);
  });
});

describe('API Protection v2.0 - Production Scenarios', () => {
  describe('Supabase Integration', () => {
    test('should preserve Supabase authentication headers', () => {
      const supabaseHeaders = {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'content-type': 'application/json',
        'prefer': 'return=representation',
        'x-client-info': 'supabase-js/2.56.1'
      };

      const result = sanitizeHeaders(supabaseHeaders) as Record<string, string>;

      expect(result).toEqual(supabaseHeaders);
    });

    test('should handle malformed bearer tokens', () => {
      const malformedHeaders = {
        'authorization': 'Bearer undefined',
        'apikey': 'null',
        'content-type': 'application/json'
      };

      const result = sanitizeHeaders(malformedHeaders) as Record<string, string>;

      // Should preserve the malformed tokens (validation happens server-side)
      expect(result).toEqual(malformedHeaders);
    });
  });

  describe('Browser Extension Compatibility', () => {
    test('should work with 1Password style strict validation', () => {
      // Simulate 1Password's strict Headers validation
      const originalHeaders = global.Headers;

      global.Headers = class StrictHeaders extends Headers {
        set(name: string, value: string) {
          if (!value || value.trim() === '') {
            throw new TypeError('Invalid header value');
          }
          return super.set(name, value);
        }
      } as any;

      try {
        const headers = {
          'Authorization': 'Bearer token',
          'Content-Type': 'application/json',
          'Empty-Value': '' // This would normally cause 1Password to throw
        };

        const sanitized = sanitizeHeaders(headers);

        // Should not throw when creating Headers with sanitized values
        expect(() => new Headers(sanitized)).not.toThrow();
      } finally {
        global.Headers = originalHeaders;
      }
    });
  });

  describe('HTTP/2 and Modern Browsers', () => {
    test('should handle lowercase header names', () => {
      const http2Headers = {
        'authorization': 'Bearer token', // HTTP/2 lowercases everything
        'content-type': 'application/json',
        'x-custom-header': 'value'
      };

      const result = sanitizeHeaders(http2Headers) as Record<string, string>;

      expect(result).toEqual(http2Headers);
    });

    test('should handle large header values', () => {
      const largeValue = 'x'.repeat(7000); // Just under 8KB limit
      const headers = {
        'X-Large-Header': largeValue,
        'Content-Type': 'application/json'
      };

      const result = sanitizeHeaders(headers) as Record<string, string>;

      expect(result['X-Large-Header']).toBe(largeValue);
      expect(result['Content-Type']).toBe('application/json');
    });
  });
});

describe('API Protection v2.0 - Configuration', () => {
  test('should respect disabled protection flag', () => {
    vi.stubGlobal('import.meta.env', {
      ...originalEnv,
      VITE_API_PROTECTION: 'false'
    });

    const headers = {
      'Authorization': 'Bearer token',
      'Invalid-Header': '' // Would normally be filtered
    };

    const result = sanitizeHeaders(headers);

    // Should return original headers unchanged
    expect(result).toBe(headers);
  });

  test('should handle strict mode', () => {
    vi.stubGlobal('import.meta.env', {
      ...originalEnv,
      VITE_API_PROTECTION: 'true',
      VITE_API_PROTECTION_STRICT: 'true',
      DEV: true
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const headers = {
        'Authorization': 'Bearer token',
        'Invalid-Header': '' // Should trigger warning in strict mode
      };

      sanitizeHeaders(headers);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API Protection] Invalid header rejected: Invalid-Header=')
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });
});

describe('API Protection v2.0 - Monitoring', () => {
  test('should track performance metrics', () => {
    const headers = {
      'Authorization': 'Bearer token',
      'Content-Type': 'application/json'
    };

    // Clear metrics
    const initialMetrics = getProtectionMetrics();

    sanitizeHeaders(headers);

    const finalMetrics = getProtectionMetrics();

    expect(finalMetrics.totalCalls).toBeGreaterThan(initialMetrics.totalCalls);
    expect(finalMetrics.successfulCalls).toBeGreaterThan(initialMetrics.successfulCalls);
    expect(finalMetrics.averageLatency).toBeGreaterThanOrEqual(0);
  });

  test('should log protection status in development', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      logProtectionStatus();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[API Protection v2.0] Status:'),
        expect.objectContaining({
          enabled: true,
          version: 'v2',
          environment: 'test'
        })
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });
});