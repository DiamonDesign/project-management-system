/**
 * Database Diagnostic Script
 * Check current state of tables and identify missing migration
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnosticCheck() {
  console.log('🔍 Running Database Diagnostic...');
  console.log('=======================================');

  try {
    // Test 1: Check if tasks table exists
    console.log('\n📋 Test 1: Checking if tasks table exists...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);

    if (tasksError) {
      if (tasksError.code === 'PGRST116' || tasksError.message.includes('does not exist')) {
        console.log('❌ tasks table does NOT exist');
        console.log(`   Error: ${tasksError.message}`);
      } else {
        console.log('⚠️  tasks table check failed with different error:');
        console.log(`   Code: ${tasksError.code}`);
        console.log(`   Message: ${tasksError.message}`);
      }
    } else {
      console.log('✅ tasks table EXISTS');
      console.log(`   Sample query returned ${tasksData?.length || 0} results`);
    }

    // Test 2: Check if projects table exists and has tasks JSON
    console.log('\n📋 Test 2: Checking projects table structure...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, tasks, project_type')
      .limit(1);

    if (projectsError) {
      console.log('❌ projects table check failed:');
      console.log(`   Code: ${projectsError.code}`);
      console.log(`   Message: ${projectsError.message}`);
    } else {
      console.log('✅ projects table EXISTS');
      if (projectsData && projectsData.length > 0) {
        const sample = projectsData[0];
        console.log(`   Sample project: ${sample.name || 'unnamed'}`);
        console.log(`   Has tasks JSON: ${sample.tasks ? 'YES' : 'NO'}`);
        console.log(`   Has project_type: ${sample.project_type ? 'YES' : 'NO'}`);

        if (sample.tasks) {
          const taskCount = Array.isArray(sample.tasks) ? sample.tasks.length : 'unknown';
          console.log(`   Tasks in JSON: ${taskCount}`);
        }
      } else {
        console.log('   No projects found in database');
      }
    }

    // Test 3: Check schema migration tracking tables
    console.log('\n📋 Test 3: Checking migration tracking tables...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('schema_migrations')
      .select('version, description, applied_at')
      .limit(5);

    if (schemaError) {
      if (schemaError.code === 'PGRST116') {
        console.log('❌ schema_migrations table does NOT exist');
      } else {
        console.log('⚠️  schema_migrations check failed:');
        console.log(`   Code: ${schemaError.code}`);
        console.log(`   Message: ${schemaError.message}`);
      }
    } else {
      console.log('✅ schema_migrations table EXISTS');
      if (schemaData && schemaData.length > 0) {
        console.log('   Applied migrations:');
        schemaData.forEach(migration => {
          console.log(`   - ${migration.version}: ${migration.description}`);
        });
      } else {
        console.log('   No migrations recorded');
      }
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }

  console.log('\n=======================================');
  console.log('🔍 Diagnostic Complete');
  console.log('\n💡 Next Steps:');
  console.log('   1. If tasks table missing: Run migration in Supabase Dashboard');
  console.log('   2. If projects has JSON tasks: Migration not executed yet');
  console.log('   3. Check scripts/MIGRATION_EXECUTION_PLAN.sql for manual execution');
}

diagnosticCheck();