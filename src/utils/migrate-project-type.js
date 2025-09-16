// Simple migration script using supabase client
import { supabase } from '../integrations/supabase/client.js';

async function addProjectTypeColumn() {
  console.log('🔧 Adding project_type column to projects table...');
  
  try {
    // Try to add a project_type to test if column exists
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('project_type')
      .limit(1);
      
    if (testError && testError.message.includes('column "project_type" does not exist')) {
      console.log('❌ Column project_type does not exist. Please run this SQL in Supabase Dashboard:');
      console.log(`
ALTER TABLE projects 
ADD COLUMN project_type TEXT 
CHECK (project_type IN ('web', 'seo', 'marketing', 'branding', 'ecommerce', 'mobile', 'task', 'maintenance', 'other'));

CREATE INDEX idx_projects_project_type ON projects(project_type);
      `);
      return false;
    } else if (testError) {
      console.log('❌ Database error:', testError.message);
      return false;
    } else {
      console.log('✅ Column project_type already exists in database');
      return true;
    }
  } catch (error) {
    console.error('❌ Migration check failed:', error);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addProjectTypeColumn().then(success => {
    if (success) {
      console.log('✅ Migration check completed successfully');
    } else {
      console.log('❌ Migration needs to be run manually');
    }
    process.exit(0);
  });
}

export { addProjectTypeColumn };