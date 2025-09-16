import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { ContentLoading } from '@/components/ui/loading';
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

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

interface ProtectedRouteProps extends RouteProtectionConfig {
  children: React.ReactNode;
}

/**
 * Enhanced ProtectedRoute component with comprehensive authentication and authorization
 * Supports role-based access control, permission-based access, and client portal access
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles,
  requiredPermissions,
  allowClientPortal = false,
  redirectOnFail = '/login',
  customValidation
}) => {
  const { session, isLoading } = useSession();

  // Show loading state while session is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <ContentLoading lines={3} showHeader />
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !session) {
    return <Navigate to={redirectOnFail} replace />;
  }

  // If no authentication required and user is authenticated, proceed
  if (!requireAuth) {
    return <>{children}</>;
  }

  // At this point we have an authenticated user
  const user = session!.user;

  // Check client portal access
  if (!allowClientPortal && isClientPortalUser(user)) {
    return (
      <Navigate 
        to="/client-portal/dashboard" 
        replace 
        state={{ reason: 'client_portal_user' }}
      />
    );
  }

  // Check allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some(role => hasRole(user, role));
    if (!hasRequiredRole) {
      return (
        <Navigate 
          to="/dashboard" 
          replace 
          state={{ 
            reason: 'insufficient_role',
            requiredRoles: allowedRoles,
            userRole: user.role 
          }}
        />
      );
    }
  }

  // Check required permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermissions = hasAllPermissions(user, requiredPermissions);
    if (!hasRequiredPermissions) {
      return (
        <Navigate 
          to="/dashboard" 
          replace 
          state={{ 
            reason: 'missing_permissions',
            requiredPermissions,
            userRole: user.role 
          }}
        />
      );
    }
  }

  // Run custom validation if provided
  if (customValidation) {
    try {
      const isValid = customValidation(user);
      if (isValid instanceof Promise) {
        // Handle async validation in a separate component
        return (
          <AsyncValidationWrapper 
            validation={isValid}
            onFail={() => <Navigate to={redirectOnFail} replace />}
          >
            {children}
          </AsyncValidationWrapper>
        );
      } else if (!isValid) {
        return <Navigate to={redirectOnFail} replace />;
      }
    } catch (error) {
      console.error('Custom validation error:', error);
      return <Navigate to={redirectOnFail} replace />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Simple authentication requirement wrapper
 */
export const RequireAuth: React.FC<RequireAuthProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => (
  <ProtectedRoute requireAuth={true} redirectOnFail={redirectTo}>
    {children}
  </ProtectedRoute>
);

interface RequireRoleProps {
  children: React.ReactNode;
  roles: UserRole | UserRole[];
  redirectTo?: string;
}

/**
 * Role-based access control wrapper
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ 
  children, 
  roles, 
  redirectTo = '/dashboard' 
}) => (
  <ProtectedRoute 
    requireAuth={true}
    allowedRoles={Array.isArray(roles) ? roles : [roles]}
    redirectOnFail={redirectTo}
  >
    {children}
  </ProtectedRoute>
);

interface RequirePermissionProps {
  children: React.ReactNode;
  permissions: Permission | Permission[];
  requireAll?: boolean;
  redirectTo?: string;
}

/**
 * Permission-based access control wrapper
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  children, 
  permissions, 
  requireAll = true,
  redirectTo = '/dashboard' 
}) => {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  return (
    <ProtectedRoute 
      requireAuth={true}
      requiredPermissions={requireAll ? permissionArray : undefined}
      customValidation={requireAll ? undefined : (user) => hasAnyPermission(user, permissionArray)}
      redirectOnFail={redirectTo}
    >
      {children}
    </ProtectedRoute>
  );
};

interface ClientPortalRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Client portal specific route protection
 */
export const ClientPortalRoute: React.FC<ClientPortalRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => (
  <ProtectedRoute 
    requireAuth={true}
    allowClientPortal={true}
    customValidation={(user) => isClientPortalUser(user)}
    redirectOnFail={redirectTo}
  >
    {children}
  </ProtectedRoute>
);

// ============================================================================
// ASYNC VALIDATION WRAPPER
// ============================================================================

interface AsyncValidationWrapperProps {
  validation: Promise<boolean>;
  onFail: () => React.ReactElement;
  children: React.ReactNode;
}

const AsyncValidationWrapper: React.FC<AsyncValidationWrapperProps> = ({ 
  validation, 
  onFail, 
  children 
}) => {
  const [isValid, setIsValid] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    validation
      .then(setIsValid)
      .catch((error) => {
        console.error('Async validation error:', error);
        setIsValid(false);
      });
  }, [validation]);

  if (isValid === null) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <ContentLoading lines={3} showHeader />
      </div>
    );
  }

  if (!isValid) {
    return onFail();
  }

  return <>{children}</>;
};

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

interface AccessDeniedProps {
  reason?: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  userRole?: UserRole;
  onRetry?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  reason,
  requiredRoles,
  requiredPermissions,
  userRole,
  onRetry
}) => {
  const getReasonMessage = () => {
    switch (reason) {
      case 'insufficient_role':
        return `Tu rol (${userRole}) no tiene suficientes permisos. Se requiere: ${requiredRoles?.join(', ')}`;
      case 'missing_permissions':
        return `Faltan permisos requeridos: ${requiredPermissions?.join(', ')}`;
      case 'client_portal_user':
        return 'Los usuarios del portal de clientes deben acceder a través del portal específico.';
      default:
        return 'No tienes permisos para acceder a esta página.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg 
              className="h-6 w-6 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Acceso Denegado
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">
          {getReasonMessage()}
        </p>
        
        <div className="flex flex-col space-y-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          )}
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;