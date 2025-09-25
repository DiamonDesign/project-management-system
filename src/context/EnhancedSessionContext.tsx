import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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
import { useLoading } from "@/context/LoadingContext";

// Enhanced SessionContext interface with progressive loading integration
interface EnhancedSessionContextType {
  // Authentication state
  session: AuthSession | null;
  user: AuthUser | null;

  // Progressive loading states
  authPhase: 'idle' | 'authenticating' | 'enhancing' | 'ready' | 'error' | 'degraded';
  canContinueWithBasicAuth: boolean;
  profileEnhancementFailed: boolean;

  // Authentication methods
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  retryProfileEnhancement: () => Promise<void>;
  continueWithBasicAuth: () => void;

  // Permission helpers
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;

  // Display helpers
  displayName: string;
  initials: string;

  // Recovery methods
  refreshSession: () => Promise<void>;
  clearErrorState: () => void;
}

// Create context with safe default value
const defaultContextValue: EnhancedSessionContextType = {
  session: null,
  user: null,
  authPhase: 'idle',
  canContinueWithBasicAuth: false,
  profileEnhancementFailed: false,
  signOut: async () => { throw new Error('SessionContext not initialized'); },
  signIn: async () => { throw new Error('SessionContext not initialized'); },
  retryProfileEnhancement: async () => { throw new Error('SessionContext not initialized'); },
  continueWithBasicAuth: () => { throw new Error('SessionContext not initialized'); },
  hasPermission: () => false,
  hasRole: () => false,
  displayName: '',
  initials: '',
  refreshSession: async () => { throw new Error('SessionContext not initialized'); },
  clearErrorState: () => { throw new Error('SessionContext not initialized'); }
};

export const EnhancedSessionContext = createContext<EnhancedSessionContextType>(defaultContextValue);

export const EnhancedSessionProvider = ({ children }: { children: ReactNode }) => {
  // Authentication state
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authPhase, setAuthPhase] = useState<'idle' | 'authenticating' | 'enhancing' | 'ready' | 'error' | 'degraded'>('idle');

  // Progressive loading state
  const [canContinueWithBasicAuth, setCanContinueWithBasicAuth] = useState(false);
  const [profileEnhancementFailed, setProfileEnhancementFailed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Integration with loading context
  const { setPhase, updateProgress, setError, state: loadingState } = useLoading();

  const navigate = useNavigate();

  // Create basic auth user without profile enhancement
  const createBasicAuthUser = useCallback((baseUser: User): AuthUser => {
    return {
      id: baseUser.id,
      email: baseUser.email || '',
      role: 'freelancer', // Default role
      metadata: {
        created_at: baseUser.created_at,
        email_verified: !!baseUser.email_confirmed_at,
        two_factor_enabled: false
      }
    };
  }, []);

  // Enhanced user enhancement with progressive degradation
  const enhanceUser = useCallback(async (
    baseUser: User,
    allowBasicFallback: boolean = true
  ): Promise<{ user: AuthUser | null; enhanced: boolean }> => {
    try {
      setAuthPhase('enhancing');
      setPhase('enhancing', 'session');
      updateProgress(60, 100);

      // Use adaptive timeout from loading context
      const timeout = loadingState.network.adaptiveTimeouts.profile;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const profileQuery = supabase
        .from("profiles")
        .select("*")
        .eq("id", baseUser.id)
        .single();

      const profileResult = await profileQuery.abortSignal(controller.signal);
      clearTimeout(timeoutId);

      const validatedResult = safeCastToProfileResult(profileResult);
      const { data: profileData, error: profileError } = validatedResult;

      if (profileError && profileError.code !== 'PGRST116') {
        logger.session("Profile enhancement error", profileError);

        if (allowBasicFallback) {
          logger.session("Falling back to basic auth");
          setProfileEnhancementFailed(true);
          setCanContinueWithBasicAuth(true);
          return { user: createBasicAuthUser(baseUser), enhanced: false };
        }

        throw profileError;
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

      return { user: enhancedUser, enhanced: true };
    } catch (error) {
      logger.session('User enhancement failed', error);

      if (allowBasicFallback) {
        logger.session('Using basic user due to enhancement failure');
        setProfileEnhancementFailed(true);
        setCanContinueWithBasicAuth(true);
        return { user: createBasicAuthUser(baseUser), enhanced: false };
      }

      return { user: null, enhanced: false };
    }
  }, [loadingState.network.adaptiveTimeouts.profile, setPhase, updateProgress, createBasicAuthUser]);

  // Retry profile enhancement
  const retryProfileEnhancement = useCallback(async () => {
    if (!session?.user) return;

    try {
      setProfileEnhancementFailed(false);
      setCanContinueWithBasicAuth(false);

      const { user: enhancedUser, enhanced } = await enhanceUser(session.user, true);

      if (enhancedUser) {
        setUser(enhancedUser);
        if (enhanced) {
          setAuthPhase('ready');
          setPhase('ready', 'session');
          updateProgress(100, 100);
          logger.session('Profile enhancement successful on retry');
        } else {
          setAuthPhase('degraded');
          setPhase('degraded', 'session');
        }
      }
    } catch (error) {
      logger.session('Profile enhancement retry failed', error);
      setError('PROFILE_RETRY_FAILED', 'Failed to retry profile enhancement');
    }
  }, [session, enhanceUser, setPhase, updateProgress, setError]);

  // Continue with basic authentication
  const continueWithBasicAuth = useCallback(() => {
    if (!session?.user) return;

    const basicUser = createBasicAuthUser(session.user);
    setUser(basicUser);
    setAuthPhase('degraded');
    setPhase('degraded', 'session');
    setCanContinueWithBasicAuth(false);

    logger.session('Continuing with basic auth');

    // Navigate based on basic user type
    navigate('/dashboard');
  }, [session, createBasicAuthUser, setPhase, navigate]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      setAuthPhase('authenticating');
      setPhase('authenticating', 'session');
      updateProgress(20, 100);

      const { data: { session: currentSession }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (currentSession && currentSession.user) {
        const { user: enhancedUser, enhanced } = await enhanceUser(currentSession.user, true);

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
          setAuthPhase(enhanced ? 'ready' : 'degraded');
          setPhase(enhanced ? 'ready' : 'degraded', 'session');
          updateProgress(100, 100);
        } else {
          throw new Error('Failed to create user');
        }
      } else {
        setSession(null);
        setUser(null);
        setAuthPhase('idle');
        setPhase('ready', 'session'); // Ready to show login
      }
    } catch (error) {
      logger.session('Session refresh failed', error);
      setAuthPhase('error');
      setError('SESSION_REFRESH_FAILED', 'Failed to refresh session');
    }
  }, [enhanceUser, setPhase, updateProgress, setError]);

  // Clear error state
  const clearErrorState = useCallback(() => {
    setAuthPhase('idle');
    setProfileEnhancementFailed(false);
    setCanContinueWithBasicAuth(false);
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        setAuthPhase('authenticating');
        setPhase('authenticating', 'session');
        updateProgress(10, 100);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            if (!isMounted) return;

            try {
              updateProgress(30, 100);

              if (event === 'SIGNED_IN' && currentSession) {
                const { user: enhancedUser, enhanced } = await enhanceUser(currentSession.user, true);

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
                  setAuthPhase(enhanced ? 'ready' : 'degraded');
                  setPhase(enhanced ? 'ready' : 'degraded', 'session');
                  updateProgress(100, 100);

                  // Navigate based on user type
                  if (enhanced && enhancedUser.client_portal_access?.is_client) {
                    navigate('/client-portal/dashboard');
                  } else {
                    navigate('/dashboard');
                  }
                }
              } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setAuthPhase('idle');
                setPhase('ready', 'session');
                clearErrorState();
                navigate('/login');
              } else if (event === 'TOKEN_REFRESHED' && currentSession) {
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
              if (isMounted) {
                setAuthPhase('error');
                setError('AUTH_STATE_ERROR', 'Authentication state error');
              }
            }
          }
        );

        return subscription;
      } catch (error) {
        logger.session('Session initialization error', error);
        if (isMounted) {
          setAuthPhase('error');
          setError('INIT_ERROR', 'Session initialization failed');
        }
      }
    };

    const subscription = initializeSession();

    return () => {
      isMounted = false;
      subscription?.then(sub => sub.unsubscribe());
    };
  }, [enhanceUser, setPhase, updateProgress, setError, navigate, clearErrorState, session]);

  // Sign in method
  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setAuthPhase('authenticating');
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
      setAuthPhase('error');
      throw error;
    }
  }, []);

  // Sign out method
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsSigningOut(true);

      // Clear local state first
      setSession(null);
      setUser(null);
      setAuthPhase('idle');
      clearErrorState();

      // Then attempt Supabase signOut with timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const { error } = await supabase.auth.signOut();
        clearTimeout(timeoutId);

        if (error) {
          logger.session('SignOut API error (non-critical)', error);
        }
      } catch (signOutError) {
        logger.session('SignOut failed - continuing with navigation', signOutError);
      }

      showSuccess("Has cerrado sesión correctamente.");
      navigate('/login');
    } catch (error: unknown) {
      logger.session('SignOut error', error);
      navigate('/login');
      showSuccess("Sesión cerrada.");
    } finally {
      setIsSigningOut(false);
    }
  }, [navigate, clearErrorState]);

  // Permission helpers
  const userHasPermission = useCallback((permission: Permission): boolean => {
    return user ? hasPermission(user, permission) : false;
  }, [user]);

  const userHasRole = useCallback((role: UserRole): boolean => {
    return user ? hasRole(user, role) : false;
  }, [user]);

  // Display helpers
  const displayName = user ? getUserDisplayName(user) : '';
  const initials = user ? getUserInitials(user) : '';

  const contextValue: EnhancedSessionContextType = {
    // Authentication state
    session,
    user,

    // Progressive loading states
    authPhase,
    canContinueWithBasicAuth,
    profileEnhancementFailed,

    // Authentication methods
    signOut,
    signIn,
    retryProfileEnhancement,
    continueWithBasicAuth,

    // Permission helpers
    hasPermission: userHasPermission,
    hasRole: userHasRole,

    // Display helpers
    displayName,
    initials,

    // Recovery methods
    refreshSession,
    clearErrorState
  };

  return (
    <EnhancedSessionContext.Provider value={contextValue}>
      {children}
    </EnhancedSessionContext.Provider>
  );
};

// Hook to use enhanced session context
export const useEnhancedSession = () => {
  const context = useContext(EnhancedSessionContext);

  if (!context) {
    throw new Error('useEnhancedSession must be used within an EnhancedSessionProvider');
  }

  return context;
};