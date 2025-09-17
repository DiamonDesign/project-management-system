import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";
import type { AppError } from "@/types";
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

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  // Enhanced state with type safety
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Emergency fallback flag
  const [emergencyMode, setEmergencyMode] = useState(false);
  
  const navigate = useNavigate();

  // Enhanced user enhancement with role and permissions
  const enhanceUser = async (baseUser: User): Promise<AuthUser | null> => {
    try {
      
      // Add timeout to database query to prevent hanging
      const profileQuery = supabase
        .from("profiles")
        .select("*")
        .eq("id", baseUser.id)
        .single();

      // Race condition: query vs timeout
      const profileResult = await Promise.race([
        profileQuery,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile query timeout')), 2000)
        )
      ]);

      const { data: profileData, error: profileError } = profileResult as {
        data: {
          id?: string;
          role?: string;
          full_name?: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          company?: string;
          bio?: string;
          website?: string;
          location?: string;
          phone?: string;
          timezone?: string;
          last_login?: string;
          login_count?: number;
          client_portal_access?: {
            is_client?: boolean;
            assigned_projects?: string[];
            invite_token?: string;
            invited_by?: string;
            invited_at?: string;
          };
        } | null;
        error: {
          code?: string;
          message?: string;
        } | null;
      } | null;
      
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching profile:", profileError);
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
      
      return enhancedUser;
    } catch (error) {
      console.error('[SessionContext] User enhancement failed:', error);
      
      // If enhancement fails, return a basic user without profile data
      if (error instanceof Error && error.message.includes('timeout')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SessionContext] Using basic user due to timeout');
        }
        return {
          id: baseUser.id,
          email: baseUser.email || '',
          role: 'freelancer',
          metadata: {
            created_at: baseUser.created_at,
            email_verified: !!baseUser.email_confirmed_at,
            two_factor_enabled: false
          }
        };
      }
      
      return null;
    }
  };

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeSession = async () => {
      try {
        
        // Set a timeout to prevent infinite loading
        const sessionTimeout = setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[SessionContext] Session initialization timeout - activating emergency mode');
          }
          if (isMounted) {
            setEmergencyMode(true);
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout - more conservative
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[SessionContext] Session initialization error:', error);
          }
          clearTimeout(sessionTimeout);
          setIsLoading(false);
          return;
        }
        
        if (currentSession && currentSession.user && isMounted) {
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
          } else if (isMounted) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[SessionContext] User enhancement failed, continuing without enhanced data');
            }
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[SessionContext] No current session found');
          }
        }
        
        clearTimeout(sessionTimeout);
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[SessionContext] Session initialization failed:', error);
        }
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        
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
              
              // Navigate based on user type
              if (enhancedUser.client_portal_access?.is_client) {
                navigate('/client-portal/dashboard');
              } else {
                navigate('/dashboard');
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            navigate('/login');
          } else if (event === 'TOKEN_REFRESHED' && currentSession) {
            // Solo actualizar tokens, mantener datos de usuario existentes
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
          if (process.env.NODE_ENV === 'development') {
            console.error('[SessionContext] Auth state change error:', error);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    );
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      if (process.env.NODE_ENV === 'development') {
        console.error("Error signing in:", error);
      }
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
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear local state
      setSession(null);
      setUser(null);
      
      showSuccess("Has cerrado sesión correctamente.");
      navigate('/login');
    } catch (error: unknown) {
      const appError = error as AppError;
      if (process.env.NODE_ENV === 'development') {
        console.error("Error signing out:", error);
      }
      const message = error?.message || "Error al cerrar sesión";
      showError(message);
      throw error;
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
      {emergencyMode && (
        <div className="bg-amber-100 border-b border-amber-200 p-2 text-center">
          <p className="text-sm text-amber-800">
            ⚠️ Modo de emergencia activo - Algunas funciones pueden estar limitadas. 
            <button
              onClick={() => {
                setEmergencyMode(false);
                setIsLoading(true);
                initializeSession();
              }}
              className="underline ml-1 hover:no-underline"
            >
              Reintentar conexión
            </button>
          </p>
        </div>
      )}
      {children}
    </SessionContext.Provider>
  );
};

// useSession hook moved to @/hooks/useSession to fix Fast Refresh warnings