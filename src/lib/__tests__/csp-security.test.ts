import { describe, test, expect } from 'vitest';
import { 
  createSecureCSPDirectives,
  generateCSP,
  generateCSPMetaTag,
  generateNonce,
  getCSPMiddlewareConfig
} from '../security';

describe('CSP Security Functions', () => {
  describe('createSecureCSPDirectives', () => {
    test('should create secure CSP without unsafe-inline by default', () => {
      const directives = createSecureCSPDirectives();
      
      expect(directives['script-src']).toEqual(["'self'"]);
      expect(directives['style-src']).toEqual(["'self'"]);
      expect(directives['script-src']).not.toContain("'unsafe-inline'");
      expect(directives['style-src']).not.toContain("'unsafe-inline'");
    });

    test('should add script nonce when provided', () => {
      const nonce = 'test-nonce-123';
      const directives = createSecureCSPDirectives(nonce);
      
      expect(directives['script-src']).toContain(`'nonce-${nonce}'`);
      expect(directives['script-src']).toContain("'self'");
    });

    test('should add style nonce when provided', () => {
      const styleNonce = 'style-nonce-456';
      const directives = createSecureCSPDirectives(undefined, styleNonce);
      
      expect(directives['style-src']).toContain(`'nonce-${styleNonce}'`);
      expect(directives['style-src']).toContain("'self'");
    });

    test('should include necessary security directives', () => {
      const directives = createSecureCSPDirectives();
      
      expect(directives['default-src']).toEqual(["'self'"]);
      expect(directives['object-src']).toEqual(["'none'"]);
      expect(directives['frame-ancestors']).toEqual(["'none'"]);
      expect(directives['base-uri']).toEqual(["'self'"]);
      expect(directives['form-action']).toEqual(["'self'"]);
    });

    test('should include Supabase domains in connect-src', () => {
      const directives = createSecureCSPDirectives();
      
      expect(directives['connect-src']).toContain("'self'");
      expect(directives['connect-src']).toContain('https://api.supabase.io');
      expect(directives['connect-src']).toContain('wss://realtime.supabase.io');
      expect(directives['connect-src']).toContain('https://*.supabase.co');
      expect(directives['connect-src']).toContain('wss://*.supabase.co');
    });
  });

  describe('generateCSP', () => {
    test('should generate valid CSP string', () => {
      const csp = generateCSP();
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
      expect(csp).not.toContain("'unsafe-inline'");
    });

    test('should handle custom directives', () => {
      const customDirectives = createSecureCSPDirectives('test-nonce');
      const csp = generateCSP(customDirectives);
      
      expect(csp).toContain("script-src 'self' 'nonce-test-nonce'");
    });

    test('should handle directives with no sources', () => {
      const csp = generateCSP();
      
      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).not.toContain('upgrade-insecure-requests ');
    });
  });

  describe('generateCSPMetaTag', () => {
    test('should generate CSP meta tag content', () => {
      const metaContent = generateCSPMetaTag();
      
      expect(metaContent).toContain("default-src 'self'");
      expect(metaContent).toContain("script-src 'self'");
      expect(metaContent).not.toContain("'unsafe-inline'");
    });

    test('should include nonces in meta tag when provided', () => {
      const scriptNonce = 'script123';
      const styleNonce = 'style456';
      const metaContent = generateCSPMetaTag(scriptNonce, styleNonce);
      
      expect(metaContent).toContain(`'nonce-${scriptNonce}'`);
      expect(metaContent).toContain(`'nonce-${styleNonce}'`);
    });
  });

  describe('generateNonce', () => {
    test('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      
      expect(nonce1).toBeTruthy();
      expect(nonce2).toBeTruthy();
      expect(nonce1).not.toBe(nonce2);
    });

    test('should generate nonces of expected length', () => {
      const nonce = generateNonce();
      
      // 16-byte nonce becomes 32-character hex string
      expect(nonce).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(nonce)).toBe(true);
    });
  });

  describe('getCSPMiddlewareConfig', () => {
    test('should return middleware configuration', () => {
      const config = getCSPMiddlewareConfig();
      
      expect(config).toHaveProperty('directives');
      expect(config).toHaveProperty('reportOnly', false);
      expect(config).toHaveProperty('upgradeInsecureRequests', true);
      expect(config).toHaveProperty('workerSrc', false);
    });

    test('should include nonces in middleware config', () => {
      const scriptNonce = 'middleware-nonce';
      const config = getCSPMiddlewareConfig(scriptNonce);
      
      expect(config.directives['script-src']).toContain(`'nonce-${scriptNonce}'`);
    });
  });

  describe('Security Validation', () => {
    test('should never include unsafe-inline in secure directives', () => {
      const directives = createSecureCSPDirectives();
      const csp = generateCSP(directives);
      
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
    });

    test('should block inline scripts and styles by default', () => {
      const directives = createSecureCSPDirectives();
      
      expect(directives['script-src']).not.toContain("'unsafe-inline'");
      expect(directives['style-src']).not.toContain("'unsafe-inline'");
      
      // Only 'self' should be allowed without nonces
      expect(directives['script-src']).toEqual(["'self'"]);
      expect(directives['style-src']).toEqual(["'self'"]);
    });

    test('should prevent common XSS vectors', () => {
      const directives = createSecureCSPDirectives();
      
      // No inline script execution
      expect(directives['script-src']).not.toContain("'unsafe-inline'");
      
      // No object/embed execution
      expect(directives['object-src']).toEqual(["'none'"]);
      
      // No frame embedding from other origins
      expect(directives['frame-ancestors']).toEqual(["'none'"]);
      
      // Restricted base URI
      expect(directives['base-uri']).toEqual(["'self'"]);
    });
  });
});