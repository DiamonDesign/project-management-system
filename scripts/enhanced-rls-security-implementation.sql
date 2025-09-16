-- ============================================================================
-- ENHANCED RLS SECURITY IMPLEMENTATION
-- Comprehensive security hardening for project management system
-- Execute step by step to verify each operation
-- ============================================================================

-- ============================================================================
-- STEP 1: BACKUP CURRENT POLICIES (View existing policies before changes)
-- ============================================================================

SELECT 
    'CURRENT POLICY BACKUP' as backup_step,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 2: CREATE SECURITY AUDIT INFRASTRUCTURE
-- ============================================================================

-- Create audit schema if not exists
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id),
    table_name text NOT NULL,
    operation text NOT NULL,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    session_id text,
    policy_violated text
);

-- Enable RLS on audit log (only admins can access)
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: ADD SECURITY COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Enhance profiles table with security tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone DEFAULT now();

-- Enhance client_portal_users table with security tracking
ALTER TABLE public.client_portal_users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.client_portal_users ADD COLUMN IF NOT EXISTS invited_at timestamp with time zone DEFAULT now();
ALTER TABLE public.client_portal_users ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id);
ALTER TABLE public.client_portal_users ADD COLUMN IF NOT EXISTS last_access timestamp with time zone;
ALTER TABLE public.client_portal_users ADD COLUMN IF NOT EXISTS access_token text;
ALTER TABLE public.client_portal_users ADD COLUMN IF NOT EXISTS token_expires_at timestamp with time zone;

-- Add project access tracking
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_confidential boolean DEFAULT false;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'normal' CHECK (access_level IN ('normal', 'confidential', 'restricted'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_accessed timestamp with time zone;

-- ============================================================================
-- STEP 4: CREATE SECURITY FUNCTIONS
-- ============================================================================

-- Function to validate user roles and permissions
CREATE OR REPLACE FUNCTION auth.validate_user_role(required_role text)
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = auth.uid();
    
    RETURN COALESCE(user_role, 'freelancer') = required_role;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate client portal access to specific projects  
CREATE OR REPLACE FUNCTION auth.validate_client_project_access(project_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.projects proj
        JOIN public.client_portal_users cpu ON cpu.client_id = proj.client_id
        WHERE proj.id = project_id
        AND cpu.user_id = auth.uid()
        AND cpu.is_active = true
        AND (cpu.token_expires_at IS NULL OR cpu.token_expires_at > now())
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is a client portal user
CREATE OR REPLACE FUNCTION auth.is_client_portal_user()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() 
        AND p.client_portal_access->>'is_client' = 'true'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION audit.log_security_event(
    p_table_name text,
    p_operation text,
    p_record_id uuid DEFAULT NULL,
    p_old_values jsonb DEFAULT NULL,
    p_new_values jsonb DEFAULT NULL,
    p_policy_violated text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.security_audit_log (
        user_id, table_name, operation, record_id, old_values, new_values, policy_violated, session_id
    ) VALUES (
        auth.uid(),
        p_table_name,
        p_operation,
        p_record_id,
        p_old_values,
        p_new_values,
        p_policy_violated,
        current_setting('request.headers')::json->>'authorization'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if audit logging fails
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: DROP ALL EXISTING POLICIES (Clean Slate)
-- ============================================================================

DO $$ 
DECLARE
    pol_record RECORD;
BEGIN
    -- Drop all existing policies on our tables
    FOR pol_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol_record.policyname, 
                      pol_record.schemaname, 
                      pol_record.tablename);
    END LOOP;
    
    RAISE NOTICE 'All existing policies dropped successfully';
END $$;

-- ============================================================================
-- STEP 6: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: IMPLEMENT ENHANCED RLS POLICIES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES TABLE POLICIES - Enhanced Security
-- -----------------------------------------------------------------------------

-- Policy 1: Users can only access their own profile
CREATE POLICY "profiles_self_access_only" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can only update their own profile (with restrictions)
CREATE POLICY "profiles_self_update_restricted" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND
    -- Prevent clients from changing critical fields
    (NOT auth.is_client_portal_user() OR 
     (OLD.role = NEW.role AND OLD.client_portal_access = NEW.client_portal_access))
);

-- Policy 3: Profile creation with role validation
CREATE POLICY "profiles_creation_validated" 
ON public.profiles
FOR INSERT 
TO authenticated
WITH CHECK (
    auth.uid() = id AND 
    role IN ('freelancer', 'client', 'admin') AND
    (role != 'admin' OR auth.validate_user_role('admin'))
);

-- Policy 4: Only admins can delete profiles
CREATE POLICY "profiles_admin_delete_only" 
ON public.profiles
FOR DELETE 
TO authenticated
USING (auth.validate_user_role('admin'));

-- -----------------------------------------------------------------------------
-- PROJECTS TABLE POLICIES - Multi-Access Model
-- -----------------------------------------------------------------------------

-- Policy 1: Project owners have full access
CREATE POLICY "projects_owner_full_access" 
ON public.projects
FOR ALL 
TO authenticated
USING (auth.uid() = user_id AND NOT auth.is_client_portal_user())
WITH CHECK (auth.uid() = user_id AND NOT auth.is_client_portal_user());

-- Policy 2: Client portal users can view assigned projects (READ-ONLY)
CREATE POLICY "projects_client_portal_read_access" 
ON public.projects
FOR SELECT 
TO authenticated
USING (
    auth.is_client_portal_user() AND
    client_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.client_portal_users cpu 
        WHERE cpu.client_id = projects.client_id 
        AND cpu.user_id = auth.uid()
        AND cpu.is_active = true
        AND (cpu.token_expires_at IS NULL OR cpu.token_expires_at > now())
    ) AND
    -- Exclude confidential projects unless explicitly granted
    (access_level != 'confidential' OR 
     EXISTS (
         SELECT 1 FROM public.client_portal_users cpu
         WHERE cpu.client_id = projects.client_id 
         AND cpu.user_id = auth.uid()
         AND cpu.access_token IS NOT NULL
     ))
);

-- Policy 3: Prevent client portal users from modifying projects
CREATE POLICY "projects_client_portal_no_modification" 
ON public.projects
FOR INSERT, UPDATE, DELETE
TO authenticated
WITH CHECK (NOT auth.is_client_portal_user());

-- -----------------------------------------------------------------------------
-- CLIENTS TABLE POLICIES - Owner Protection
-- -----------------------------------------------------------------------------

-- Policy 1: Only project owners can access client data
CREATE POLICY "clients_owner_access_only" 
ON public.clients
FOR ALL 
TO authenticated
USING (auth.uid() = user_id AND NOT auth.is_client_portal_user())
WITH CHECK (auth.uid() = user_id AND NOT auth.is_client_portal_user());

-- Policy 2: Admins can view all clients for management
CREATE POLICY "clients_admin_read_access" 
ON public.clients
FOR SELECT 
TO authenticated
USING (auth.validate_user_role('admin'));

-- -----------------------------------------------------------------------------
-- CLIENT_PORTAL_USERS TABLE POLICIES - Strict Validation
-- -----------------------------------------------------------------------------

-- Policy 1: Users can only see their own client portal mapping
CREATE POLICY "client_portal_users_self_access" 
ON public.client_portal_users
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id AND is_active = true);

-- Policy 2: Only project owners can manage client portal users for their clients
CREATE POLICY "client_portal_users_owner_management" 
ON public.client_portal_users
FOR INSERT, UPDATE
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_id 
        AND c.user_id = auth.uid()
    ) AND
    NOT auth.is_client_portal_user()
);

-- Policy 3: Only owners can delete client portal access
CREATE POLICY "client_portal_users_owner_delete" 
ON public.client_portal_users
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_id 
        AND c.user_id = auth.uid()
    ) AND
    NOT auth.is_client_portal_user()
);

-- Policy 4: Prevent self-assignment to client portal
CREATE POLICY "client_portal_users_no_self_assignment" 
ON public.client_portal_users
FOR INSERT, UPDATE
TO authenticated
WITH CHECK (auth.uid() != user_id);

-- -----------------------------------------------------------------------------
-- AUDIT LOG TABLE POLICIES
-- -----------------------------------------------------------------------------

-- Only system admins can access audit logs
CREATE POLICY "audit_log_admin_only" 
ON public.security_audit_log
FOR ALL 
TO authenticated
USING (auth.validate_user_role('admin'))
WITH CHECK (auth.validate_user_role('admin'));

-- ============================================================================
-- STEP 8: CREATE SECURITY TRIGGERS
-- ============================================================================

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit.trigger_security_audit()
RETURNS trigger AS $$
BEGIN
    -- Log the security event
    PERFORM audit.log_security_event(
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the operation if audit fails
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security validation trigger function
CREATE OR REPLACE FUNCTION auth.trigger_prevent_privilege_escalation()
RETURNS trigger AS $$
BEGIN
    -- Prevent clients from changing their role
    IF auth.is_client_portal_user() AND NEW.role != OLD.role THEN
        PERFORM audit.log_security_event(
            'profiles', 'PRIVILEGE_ESCALATION_ATTEMPT', NEW.id, 
            to_jsonb(OLD), to_jsonb(NEW), 'Client attempted role change'
        );
        RAISE EXCEPTION 'SECURITY VIOLATION: Client portal users cannot change their role';
    END IF;
    
    -- Prevent unauthorized role assignments to admin
    IF NEW.role = 'admin' AND OLD.role != 'admin' AND NOT auth.validate_user_role('admin') THEN
        PERFORM audit.log_security_event(
            'profiles', 'UNAUTHORIZED_ADMIN_ASSIGNMENT', NEW.id, 
            to_jsonb(OLD), to_jsonb(NEW), 'Unauthorized admin role assignment attempt'
        );
        RAISE EXCEPTION 'SECURITY VIOLATION: Insufficient privileges to assign admin role';
    END IF;
    
    -- Update last login when login_count changes
    IF NEW.login_count > OLD.login_count THEN
        NEW.last_login := now();
        NEW.failed_login_attempts := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_projects_changes ON public.projects;
CREATE TRIGGER audit_projects_changes 
    AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_security_audit();

DROP TRIGGER IF EXISTS audit_client_portal_changes ON public.client_portal_users;
CREATE TRIGGER audit_client_portal_changes 
    AFTER INSERT OR UPDATE OR DELETE ON public.client_portal_users
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_security_audit();

DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
CREATE TRIGGER audit_profiles_changes 
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_security_audit();

-- Apply security validation trigger
DROP TRIGGER IF EXISTS validate_profile_security ON public.profiles;
CREATE TRIGGER validate_profile_security 
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION auth.trigger_prevent_privilege_escalation();

-- ============================================================================
-- STEP 9: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role) WHERE role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_client_portal ON public.profiles(id) WHERE client_portal_access->>'is_client' = 'true';

CREATE INDEX IF NOT EXISTS idx_projects_user_client ON public.projects(user_id, client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_access_level ON public.projects(client_id, access_level) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_portal_active ON public.client_portal_users(user_id, client_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_client_portal_token_expiry ON public.client_portal_users(client_id, token_expires_at) WHERE token_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_user_time ON public.security_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_table_op ON public.security_audit_log(table_name, operation, created_at DESC);

-- ============================================================================
-- STEP 10: VERIFY IMPLEMENTATION
-- ============================================================================

-- Check RLS status
SELECT 
    'RLS STATUS CHECK' as verification_step,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE pg_policies.tablename = pg_tables.tablename
    ) as policy_count
FROM pg_tables 
WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users', 'security_audit_log')
ORDER BY tablename;

-- Check all new policies
SELECT 
    'NEW POLICIES VERIFICATION' as verification_step,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users', 'security_audit_log')
ORDER BY tablename, policyname;

-- Check security functions
SELECT 
    'SECURITY FUNCTIONS' as verification_step,
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'auth' AND routine_name LIKE '%validate%'
ORDER BY routine_name;

-- ============================================================================
-- STEP 11: SECURITY TESTING FRAMEWORK
-- ============================================================================

-- Create test framework for validating RLS policies
CREATE OR REPLACE FUNCTION test.validate_rls_policies()
RETURNS TABLE(
    test_name text,
    test_result text,
    expected_result text,
    status text
) AS $$
DECLARE
    test_user_id uuid;
    test_count integer;
BEGIN
    -- Test 1: User data isolation
    SELECT auth.uid() INTO test_user_id;
    
    SELECT COUNT(*) INTO test_count FROM public.projects WHERE user_id != test_user_id;
    RETURN QUERY SELECT 
        'User Data Isolation'::text,
        test_count::text,
        '0'::text,
        CASE WHEN test_count = 0 THEN 'PASS' ELSE 'FAIL' END::text;
    
    -- Test 2: Client portal access validation
    IF auth.is_client_portal_user() THEN
        SELECT COUNT(*) INTO test_count FROM public.clients;
        RETURN QUERY SELECT 
            'Client Portal Access Restriction'::text,
            test_count::text,
            '0'::text,
            CASE WHEN test_count = 0 THEN 'PASS' ELSE 'FAIL' END::text;
    END IF;
    
    -- Test 3: Profile access validation
    SELECT COUNT(*) INTO test_count FROM public.profiles WHERE id != test_user_id;
    RETURN QUERY SELECT 
        'Profile Access Isolation'::text,
        test_count::text,
        '0'::text,
        CASE WHEN test_count = 0 THEN 'PASS' ELSE 'FAIL' END::text;
        
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- IMPLEMENTATION COMPLETE
-- ============================================================================

SELECT 
    '🔐 ENHANCED RLS SECURITY IMPLEMENTATION COMPLETE' as status,
    now() as completed_at,
    'Execute test.validate_rls_policies() to run security tests' as next_step;

-- ============================================================================
-- ROLLBACK SCRIPT (In case of issues)
-- ============================================================================

/*
-- EMERGENCY ROLLBACK SCRIPT
-- Only use if there are critical issues with the new policies

-- Drop all new policies
DROP POLICY IF EXISTS "profiles_self_access_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update_restricted" ON public.profiles;
DROP POLICY IF EXISTS "profiles_creation_validated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete_only" ON public.profiles;

DROP POLICY IF EXISTS "projects_owner_full_access" ON public.projects;
DROP POLICY IF EXISTS "projects_client_portal_read_access" ON public.projects;
DROP POLICY IF EXISTS "projects_client_portal_no_modification" ON public.projects;

DROP POLICY IF EXISTS "clients_owner_access_only" ON public.clients;
DROP POLICY IF EXISTS "clients_admin_read_access" ON public.clients;

DROP POLICY IF EXISTS "client_portal_users_self_access" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_owner_management" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_owner_delete" ON public.client_portal_users;
DROP POLICY IF EXISTS "client_portal_users_no_self_assignment" ON public.client_portal_users;

DROP POLICY IF EXISTS "audit_log_admin_only" ON public.security_audit_log;

-- Restore basic policies
CREATE POLICY "temp_emergency_access" ON public.projects FOR ALL TO authenticated USING (true);
CREATE POLICY "temp_emergency_access" ON public.clients FOR ALL TO authenticated USING (true);
CREATE POLICY "temp_emergency_access" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "temp_emergency_access" ON public.client_portal_users FOR ALL TO authenticated USING (true);
*/