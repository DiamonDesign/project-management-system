-- Safe Database Security Fixes
-- Execute these SQL commands in Supabase SQL Editor
-- This version checks for table existence before making changes

-- 1. FIRST, run the check script to see what tables exist:
-- /claudedocs/database-check-existing-tables.sql

-- 2. Create missing tables only if they don't exist

-- Create client_portal_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  invited_by_user_id UUID REFERENCES auth.users(id),
  invite_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_access TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_client_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  client_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add foreign key constraints only if tables and referenced tables exist
DO $$
BEGIN
  -- Add foreign key for project_client_assignments -> projects
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_client_assignments') THEN

    -- Check if constraint doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'fk_project_client_assignments_project_id') THEN
      ALTER TABLE project_client_assignments
      ADD CONSTRAINT fk_project_client_assignments_project_id
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Add foreign key for project_client_assignments -> clients
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_client_assignments') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'fk_project_client_assignments_client_id') THEN
      ALTER TABLE project_client_assignments
      ADD CONSTRAINT fk_project_client_assignments_client_id
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Add foreign key for client_portal_access -> clients
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_access') THEN

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'fk_client_portal_access_client_id') THEN
      ALTER TABLE client_portal_access
      ADD CONSTRAINT fk_client_portal_access_client_id
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 4. Create indexes for performance (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_access') THEN
    CREATE INDEX IF NOT EXISTS idx_client_portal_access_user_id ON client_portal_access(user_id);
    CREATE INDEX IF NOT EXISTS idx_client_portal_access_client_id ON client_portal_access(client_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_client_assignments') THEN
    CREATE INDEX IF NOT EXISTS idx_project_client_assignments_project_id ON project_client_assignments(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_client_assignments_client_id ON project_client_assignments(client_id);
  END IF;
END $$;

-- 5. Enable RLS on existing tables only
DO $$
BEGIN
  -- Enable RLS on existing tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_access') THEN
    ALTER TABLE client_portal_access ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_client_assignments') THEN
    ALTER TABLE project_client_assignments ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_users') THEN
    ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 6. Create RLS policies for existing tables
DO $$
BEGIN
  -- RLS Policies for client_portal_access
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_access') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can only access their own portal access" ON client_portal_access;

    CREATE POLICY "Users can only access their own portal access" ON client_portal_access
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- RLS Policies for project_client_assignments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_client_assignments') THEN
    DROP POLICY IF EXISTS "Users can only see assignments for their projects" ON project_client_assignments;

    CREATE POLICY "Users can only see assignments for their projects" ON project_client_assignments
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = project_client_assignments.project_id
          AND projects.user_id = auth.uid()
        )
      );
  END IF;

  -- RLS Policies for client_portal_users (if it exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_users') THEN
    DROP POLICY IF EXISTS "Users can manage their own client portal users" ON client_portal_users;
    DROP POLICY IF EXISTS "Client portal users can view their own records" ON client_portal_users;

    CREATE POLICY "Users can manage their own client portal users" ON client_portal_users
      FOR ALL USING (invited_by_user_id = auth.uid());

    CREATE POLICY "Client portal users can view their own records" ON client_portal_users
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- 7. Add check constraints for data integrity (only if tables exist)
DO $$
BEGIN
  -- Add check constraints for client_portal_users if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_users') THEN
    -- Check if constraint doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'chk_token_expires_at_future'
                   AND table_name = 'client_portal_users') THEN
      ALTER TABLE client_portal_users
      ADD CONSTRAINT chk_token_expires_at_future
      CHECK (token_expires_at > created_at);
    END IF;

    -- Add unique constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'uq_client_portal_users_user_client'
                   AND table_name = 'client_portal_users') THEN
      ALTER TABLE client_portal_users
      ADD CONSTRAINT uq_client_portal_users_user_client
      UNIQUE (user_id, client_id);
    END IF;
  END IF;

  -- Add email format check for clients if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'chk_email_format'
                   AND table_name = 'clients') THEN
      ALTER TABLE clients
      ADD CONSTRAINT chk_email_format
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;
  END IF;
END $$;

-- 8. Create security audit log table and triggers
CREATE TABLE IF NOT EXISTS security_audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit function
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

-- Add triggers for existing critical tables
DO $$
BEGIN
  -- Add trigger for client_portal_users if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_users') THEN
    DROP TRIGGER IF EXISTS tr_client_portal_users_audit ON client_portal_users;
    CREATE TRIGGER tr_client_portal_users_audit
      AFTER INSERT OR UPDATE OR DELETE ON client_portal_users
      FOR EACH ROW EXECUTE FUNCTION log_security_event();
  END IF;

  -- Add trigger for client_portal_access if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_portal_access') THEN
    DROP TRIGGER IF EXISTS tr_client_portal_access_audit ON client_portal_access;
    CREATE TRIGGER tr_client_portal_access_audit
      AFTER INSERT OR UPDATE OR DELETE ON client_portal_access
      FOR EACH ROW EXECUTE FUNCTION log_security_event();
  END IF;
END $$;

-- Final verification query
SELECT
  'SETUP COMPLETE' as status,
  'Check the results above for any errors' as message;

-- Show final table status
SELECT table_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = t.table_name
       ) THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (VALUES
  ('projects'),
  ('clients'),
  ('tasks'),
  ('notes'),
  ('profiles'),
  ('client_portal_users'),
  ('client_portal_access'),
  ('project_client_assignments'),
  ('security_audit_log')
) AS t(table_name)
ORDER BY table_name;