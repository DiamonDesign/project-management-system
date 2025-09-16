-- Database Security Fixes
-- Execute these SQL commands in Supabase SQL Editor

-- 1. Add missing primary key constraints

-- First, check if primary keys already exist
-- Add primary key to client_portal_access if it doesn't have one
ALTER TABLE client_portal_access
ADD CONSTRAINT pk_client_portal_access
PRIMARY KEY (id);

-- Add primary key to project_client_assignments if it doesn't have one
ALTER TABLE project_client_assignments
ADD CONSTRAINT pk_project_client_assignments
PRIMARY KEY (id);

-- 2. Ensure all tables have proper primary keys
-- Check if any other tables are missing primary keys

-- 3. Add additional security constraints
-- Ensure user_id references are properly constrained
ALTER TABLE client_portal_access
ADD CONSTRAINT fk_client_portal_access_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE project_client_assignments
ADD CONSTRAINT fk_project_client_assignments_project_id
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE project_client_assignments
ADD CONSTRAINT fk_project_client_assignments_client_id
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- 4. Create indexes for better performance on foreign keys
CREATE INDEX IF NOT EXISTS idx_client_portal_access_user_id
ON client_portal_access(user_id);

CREATE INDEX IF NOT EXISTS idx_project_client_assignments_project_id
ON project_client_assignments(project_id);

CREATE INDEX IF NOT EXISTS idx_project_client_assignments_client_id
ON project_client_assignments(client_id);

-- 5. Add comprehensive RLS policies

-- Enable RLS on all tables if not already enabled
ALTER TABLE client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_portal_access
DROP POLICY IF EXISTS "Users can only access their own portal access" ON client_portal_access;
CREATE POLICY "Users can only access their own portal access" ON client_portal_access
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for project_client_assignments
DROP POLICY IF EXISTS "Users can only see assignments for their projects" ON project_client_assignments;
CREATE POLICY "Users can only see assignments for their projects" ON project_client_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_client_assignments.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for client_portal_users
DROP POLICY IF EXISTS "Users can manage their own client portal users" ON client_portal_users;
CREATE POLICY "Users can manage their own client portal users" ON client_portal_users
  FOR ALL USING (invited_by_user_id = auth.uid());

DROP POLICY IF EXISTS "Client portal users can view their own records" ON client_portal_users;
CREATE POLICY "Client portal users can view their own records" ON client_portal_users
  FOR SELECT USING (user_id = auth.uid());

-- 6. Additional security measures

-- Add check constraints for data integrity
ALTER TABLE client_portal_users
ADD CONSTRAINT chk_token_expires_at_future
CHECK (token_expires_at > created_at);

-- Ensure email format in clients table
ALTER TABLE clients
ADD CONSTRAINT chk_email_format
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add unique constraints where needed
ALTER TABLE client_portal_users
ADD CONSTRAINT uq_client_portal_users_user_client
UNIQUE (user_id, client_id);

-- 7. Create audit triggers for security monitoring

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO security_audit_log (
    table_name,
    operation,
    user_id,
    old_values,
    new_values,
    timestamp
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    NOW()
  );

  RETURN CASE
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Add triggers for critical tables
DROP TRIGGER IF EXISTS tr_client_portal_users_audit ON client_portal_users;
CREATE TRIGGER tr_client_portal_users_audit
  AFTER INSERT OR UPDATE OR DELETE ON client_portal_users
  FOR EACH ROW EXECUTE FUNCTION log_security_event();

DROP TRIGGER IF EXISTS tr_client_portal_access_audit ON client_portal_access;
CREATE TRIGGER tr_client_portal_access_audit
  AFTER INSERT OR UPDATE OR DELETE ON client_portal_access
  FOR EACH ROW EXECUTE FUNCTION log_security_event();