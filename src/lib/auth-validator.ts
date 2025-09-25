/**
 * Authentication Validation Utilities
 * 
 * Provides robust session validation and token refresh mechanisms
 * to prevent database operation failures due to stale auth tokens.
 */

import { supabase } from '@/integrations/supabase/client';
import type { AppError, DatabaseError } from '@/types';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export interface AuthValidationResult {
  isValid: boolean;
  session: Session | null;
  error?: string;
  shouldReauthenticate?: boolean;
}

/**
 * Validates current session and refreshes token if necessary
 * 
 * This addresses the core authentication issue where frontend shows
 * user as authenticated but database operations fail due to expired tokens.
 */
export async function validateAndRefreshSession(): Promise<AuthValidationResult> {
  try {
    if (import.meta.env.DEV) console.log('[AuthValidator] Starting session validation...');
    
    // Step 1: Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      logger.auth('Session retrieval error', sessionError);
      return {
        isValid: false,
        session: null,
        error: `Session error: ${sessionError.message}`,
        shouldReauthenticate: true
      };
    }
    
    if (!session) {
      logger.auth('No session found');
      return {
        isValid: false,
        session: null,
        error: 'No active session',
        shouldReauthenticate: true
      };
    }
    
    // Step 2: Check token expiration (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minutes
    const expiresAt = session.expires_at;
    
    if (import.meta.env.DEV) console.log('[AuthValidator] Token validation:', {
      current_time: now,
      expires_at: expiresAt,
      expires_in_seconds: expiresAt ? (expiresAt - now) : 'unknown',
      needs_refresh: expiresAt ? (expiresAt - now) < bufferTime : true
    });
    
    if (!expiresAt || (expiresAt - now) < bufferTime) {
      if (import.meta.env.DEV) console.log('[AuthValidator] Token expired or expiring soon, refreshing...');
      
      // Step 3: Refresh token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        logger.auth('Token refresh failed', refreshError);
        return {
          isValid: false,
          session: null,
          error: `Token refresh failed: ${refreshError.message}`,
          shouldReauthenticate: true
        };
      }
      
      if (!refreshData.session) {
        logger.auth('Token refresh returned no session');
        return {
          isValid: false,
          session: null,
          error: 'Token refresh returned no session',
          shouldReauthenticate: true
        };
      }
      
      if (import.meta.env.DEV) console.log('[AuthValidator] Token refreshed successfully');
      return {
        isValid: true,
        session: refreshData.session,
        error: undefined
      };
    }
    
    // Step 4: Session is valid
    if (import.meta.env.DEV) console.log('[AuthValidator] Session is valid');
    return {
      isValid: true,
      session,
      error: undefined
    };
    
  } catch (error) {
    console.error('[AuthValidator] Validation exception:', error);
    return {
      isValid: false,
      session: null,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      shouldReauthenticate: true
    };
  }
}

/**
 * Validates session before database operations
 * 
 * Use this before any Supabase database operation to ensure
 * valid authentication and prevent JWT-related errors.
 */
export async function validateForDatabaseOperation(expectedUserId?: string): Promise<AuthValidationResult> {
  const result = await validateAndRefreshSession();
  
  if (!result.isValid || !result.session) {
    return result;
  }
  
  // Additional validation for specific user operations
  if (expectedUserId && result.session.user.id !== expectedUserId) {
    console.error('[AuthValidator] User ID mismatch:', {
      expected: expectedUserId,
      actual: result.session.user.id
    });
    
    return {
      isValid: false,
      session: null,
      error: 'User ID mismatch - possible session corruption',
      shouldReauthenticate: true
    };
  }
  
  return result;
}

/**
 * Enhanced error handler for database operations
 * 
 * Detects auth-related errors and provides actionable error messages.
 */
export function handleDatabaseError(error: unknown): {
  isAuthError: boolean;
  userMessage: string;
  shouldReauthenticate: boolean;
} {
  const appError = error as DatabaseError;
  console.error('[AuthValidator] Database error analysis:', error);
  
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code;
  
  // Detect authentication-related errors
  const authErrorIndicators = [
    'JWT',
    'PGRST301',
    'authentication',
    'unauthorized',
    'token',
    'session'
  ];
  
  const isAuthError = authErrorIndicators.some(indicator => 
    errorMessage.toLowerCase().includes(indicator.toLowerCase()) ||
    errorCode === 'PGRST301'
  );
  
  if (isAuthError) {
    return {
      isAuthError: true,
      userMessage: 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.',
      shouldReauthenticate: true
    };
  }
  
  // Handle other common errors
  if (errorMessage.includes('permission')) {
    return {
      isAuthError: false,
      userMessage: 'No tienes permisos para realizar esta operación.',
      shouldReauthenticate: false
    };
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      isAuthError: false,
      userMessage: 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
      shouldReauthenticate: false
    };
  }
  
  return {
    isAuthError: false,
    userMessage: `Error del sistema: ${errorMessage}`,
    shouldReauthenticate: false
  };
}

/**
 * Wrapper for database operations with automatic auth validation
 * 
 * Usage: const result = await withAuthValidation(() => supabase.from('table').insert(data));
 */
export async function withAuthValidation<T>(
  operation: (validSession: Session) => Promise<T>,
  expectedUserId?: string
): Promise<T> {
  const validation = await validateForDatabaseOperation(expectedUserId);
  
  if (!validation.isValid || !validation.session) {
    throw new Error(validation.error || 'Authentication validation failed');
  }
  
  try {
    return await operation(validation.session);
  } catch (error) {
    const errorInfo = handleDatabaseError(error);
    if (errorInfo.isAuthError) {
      // Re-throw with enhanced auth error
      throw new Error(errorInfo.userMessage);
    }
    // Re-throw original error for non-auth issues
    throw error;
  }
}