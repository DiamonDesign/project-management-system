#!/usr/bin/env node

// Direct Supabase connectivity test using hardcoded credentials
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL not found in environment');
  process.exit(1);
}
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

console.log('🔍 Testing Supabase Database Connection');
console.log('📡 URL:', supabaseUrl);
console.log('🔑 Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n⏱️ Testing basic query with timeout...');
    const startTime = Date.now();
    
    // Test with 10 second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
    });
    
    const queryPromise = supabase
      .from('projects')
      .select('id, name')
      .limit(1);
    
    const result = await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    if (result.error) {
      console.log('❌ Database query error:', result.error.message);
      console.log('📊 Error details:', {
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint
      });
      return false;
    }
    
    console.log('✅ Query successful! Duration:', duration + 'ms');
    console.log('📊 Data returned:', result.data?.length || 0, 'records');
    return true;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.message.includes('timeout')) {
      console.log('⏱️ TIMEOUT after', duration + 'ms');
      console.log('🚨 This indicates network connectivity issues with Supabase');
    } else {
      console.log('❌ Connection error:', error.message);
    }
    return false;
  }
}

async function testAuth() {
  try {
    console.log('\n🔐 Testing auth connection...');
    const startTime = Date.now();
    
    const { data, error } = await supabase.auth.getUser();
    const duration = Date.now() - startTime;
    
    if (error) {
      console.log('❌ Auth error:', error.message);
      return false;
    }
    
    console.log('✅ Auth connection successful! Duration:', duration + 'ms');
    console.log('👤 User:', data?.user ? 'Logged in' : 'No user');
    return true;
    
  } catch (error) {
    console.log('❌ Auth connection failed:', error.message);
    return false;
  }
}

// Run tests
console.log('\n=== SUPABASE CONNECTION TEST ===');

Promise.all([
  testAuth(),
  testConnection()
]).then(([authResult, dbResult]) => {
  console.log('\n=== TEST RESULTS ===');
  console.log('🔐 Auth:', authResult ? '✅ PASS' : '❌ FAIL');
  console.log('🗄️ Database:', dbResult ? '✅ PASS' : '❌ FAIL');
  
  if (!authResult && !dbResult) {
    console.log('\n🚨 CRITICAL: Both auth and database are failing');
    console.log('💡 This suggests network connectivity issues with Supabase');
  } else if (!dbResult) {
    console.log('\n⚠️ WARNING: Database queries are timing out');
    console.log('💡 Check Supabase project status and database permissions');
  }
  
  process.exit(dbResult ? 0 : 1);
}).catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});