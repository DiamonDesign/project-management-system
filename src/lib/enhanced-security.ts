import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Security event types
export type SecurityEventType = 
  | 'login_attempt'
  | 'permission_violation' 
  | 'data_access_violation'
  | 'authentication_failure'
  | 'suspicious_activity'
  | 'rate_limit_exceeded';

// Security event data interface
export interface SecurityEventData {
  user_id?: string;
  resource_id?: string;
  action?: string;
  details?: string;
  risk_score?: number;
  metadata?: Record<string, unknown>;
}

// Validation schemas
const securityEventSchema = z.object({
  event_type: z.string().min(1),
  event_data: z.record(z.unknown()),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; timestamp: number }>();

/**
 * Get client IP address safely
 */
async function getClientIP(): Promise<string> {
  try {
    // In a real implementation, this would get the actual client IP
    // For now, return a placeholder
    return 'unknown';
  } catch (error) {
    console.warn('Failed to get client IP:', error);
    return 'unknown';
  }
}

/**
 * Get client user agent safely
 */
function getClientUserAgent(): string {
  try {
    return navigator.userAgent || 'unknown';
  } catch (error) {
    console.warn('Failed to get user agent:', error);
    return 'unknown';
  }
}

/**
 * Calculate risk score based on event type and context
 */
export function calculateRiskScore(
  eventType: SecurityEventType,
  eventData: SecurityEventData
): number {
  let riskScore = 0;

  // Base risk scores by event type
  switch (eventType) {
    case 'login_attempt':
      riskScore = 1;
      break;
    case 'permission_violation':
      riskScore = 7;
      break;
    case 'data_access_violation':
      riskScore = 9;
      break;
    case 'authentication_failure':
      riskScore = 5;
      break;
    case 'suspicious_activity':
      riskScore = 8;
      break;
    case 'rate_limit_exceeded':
      riskScore = 6;
      break;
    default:
      riskScore = 3;
  }

  // Increase risk based on repeated violations
  const key = `${eventType}_${eventData.user_id || 'anonymous'}`;
  const existing = rateLimitStore.get(key);
  if (existing && Date.now() - existing.timestamp < 3600000) { // 1 hour
    riskScore += Math.min(existing.count * 2, 10);
  }

  return Math.min(riskScore, 10);
}

/**
 * Check if action should be rate limited
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 300000 // 5 minutes
): boolean {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now - existing.timestamp > windowMs) {
    rateLimitStore.set(key, { count: 1, timestamp: now });
    return false; // Not rate limited
  }

  existing.count++;
  return existing.count > maxAttempts; // Rate limited if exceeded
}

/**
 * Sanitize input data to prevent injection attacks
 */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters
    return input.replace(/[<>'"&]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key) as string] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Secure data access wrapper
 */
export async function secureDataAccess<T>(
  operation: () => Promise<T>,
  resourceType: string,
  resourceId: string,
  userId?: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    // Log data access attempt
    await logSecurityEvent('data_access_violation', {
      user_id: userId,
      resource_id: resourceId,
      resource_type: resourceType,
      action: 'access_attempt'
    });

    const result = await operation();

    // Log successful access
    const duration = Date.now() - startTime;
    await logSecurityEvent('data_access_violation', {
      user_id: userId,
      resource_id: resourceId,
      resource_type: resourceType,
      action: 'access_success',
      duration
    });

    return result;
  } catch (error) {
    // Log access failure
    await logSecurityEvent('data_access_violation', {
      user_id: userId,
      resource_id: resourceId,
      resource_type: resourceType,
      action: 'access_failure',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

/**
 * Enhanced permission checking
 */
export async function checkPermissions(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    // Validate inputs
    if (!isValidUUID(userId)) {
      await logSecurityEvent('permission_violation', {
        user_id: userId,
        resource,
        action,
        reason: 'invalid_user_id'
      });
      return false;
    }

    // Check rate limiting
    const rateLimitKey = `permission_check_${userId}`;
    if (checkRateLimit(rateLimitKey, 100, 60000)) { // 100 checks per minute
      await logSecurityEvent('rate_limit_exceeded', {
        user_id: userId,
        action: 'permission_check',
        resource
      });
      return false;
    }

    // Use Supabase RLS policies for permission checking
    const { data: hasPermission, error } = await supabase
      .rpc('check_user_permission', {
        p_user_id: userId,
        p_resource: resource,
        p_action: action
      });

    if (error) {
      throw error;
    }

    if (!hasPermission) {
      await logSecurityEvent('permission_violation', {
        user_id: userId,
        resource,
        action,
        reason: 'access_denied'
      });
    }

    return Boolean(hasPermission);
  } catch (error) {
    console.error('Permission check failed:', error);
    await logSecurityEvent('permission_violation', {
      user_id: userId,
      resource,
      action,
      reason: 'check_failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Log security events with validation
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  eventData: SecurityEventData
): Promise<void> {
  try {
    // Validate and sanitize input
    const validatedData = securityEventSchema.parse({
      event_type: eventType,
      event_data: sanitizeInput(eventData) as Record<string, unknown>,
      ip_address: await getClientIP(),
      user_agent: getClientUserAgent(),
      timestamp: new Date().toISOString(),
    });

    // Calculate risk score
    const riskScore = calculateRiskScore(eventType, eventData);

    // Use Supabase RPC to call the audit logging function
    const { error } = await supabase.rpc('log_security_audit_event', {
      event_type: eventType,
      event_data: validatedData.event_data,
      ip_address: validatedData.ip_address,
      user_agent: validatedData.user_agent,
      risk_score: riskScore
    });

    if (error) {
      console.error('Failed to log security event:', error);
    }

    // Update rate limiting counters
    const key = `${eventType}_${eventData.user_id || 'anonymous'}`;
    const existing = rateLimitStore.get(key);
    if (existing) {
      existing.count++;
    } else {
      rateLimitStore.set(key, { count: 1, timestamp: Date.now() });
    }

  } catch (error) {
    // Don't throw errors from logging to avoid breaking the main flow
    console.error('Security event logging failed:', error);
  }
}

/**
 * Audit database query for potential security issues
 */
export function auditDatabaseQuery(
  query: string,
  params: Record<string, unknown> = {}
): { isSecure: boolean; issues: string[] } {
  const issues: string[] = [];
  const lowercaseQuery = query.toLowerCase();

  // Check for SQL injection patterns
  const dangerousPatterns = [
    /union.*select/i,
    /drop.*table/i,
    /delete.*from.*where.*1.*=.*1/i,
    /insert.*into.*values/i,
    /update.*set.*where.*1.*=.*1/i,
    /'.*or.*'.*=.*'/i,
    /;.*--/i,
    /\/\*.*\*\//i
  ];

  dangerousPatterns.forEach(pattern => {
    if (pattern.test(query)) {
      issues.push(`Potential SQL injection pattern detected: ${pattern.source}`);
    }
  });

  // Check for missing WHERE clauses in dangerous operations
  if (/^(delete|update)/.test(lowercaseQuery) && !/where/.test(lowercaseQuery)) {
    issues.push('DELETE/UPDATE without WHERE clause detected');
  }

  // Check for unparameterized queries
  if (/'.*'/.test(query) && Object.keys(params).length === 0) {
    issues.push('Unparameterized query with string literals detected');
  }

  return {
    isSecure: issues.length === 0,
    issues
  };
}

/**
 * Content Security Policy violation handler
 */
export function handleCSPViolation(violationDetails: {
  documentURI: string;
  referrer: string;
  violatedDirective: string;
  effectiveDirective: string;
  originalPolicy: string;
  sourceFile: string;
  statusCode: number;
}): void {
  // Log CSP violation as security event
  logSecurityEvent('suspicious_activity', {
    action: 'csp_violation',
    details: 'Content Security Policy violation detected',
    metadata: {
      violated_directive: violatedDetails.violatedDirective,
      source_file: violatedDetails.sourceFile,
      document_uri: violatedDetails.documentURI,
      status_code: violatedDetails.statusCode
    }
  });

  // In production, you might want to send this to a monitoring service
  console.warn('CSP Violation:', violationDetails);
}

/**
 * Initialize security monitoring
 */
export function initializeSecurity(): void {
  // Set up CSP violation reporting
  if (typeof window !== 'undefined') {
    document.addEventListener('securitypolicyviolation', (e) => {
      handleCSPViolation({
        documentURI: e.documentURI,
        referrer: e.referrer,
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
        originalPolicy: e.originalPolicy,
        sourceFile: e.sourceFile,
        statusCode: e.statusCode
      });
    });
  }

  // Clean up old rate limiting entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.timestamp > 3600000) { // 1 hour old
        rateLimitStore.delete(key);
      }
    }
  }, 300000); // Clean up every 5 minutes

  if (import.meta.env.DEV) console.log('Security monitoring initialized');
}