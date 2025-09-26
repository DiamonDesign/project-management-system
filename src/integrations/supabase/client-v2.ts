/**
 * Enhanced Supabase Client with API Protection v2.0
 *
 * This is the production-ready replacement for the current client.ts
 * that uses the bulletproof header sanitization implementation.
 */

import { createClient } from "@supabase/supabase-js";
import { createProtectedFetch, logProtectionStatus } from "@/lib/api-protection-migration";

// Environment validation with enhanced error handling
function validateEnvironmentVariables(): { url: string; key: string } {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Enhanced validation with specific error messages
  const errors: string[] = [];

  if (!url) {
    errors.push("VITE_SUPABASE_URL is not defined");
  } else {
    if (typeof url !== 'string') {
      errors.push("VITE_SUPABASE_URL must be a string");
    } else if (url.trim() === '') {
      errors.push("VITE_SUPABASE_URL cannot be empty");
    } else {
      try {
        const parsedUrl = new URL(url.trim());
        if (!parsedUrl.hostname.includes('supabase')) {
          console.warn("Warning: VITE_SUPABASE_URL doesn't appear to be a Supabase URL");
        }
      } catch (urlError) {
        errors.push(`VITE_SUPABASE_URL is not a valid URL: ${urlError.message}`);
      }
    }
  }

  if (!key) {
    errors.push("VITE_SUPABASE_ANON_KEY is not defined");
  } else {
    if (typeof key !== 'string') {
      errors.push("VITE_SUPABASE_ANON_KEY must be a string");
    } else if (key.trim() === '') {
      errors.push("VITE_SUPABASE_ANON_KEY cannot be empty");
    } else {
      const trimmedKey = key.trim();
      // Basic JWT structure validation
      if (!trimmedKey.startsWith('eyJ')) {
        errors.push("VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT (should start with 'eyJ')");
      } else {
        // Validate JWT structure (header.payload.signature)
        const jwtParts = trimmedKey.split('.');
        if (jwtParts.length !== 3) {
          errors.push("VITE_SUPABASE_ANON_KEY does not have valid JWT structure (should have 3 parts separated by dots)");
        }
      }
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Supabase configuration validation failed:\n${errors.map(e => `  • ${e}`).join('\n')}`;
    throw new Error(errorMessage);
  }

  return {
    url: url.trim(),
    key: key.trim()
  };
}

// Initialize environment validation
const { url: supabaseUrl, key: supabaseAnonKey } = validateEnvironmentVariables();

// Create protected fetch with migration support
const protectedFetch = createProtectedFetch();

// Enhanced client configuration
const clientConfig = {
  global: {
    fetch: protectedFetch,
  },
  auth: {
    // Enhanced auth configuration
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    // Additional security headers for auth requests
    headers: {
      'X-Client-Info': 'supabase-js-enhanced'
    }
  },
  realtime: {
    // Real-time configuration with protected headers
    headers: {
      'X-Client-Info': 'supabase-realtime-enhanced'
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000)
  },
  db: {
    // Database configuration
    schema: 'public',
  }
};

// Log protection status in development
if (import.meta.env.DEV) {
  logProtectionStatus();

  console.log('[Supabase Client Enhanced] Configuration:', {
    url: supabaseUrl.replace(/\/\/([^.]+)\./, '//***.'), // Mask subdomain for security
    keyLength: supabaseAnonKey.length,
    protectionEnabled: true,
    environment: import.meta.env.MODE
  });
}

// Create enhanced Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientConfig);

// Enhanced error handling for auth operations
const originalAuth = supabase.auth;

// Wrap auth methods with enhanced error handling
supabase.auth.signUp = new Proxy(originalAuth.signUp.bind(originalAuth), {
  async apply(target, thisArg, args) {
    try {
      return await target.apply(thisArg, args);
    } catch (error) {
      console.error('[Supabase Auth] SignUp failed:', error);

      // Check if it's a header sanitization issue
      if (error instanceof TypeError && error.message.includes('header')) {
        console.error('[Supabase Auth] Header sanitization may have caused auth failure');
      }

      throw error;
    }
  }
});

supabase.auth.signInWithPassword = new Proxy(originalAuth.signInWithPassword.bind(originalAuth), {
  async apply(target, thisArg, args) {
    try {
      return await target.apply(thisArg, args);
    } catch (error) {
      console.error('[Supabase Auth] SignIn failed:', error);

      // Check if it's a header sanitization issue
      if (error instanceof TypeError && error.message.includes('header')) {
        console.error('[Supabase Auth] Header sanitization may have caused auth failure');
      }

      throw error;
    }
  }
});

// Enhanced session monitoring
supabase.auth.onAuthStateChange((event, session) => {
  if (import.meta.env.DEV) {
    console.log('[Supabase Auth] State change:', {
      event,
      hasSession: !!session,
      userId: session?.user?.id?.slice(0, 8) + '...' || 'none'
    });
  }

  // Monitor for auth failures that might be related to header issues
  if (event === 'SIGNED_OUT' && session === null) {
    const lastError = (globalThis as any).__LAST_SUPABASE_ERROR__;
    if (lastError && lastError.message.includes('header')) {
      console.error('[Supabase Auth] Potential header sanitization related sign-out:', lastError);
    }
  }
});

// Wrap database operations with enhanced error handling
const originalFrom = supabase.from.bind(supabase);
supabase.from = new Proxy(originalFrom, {
  apply(target, thisArg, args) {
    const queryBuilder = target.apply(thisArg, args);

    // Wrap common query methods
    const methods = ['select', 'insert', 'update', 'delete', 'upsert'];

    methods.forEach(method => {
      if (typeof queryBuilder[method] === 'function') {
        queryBuilder[method] = new Proxy(queryBuilder[method], {
          apply(methodTarget, methodThisArg, methodArgs) {
            const result = methodTarget.apply(methodThisArg, methodArgs);

            // If this returns a promise (for execution methods), wrap with error handling
            if (result && typeof result.then === 'function') {
              return result.catch((error: any) => {
                console.error(`[Supabase DB] ${method} operation failed:`, error);

                // Store error for potential header-related debugging
                (globalThis as any).__LAST_SUPABASE_ERROR__ = error;

                throw error;
              });
            }

            return result;
          }
        });
      }
    });

    return queryBuilder;
  }
});

// Health check function for monitoring
export async function checkSupabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    auth: boolean;
    database: boolean;
    protectionActive: boolean;
    lastError?: string;
  };
}> {
  const health = {
    status: 'healthy' as const,
    details: {
      auth: false,
      database: false,
      protectionActive: true,
      lastError: undefined as string | undefined
    }
  };

  try {
    // Test auth endpoint
    const { error: authError } = await supabase.auth.getSession();
    health.details.auth = !authError;

    if (authError) {
      health.details.lastError = authError.message;
      health.status = 'degraded';
    }
  } catch (error) {
    health.details.auth = false;
    health.details.lastError = (error as Error).message;
    health.status = 'unhealthy';
  }

  try {
    // Test database connectivity with a simple query
    const { error: dbError } = await supabase
      .from('users') // Assuming users table exists
      .select('id')
      .limit(1)
      .maybeSingle();

    health.details.database = !dbError;

    if (dbError && !health.details.lastError) {
      health.details.lastError = dbError.message;
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    }
  } catch (error) {
    health.details.database = false;
    if (!health.details.lastError) {
      health.details.lastError = (error as Error).message;
    }
    health.status = 'unhealthy';
  }

  return health;
}

// Export migration status for monitoring
export { getMigrationStatus } from '@/lib/api-protection-migration';

// Export type definitions for enhanced client
export type SupabaseClient = typeof supabase;
export type HealthStatus = Awaited<ReturnType<typeof checkSupabaseHealth>>;

// Default export
export default supabase;