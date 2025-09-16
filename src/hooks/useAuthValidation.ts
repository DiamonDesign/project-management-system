/**
 * Authentication Validation Hooks
 * 
 * React hooks for type-safe authentication operations,
 * session validation, and permission checking.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuthValidationResult,
  AuthenticatedUser,
  AuthenticatedSession,
  RouteProtection,
  RouteAccessResult,
  UserPermission,
  UserRole,
  ClientPortalAccess,
  AuthValidationError
} from '@/types/auth';
import {
  validateSession,
  validateForDatabaseOperation,
  checkRouteAccess,
  checkRouteAccessAsync,
  getClientPortalAccess,
  hasProjectAccess,
  getUserDisplayName,
  getUserInitials,
  withAuthValidation
} from '@/lib/auth-utils';
import { showError, showSuccess } from '@/utils/toast';

// ================================
// SESSION VALIDATION HOOKS
// ================================

/**
 * Hook for session validation with automatic refresh
 */
export function useSessionValidation() {
  const [validationResult, setValidationResult] = useState<AuthValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const validate = useCallback(async () => {
    setIsValidating(true);
    try {
      const result = await validateSession();
      setValidationResult(result);
      setLastValidated(new Date());
      
      if (!result.isValid && result.shouldReauthenticate) {
        console.warn('[useSessionValidation] Session invalid, user should reauthenticate');
      }
      
      return result;
    } catch (error) {
      console.error('[useSessionValidation] Validation error:', error);
      setValidationResult({
        isValid: false,
        session: null,
        user: null,
        validation: {
          isValid: false,
          isExpired: true,
          wasRefreshed: false,
          validatedAt: new Date(),
          errors: []
        },
        shouldReauthenticate: true
      });
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  // Auto-validate on mount and set up periodic validation
  useEffect(() => {
    validate();
    
    // Set up periodic validation (every 5 minutes)
    intervalRef.current = setInterval(validate, 5 * 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [validate]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return {
    validationResult,
    isValidating,
    lastValidated,
    validate,
    isValid: validationResult?.isValid || false,
    user: validationResult?.user || null,
    session: validationResult?.session || null,
    shouldReauthenticate: validationResult?.shouldReauthenticate || false
  };
}

/**
 * Hook for database operation validation
 */
export function useDatabaseValidation() {
  const [isValidating, setIsValidating] = useState(false);
  
  const validateForOperation = useCallback(async (expectedUserId?: string) => {
    setIsValidating(true);
    try {
      const result = await validateForDatabaseOperation(expectedUserId);
      
      if (!result.isValid) {
        showError(result.error?.message || 'Error de validación de sesión');
      }
      
      return result;
    } finally {
      setIsValidating(false);
    }
  }, []);
  
  const executeWithValidation = useCallback(async <T>(
    operation: (session: AuthenticatedSession) => Promise<T>,
    expectedUserId?: string
  ): Promise<T> => {
    return withAuthValidation(operation, expectedUserId);
  }, []);
  
  return {
    isValidating,
    validateForOperation,
    executeWithValidation
  };
}

// ================================
// PERMISSION HOOKS
// ================================

/**
 * Hook for checking user permissions
 */
export function usePermissions(user: AuthenticatedUser | null) {
  const checkPermission = useCallback((permission: UserPermission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);
  
  const checkAnyPermission = useCallback((permissions: UserPermission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }, [user]);
  
  const checkAllPermissions = useCallback((permissions: UserPermission[]): boolean => {
    if (!user) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  }, [user]);
  
  const checkRole = useCallback((role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  }, [user]);
  
  const checkAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);
  
  return {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkRole,
    checkAnyRole,
    hasPermissions: user?.permissions || [],
    userRole: user?.role || null
  };
}

// ================================
// ROUTE PROTECTION HOOKS
// ================================

/**
 * Hook for route protection with automatic redirection
 */
export function useRouteProtection(protection: RouteProtection) {
  const navigate = useNavigate();
  const { user } = useSessionValidation();
  const [accessResult, setAccessResult] = useState<RouteAccessResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  const checkAccess = useCallback(async () => {
    setIsChecking(true);
    try {
      let result: RouteAccessResult;
      
      if (protection.customValidator) {
        result = await checkRouteAccessAsync(protection, user);
      } else {
        result = checkRouteAccess(protection, user);
      }
      
      setAccessResult(result);
      
      // Handle redirection for unauthorized access
      if (!result.hasAccess) {
        if (result.redirectTo) {
          navigate(result.redirectTo);
        } else {
          // Default redirects based on denial reason
          switch (result.denialReason) {
            case 'not_authenticated':
              navigate('/login');
              break;
            case 'email_not_verified':
              navigate('/verify-email');
              break;
            case 'phone_not_verified':
              navigate('/verify-phone');
              break;
            default:
              navigate('/unauthorized');
          }
        }
        
        // Show appropriate message
        const messages = {
          not_authenticated: 'Debes iniciar sesión para acceder a esta página',
          insufficient_role: 'No tienes permisos suficientes para acceder a esta página',
          missing_permissions: 'No tienes los permisos necesarios para acceder a esta página',
          email_not_verified: 'Debes verificar tu email para acceder a esta página',
          phone_not_verified: 'Debes verificar tu teléfono para acceder a esta página',
          account_inactive: 'Tu cuenta está inactiva. Contacta al administrador',
          custom_validation_failed: 'No cumples los requisitos para acceder a esta página'
        };
        
        if (result.denialReason) {
          showError(messages[result.denialReason]);
        }
      }
      
      return result;
    } finally {
      setIsChecking(false);
    }
  }, [protection, user, navigate]);
  
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);
  
  return {
    hasAccess: accessResult?.hasAccess || false,
    accessResult,
    isChecking,
    checkAccess
  };
}

/**
 * Hook for conditional route protection
 */
export function useConditionalRouteProtection() {
  const navigate = useNavigate();
  
  const protectRoute = useCallback(async (
    protection: RouteProtection,
    user: AuthenticatedUser | null,
    onUnauthorized?: (result: RouteAccessResult) => void
  ) => {
    const result = protection.customValidator
      ? await checkRouteAccessAsync(protection, user)
      : checkRouteAccess(protection, user);
    
    if (!result.hasAccess) {
      onUnauthorized?.(result);
      
      if (result.redirectTo) {
        navigate(result.redirectTo);
      }
      
      return false;
    }
    
    return true;
  }, [navigate]);
  
  return { protectRoute };
}

// ================================
// CLIENT PORTAL HOOKS
// ================================

/**
 * Hook for client portal access management
 */
export function useClientPortalAccess(clientId?: string) {
  const [portalAccess, setPortalAccess] = useState<ClientPortalAccess | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthValidationError | null>(null);
  
  const fetchAccess = useCallback(async (id?: string) => {
    const targetClientId = id || clientId;
    if (!targetClientId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const access = await getClientPortalAccess(targetClientId);
      setPortalAccess(access);
    } catch (err) {
      const error = err instanceof Error 
        ? err 
        : new Error('Failed to fetch client portal access');
      console.error('[useClientPortalAccess] Error:', error);
      setError({
        code: 'UNKNOWN_ERROR',
        message: error.message,
        category: 'system',
        isRecoverable: true,
        recoveryActions: ['retry'],
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);
  
  const checkProjectAccess = useCallback((
    projectId: string,
    requiredLevel: 'none' | 'tasks' | 'progress' | 'reports' | 'full' = 'tasks'
  ) => {
    if (!portalAccess) return false;
    return hasProjectAccess(portalAccess, projectId, requiredLevel);
  }, [portalAccess]);
  
  useEffect(() => {
    if (clientId) {
      fetchAccess();
    }
  }, [fetchAccess, clientId]);
  
  return {
    portalAccess,
    isLoading,
    error,
    fetchAccess,
    checkProjectAccess,
    hasAccess: Boolean(portalAccess?.isActive),
    isExpired: portalAccess?.expiresAt ? portalAccess.expiresAt < new Date() : false
  };
}

// ================================
// USER PROFILE HOOKS
// ================================

/**
 * Hook for user profile information and display utilities
 */
export function useUserProfile(user: AuthenticatedUser | null) {
  const displayName = user ? getUserDisplayName(user) : '';
  const initials = user ? getUserInitials(user) : '';
  
  const profile = user?.profile;
  const isProfileComplete = Boolean(
    profile?.first_name && 
    profile?.last_name && 
    user?.email_confirmed_at
  );
  
  const getAvatarUrl = useCallback(() => {
    return profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  }, [profile?.avatar_url, displayName]);
  
  return {
    profile,
    displayName,
    initials,
    isProfileComplete,
    getAvatarUrl,
    role: user?.role,
    status: user?.status,
    permissions: user?.permissions || [],
    lastSignIn: user?.last_sign_in_at,
    emailVerified: Boolean(user?.email_confirmed_at),
    phoneVerified: Boolean(user?.phone_confirmed_at)
  };
}

// ================================
// ERROR HANDLING HOOKS
// ================================

/**
 * Hook for handling authentication errors
 */
export function useAuthErrorHandler() {
  const navigate = useNavigate();
  
  const handleAuthError = useCallback((error: AuthValidationError) => {
    console.error('[useAuthErrorHandler] Auth error:', error);
    
    // Show user-friendly message
    showError(error.message);
    
    // Handle specific error types
    switch (error.code) {
      case 'SESSION_EXPIRED':
      case 'SESSION_INVALID':
      case 'TOKEN_EXPIRED':
        navigate('/login');
        break;
        
      case 'EMAIL_NOT_VERIFIED':
        navigate('/verify-email');
        break;
        
      case 'PHONE_NOT_VERIFIED':
        navigate('/verify-phone');
        break;
        
      case 'ACCOUNT_INACTIVE':
      case 'ACCOUNT_LOCKED':
        navigate('/account-status');
        break;
        
      case 'INSUFFICIENT_PERMISSIONS':
      case 'ROLE_NOT_AUTHORIZED':
        navigate('/unauthorized');
        break;
        
      default:
        if (error.recoveryActions.includes('login_again')) {
          navigate('/login');
        }
    }
  }, [navigate]);
  
  const handleRecoveryAction = useCallback((error: AuthValidationError, action: string) => {
    switch (action) {
      case 'retry':
        window.location.reload();
        break;
        
      case 'refresh_page':
        window.location.reload();
        break;
        
      case 'clear_session':
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
        break;
        
      case 'login_again':
        navigate('/login');
        break;
        
      case 'verify_email':
        navigate('/verify-email');
        break;
        
      case 'verify_phone':
        navigate('/verify-phone');
        break;
        
      case 'contact_support':
        // Could open support modal or navigate to support page
        showError('Por favor contacta al soporte técnico para resolver este problema');
        break;
        
      case 'wait_and_retry':
        showError('Servicio temporalmente no disponible. Intenta de nuevo en unos minutos');
        break;
        
      default:
        console.warn('[useAuthErrorHandler] Unknown recovery action:', action);
    }
  }, [navigate]);
  
  return {
    handleAuthError,
    handleRecoveryAction
  };
}