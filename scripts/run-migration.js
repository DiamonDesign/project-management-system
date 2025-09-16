import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need this for admin operations

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL not found in .env file');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Using anon key (limited permissions)');
  console.log('For schema changes, you may need to run this migration in Supabase Dashboard > SQL Editor');
  console.log('Migration file: scripts/add-project-type-migration.sql');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔧 Running project_type column migration...');

  try {
    // Read the migration SQL
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'add-project-type-migration.sql'), 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Try a simplified version
      console.log('🔄 Trying simplified migration...');
      
      const simplifiedSQL = `
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS project_type TEXT 
        CHECK (project_type IN ('web', 'seo', 'marketing', 'branding', 'ecommerce', 'mobile', 'task', 'maintenance', 'other'));
      `;
      
      const { error: simpleError } = await supabase.rpc('exec_sql', { 
        sql: simplifiedSQL 
      });
      
      if (simpleError) {
        console.error('❌ Simplified migration also failed:', simpleError.message);
        console.log('📋 Please run this SQL manually in Supabase Dashboard:');
        console.log(simplifiedSQL);
        process.exit(1);
      } else {
        console.log('✅ Simplified migration successful');
      }
    } else {
      console.log('✅ Migration completed successfully');
    }

    // Verify the column exists
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'projects')
      .eq('column_name', 'project_type');
    
    if (columns && columns.length > 0) {
      console.log('✅ project_type column verified in database');
    } else {
      console.log('⚠️  Could not verify project_type column');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    console.log('📋 Please run the migration manually in Supabase Dashboard > SQL Editor');
    console.log('Migration file: scripts/add-project-type-migration.sql');
  }
}

runMigration();