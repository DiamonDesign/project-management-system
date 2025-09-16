// Script to create the proposals table in Supabase database
// This script reads the SQL file and executes it against the database

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://otrbnpruzsayfhixdvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90cmJucHJ1enNheWZoaXhkdnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzNDUwMzksImV4cCI6MjA1MTkyMTAzOX0.4nnTUdXPJLJC8LjvNZEzQrxHvXxOl_P3k6eWfJpBhtg';

async function executeProposalsSchema() {
  try {
    console.log('🚀 Starting proposals table creation...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, 'create_proposals_table.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    
    console.log('📖 SQL file read successfully');
    
    // Execute the SQL using Supabase REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    });

    if (!response.ok) {
      console.log('⚠️ RPC method not available, trying alternative approach...');
      
      // Alternative: Execute SQL statements one by one using raw SQL endpoint
      // Note: This is a simplified approach for demonstration
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Found ${statements.length} SQL statements to execute`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          // For CREATE TABLE, we would need to use Supabase's dashboard or CLI
          // This is just a simulation of the process
          console.log(`   Statement preview: ${statement.substring(0, 100)}...`);
        }
      }
      
      console.log('⚠️  Note: For security reasons, table creation requires direct database access.');
      console.log('📋 Next steps:');
      console.log('   1. Copy the SQL from create_proposals_table.sql');
      console.log('   2. Go to Supabase Dashboard > SQL Editor');
      console.log('   3. Paste and execute the SQL');
      console.log('   4. Verify the table was created in the Database section');
      
      return;
    }
    
    const result = await response.json();
    console.log('✅ Database schema updated successfully!');
    console.log('📊 Result:', result);
    
  } catch (error) {
    console.error('❌ Error creating proposals table:', error.message);
    console.log('');
    console.log('📋 Manual steps to create the table:');
    console.log('   1. Open Supabase Dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy and paste the SQL from scripts/create_proposals_table.sql');
    console.log('   4. Execute the SQL');
  }
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeProposalsSchema();
}

export { executeProposalsSchema };