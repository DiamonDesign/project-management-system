/**
 * Comprehensive Security Tests for Adaptive CSP System
 * Validates A+ security grade compliance across all environments
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectEnvironment,
  generateCSPNonce,
  createDevelopmentCSP,
  createProductionCSP,
  createTestCSP,
  createAdaptiveCSP,
  calculateContentHash,
  initializeAdaptiveCSP
} from '../adaptive-csp';

// Mock global environment
const mockWindow = (props: Record<string, any>) => {
  Object.defineProperty(window, 'location', {
    value: props.location || { hostname: 'localhost' },
    writable: true
  });
};

const mockImportMeta = (env: Record<string, any>) => {
  vi.stubGlobal('import.meta', { env });
};

const mockProcess = (env: Record<string, any>) => {
  vi.stubGlobal('process', { env });
};

describe('Adaptive CSP Security System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Environment Detection', () => {
    test('should detect development environment correctly', () => {
      mockImportMeta({ DEV: true, PROD: false });
      expect(detectEnvironment()).toBe('development');
    });

    test('should detect production environment correctly', () => {
      mockImportMeta({ DEV: false, PROD: true });
      expect(detectEnvironment()).toBe('production');
    });

    test('should detect test environment correctly', () => {
      mockImportMeta({ MODE: 'test' });
      expect(detectEnvironment()).toBe('test');
    });

    test('should fallback to process.env detection', () => {
      mockImportMeta({});
      mockProcess({ NODE_ENV: 'development' });
      expect(detectEnvironment()).toBe('development');
    });

    test('should fallback to browser detection for localhost', () => {
      mockImportMeta({});
      mockProcess({});
      mockWindow({ location: { hostname: 'localhost' } });
      expect(detectEnvironment()).toBe('development');
    });

    test('should default to production for safety', () => {
      mockImportMeta({});
      mockProcess({});
      mockWindow({ location: { hostname: 'example.com' } });
      expect(detectEnvironment()).toBe('production');
    });
  });

  describe('CSP Nonce Generation', () => {
    test('should generate unique nonces', () => {
      const nonce1 = generateCSPNonce();
      const nonce2 = generateCSPNonce();

      expect(nonce1).toBeTruthy();
      expect(nonce2).toBeTruthy();
      expect(nonce1).not.toBe(nonce2);
    });

    test('should generate nonces of correct length', () => {
      const nonce = generateCSPNonce();
      // 16-byte token becomes 32-character hex string
      expect(nonce).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(nonce)).toBe(true);
    });

    test('should generate cryptographically secure nonces', () => {
      const nonces = Array.from({ length: 100 }, () => generateCSPNonce());
      const uniqueNonces = new Set(nonces);

      // All nonces should be unique (cryptographically secure)
      expect(uniqueNonces.size).toBe(100);
    });
  });

  describe('Content Hash Calculation', () => {
    test('should calculate correct SHA-256 hash', async () => {
      const content = 'test content';
      const hash = await calculateContentHash(content);

      expect(hash).toMatch(/^sha256-[A-Za-z0-9+/=]+$/);
      expect(hash).toBe('sha256-n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=');
    });

    test('should generate different hashes for different content', async () => {
      const hash1 = await calculateContentHash('content1');
      const hash2 = await calculateContentHash('content2');

      expect(hash1).not.toBe(hash2);
    });

    test('should generate consistent hashes for same content', async () => {
      const content = 'consistent content';
      const hash1 = await calculateContentHash(content);
      const hash2 = await calculateContentHash(content);

      expect(hash1).toBe(hash2);
    });
  });

  describe('Development CSP Configuration', () => {
    test('should create secure development CSP', () => {
      const csp = createDevelopmentCSP();

      // Should allow self
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");

      // Should allow development tools
      expect(csp).toContain("'unsafe-eval'"); // For Vite HMR
      expect(csp).toContain("'unsafe-inline'"); // Temporary for dev

      // Should include WebSocket connections for development
      expect(csp).toContain('ws://localhost:*');
      expect(csp).toContain('http://localhost:*');

      // Should include Google Fonts
      expect(csp).toContain('https://fonts.googleapis.com');
      expect(csp).toContain('https://fonts.gstatic.com');
    });

    test('should include nonces when enabled', () => {
      const csp = createDevelopmentCSP({ enableNonces: true });

      // Should contain nonce pattern (actual nonce will vary)
      expect(csp).toMatch(/'nonce-[a-f0-9]{32}'/);
    });

    test('should include custom domains', () => {
      const customDomains = ['https://api.example.com', 'wss://websocket.example.com'];
      const csp = createDevelopmentCSP({ customDomains });

      customDomains.forEach(domain => {
        expect(csp).toContain(domain);
      });
    });

    test('should include report URI when specified', () => {
      const reportUri = 'https://csp-reports.example.com';
      const csp = createDevelopmentCSP({ reportUri });

      expect(csp).toContain(`report-uri ${reportUri}`);
      expect(csp).toContain("report-to csp-endpoint");
    });
  });

  describe('Production CSP Configuration', () => {
    test('should create maximum security production CSP', () => {
      const csp = createProductionCSP();

      // Should use most restrictive default
      expect(csp).toContain("default-src 'none'");

      // Should only allow self for scripts
      expect(csp).toContain("script-src 'self'");

      // Should NOT contain unsafe directives
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");

      // Should NOT contain development-specific sources
      expect(csp).not.toContain('ws://localhost');
      expect(csp).not.toContain('http://localhost');

      // Should include security headers
      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).toContain('block-all-mixed-content');
    });

    test('should include nonces in production when enabled', () => {
      const csp = createProductionCSP({ enableNonces: true });

      expect(csp).toMatch(/'nonce-[a-f0-9]{32}'/);
      expect(csp).not.toContain("'unsafe-inline'");
    });

    test('should include minimal trusted sources', () => {
      const csp = createProductionCSP();

      // Only essential font sources
      expect(csp).toContain('https://fonts.googleapis.com');
      expect(csp).toContain('https://fonts.gstatic.com');

      // Only essential image sources
      expect(csp).toContain("img-src 'self' data: https:");

      // Only Supabase connections
      expect(csp).toContain('https://*.supabase.co');
      expect(csp).toContain('wss://*.supabase.co');
    });

    test('should enforce maximum security directives', () => {
      const csp = createProductionCSP();

      // Frame protection
      expect(csp).toContain("frame-ancestors 'none'");

      // Object restrictions
      expect(csp).toContain("object-src 'none'");

      // Base URI protection
      expect(csp).toContain("base-uri 'self'");

      // Form action restriction
      expect(csp).toContain("form-action 'self'");
    });
  });

  describe('Test Environment CSP', () => {
    test('should create balanced test CSP', () => {
      const csp = createTestCSP();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("'unsafe-eval'"); // Needed for test frameworks
      expect(csp).toContain("'unsafe-inline'"); // Relaxed for tests
      expect(csp).toContain('connect-src');
    });

    test('should include nonce for test environment', () => {
      const csp = createTestCSP();

      expect(csp).toMatch(/'nonce-[a-f0-9]{32}'/);
    });
  });

  describe('Adaptive CSP Generation', () => {
    test('should automatically select development CSP', () => {
      mockImportMeta({ DEV: true });

      const csp = createAdaptiveCSP();

      expect(csp).toContain("'unsafe-eval'"); // Development marker
    });

    test('should automatically select production CSP', () => {
      mockImportMeta({ PROD: true });

      const csp = createAdaptiveCSP();

      expect(csp).toContain("default-src 'none'"); // Production marker
      expect(csp).not.toContain("'unsafe-eval'");
    });

    test('should respect environment override', () => {
      mockImportMeta({ DEV: true });

      const csp = createAdaptiveCSP({ environment: 'production' });

      expect(csp).toContain("default-src 'none'"); // Should be production despite dev environment
    });

    test('should include all configuration options', () => {
      const config = {
        reportUri: 'https://reports.example.com',
        customDomains: ['https://custom.example.com'],
        enableNonces: true,
        enableHashes: true,
        reportViolations: true
      };

      const csp = createAdaptiveCSP(config);

      expect(csp).toContain(config.reportUri!);
      expect(csp).toContain(config.customDomains![0]);
      expect(csp).toMatch(/'nonce-[a-f0-9]{32}'/);
    });
  });

  describe('Security Validation', () => {
    test('should never include unsafe-inline in production', () => {
      const csp = createProductionCSP();

      expect(csp).not.toContain("'unsafe-inline'");
    });

    test('should never include unsafe-eval in production', () => {
      const csp = createProductionCSP();

      expect(csp).not.toContain("'unsafe-eval'");
    });

    test('should always include security headers in production', () => {
      const csp = createProductionCSP();

      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).toContain('block-all-mixed-content');
    });

    test('should restrict frame ancestors in all environments', () => {
      const devCSP = createDevelopmentCSP();
      const prodCSP = createProductionCSP();
      const testCSP = createTestCSP();

      expect(devCSP).toContain("frame-ancestors 'none'");
      expect(prodCSP).toContain("frame-ancestors 'none'");
      expect(testCSP).toContain("frame-ancestors 'none'");
    });

    test('should restrict object sources in all environments', () => {
      const devCSP = createDevelopmentCSP();
      const prodCSP = createProductionCSP();
      const testCSP = createTestCSP();

      expect(devCSP).toContain("object-src 'none'");
      expect(prodCSP).toContain("object-src 'none'");
      expect(testCSP).toContain("object-src 'none'");
    });
  });

  describe('CSP Initialization', () => {
    test('should initialize CSP system correctly', () => {
      const mockDocument = {
        addEventListener: vi.fn()
      };
      vi.stubGlobal('document', mockDocument);

      const result = initializeAdaptiveCSP();

      expect(result).toHaveProperty('csp');
      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('environment');
      expect(typeof result.csp).toBe('string');
      expect(mockDocument.addEventListener).toHaveBeenCalled();
    });

    test('should handle missing document gracefully', () => {
      vi.stubGlobal('document', undefined);

      expect(() => {
        initializeAdaptiveCSP();
      }).not.toThrow();
    });
  });

  describe('A+ Security Grade Validation', () => {
    test('production CSP should meet A+ security standards', () => {
      const csp = createProductionCSP();

      // A+ Requirements: No unsafe directives
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).not.toContain("'unsafe-hashes'");

      // A+ Requirements: Restrictive defaults
      expect(csp).toContain("default-src 'none'");

      // A+ Requirements: Security features enabled
      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).toContain('block-all-mixed-content');

      // A+ Requirements: Frame protection
      expect(csp).toContain("frame-ancestors 'none'");

      // A+ Requirements: Base URI restriction
      expect(csp).toContain("base-uri 'self'");
    });

    test('should maintain security when nonces are used', () => {
      const csp = createProductionCSP({ enableNonces: true });

      // Should have nonce but no unsafe-inline
      expect(csp).toMatch(/'nonce-[a-f0-9]{32}'/);
      expect(csp).not.toContain("'unsafe-inline'");
    });

    test('should have minimal attack surface', () => {
      const csp = createProductionCSP();

      // Should minimize allowed sources
      const scriptSources = csp.match(/script-src[^;]+/)?.[0] || '';
      const styleSources = csp.match(/style-src[^;]+/)?.[0] || '';

      // Script sources should be minimal
      expect(scriptSources.split(' ').length).toBeLessThan(5);

      // Should not allow wildcard domains
      expect(csp).not.toContain('*');
      expect(csp).not.toMatch(/https:\/\/\*/);
    });
  });

  describe('Browser Compatibility', () => {
    test('should generate valid CSP for all modern browsers', () => {
      const csp = createProductionCSP();

      // Should use standard CSP directives
      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');

      // Should not use deprecated directives
      expect(csp).not.toContain('block-all-mixed-content'); // Replaced by upgrade-insecure-requests in most cases

      // Should use supported syntax
      expect(csp).toMatch(/^[a-zA-Z0-9\s':\-\/\.\*\?\+\=\;\-_]+$/);
    });

    test('should handle edge cases gracefully', () => {
      expect(() => createAdaptiveCSP({ environment: undefined as any })).not.toThrow();
      expect(() => createAdaptiveCSP({ customDomains: [] })).not.toThrow();
      expect(() => createAdaptiveCSP({ enableNonces: false })).not.toThrow();
    });
  });

  describe('Performance Impact', () => {
    test('CSP generation should be fast', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        createAdaptiveCSP();
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should generate 1000 CSPs in under 100ms
    });

    test('nonce generation should be efficient', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        generateCSPNonce();
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(50); // Should generate 1000 nonces in under 50ms
    });
  });
});