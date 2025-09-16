-- Migration to add archived functionality to projects table
-- Run this SQL in your Supabase SQL Editor

-- Add archived and archived_at columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for better performance when filtering archived projects
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(user_id, archived);

-- Create index for archived_at for better performance when ordering by archive date
CREATE INDEX IF NOT EXISTS idx_projects_archived_at ON projects(archived_at DESC) WHERE archived = true;

-- Update RLS policies to handle archived projects
-- First, create a helper function to check if user owns the project
CREATE OR REPLACE FUNCTION auth.user_owns_project(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the SELECT policy to allow users to see their archived projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Update the UPDATE policy to allow archiving/unarchiving
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Ensure users can still delete their own projects (including archived ones)
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Add a trigger to automatically set archived_at when archived is set to true
CREATE OR REPLACE FUNCTION set_archived_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.archived = true AND OLD.archived = false THEN
    NEW.archived_at = NOW();
  ELSIF NEW.archived = false THEN
    NEW.archived_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_archived_at ON projects;
CREATE TRIGGER trigger_set_archived_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_archived_at();

-- Comments for documentation
COMMENT ON COLUMN projects.archived IS 'Indicates if the project has been archived by the user';
COMMENT ON COLUMN projects.archived_at IS 'Timestamp when the project was archived';
COMMENT ON INDEX idx_projects_archived IS 'Index for efficient filtering of archived/active projects by user';
COMMENT ON INDEX idx_projects_archived_at IS 'Index for efficient ordering of archived projects by archive date';