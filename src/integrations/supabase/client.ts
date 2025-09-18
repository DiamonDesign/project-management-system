import { createClient } from "@supabase/supabase-js";

// TEMPORARY FIX: Hardcode values to bypass Vercel env var issue
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://nktdqpzxzouxcsvmijvt.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdGRxcHp4em91eGNzdm1panZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNzQ0MjMsImV4cCI6MjA3Mjg1MDQyM30.9-wSc9vwUOvWPzQl88mxIT0RwgVDm20GUedP9enI3Jk";

// DEBUGGING: Check if vars are loaded correctly in production (use console.error to bypass terser)
console.error('🔍 DEBUG SB URL ok?', !!supabaseUrl, 'anon len', supabaseAnonKey?.length);
console.error('🔍 DEBUG fetch type', typeof fetch);
console.error('🔍 DEBUG Using env vars?', !!import.meta.env.VITE_SUPABASE_URL);
console.error('🔍 DEBUG Actual URL:', supabaseUrl);
console.error('🔍 DEBUG Actual key length:', supabaseAnonKey?.length);

// MARCA INEQUÍVOCA EN RUNTIME
console.error('[SB-CLIENT] used-from', import.meta.url);
(window as any).__SB_CLIENT_MARK__ = 'used';

// PROTECTION: Store original fetch before extensions can override it
const originalFetch = window.fetch;
if (typeof originalFetch === 'function') {
  console.error('[SB-CLIENT] Protected fetch stored');
}

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

// Create Supabase client with validated configuration and extension protection
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: import.meta.env.DEV
  },
  global: {
    // PROTECTION: Use original fetch to bypass extension interference
    fetch: originalFetch
  }
});