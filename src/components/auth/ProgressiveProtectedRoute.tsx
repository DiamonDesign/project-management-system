import React from 'react';
import { Navigate } from 'react-router-dom';
import { useEnhancedSession } from '@/context/EnhancedSessionContext';
import { useLoading } from '@/context/LoadingContext';
import { SmartLoadingScreen, ComponentLoadingWrapper } from '@/components/ui/progressive-loading';
import type {
  UserRole,
  Permission,
  AuthUser,
  RouteProtectionConfig
} from '@/types/auth';
import {
  hasRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isClientPortalUser
} from '@/types/auth';

// Enhanced route protection with progressive loading support
interface ProgressiveProtectedRouteProps extends RouteProtectionConfig {
  children: React.ReactNode;
  allowDegraded?: boolean;        // Allow access in degraded mode
  gracefulFallback?: React.ReactNode; // Fallback content for degraded mode
  blockingOnError?: boolean;      // Block access on authentication errors
}

/**
 * Enhanced ProtectedRoute with progressive loading support
 * Provides graceful degradation and user-controlled recovery
 */
export const ProgressiveProtectedRoute: React.FC<ProgressiveProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles,
  requiredPermissions,
  allowClientPortal = false,
  redirectOnFail = '/login',
  customValidation,
  allowDegraded = false,
  gracefulFallback,
  blockingOnError = false
}) => {
  const {
    session,
    user,
    authPhase,
    canContinueWithBasicAuth,
    profileEnhancementFailed,
    retryProfileEnhancement,
    continueWithBasicAuth
  } = useEnhancedSession();

  const { shouldBlock, hasError, isDegraded } = useLoading();

  // Handle authentication phases with progressive loading
  if (requireAuth) {
    switch (authPhase) {
      case 'authenticating':
        if (shouldBlock) {
          return <SmartLoadingScreen title="Verificando autenticación" />;
        }
        // Progressive: continue with loading fallback
        break;

      case 'enhancing':
        if (shouldBlock) {
          return <SmartLoadingScreen title="Cargando perfil" showProgress />;
        }
        // Progressive: continue with basic functionality
        break;

      case 'error':
        if (blockingOnError || shouldBlock) {
          return (
            <SmartLoadingScreen
              title="Error de autenticación"
              description="Se produjo un error al verificar tu sesión"
            />
          );
        }
        // Progressive: redirect on error
        return <Navigate to={redirectOnFail} replace />;

      case 'idle':
        // No session available
        return <Navigate to={redirectOnFail} replace />;
    }

    // Check if we have sufficient authentication
    if (!session && !canContinueWithBasicAuth) {
      return <Navigate to={redirectOnFail} replace />;
    }
  }

  // Progressive authentication validation
  const currentUser = user;
  const isAuthenticated = !!currentUser;
  const isEnhanced = authPhase === 'ready';
  const canUseDegraded = allowDegraded && (authPhase === 'degraded' || isDegraded);

  // Require authentication but none available
  if (requireAuth && !isAuthenticated && !canUseDegraded) {
    return <Navigate to={redirectOnFail} replace />;
  }

  // Role-based validation (only for enhanced users or allow degraded)
  if (allowedRoles && currentUser && (isEnhanced || canUseDegraded)) {
    const hasValidRole = allowedRoles.some(role => hasRole(currentUser, role));
    if (!hasValidRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Permission-based validation (only for enhanced users)
  if (requiredPermissions && currentUser && isEnhanced) {
    let hasValidPermissions = false;

    if (requiredPermissions.any) {
      hasValidPermissions = hasAnyPermission(currentUser, requiredPermissions.any);
    } else if (requiredPermissions.all) {
      hasValidPermissions = hasAllPermissions(currentUser, requiredPermissions.all);
    } else if (requiredPermissions.single) {
      hasValidPermissions = hasPermission(currentUser, requiredPermissions.single);
    }

    if (!hasValidPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Client portal validation
  if (!allowClientPortal && currentUser && isClientPortalUser(currentUser)) {
    return <Navigate to="/client-portal/dashboard" replace />;
  }

  // Custom validation
  if (customValidation && currentUser) {
    const validationResult = customValidation(currentUser);
    if (!validationResult.isValid) {
      return <Navigate to={validationResult.redirectTo || redirectOnFail} replace />;
    }
  }

  // Render content with progressive enhancement
  if (canUseDegraded && gracefulFallback) {
    return (
      <>
        {profileEnhancementFailed && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-center">
            <p className="text-amber-800 text-sm">
              ⚠️ Algunas funciones pueden estar limitadas
              <button
                onClick={retryProfileEnhancement}
                className="ml-3 px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700"
              >
                Intentar cargar completo
              </button>
            </p>
          </div>
        )}
        <ComponentLoadingWrapper
          componentName="session"
          fallback={gracefulFallback}
        >
          {children}
        </ComponentLoadingWrapper>
      </>
    );
  }

  return <>{children}</>;
};

// Convenience components for common use cases
export const RequireAuth: React.FC<{
  children: React.ReactNode;
  allowDegraded?: boolean;
  gracefulFallback?: React.ReactNode;
}> = ({ children, allowDegraded = false, gracefulFallback }) => (
  <ProgressiveProtectedRoute
    requireAuth
    allowDegraded={allowDegraded}
    gracefulFallback={gracefulFallback}
  >
    {children}
  </ProgressiveProtectedRoute>
);

export const RequireRole: React.FC<{
  children: React.ReactNode;
  roles: UserRole[];
  allowDegraded?: boolean;
}> = ({ children, roles, allowDegraded = false }) => (
  <ProgressiveProtectedRoute
    requireAuth
    allowedRoles={roles}
    allowDegraded={allowDegraded}
  >
    {children}
  </ProgressiveProtectedRoute>
);

export const RequirePermission: React.FC<{
  children: React.ReactNode;
  permission: Permission;
  allowDegraded?: boolean;
}> = ({ children, permission, allowDegraded = false }) => (
  <ProgressiveProtectedRoute
    requireAuth
    requiredPermissions={{ single: permission }}
    allowDegraded={allowDegraded}
  >
    {children}
  </ProgressiveProtectedRoute>
);

export const ClientPortalRoute: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user, authPhase } = useEnhancedSession();

  // Allow client portal access
  if (user && isClientPortalUser(user)) {
    return <>{children}</>;
  }

  // If user is not a client, redirect to main dashboard
  if (user && authPhase === 'ready') {
    return <Navigate to="/dashboard" replace />;
  }

  // Still loading or no user
  return <Navigate to="/login" replace />;
};

// Progressive loading wrapper for gradual feature reveal
export const ProgressiveFeature: React.FC<{
  children: React.ReactNode;
  componentName: keyof import('@/types/loading').LoadingState['components'];
  fallback?: React.ReactNode;
  requiresEnhancedAuth?: boolean;
}> = ({ children, componentName, fallback, requiresEnhancedAuth = false }) => {
  const { authPhase } = useEnhancedSession();

  // If requires enhanced auth but we're in degraded mode, show fallback
  if (requiresEnhancedAuth && authPhase === 'degraded') {
    return (
      <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
        <p className="text-amber-800 text-sm">
          Esta función requiere cargar tu perfil completo.
        </p>
      </div>
    );
  }

  return (
    <ComponentLoadingWrapper
      componentName={componentName}
      fallback={fallback}
    >
      {children}
    </ComponentLoadingWrapper>
  );
};