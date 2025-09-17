// Debug environment variables - REMOVE AFTER FIXING
console.log('🔍 Environment Debug:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
console.log('VITE_APP_URL:', import.meta.env.VITE_APP_URL);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);

// Validate Supabase URL format
const url = import.meta.env.VITE_SUPABASE_URL;
if (url && !url.startsWith('https://') && !url.endsWith('.supabase.co')) {
  console.error('❌ Invalid VITE_SUPABASE_URL format:', url);
}

// Validate anon key format (should be JWT)
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (key && !key.startsWith('eyJ')) {
  console.error('❌ Invalid VITE_SUPABASE_ANON_KEY format (should start with eyJ)');
}