/**
 * Authentication Utility Functions
 * 
 * Type-safe utility functions for authentication operations,
 * session validation, and permission checking.
 */

import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AppError, DatabaseError } from '@/types';
import {
  AuthUser,
  AuthSession,
  SessionValidationResult,
  UserRole,
  Permission,
  AuthError,
  AuthErrorCode,
  hasRole,
  hasPermission,
  hasAllPermissions,
  isClientPortalUser,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS
} from '@/types/auth';

// ================================
// SESSION VALIDATION FUNCTIONS
// ================================

/**
 * Enhanced session validation with detailed error handling
 */
export async function validateSession(): Promise<SessionValidationResult & { 
  session: AuthSession | null;
  user: AuthUser | null;
}> {
  try {
    if (import.meta.env.DEV) console.log('[AuthUtils] Starting session validation...');
    
    // Get current session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[AuthUtils] Session retrieval error:', sessionError);
      return {
        isValid: false,
        needsRefresh: false,
        errors: ['Session retrieval failed'],
        session: null,
        user: null
      };
    }
    
    if (!session || !session.user) {
      console.warn('[AuthUtils] No active session found');
      return {
        isValid: false,
        needsRefresh: false,
        errors: ['No active session'],
        session: null,
        user: null
      };
    }
    
    // Validate token expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const bufferTime = 5 * 60; // 5 minutes buffer
    const timeRemaining = expiresAt - now;
    const isExpired = timeRemaining <= 0;
    const isExpiringSoon = timeRemaining < bufferTime;
    
    if (import.meta.env.DEV) console.log('[AuthUtils] Token validation:', {
      current_time: now,
      expires_at: expiresAt,
      time_remaining: timeRemaining,
      is_expired: isExpired,
      is_expiring_soon: isExpiringSoon
    });
    
    let finalSession = session;
    let wasRefreshed = false;
    
    // Refresh token if expired or expiring soon
    if (isExpired || isExpiringSoon) {
      if (import.meta.env.DEV) console.log('[AuthUtils] Token needs refresh, attempting...');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('[AuthUtils] Token refresh failed:', refreshError);
        return {
          isValid: false,
          needsRefresh: true,
          errors: ['Token refresh failed'],
          session: null,
          user: null
        };
      }
      
      finalSession = refreshData.session;
      wasRefreshed = true;
      if (import.meta.env.DEV) console.log('[AuthUtils] Token refreshed successfully');
    }
    
    // Enhance user with role and permissions
    const authenticatedUser = await enhanceUser(finalSession.user);
    if (!authenticatedUser) {
      return {
        isValid: false,
        needsRefresh: false,
        errors: ['Failed to enhance user data'],
        session: null,
        user: null
      };
    }
    
    // Create enhanced session
    const authenticatedSession: AuthSession = {
      user: authenticatedUser,
      access_token: finalSession.access_token,
      refresh_token: finalSession.refresh_token,
      expires_at: finalSession.expires_at,
      token_type: 'bearer'
    };
    
    return {
      isValid: true,
      needsRefresh: false,
      expiresInMinutes: Math.floor(timeRemaining / 60),
      session: authenticatedSession,
      user: authenticatedUser
    };
    
  } catch (error) {
    console.error('[AuthUtils] Validation exception:', error);
    return {
      isValid: false,
      needsRefresh: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      session: null,
      user: null
    };
  }
}

/**
 * Validate session for database operations with user ID verification
 */
export async function validateForDatabaseOperation(expectedUserId?: string) {
  const result = await validateSession();
  
  if (!result.isValid || !result.session || !result.user) {
    return result;
  }
  
  // Additional validation for specific user operations
  if (expectedUserId && result.user.id !== expectedUserId) {
    console.error('[AuthUtils] User ID mismatch:', {
      expected: expectedUserId,
      actual: result.user.id
    });
    
    return {
      ...result,
      isValid: false,
      errors: ['User ID mismatch - possible session corruption']
    };
  }
  
  return result;
}

// ================================
// USER ENHANCEMENT FUNCTIONS
// ================================

/**
 * Enhance basic user with role and permissions
 */
async function enhanceUser(user: User): Promise<AuthUser | null> {
  try {
    // Fetch user profile and role from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.warn('[AuthUtils] Profile fetch error:', profileError);
    }
    
    // Default role for new users or fallback
    const userRole: UserRole = profile?.role || 'freelancer';
    
    const enhancedUser: AuthUser = {
      id: user.id,
      email: user.email || '',
      role: userRole,
      profile: profile ? {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        company: profile.company,
        bio: profile.bio,
        website: profile.website,
        location: profile.location,
        phone: profile.phone,
        timezone: profile.timezone,
      } : undefined,
      metadata: {
        created_at: user.created_at,
        last_login: profile?.last_login,
        login_count: profile?.login_count,
        email_verified: !!user.email_confirmed_at,
        two_factor_enabled: false // TODO: implement 2FA
      },
      client_portal_access: profile?.client_portal_access ? {
        is_client: profile.client_portal_access.is_client,
        assigned_projects: profile.client_portal_access.assigned_projects || [],
        invite_token: profile.client_portal_access.invite_token,
        invited_by: profile.client_portal_access.invited_by,
        invited_at: profile.client_portal_access.invited_at
      } : undefined
    };
    
    return enhancedUser;
  } catch (error) {
    console.error('[AuthUtils] User enhancement failed:', error);
    return null;
  }
}

// ================================
// ERROR HANDLING FUNCTIONS
// ================================

/**
 * Create authentication error
 */
export function createAuthError(
  code: AuthErrorCode,
  message: string,
  details?: Record<string, unknown>,
  correlationId?: string
): AuthError {
  return {
    code,
    message,
    details,
    recoveryActions: getRecoveryActions(code),
    timestamp: new Date().toISOString(),
    correlation_id: correlationId
  };
}

/**
 * Get recovery actions for error codes
 */
function getRecoveryActions(code: AuthErrorCode) {
  switch (code) {
    case 'SESSION_EXPIRED':
      return [
        { label: 'Iniciar sesión', action: 'redirect' as const, url: '/login' },
        { label: 'Refrescar página', action: 'refresh' as const }
      ];
    case 'INSUFFICIENT_PERMISSIONS':
      return [
        { label: 'Contactar administrador', action: 'contact_support' as const },
        { label: 'Volver', action: 'redirect' as const, url: '/dashboard' }
      ];
    case 'NETWORK_ERROR':
      return [
        { label: 'Reintentar', action: 'retry' as const },
        { label: 'Refrescar página', action: 'refresh' as const }
      ];
    default:
      return [
        { label: 'Volver al inicio', action: 'redirect' as const, url: '/' },
        { label: 'Contactar soporte', action: 'contact_support' as const }
      ];
  }
}

/**
 * Handle database errors with authentication context
 */
export function handleDatabaseError(error: unknown): {
  isAuthError: boolean;
  userMessage: string;
  shouldReauthenticate: boolean;
  errorCode: AuthErrorCode;
} {
  const appError = error as DatabaseError;
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code;
  
  // Detect authentication-related errors
  const authErrorIndicators = [
    'JWT', 'PGRST301', 'authentication', 'unauthorized', 'token', 'session'
  ];
  
  const isAuthError = authErrorIndicators.some(indicator => 
    errorMessage.toLowerCase().includes(indicator.toLowerCase()) ||
    errorCode === 'PGRST301'
  );
  
  if (isAuthError) {
    return {
      isAuthError: true,
      userMessage: 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.',
      shouldReauthenticate: true,
      errorCode: 'SESSION_EXPIRED'
    };
  }
  
  // Handle permission errors
  if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
    return {
      isAuthError: false,
      userMessage: 'No tienes permisos para realizar esta operación.',
      shouldReauthenticate: false,
      errorCode: 'INSUFFICIENT_PERMISSIONS'
    };
  }
  
  // Handle network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      isAuthError: false,
      userMessage: 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
      shouldReauthenticate: false,
      errorCode: 'NETWORK_ERROR'
    };
  }
  
  return {
    isAuthError: false,
    userMessage: `Error del sistema: ${errorMessage}`,
    shouldReauthenticate: false,
    errorCode: 'UNKNOWN_ERROR'
  };
}

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Get user display name
 */
export function getUserDisplayName(user: AuthUser): string {
  if (user.profile?.full_name) {
    return user.profile.full_name;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Usuario';
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user: AuthUser): string {
  const name = user.profile?.full_name;
  
  if (name) {
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    } else if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }
  
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return 'U';
}

/**
 * Check if user can access project
 */
export function canAccessProject(user: AuthUser, projectId: string): boolean {
  // Freelancers and higher roles can access all projects
  if (hasRole(user, 'freelancer')) {
    return true;
  }
  
  // Client portal users can only access assigned projects
  if (isClientPortalUser(user)) {
    return user.client_portal_access?.assigned_projects?.includes(projectId) === true;
  }
  
  return false;
}

/**
 * Get user avatar URL or generate initials
 */
export function getUserAvatar(user: AuthUser): { type: 'url' | 'initials'; value: string } {
  if (user.profile?.avatar_url) {
    return { type: 'url', value: user.profile.avatar_url };
  }
  
  return { type: 'initials', value: getUserInitials(user) };
}