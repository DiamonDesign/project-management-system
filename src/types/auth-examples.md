# TypeScript Authentication System Usage Guide

This guide demonstrates how to use the new type-safe authentication system for secure route protection, user management, and permission handling.

## Table of Contents
1. [Basic Authentication](#basic-authentication)
2. [Route Protection](#route-protection)
3. [Permission Checking](#permission-checking)
4. [Session Validation](#session-validation)
5. [Error Handling](#error-handling)
6. [Client Portal Access](#client-portal-access)

## Basic Authentication

### Using the Enhanced SessionContext

```tsx
import { useSession, useAuth, usePermissions } from '@/context/SessionContext';

// Basic authentication
function LoginComponent() {
  const { signIn, isLoading } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      // Automatically redirected to dashboard on success
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* Form fields */}
    </form>
  );
}

// Full session information
function UserProfileComponent() {
  const { 
    user, 
    profile, 
    displayName, 
    initials, 
    isProfileComplete,
    updateProfile 
  } = useSession();
  
  if (!user) return <div>Please log in</div>;
  
  return (
    <div>
      <h2>Welcome, {displayName}!</h2>
      <p>Role: {user.role}</p>
      <p>Status: {user.status}</p>
      <p>Permissions: {user.permissions.length}</p>
      
      {!isProfileComplete && (
        <div>Please complete your profile</div>
      )}
    </div>
  );
}
```

## Route Protection

### Using the ProtectedRoute Component

```tsx
import { ProtectedRoute, RequireAuth, RequireRole, RequirePermission } from '@/components/auth/ProtectedRoute';
import type { RouteProtection } from '@/types/auth';

// Basic authentication requirement
function ProtectedDashboard() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

// Role-based protection
function AdminPanel() {
  return (
    <RequireRole roles={['admin', 'super_admin']}>
      <AdminDashboard />
    </RequireRole>
  );
}

// Permission-based protection
function ProjectManagement() {
  return (
    <RequirePermission permissions={['projects:create', 'projects:update']}>
      <ProjectManager />
    </RequirePermission>
  );
}

// Advanced protection with custom validation
function AdvancedProtection() {
  const protection: RouteProtection = {
    requireAuth: true,
    allowedRoles: ['admin', 'project_manager'],
    requiredPermissions: ['projects:read'],
    requireEmailVerification: true,
    customValidator: async (user) => {
      // Custom business logic
      return user.status === 'active' && user.profile?.company;
    },
    unauthorizedRedirect: '/upgrade-account'
  };
  
  return (
    <ProtectedRoute protection={protection}>
      <PremiumFeatures />
    </ProtectedRoute>
  );
}
```

### Using Route Protection Hooks

```tsx
import { useRouteProtection } from '@/hooks/useAuthValidation';

function ConditionalContent() {
  const { hasAccess, isChecking } = useRouteProtection({
    requireAuth: true,
    allowedRoles: ['admin']
  });
  
  if (isChecking) return <div>Checking permissions...</div>;
  
  return hasAccess ? (
    <AdminContent />
  ) : (
    <div>Access denied</div>
  );
}
```

## Permission Checking

### Using Permission Hooks

```tsx
import { usePermissions } from '@/context/SessionContext';

function FeatureComponent() {
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();
  
  const canCreateProjects = hasPermission('projects:create');
  const canManageUsers = hasAnyPermission(['users:create', 'users:update']);
  const isAdmin = hasRole('admin');
  
  return (
    <div>
      {canCreateProjects && (
        <button>Create Project</button>
      )}
      
      {canManageUsers && (
        <button>Manage Users</button>
      )}
      
      {isAdmin && (
        <button>Admin Settings</button>
      )}
    </div>
  );
}
```

### Programmatic Permission Checking

```tsx
import { hasPermission, hasAnyRole, getUserRoleLevel } from '@/types/auth';

function checkUserAccess(user: AuthenticatedUser) {
  // Check specific permission
  if (hasPermission(user, 'projects:delete')) {
    console.log('User can delete projects');
  }
  
  // Check role level
  const userLevel = getUserRoleLevel(user);
  const requiredLevel = 60; // project_manager level
  
  if (userLevel >= requiredLevel) {
    console.log('User has sufficient role level');
  }
  
  // Check multiple roles
  if (hasAnyRole(user, ['admin', 'super_admin'])) {
    console.log('User is an administrator');
  }
}
```

## Session Validation

### Using Session Validation Hooks

```tsx
import { useSessionValidation, useDatabaseValidation } from '@/hooks/useAuthValidation';

function DataComponent() {
  const { isValid, validationResult, validate } = useSessionValidation();
  const { executeWithValidation } = useDatabaseValidation();
  
  const loadData = async () => {
    try {
      const data = await executeWithValidation(async (session) => {
        // Database operation with validated session
        return supabase
          .from('projects')
          .select('*')
          .eq('user_id', session.user.id);
      });
      
      console.log('Data loaded:', data);
    } catch (error) {
      console.error('Data loading failed:', error);
    }
  };
  
  if (!isValid) {
    return <div>Invalid session. Please log in again.</div>;
  }
  
  return (
    <div>
      <button onClick={loadData}>Load Data</button>
      <button onClick={validate}>Refresh Session</button>
    </div>
  );
}
```

### Manual Session Validation

```tsx
import { validateSession, validateForDatabaseOperation } from '@/lib/auth-utils';

async function performSecureOperation() {
  // Validate session before operation
  const validation = await validateForDatabaseOperation();
  
  if (!validation.isValid) {
    throw new Error('Session invalid: ' + validation.error?.message);
  }
  
  // Proceed with operation using validated session
  const result = await supabase
    .from('sensitive_data')
    .select('*')
    .eq('user_id', validation.user!.id);
    
  return result;
}
```

## Error Handling

### Using Error Handling Hooks

```tsx
import { useAuthErrorHandler } from '@/hooks/useAuthValidation';
import type { AuthValidationError } from '@/types/auth';

function ComponentWithErrorHandling() {
  const { handleAuthError, handleRecoveryAction } = useAuthErrorHandler();
  
  const performAction = async () => {
    try {
      await someAuthenticatedAction();
    } catch (error) {
      if (isAuthValidationError(error)) {
        handleAuthError(error);
      }
    }
  };
  
  const showRecoveryOptions = (error: AuthValidationError) => {
    return (
      <div>
        <p>Error: {error.message}</p>
        {error.recoveryActions.map(action => (
          <button 
            key={action} 
            onClick={() => handleRecoveryAction(error, action)}
          >
            {getActionLabel(action)}
          </button>
        ))}
      </div>
    );
  };
  
  return <div>{/* Component content */}</div>;
}
```

### Creating Custom Auth Errors

```tsx
import { createAuthError } from '@/types/auth';

function customAuthOperation() {
  try {
    // Some operation
  } catch (error) {
    // Create structured auth error
    const authError = createAuthError(
      'INSUFFICIENT_PERMISSIONS',
      'You need admin privileges to perform this action',
      'authorization',
      false, // not recoverable by user
      { requiredRole: 'admin', userRole: 'freelancer' }
    );
    
    throw authError;
  }
}
```

## Client Portal Access

### Managing Client Portal Access

```tsx
import { useClientPortalAccess } from '@/hooks/useAuthValidation';

function ClientPortalComponent({ clientId }: { clientId: string }) {
  const { 
    portalAccess, 
    checkProjectAccess, 
    hasAccess, 
    isExpired 
  } = useClientPortalAccess(clientId);
  
  if (!hasAccess || isExpired) {
    return <div>Portal access expired or not available</div>;
  }
  
  return (
    <div>
      {portalAccess?.projectIds.map(projectId => (
        <div key={projectId}>
          <h3>Project {projectId}</h3>
          
          {checkProjectAccess(projectId, 'tasks') && (
            <button>View Tasks</button>
          )}
          
          {checkProjectAccess(projectId, 'reports') && (
            <button>View Reports</button>
          )}
          
          {checkProjectAccess(projectId, 'full') && (
            <button>Full Access</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Programmatic Client Access Checking

```tsx
import { getClientPortalAccess, hasProjectAccess } from '@/lib/auth-utils';

async function checkClientPermissions(clientId: string, projectId: string) {
  const access = await getClientPortalAccess(clientId);
  
  if (!access) {
    console.log('No portal access found');
    return false;
  }
  
  const canViewReports = hasProjectAccess(access, projectId, 'reports');
  const hasFullAccess = hasProjectAccess(access, projectId, 'full');
  
  return {
    canView: hasProjectAccess(access, projectId, 'tasks'),
    canViewReports,
    hasFullAccess,
    availableFeatures: access.availableFeatures
  };
}
```

## Form Validation with Zod

### Using Authentication Schemas

```tsx
import { LoginCredentialsSchema, SignupDataSchema } from '@/types/auth';
import type { LoginCredentials, SignupData } from '@/types/auth';

function LoginForm() {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate with Zod schema
      const validated = LoginCredentialsSchema.parse(formData);
      
      // Proceed with validated data
      signIn(validated.email, validated.password);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Validation errors:', error.errors);
      }
    }
  };
  
  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

## Type Guards and Safety

### Using Type Guards

```tsx
import { isAuthenticatedUser, isAuthenticatedSession } from '@/types/auth';

function processUserData(userData: unknown) {
  if (isAuthenticatedUser(userData)) {
    // TypeScript now knows userData is AuthenticatedUser
    console.log('User role:', userData.role);
    console.log('Permissions:', userData.permissions);
  }
}

function processSession(sessionData: unknown) {
  if (isAuthenticatedSession(sessionData)) {
    // TypeScript knows this is AuthenticatedSession
    console.log('Valid until:', sessionData.validation.expiresAt);
    console.log('User:', sessionData.user.email);
  }
}
```

## Best Practices

### 1. Always Use Type-Safe Hooks
```tsx
// ✅ Good - Type safe
const { user, hasPermission } = usePermissions();

// ❌ Avoid - Direct context access
const context = useContext(SessionContext);
```

### 2. Validate Sessions for Database Operations
```tsx
// ✅ Good - Validated operation
const { executeWithValidation } = useDatabaseValidation();
const result = await executeWithValidation(async (session) => {
  return supabase.from('table').select('*');
});

// ❌ Avoid - Direct database call
const result = await supabase.from('table').select('*');
```

### 3. Use Proper Error Handling
```tsx
// ✅ Good - Structured error handling
try {
  await authenticatedOperation();
} catch (error) {
  if (isAuthValidationError(error)) {
    handleAuthError(error);
  } else {
    handleGenericError(error);
  }
}
```

### 4. Implement Progressive Enhancement
```tsx
// ✅ Good - Progressive permission checking
function FeatureSet() {
  const { hasPermission, hasAnyRole } = usePermissions();
  
  return (
    <div>
      {/* Basic features for all authenticated users */}
      <BasicFeatures />
      
      {/* Enhanced features based on permissions */}
      {hasPermission('advanced:features') && <AdvancedFeatures />}
      
      {/* Admin-only features */}
      {hasAnyRole(['admin', 'super_admin']) && <AdminFeatures />}
    </div>
  );
}
```

This authentication system provides comprehensive type safety, preventing runtime authentication errors and enabling secure, maintainable user management throughout your application.