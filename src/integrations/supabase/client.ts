import { createClient } from "@supabase/supabase-js";

// Environment variable validation with detailed error messages
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Comprehensive validation function
function validateSupabaseConfig() {
  const errors: string[] = [];

  if (!supabaseUrl) {
    errors.push("VITE_SUPABASE_URL is not defined");
  } else if (typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('https://')) {
    errors.push(`VITE_SUPABASE_URL is invalid: "${supabaseUrl}" (expected https://...supabase.co)`);
  }

  if (!supabaseAnonKey) {
    errors.push("VITE_SUPABASE_ANON_KEY is not defined");
  } else if (typeof supabaseAnonKey !== 'string' || supabaseAnonKey.length < 100) {
    errors.push(`VITE_SUPABASE_ANON_KEY is invalid: length ${supabaseAnonKey?.length || 0} (expected >100 chars)`);
  }

  if (errors.length > 0) {
    const errorMessage = [
      "❌ Supabase configuration error:",
      ...errors.map(error => `   • ${error}`),
      "",
      "🔧 Fix in Vercel Dashboard:",
      "   1. Go to project settings > Environment Variables",
      "   2. Add missing variables for Production environment",
      "   3. Redeploy the application",
      "",
      `📊 Current values:`,
      `   VITE_SUPABASE_URL: ${supabaseUrl || 'undefined'}`,
      `   VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'}`
    ].join('\n');

    console.error(errorMessage);
    throw new Error(`Supabase configuration error: ${errors.join(', ')}`);
  }
}

// Validate configuration before creating client
validateSupabaseConfig();

// Create Supabase client with validated configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enhanced auth configuration for production
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Handle auth errors gracefully
    debug: import.meta.env.DEV // Only enable debug in development
  }
});