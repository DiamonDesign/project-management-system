-- Migration to add project_type column to projects table
-- Run this in Supabase SQL Editor

-- Add project_type column to projects table
ALTER TABLE projects 
ADD COLUMN project_type TEXT CHECK (project_type IN ('web', 'seo', 'marketing', 'branding', 'ecommerce', 'mobile', 'task', 'maintenance', 'other'));

-- Add comment to describe the column
COMMENT ON COLUMN projects.project_type IS 'Type of project: web, seo, marketing, branding, ecommerce, mobile, task, maintenance, or other';

-- Create index for better query performance on project type filtering
CREATE INDEX idx_projects_project_type ON projects(project_type);

-- Optional: Add some example data for existing projects (you can modify or skip this)
-- UPDATE projects SET project_type = 'web' WHERE name ILIKE '%web%' OR name ILIKE '%página%' OR name ILIKE '%sitio%';
-- UPDATE projects SET project_type = 'seo' WHERE name ILIKE '%seo%' OR name ILIKE '%posicionamiento%';
-- UPDATE projects SET project_type = 'marketing' WHERE name ILIKE '%marketing%' OR name ILIKE '%campaña%';

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'project_type';