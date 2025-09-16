// Supabase Database Connectivity Test
// Copy and paste this entire code block into browser console

async function testSupabaseConnection() {
  console.log('=== Supabase Connectivity Test ===');
  
  // Test environment variables
  console.log('Environment check:');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Test Supabase client import
  try {
    console.log('Testing Supabase client import...');
    const { createClient } = await import('@supabase/supabase-js');
    console.log('✅ Supabase client import successful');
  
  // Test client creation
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const client = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase client created successfully');
  
  // Test basic auth check
  console.log('Testing auth session...');
  const startTime = performance.now();
  
  const { data: authData, error: authError } = await client.auth.getSession();
  const authDuration = performance.now() - startTime;
  
  if (authError) {
    console.error('❌ Auth error:', authError);
  } else {
    console.log('✅ Auth check successful:', authDuration.toFixed(2) + 'ms');
    console.log('Session exists:', !!authData.session);
  }
  
  // Test database query with timeout
  console.log('Testing database query...');
  const queryStartTime = performance.now();
  
  // Create timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout after 10s')), 10000);
  });
  
  // Create query promise
  const queryPromise = client
    .from('projects')
    .select('id')
    .limit(1);
  
  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    const queryDuration = performance.now() - queryStartTime;
    
    if (result.error) {
      console.error('❌ Query error:', result.error);
    } else {
      console.log('✅ Database query successful:', queryDuration.toFixed(2) + 'ms');
      console.log('Records found:', result.data?.length || 0);
    }
  } catch (error) {
    const queryDuration = performance.now() - queryStartTime;
    if (error.message.includes('timeout')) {
      console.error('⏱️ Database query TIMEOUT after:', queryDuration.toFixed(2) + 'ms');
    } else {
      console.error('❌ Database query exception:', error);
    }
  }
  
  } catch (error) {
    console.error('❌ Import or setup error:', error);
    return false;
  }
}

// Export for global access and auto-run
window.testSupabaseConnection = testSupabaseConnection;

console.log('=== Test Function Ready ===');
console.log('Run: testSupabaseConnection() in console or wait for auto-execution...');

// Auto-run the test
testSupabaseConnection().then(result => {
  console.log('🏁 Test complete, result:', result ? 'SUCCESS' : 'FAILED');
}).catch(error => {
  console.error('💥 Test execution error:', error);
});