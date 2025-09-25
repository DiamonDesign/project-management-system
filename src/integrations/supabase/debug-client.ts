import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced debugging for Supabase connection issues
console.group('🔍 Supabase Debug Client Initialization');
console.log('Environment:', import.meta.env.MODE);
console.log('URL:', supabaseUrl);
console.log('Key Length:', supabaseAnonKey?.length);
console.log('API Protection Disabled:', import.meta.env.VITE_API_PROTECTION === 'false');
console.groupEnd();

// Enhanced fetch wrapper with detailed logging
const debugFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString();
  const startTime = performance.now();

  console.group(`📡 Supabase Request: ${init?.method || 'GET'}`);
  console.log('URL:', url);
  console.log('Headers:', init?.headers ? Object.fromEntries(
    init.headers instanceof Headers
      ? Array.from(init.headers.entries())
      : Object.entries(init.headers)
  ) : 'None');

  try {
    const response = await fetch(input, init);
    const duration = performance.now() - startTime;

    console.log(`✅ Response: ${response.status} (${duration.toFixed(0)}ms)`);
    console.groupEnd();

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;

    console.error(`❌ Request Failed (${duration.toFixed(0)}ms):`, error);
    console.error('Error Details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.groupEnd();

    throw error;
  }
};

// Validate environment before creating client
function validateEnvironment() {
  const errors: string[] = [];

  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    errors.push('VITE_SUPABASE_URL is missing or invalid');
  } else {
    try {
      new URL(supabaseUrl);
    } catch {
      errors.push('VITE_SUPABASE_URL is not a valid URL');
    }
  }

  if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
    errors.push('VITE_SUPABASE_ANON_KEY is missing or invalid');
  } else if (!supabaseAnonKey.startsWith('eyJ')) {
    errors.push('VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT');
  }

  if (errors.length > 0) {
    console.error('🚨 Environment Validation Failed:', errors);
    throw new Error(`Supabase configuration invalid: ${errors.join(', ')}`);
  }

  console.log('✅ Environment validation passed');
}

// Validate environment first
validateEnvironment();

// Create Supabase client with debug fetch (only in development)
export const debugSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: import.meta.env.DEV ? debugFetch : fetch,
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage,
  },
});

// Test connection function
export async function testSupabaseConnection() {
  console.group('🧪 Testing Supabase Connection');

  try {
    // Test basic connection
    const { data, error } = await debugSupabase.from('projects').select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Connection test successful');
    return { success: true, data };

  } catch (error) {
    console.error('❌ Connection test threw error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    console.groupEnd();
  }
}

// Test authentication function
export async function testSupabaseAuth(email: string, password: string) {
  console.group('🔐 Testing Supabase Authentication');

  try {
    const { data, error } = await debugSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Auth test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Auth test successful', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Auth test threw error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    console.groupEnd();
  }
}