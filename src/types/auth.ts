import { z } from 'zod';

// ============================================================================
// CORE AUTHENTICATION TYPES
// ============================================================================

export type UserRole = 'super_admin' | 'admin' | 'project_manager' | 'freelancer' | 'client' | 'viewer';

export type Permission = 
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  | 'projects:create' | 'projects:read' | 'projects:update' | 'projects:delete'
  | 'tasks:create' | 'tasks:read' | 'tasks:update' | 'tasks:delete'
  | 'notes:create' | 'notes:read' | 'notes:update' | 'notes:delete'
  | 'clients:create' | 'clients:read' | 'clients:update' | 'clients:delete'
  | 'analytics:read' | 'settings:update' | 'invites:create';

// ============================================================================
// ENHANCED USER TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile?: {
    full_name?: string;
    avatar_url?: string;
    company?: string;
    bio?: string;
    website?: string;
    location?: string;
    phone?: string;
    timezone?: string;
  };
  metadata?: {
    created_at: string;
    last_login?: string;
    login_count?: number;
    email_verified?: boolean;
    two_factor_enabled?: boolean;
  };
  client_portal_access?: {
    is_client?: boolean;
    assigned_projects?: string[];
    invite_token?: string;
    invited_by?: string;
    invited_at?: string;
  };
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  token_type: 'bearer';
}

export interface SessionValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  expiresInMinutes?: number;
  errors?: string[];
}

export interface SessionMetadata {
  device_info?: {
    platform?: string;
    browser?: string;
    is_mobile?: boolean;
  };
  location_info?: {
    ip_address?: string;
    country?: string;
    city?: string;
  };
  activity_info?: {
    last_activity: string;
    session_duration?: number;
    page_views?: number;
  };
}

// ============================================================================
// ROUTE PROTECTION TYPES
// ============================================================================

export interface RouteProtectionConfig {
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  allowClientPortal?: boolean;
  redirectOnFail?: string;
  customValidation?: (user: AuthUser) => boolean | Promise<boolean>;
}

export interface RouteAccessResult {
  hasAccess: boolean;
  reason?: 'no_auth' | 'insufficient_role' | 'missing_permission' | 'custom_validation_failed';
  redirectTo?: string;
  suggestedActions?: string[];
}

// ============================================================================
// CLIENT PORTAL TYPES
// ============================================================================

export interface ClientPortalAccess {
  is_client: boolean;
  assigned_projects: string[];
  invite_token?: string;
  invited_by: string;
  invited_at: string;
  access_level: 'read' | 'comment' | 'limited_edit';
  restrictions?: {
    can_view_finances?: boolean;
    can_download_files?: boolean;
    can_invite_others?: boolean;
  };
}

export interface ClientInviteData {
  email: string;
  project_ids: string[];
  access_level: ClientPortalAccess['access_level'];
  restrictions?: ClientPortalAccess['restrictions'];
  expires_at?: string;
  message?: string;
}

// ============================================================================
// AUTHENTICATION ERRORS
// ============================================================================

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'TOKEN_INVALID'
  | 'TOKEN_REFRESH_FAILED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ACCOUNT_DISABLED'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOO_MANY_ATTEMPTS'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
  recoveryActions?: {
    label: string;
    action: 'retry' | 'redirect' | 'refresh' | 'logout' | 'contact_support';
    url?: string;
  }[];
  timestamp: string;
  correlation_id?: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const userRoleSchema = z.enum(['super_admin', 'admin', 'project_manager', 'freelancer', 'client', 'viewer']);

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: userRoleSchema,
  profile: z.object({
    full_name: z.string().optional(),
    avatar_url: z.string().url().optional(),
    company: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().url().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  metadata: z.object({
    created_at: z.string(),
    last_login: z.string().optional(),
    login_count: z.number().optional(),
    email_verified: z.boolean().optional(),
    two_factor_enabled: z.boolean().optional(),
  }).optional(),
  client_portal_access: z.object({
    is_client: z.boolean().optional(),
    assigned_projects: z.array(z.string().uuid()).optional(),
    invite_token: z.string().optional(),
    invited_by: z.string().uuid().optional(),
    invited_at: z.string().optional(),
  }).optional(),
});

export const sessionSchema = z.object({
  user: authUserSchema,
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number().optional(),
  token_type: z.literal('bearer'),
});

export const loginFormSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional(),
});

export const clientInviteFormSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  project_ids: z.array(z.string().uuid()).min(1, 'Selecciona al menos un proyecto'),
  access_level: z.enum(['read', 'comment', 'limited_edit']),
  message: z.string().optional(),
  expires_at: z.string().optional(),
  restrictions: z.object({
    can_view_finances: z.boolean().optional(),
    can_download_files: z.boolean().optional(),
    can_invite_others: z.boolean().optional(),
  }).optional(),
});

// ============================================================================
// ROLE HIERARCHY & PERMISSIONS
// ============================================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  project_manager: 60,
  freelancer: 40,
  client: 20,
  viewer: 10,
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'projects:create', 'projects:read', 'projects:update', 'projects:delete',
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'notes:create', 'notes:read', 'notes:update', 'notes:delete',
    'clients:create', 'clients:read', 'clients:update', 'clients:delete',
    'analytics:read', 'settings:update', 'invites:create'
  ],
  admin: [
    'users:read', 'users:update',
    'projects:create', 'projects:read', 'projects:update', 'projects:delete',
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'notes:create', 'notes:read', 'notes:update', 'notes:delete',
    'clients:create', 'clients:read', 'clients:update', 'clients:delete',
    'analytics:read', 'settings:update', 'invites:create'
  ],
  project_manager: [
    'projects:read', 'projects:update',
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'notes:create', 'notes:read', 'notes:update', 'notes:delete',
    'clients:read', 'clients:update',
    'analytics:read', 'invites:create'
  ],
  freelancer: [
    'projects:read',
    'tasks:read', 'tasks:update',
    'notes:create', 'notes:read', 'notes:update',
    'clients:read',
    'analytics:read'
  ],
  client: [
    'projects:read',
    'tasks:read',
    'notes:read'
  ],
  viewer: [
    'projects:read',
    'tasks:read',
    'notes:read'
  ]
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isAuthUser = (obj: unknown): obj is AuthUser => {
  try {
    authUserSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const isAuthSession = (obj: unknown): obj is AuthSession => {
  try {
    sessionSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const hasRole = (user: AuthUser, role: UserRole): boolean => {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role];
};

export const hasPermission = (user: AuthUser, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[user.role].includes(permission);
};

export const hasAnyPermission = (user: AuthUser, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(user, permission));
};

export const hasAllPermissions = (user: AuthUser, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(user, permission));
};

export const isClientPortalUser = (user: AuthUser): boolean => {
  return user.client_portal_access?.is_client === true;
};

export const canAccessProject = (user: AuthUser, projectId: string): boolean => {
  if (hasRole(user, 'freelancer')) {
    return true; // Freelancers can access all projects
  }
  
  if (isClientPortalUser(user)) {
    return user.client_portal_access?.assigned_projects?.includes(projectId) === true;
  }
  
  return false;
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LoginCredentials = z.infer<typeof loginFormSchema>;
export type ClientInviteForm = z.infer<typeof clientInviteFormSchema>;