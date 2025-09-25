import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";
import type { AppError } from "@/types";
import { safeCastToProfileResult, safeCastToAppError } from "@/lib/validation-schemas";
import { logger } from "@/lib/logger";
import {
  AuthUser,
  AuthSession,
  SessionValidationResult,
  UserRole,
  Permission,
  hasPermission,
  hasAllPermissions,
  hasRole,
  ROLE_PERMISSIONS
} from "@/types/auth";
import { 
  validateSession, 
  getUserDisplayName, 
  getUserInitials,
  createAuthError
} from "@/lib/auth-utils";

// Enhanced SessionContext interface with type-safe authentication
interface SessionContextType {
  // Authentication state
  session: AuthSession | null;
  user: AuthUser | null;
  
  // Loading states
  isLoading: boolean;
  isSigningOut: boolean;
  
  // Authentication methods
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  
  // Permission helpers
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  
  // Display helpers
  displayName: string;
  initials: string;
}

// Create context with safe default value to prevent undefined context errors
const defaultContextValue: SessionContextType = {
  session: null,
  user: null,
  isLoading: true,
  isSigningOut: false,
  signOut: async () => { throw new Error('SessionContext not initialized'); },
  signIn: async () => { throw new Error('SessionContext not initialized'); },
  hasPermission: () => false,
  hasRole: () => false,
  displayName: '',
  initials: '',
};

export const SessionContext = createContext<SessionContextType>(defaultContextValue);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  // Enhanced state with type safety
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Error handling
  const [authError, setAuthError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Enhanced user enhancement with role and permissions
  const enhanceUser = async (baseUser: User): Promise<AuthUser | null> => {
    try {
      logger.session(`Enhancing user: ${baseUser.id}`);

      // Add timeout to database query to prevent hanging
      const profileQuery = supabase
        .from("profiles")
        .select("*")
        .eq("id", baseUser.id)
        .single();

      // Wrap query with timeout promise for more reliable handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 3000); // Reduced to 3s for faster recovery
      });

      const profileResult = await Promise.race([
        profileQuery,
        timeoutPromise
      ]) as any; // Race between query and timeout

      const validatedResult = safeCastToProfileResult(profileResult);
      const { data: profileData, error: profileError } = validatedResult;

      if (profileError) {
        logger.session("Profile query error:", profileError);
        // Don't throw on profile errors - continue with basic user
        if (profileError.code !== 'PGRST116') { // PGRST116 = not found
          logger.session("Non-404 profile error, continuing with basic user");
        }
      }
      
      // Default role for new users or fallback
      const userRole: UserRole = profileData?.role || 'freelancer';
      
      const enhancedUser: AuthUser = {
        id: baseUser.id,
        email: baseUser.email || '',
        role: userRole,
        profile: profileData ? {
          full_name: profileData.full_name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
          avatar_url: profileData.avatar_url,
          company: profileData.company,
          bio: profileData.bio,
          website: profileData.website,
          location: profileData.location,
          phone: profileData.phone,
          timezone: profileData.timezone,
        } : undefined,
        metadata: {
          created_at: baseUser.created_at,
          last_login: profileData?.last_login,
          login_count: profileData?.login_count,
          email_verified: !!baseUser.email_confirmed_at,
          two_factor_enabled: false // TODO: implement 2FA
        },
        client_portal_access: (profileData && typeof profileData.client_portal_access === 'object') ? {
          is_client: profileData.client_portal_access?.is_client || false,
          assigned_projects: Array.isArray(profileData.client_portal_access?.assigned_projects) ? profileData.client_portal_access.assigned_projects : [],
          invite_token: profileData.client_portal_access?.invite_token,
          invited_by: profileData.client_portal_access?.invited_by,
          invited_at: profileData.client_portal_access?.invited_at
        } : undefined
      };
      
      logger.session(`User enhancement successful for: ${baseUser.id}`);
      return enhancedUser;
    } catch (error) {
      logger.session('User enhancement failed', error);

      // Always return a basic user on failure to prevent blocking
      logger.session('Using basic user due to enhancement failure');
      return {
        id: baseUser.id,
        email: baseUser.email || '',
        role: 'freelancer' as UserRole,
        metadata: {
          created_at: baseUser.created_at,
          email_verified: !!baseUser.email_confirmed_at,
          two_factor_enabled: false
        }
      };
    }
  };

  // Retry session initialization function
  const retryInitialization = async () => {
    try {
      setAuthError(null);
      setIsLoading(true);

      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        logger.session('Session retry error', error);
        setAuthError('Error al inicializar la sesión. Por favor, inténtalo de nuevo.');
        setIsLoading(false);
        return;
      }

      if (currentSession && currentSession.user) {
        const enhancedUser = await enhanceUser(currentSession.user);

        if (enhancedUser) {
          const authSession: AuthSession = {
            user: enhancedUser,
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
            expires_at: currentSession.expires_at,
            token_type: 'bearer'
          };
          setSession(authSession);
          setUser(enhancedUser);
        } else {
          logger.session('User enhancement failed during retry');
          setAuthError('Error al procesar la información del usuario.');
        }
      } else {
        logger.session('No session found during retry');
      }

      setIsLoading(false);
    } catch (error) {
      logger.session('Session retry failed', error);
      setAuthError('Error inesperado al reintentar. Por favor, recarga la página.');
      setIsLoading(false);
    }
  };

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;
    let initialCheckCompleted = false;

    const initializeSession = async () => {
      try {
        logger.session('Starting session initialization');

        // Get current session immediately
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          logger.session('Session fetch error:', sessionError);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (currentSession && currentSession.user && isMounted) {
          logger.session('Found existing session, enhancing user');
          const enhancedUser = await enhanceUser(currentSession.user);

          if (enhancedUser && isMounted) {
            const authSession: AuthSession = {
              user: enhancedUser,
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
              expires_at: currentSession.expires_at,
              token_type: 'bearer'
            };
            setSession(authSession);
            setUser(enhancedUser);
          }
        } else {
          logger.session('No existing session found');
          if (isMounted) {
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        logger.session('Session initialization error:', error);
      } finally {
        if (isMounted) {
          initialCheckCompleted = true;
          setIsLoading(false);
          logger.session('Session initialization completed');
        }
      }
    };

    // Set a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (!initialCheckCompleted && isMounted) {
        logger.session('Session initialization timeout - forcing completion');
        setSession(null);
        setUser(null);
        setIsLoading(false);
      }
    }, 10000); // 10 second safety timeout

    // Initialize session immediately
    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        logger.session('Auth state change:', event);

        if (!isMounted) return;

        try {
          if (event === 'SIGNED_IN' && currentSession) {
            const enhancedUser = await enhanceUser(currentSession.user);
            if (enhancedUser && isMounted) {
              const authSession: AuthSession = {
                user: enhancedUser,
                access_token: currentSession.access_token,
                refresh_token: currentSession.refresh_token,
                expires_at: currentSession.expires_at,
                token_type: 'bearer'
              };
              setSession(authSession);
              setUser(enhancedUser);

              // Navigate based on user type (but only if not already on a protected route)
              const currentPath = window.location.pathname;
              const isProtectedRoute = ['/dashboard', '/projects', '/clients', '/tasks', '/profile', '/analytics'].some(route =>
                currentPath.startsWith(route)
              );

              if (!isProtectedRoute) {
                if (enhancedUser.client_portal_access?.is_client) {
                  navigate('/client-portal/dashboard');
                } else {
                  navigate('/projects');
                }
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            navigate('/login');
          } else if (event === 'TOKEN_REFRESHED' && currentSession) {
            // Update tokens only, keep existing user data
            if (isMounted && session) {
              const updatedSession: AuthSession = {
                ...session,
                access_token: currentSession.access_token,
                refresh_token: currentSession.refresh_token,
                expires_at: currentSession.expires_at,
              };
              setSession(updatedSession);
            }
          }
        } catch (error) {
          logger.session('Auth state change error', error);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [navigate]); // Removed session from dependencies to prevent circular updates

  // Sign in method
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      showSuccess("¡Bienvenido! Has iniciado sesión correctamente.");
    } catch (error: unknown) {
      const appError = error as AppError;
      logger.session('Error signing in', error);
      const message = appError?.message || "Error al iniciar sesión";
      showError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out method
  const signOut = async (): Promise<void> => {
    try {
      setIsSigningOut(true);

      // Clear local state first
      setSession(null);
      setUser(null);

      // Then attempt Supabase signOut with simple timeout (non-blocking)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const { error } = await supabase.auth.signOut();
        clearTimeout(timeoutId);

        if (error) {
          logger.session('SignOut API error (non-critical)', error);
        }
      } catch (signOutError) {
        // SignOut failed, but we already cleared local state, so continue
        logger.session('SignOut failed - continuing with navigation', signOutError);
      }

      showSuccess("Has cerrado sesión correctamente.");
      navigate('/login');
    } catch (error: unknown) {
      logger.session('SignOut error', error);
      // State already cleared, just navigate
      navigate('/login');
      showSuccess("Sesión cerrada.");
    } finally {
      setIsSigningOut(false);
    }
  };

  // Permission helpers
  const userHasPermission = (permission: Permission): boolean => {
    return user ? hasPermission(user, permission) : false;
  };

  const userHasRole = (role: UserRole): boolean => {
    return user ? hasRole(user, role) : false;
  };

  // Display helpers
  const displayName = user ? getUserDisplayName(user) : '';
  const initials = user ? getUserInitials(user) : '';

  const contextValue: SessionContextType = {
    // Authentication state
    session,
    user,
    
    // Loading states
    isLoading,
    isSigningOut,
    
    // Authentication methods
    signOut,
    signIn,
    
    // Permission helpers
    hasPermission: userHasPermission,
    hasRole: userHasRole,
    
    // Display helpers
    displayName,
    initials,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {authError && (
        <div className="bg-red-50 border-b border-red-200 p-3 text-center">
          <p className="text-sm text-red-800">
            ⚠️ {authError}
            <button
              onClick={() => {
                retryInitialization();
              }}
              className="ml-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </p>
        </div>
      )}
      {children}
    </SessionContext.Provider>
  );
};

// useSession hook moved to @/hooks/useSession to fix Fast Refresh warnings