import { createClient } from "@supabase/supabase-js";
import { createProtectedFetch, logProtectionStatus } from "@/lib/api-protection";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Strict validation to prevent invalid header values
if (!supabaseUrl || typeof supabaseUrl !== 'string' || supabaseUrl.trim() === '') {
  throw new Error("Invalid VITE_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string' || supabaseAnonKey.trim() === '') {
  throw new Error("Invalid VITE_SUPABASE_ANON_KEY environment variable");
}

// Additional validation for URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error("VITE_SUPABASE_URL is not a valid URL");
}

// Additional validation for JWT format (basic check)
if (!supabaseAnonKey.startsWith('eyJ')) {
  throw new Error("VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT");
}

// Initialize API protection for Supabase
const protectedFetch = createProtectedFetch();

// Log protection status in development
logProtectionStatus();

export const supabase = createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
  global: {
    fetch: protectedFetch,
  },
});