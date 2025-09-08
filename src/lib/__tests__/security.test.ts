import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeHtml,
  stripHtml,
  sanitizeTextInput,
  isValidEmail,
  isValidUrl,
  isValidUuid,
  generateSecureToken,
  validationSchemas,
  rateLimiter,
  csrfManager,
} from '@/lib/security';

describe('Security Utils', () => {
  describe('HTML Sanitization', () => {
    it('removes dangerous script tags', () => {
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = sanitizeHtml(maliciousHtml);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('removes dangerous attributes', () => {
      const maliciousHtml = '<div onclick="alert(\'xss\')">Content</div>';
      const sanitized = sanitizeHtml(maliciousHtml);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('Content');
    });

    it('preserves allowed HTML tags', () => {
      const safeHtml = '<p>Hello <strong>world</strong>!</p><ul><li>Item 1</li></ul>';
      const sanitized = sanitizeHtml(safeHtml);
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<ul>');
      expect(sanitized).toContain('<li>');
    });

    it('handles empty and null inputs', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as never)).toBe('');
      expect(sanitizeHtml(undefined as never)).toBe('');
    });

    it('strips all HTML tags', () => {
      const htmlWithTags = '<p>Hello <strong>world</strong>!</p>';
      const stripped = stripHtml(htmlWithTags);
      
      expect(stripped).toBe('Hello world!');
      expect(stripped).not.toContain('<');
      expect(stripped).not.toContain('>');
    });
  });

  describe('Text Input Sanitization', () => {
    it('sanitizes potentially dangerous text input', () => {
      const dangerousInput = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeTextInput(dangerousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('respects maximum length limit', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = sanitizeTextInput(longInput, 100);
      
      expect(sanitized.length).toBeLessThanOrEqual(100);
    });

    it('trims whitespace', () => {
      const inputWithWhitespace = '  hello world  ';
      const sanitized = sanitizeTextInput(inputWithWhitespace);
      
      expect(sanitized).toBe('hello world');
    });
  });

  describe('Email Validation', () => {
    it('validates correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('valid.email@subdomain.example.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('test..test@domain.com')).toBe(false);
    });

    it('rejects emails that exceed RFC length limit', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('validates correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://subdomain.example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com:8080/path?query=value')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false); // Missing protocol
    });
  });

  describe('UUID Validation', () => {
    it('validates correct UUIDs', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false); // Too short
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false); // Too long
    });
  });

  describe('Token Generation', () => {
    it('generates tokens of specified length', () => {
      const token16 = generateSecureToken(16);
      const token32 = generateSecureToken(32);
      
      expect(token16.length).toBe(32); // Hex encoding doubles length
      expect(token32.length).toBe(64);
    });

    it('generates different tokens each time', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });

    it('generates hex-formatted tokens', () => {
      const token = generateSecureToken(8);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('Validation Schemas', () => {
    it('validates project titles', () => {
      const validTitle = validationSchemas.projectTitle.safeParse('Valid Project Title');
      expect(validTitle.success).toBe(true);

      const invalidTitle = validationSchemas.projectTitle.safeParse('x'.repeat(201));
      expect(invalidTitle.success).toBe(false);
    });

    it('validates email format', () => {
      const validEmail = validationSchemas.email.safeParse('test@example.com');
      expect(validEmail.success).toBe(true);

      const invalidEmail = validationSchemas.email.safeParse('not-an-email');
      expect(invalidEmail.success).toBe(false);
    });

    it('transforms and sanitizes note content', () => {
      const result = validationSchemas.noteContent.safeParse('<script>alert("xss")</script><p>Safe</p>');
      
      if (result.success) {
        expect(result.data).not.toContain('<script>');
        expect(result.data).toContain('<p>Safe</p>');
      } else {
        throw new Error('Validation should have succeeded');
      }
    });
  });

  describe('Rate Limiter', () => {
    beforeEach(() => {
      // Clear rate limiter state
      rateLimiter['attempts'].clear();
    });

    it('allows requests within limits', () => {
      expect(rateLimiter.isAllowed('test-user', 5)).toBe(true);
      expect(rateLimiter.isAllowed('test-user', 5)).toBe(true);
      expect(rateLimiter.isAllowed('test-user', 5)).toBe(true);
    });

    it('blocks requests exceeding limits', () => {
      // Make 5 requests (should all be allowed)
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed('test-user', 5)).toBe(true);
      }
      
      // 6th request should be blocked
      expect(rateLimiter.isAllowed('test-user', 5)).toBe(false);
    });

    it('resets limits for different users', () => {
      // Fill up limits for user1
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed('user1', 5);
      }
      
      // user2 should still have full limits
      expect(rateLimiter.isAllowed('user2', 5)).toBe(true);
    });

    it('manually resets user limits', () => {
      // Fill up limits
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed('test-user', 5);
      }
      
      // Should be blocked
      expect(rateLimiter.isAllowed('test-user', 5)).toBe(false);
      
      // Reset and try again
      rateLimiter.reset('test-user');
      expect(rateLimiter.isAllowed('test-user', 5)).toBe(true);
    });
  });

  describe('CSRF Token Manager', () => {
    beforeEach(() => {
      // Clear CSRF tokens
      csrfManager['tokens'].clear();
    });

    it('generates and validates tokens', () => {
      const token = csrfManager.generateToken();
      
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(csrfManager.validateToken(token)).toBe(true);
    });

    it('rejects invalid tokens', () => {
      expect(csrfManager.validateToken('invalid-token')).toBe(false);
    });

    it('removes used tokens', () => {
      const token = csrfManager.generateToken();
      
      expect(csrfManager.validateToken(token)).toBe(true);
      
      csrfManager.removeToken(token);
      expect(csrfManager.validateToken(token)).toBe(false);
    });

    it('clears expired tokens', () => {
      // Generate some tokens
      csrfManager.generateToken();
      csrfManager.generateToken();
      
      // Should clear when called
      csrfManager.clearExpiredTokens();
      
      // This test mainly ensures the method doesn't throw
      expect(true).toBe(true);
    });
  });
});