import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
}

/**
 * Enhanced session validation that ensures proper auth context for database operations
 */
export async function validateSession(): Promise<AuthState> {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Auth] Session validation error:', error.message);
      return { user: null, session: null, isAuthenticated: false };
    }

    if (!session || !session.user) {
      if (import.meta.env.DEV) console.log('[Auth] No active session found');
      return { user: null, session: null, isAuthenticated: false };
    }

    // Verify session is not expired
    const expiresAt = session.expires_at;
    if (expiresAt && Date.now() / 1000 > expiresAt) {
      if (import.meta.env.DEV) console.log('[Auth] Session expired, attempting refresh...');
      
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        console.error('[Auth] Session refresh failed:', refreshError?.message);
        return { user: null, session: null, isAuthenticated: false };
      }
      
      if (import.meta.env.DEV) console.log('[Auth] Session refreshed successfully');
      return { 
        user: refreshedSession.user, 
        session: refreshedSession, 
        isAuthenticated: true 
      };
    }

    if (import.meta.env.DEV) console.log('[Auth] Valid session found:', session.user.id);
    return { 
      user: session.user, 
      session: session, 
      isAuthenticated: true 
    };
    
  } catch (error) {
    console.error('[Auth] Session validation failed:', error);
    return { user: null, session: null, isAuthenticated: false };
  }
}

/**
 * Enhanced database operation wrapper that ensures proper auth context
 */
export async function withAuth<T>(
  operation: (userId: string, session: Session) => Promise<T>
): Promise<T> {
  const { user, session, isAuthenticated } = await validateSession();
  
  if (!isAuthenticated || !user || !session) {
    throw new Error('Authentication required: Please log in to continue');
  }

  try {
    if (import.meta.env.DEV) console.log(`[Auth] Executing database operation for user: ${user.id}`);
    return await operation(user.id, session);
  } catch (error) {
    console.error('[Auth] Database operation failed:', error);
    throw error;
  }
}

/**
 * Force session establishment for database operations
 */
export async function ensureAuthenticatedRequest() {
  const { session, isAuthenticated } = await validateSession();
  
  if (!isAuthenticated || !session) {
    throw new Error('Authentication required');
  }

  // Set explicit Authorization header for this request
  return {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabase.supabaseKey
    }
  };
}

/**
 * Test auth context in database
 */
export async function testAuthContext(): Promise<{
  success: boolean;
  userId: string | null;
  error?: string;
}> {
  try {
    const { user, session, isAuthenticated } = await validateSession();
    
    if (!isAuthenticated || !user || !session) {
      return {
        success: false,
        userId: null,
        error: 'No authenticated user'
      };
    }

    // Try a simple RLS-protected query to test auth context
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (error) {
      return {
        success: false,
        userId: user.id,
        error: error.message
      };
    }

    return {
      success: true,
      userId: user.id
    };

  } catch (error) {
    return {
      success: false,
      userId: null,
      error: (error as Error).message
    };
  }
}