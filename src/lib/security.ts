import DOMPurify from 'dompurify';
import validator from 'validator';
import { z } from 'zod';

// XSS Protection Configuration
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target'],
  FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover'],
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe', 'style', 'link'],
  KEEP_CONTENT: false,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  return DOMPurify.sanitize(html, {
    ...PURIFY_CONFIG,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * Strips all HTML tags and returns plain text
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Validates and sanitizes text input
 */
export function sanitizeTextInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove any potential script injections
  const sanitized = validator.escape(input);
  
  // Trim and limit length
  return sanitized.trim().slice(0, maxLength);
}

/**
 * Validates email address
 */
export function isValidEmail(email: string): boolean {
  return validator.isEmail(email) && email.length <= 254; // RFC 5321 limit
}

/**
 * Validates URL
 */
export function isValidUrl(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    allow_underscores: true,
  });
}

/**
 * Validates UUID
 */
export function isValidUuid(uuid: string): boolean {
  return validator.isUUID(uuid, 4);
}

/**
 * Generates a secure random token for CSRF protection
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Zod schemas for common validation patterns
export const validationSchemas = {
  email: z.string().email().max(254),
  
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Name contains invalid characters'),
  
  projectTitle: z.string()
    .min(1, 'Project title is required')
    .max(200, 'Project title must be less than 200 characters')
    .transform(val => sanitizeTextInput(val, 200)),
  
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .transform(val => sanitizeTextInput(val, 2000)),
  
  noteTitle: z.string()
    .max(200, 'Note title must be less than 200 characters')
    .transform(val => sanitizeTextInput(val, 200)),
  
  noteContent: z.string()
    .max(10000, 'Note content must be less than 10000 characters')
    .transform(val => sanitizeHtml(val)),
  
  url: z.string().refine(isValidUrl, 'Invalid URL format'),
  
  uuid: z.string().refine(isValidUuid, 'Invalid UUID format'),
  
  clientInviteCode: z.string()
    .min(8, 'Invite code must be at least 8 characters')
    .max(64, 'Invite code must be less than 64 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid invite code format'),
};

/**
 * Rate limiting utility (basic implementation)
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  public isAllowed(
    identifier: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  public reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * CSRF Token management
 */
class CSRFTokenManager {
  private tokens: Set<string> = new Set();
  
  public generateToken(): string {
    const token = generateSecureToken(32);
    this.tokens.add(token);
    return token;
  }
  
  public validateToken(token: string): boolean {
    return this.tokens.has(token);
  }
  
  public removeToken(token: string): void {
    this.tokens.delete(token);
  }
  
  public clearExpiredTokens(): void {
    // In a real implementation, you'd track creation times
    // For now, this is a placeholder for cleanup logic
    if (this.tokens.size > 100) {
      this.tokens.clear();
    }
  }
}

export const csrfManager = new CSRFTokenManager();

/**
 * Content Security Policy helpers
 */
export const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Note: unsafe-inline should be removed in production
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'font-src': ["'self'"],
  'connect-src': ["'self'", "https://api.supabase.io", "wss://realtime.supabase.io"],
  'media-src': ["'none'"],
  'object-src': ["'none'"],
  'child-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

export function generateCSP(): string {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => 
      sources.length > 0 
        ? `${directive} ${sources.join(' ')}` 
        : directive
    )
    .join('; ');
}