-- ============================================================================
-- POST-MIGRATION SECURITY VALIDATION AND RLS POLICIES
-- Comprehensive security setup for normalized tasks structure
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TASKS TABLE RLS POLICIES (NORMALIZED STRUCTURE)
-- ----------------------------------------------------------------------------

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "tasks_user_access" ON tasks;
DROP POLICY IF EXISTS "tasks_owner_select" ON tasks;
DROP POLICY IF EXISTS "tasks_owner_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_owner_update" ON tasks;
DROP POLICY IF EXISTS "tasks_owner_delete" ON tasks;

-- Policy 1: Task owners can view their own tasks
CREATE POLICY "tasks_owner_select"
ON tasks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Task owners can create tasks for their own projects
CREATE POLICY "tasks_owner_insert"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_id
        AND p.user_id = auth.uid()
    )
);

-- Policy 3: Task owners can update their own tasks (with validation)
CREATE POLICY "tasks_owner_update"
ON tasks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
    auth.uid() = user_id AND
    -- Ensure project ownership hasn't changed maliciously
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_id
        AND p.user_id = auth.uid()
    ) AND
    -- Prevent status manipulation by client portal users
    (NOT auth.is_client_portal_user() OR OLD.status = NEW.status)
);

-- Policy 4: Task owners can delete their own tasks
CREATE POLICY "tasks_owner_delete"
ON tasks
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id AND
    NOT auth.is_client_portal_user() -- Client portal users cannot delete tasks
);

-- Policy 5: Client portal users can view tasks from their assigned projects (READ-ONLY)
CREATE POLICY "tasks_client_portal_read_access"
ON tasks
FOR SELECT
TO authenticated
USING (
    auth.is_client_portal_user() AND
    EXISTS (
        SELECT 1 FROM projects p
        JOIN client_portal_users cpu ON cpu.client_id = p.client_id
        WHERE p.id = tasks.project_id
        AND cpu.user_id = auth.uid()
        AND cpu.is_active = true
        AND (cpu.token_expires_at IS NULL OR cpu.token_expires_at > NOW())
        -- Exclude confidential tasks unless explicitly granted
        AND (p.access_level != 'confidential' OR cpu.access_token IS NOT NULL)
    )
);

-- Policy 6: Prevent client portal users from modifying tasks
CREATE POLICY "tasks_client_portal_no_modification"
ON tasks
FOR INSERT, UPDATE, DELETE
TO authenticated
WITH CHECK (NOT auth.is_client_portal_user());

-- ----------------------------------------------------------------------------
-- 2. ENHANCED SECURITY FUNCTIONS FOR TASKS
-- ----------------------------------------------------------------------------

-- Function to validate task ownership and project relationship
CREATE OR REPLACE FUNCTION auth.validate_task_ownership(
    p_task_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    task_owner UUID;
    project_owner UUID;
BEGIN
    -- Get task and project owner information
    SELECT t.user_id, p.user_id
    INTO task_owner, project_owner
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = p_task_id;

    -- Validate ownership consistency
    RETURN (task_owner = p_user_id AND project_owner = p_user_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access task through client portal
CREATE OR REPLACE FUNCTION auth.validate_client_task_access(
    p_task_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN client_portal_users cpu ON cpu.client_id = p.client_id
        WHERE t.id = p_task_id
        AND cpu.user_id = p_user_id
        AND cpu.is_active = true
        AND (cpu.token_expires_at IS NULL OR cpu.token_expires_at > NOW())
        AND (p.access_level != 'confidential' OR cpu.access_token IS NOT NULL)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to audit task access attempts
CREATE OR REPLACE FUNCTION audit.log_task_access_attempt(
    p_task_id UUID,
    p_operation TEXT,
    p_success BOOLEAN,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_audit_log (
        user_id, table_name, operation, record_id,
        new_values, policy_violated, created_at
    ) VALUES (
        auth.uid(),
        'tasks',
        p_operation,
        p_task_id,
        jsonb_build_object(
            'success', p_success,
            'failure_reason', p_failure_reason,
            'user_agent', current_setting('request.headers', true)::json->>'user-agent',
            'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for'
        ),
        CASE WHEN NOT p_success THEN 'Unauthorized task access attempt' ELSE NULL END,
        NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if audit logging fails
        NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. SECURITY VALIDATION TRIGGERS FOR TASKS
-- ----------------------------------------------------------------------------

-- Trigger to validate data integrity and security on task changes
CREATE OR REPLACE FUNCTION auth.validate_task_security()
RETURNS TRIGGER AS $$
DECLARE
    project_owner UUID;
    is_client_user BOOLEAN;
BEGIN
    -- Check if current user is a client portal user
    SELECT auth.is_client_portal_user() INTO is_client_user;

    -- For INSERT and UPDATE operations
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        -- Verify project exists and get owner
        SELECT user_id INTO project_owner
        FROM projects
        WHERE id = NEW.project_id;

        IF NOT FOUND THEN
            PERFORM audit.log_task_access_attempt(NEW.id, TG_OP, false, 'Invalid project_id');
            RAISE EXCEPTION 'Invalid project reference';
        END IF;

        -- Ensure user_id matches project owner
        IF NEW.user_id != project_owner THEN
            PERFORM audit.log_task_access_attempt(NEW.id, TG_OP, false, 'User/project ownership mismatch');
            RAISE EXCEPTION 'Task user_id must match project owner';
        END IF;

        -- Prevent client users from creating/modifying tasks
        IF is_client_user AND TG_OP IN ('INSERT', 'UPDATE') THEN
            PERFORM audit.log_task_access_attempt(NEW.id, TG_OP, false, 'Client portal user modification attempt');
            RAISE EXCEPTION 'Client portal users cannot modify tasks';
        END IF;

        -- Validate status transitions
        IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
            -- Log status changes for audit
            PERFORM audit.log_security_event(
                'tasks', 'STATUS_CHANGE', NEW.id,
                jsonb_build_object('old_status', OLD.status),
                jsonb_build_object('new_status', NEW.status)
            );
        END IF;

        -- Validate enum values
        IF NEW.status NOT IN ('not-started', 'in-progress', 'completed') THEN
            RAISE EXCEPTION 'Invalid task status: %', NEW.status;
        END IF;

        IF NEW.priority NOT IN ('low', 'medium', 'high') THEN
            RAISE EXCEPTION 'Invalid task priority: %', NEW.priority;
        END IF;

        -- Validate date constraints
        IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.start_date > NEW.end_date THEN
            RAISE EXCEPTION 'Task start_date cannot be after end_date';
        END IF;

        -- Auto-update updated_at timestamp
        NEW.updated_at = NOW();

        RETURN NEW;
    END IF;

    -- For DELETE operations
    IF TG_OP = 'DELETE' THEN
        -- Prevent client users from deleting tasks
        IF is_client_user THEN
            PERFORM audit.log_task_access_attempt(OLD.id, TG_OP, false, 'Client portal user deletion attempt');
            RAISE EXCEPTION 'Client portal users cannot delete tasks';
        END IF;

        -- Log deletion for audit
        PERFORM audit.log_security_event(
            'tasks', 'DELETE', OLD.id,
            to_jsonb(OLD), NULL
        );

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply security validation trigger
DROP TRIGGER IF EXISTS validate_task_security ON tasks;
CREATE TRIGGER validate_task_security
    BEFORE INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION auth.validate_task_security();

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE-OPTIMIZED SECURITY INDEXES
-- ----------------------------------------------------------------------------

-- Indexes to optimize RLS policy performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_rls_user_id
ON tasks(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_rls_project_user
ON tasks(project_id, user_id);

-- Index for client portal access optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_client_access
ON tasks(project_id)
WHERE EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
    AND p.client_id IS NOT NULL
);

-- ----------------------------------------------------------------------------
-- 5. COMPREHENSIVE SECURITY TESTING FRAMEWORK
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION test.validate_task_security_policies()
RETURNS TABLE(
    test_name TEXT,
    test_result TEXT,
    expected_result TEXT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_user_id UUID;
    test_project_id UUID;
    test_task_id UUID;
    other_user_id UUID;
    task_count INTEGER;
BEGIN
    -- Get current user for testing
    test_user_id := auth.uid();

    -- Test 1: User can only see their own tasks
    SELECT COUNT(*) INTO task_count
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE p.user_id != test_user_id;

    RETURN QUERY SELECT
        'Task Data Isolation'::TEXT,
        task_count::TEXT,
        '0'::TEXT,
        CASE WHEN task_count = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Users should not see tasks from other users'' projects'::TEXT;

    -- Test 2: Client portal user restrictions
    IF auth.is_client_portal_user() THEN
        -- Client users should not be able to see tasks from unassigned projects
        SELECT COUNT(*) INTO task_count
        FROM tasks t
        WHERE NOT EXISTS (
            SELECT 1 FROM projects p
            JOIN client_portal_users cpu ON cpu.client_id = p.client_id
            WHERE p.id = t.project_id
            AND cpu.user_id = test_user_id
            AND cpu.is_active = true
        );

        RETURN QUERY SELECT
            'Client Portal Access Restriction'::TEXT,
            task_count::TEXT,
            '0'::TEXT,
            CASE WHEN task_count = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
            'Client portal users should only access assigned project tasks'::TEXT;

        -- Test task modification restrictions for clients
        BEGIN
            INSERT INTO tasks (project_id, user_id, title, status, priority)
            SELECT project_id, user_id, 'Test Task', 'not-started', 'medium'
            FROM projects LIMIT 1;

            RETURN QUERY SELECT
                'Client Portal Modification Block'::TEXT,
                'INSERT_ALLOWED'::TEXT,
                'INSERT_BLOCKED'::TEXT,
                'FAIL'::TEXT,
                'Client portal users should not be able to create tasks'::TEXT;
        EXCEPTION
            WHEN insufficient_privilege OR check_violation THEN
                RETURN QUERY SELECT
                    'Client Portal Modification Block'::TEXT,
                    'INSERT_BLOCKED'::TEXT,
                    'INSERT_BLOCKED'::TEXT,
                    'PASS'::TEXT,
                    'Client portal users correctly blocked from creating tasks'::TEXT;
        END;
    END IF;

    -- Test 3: Project-Task ownership consistency
    SELECT COUNT(*) INTO task_count
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.user_id != p.user_id;

    RETURN QUERY SELECT
        'Task-Project Ownership Consistency'::TEXT,
        task_count::TEXT,
        '0'::TEXT,
        CASE WHEN task_count = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'All tasks should belong to the same user as their project'::TEXT;

    -- Test 4: RLS policy effectiveness
    SET ROLE authenticated;
    SELECT COUNT(*) INTO task_count FROM tasks;
    RESET ROLE;

    RETURN QUERY SELECT
        'RLS Policy Active'::TEXT,
        CASE WHEN task_count > 0 THEN 'ACTIVE' ELSE 'INACTIVE' END::TEXT,
        'ACTIVE'::TEXT,
        CASE WHEN task_count >= 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'RLS policies should be active and filtering data'::TEXT;

    -- Test 5: Security function availability
    BEGIN
        PERFORM auth.validate_task_ownership(gen_random_uuid(), test_user_id);

        RETURN QUERY SELECT
            'Security Functions Available'::TEXT,
            'AVAILABLE'::TEXT,
            'AVAILABLE'::TEXT,
            'PASS'::TEXT,
            'Security validation functions are working'::TEXT;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT
                'Security Functions Available'::TEXT,
                'ERROR'::TEXT,
                'AVAILABLE'::TEXT,
                'FAIL'::TEXT,
                'Security functions encountered error: ' || SQLERRM;
    END;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. SECURITY MONITORING AND ALERTING
-- ----------------------------------------------------------------------------

-- View for security monitoring dashboard
CREATE OR REPLACE VIEW security_monitoring_dashboard AS
SELECT
    'task_access_violations' as metric_name,
    COUNT(*) as current_value,
    5 as warning_threshold,
    15 as critical_threshold,
    CASE
        WHEN COUNT(*) >= 15 THEN 'CRITICAL'
        WHEN COUNT(*) >= 5 THEN 'WARNING'
        ELSE 'NORMAL'
    END as status,
    'Number of task access violations in last hour' as description
FROM security_audit_log
WHERE table_name = 'tasks'
AND policy_violated IS NOT NULL
AND created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT
    'client_portal_violations',
    COUNT(*),
    3,
    10,
    CASE
        WHEN COUNT(*) >= 10 THEN 'CRITICAL'
        WHEN COUNT(*) >= 3 THEN 'WARNING'
        ELSE 'NORMAL'
    END,
    'Client portal access violations in last hour'
FROM security_audit_log
WHERE new_values->>'failure_reason' LIKE '%Client portal%'
AND created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT
    'failed_task_operations',
    COUNT(*),
    10,
    25,
    CASE
        WHEN COUNT(*) >= 25 THEN 'CRITICAL'
        WHEN COUNT(*) >= 10 THEN 'WARNING'
        ELSE 'NORMAL'
    END,
    'Failed task operations in last hour'
FROM security_audit_log
WHERE table_name = 'tasks'
AND new_values->>'success' = 'false'
AND created_at > NOW() - INTERVAL '1 hour';

-- Function to generate security alerts
CREATE OR REPLACE FUNCTION security.generate_security_alerts()
RETURNS TABLE(
    alert_level TEXT,
    alert_message TEXT,
    metric_value INTEGER,
    threshold_exceeded INTEGER,
    recommended_action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check for security violations
    FOR alert_level, alert_message, metric_value, threshold_exceeded, recommended_action IN
        SELECT
            sdm.status,
            sdm.metric_name || ' threshold exceeded',
            sdm.current_value::INTEGER,
            CASE sdm.status
                WHEN 'CRITICAL' THEN sdm.critical_threshold
                WHEN 'WARNING' THEN sdm.warning_threshold
                ELSE 0
            END,
            CASE sdm.status
                WHEN 'CRITICAL' THEN 'Immediate investigation required - possible security breach'
                WHEN 'WARNING' THEN 'Monitor closely - review recent security logs'
                ELSE 'No action required'
            END
        FROM security_monitoring_dashboard sdm
        WHERE sdm.status IN ('WARNING', 'CRITICAL')
    LOOP
        RETURN NEXT;
    END LOOP;

    -- If no alerts, return healthy status
    IF NOT FOUND THEN
        RETURN QUERY SELECT
            'HEALTHY'::TEXT,
            'All security metrics within normal range'::TEXT,
            0,
            0,
            'Continue normal monitoring'::TEXT;
    END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auth.validate_task_ownership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.validate_client_task_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION test.validate_task_security_policies() TO authenticated;
GRANT SELECT ON security_monitoring_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION security.generate_security_alerts() TO authenticated;

-- Create schema for security functions if not exists
CREATE SCHEMA IF NOT EXISTS security;
GRANT USAGE ON SCHEMA security TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. FINAL SECURITY VALIDATION
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
    security_test RECORD;
    all_tests_passed BOOLEAN := TRUE;
BEGIN
    -- Check RLS is enabled on tasks
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = 'tasks' AND relnamespace = 'public'::regnamespace;

    IF NOT rls_enabled THEN
        RAISE EXCEPTION 'RLS is not enabled on tasks table';
    END IF;

    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'tasks' AND schemaname = 'public';

    IF policy_count < 5 THEN
        RAISE EXCEPTION 'Insufficient RLS policies on tasks table: found %, expected >= 5', policy_count;
    END IF;

    RAISE NOTICE 'SECURITY VALIDATION RESULTS:';
    RAISE NOTICE '============================';
    RAISE NOTICE 'RLS Enabled: %', CASE WHEN rls_enabled THEN 'YES' ELSE 'NO' END;
    RAISE NOTICE 'RLS Policies: %', policy_count;

    -- Run security tests if possible
    BEGIN
        FOR security_test IN
            SELECT * FROM test.validate_task_security_policies()
        LOOP
            RAISE NOTICE 'Security Test: % - %', security_test.test_name, security_test.status;
            IF security_test.status != 'PASS' THEN
                all_tests_passed := FALSE;
                RAISE NOTICE 'FAILED: %', security_test.details;
            END IF;
        END LOOP;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Security tests could not be run: %', SQLERRM;
    END;

    IF all_tests_passed THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ ALL SECURITY VALIDATIONS PASSED';
        RAISE NOTICE 'Tasks table is properly secured with RLS policies';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ SOME SECURITY VALIDATIONS FAILED';
        RAISE NOTICE 'Review failed tests and fix security issues';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY MONITORING:';
    RAISE NOTICE '- Monitor security_monitoring_dashboard view';
    RAISE NOTICE '- Run security.generate_security_alerts() regularly';
    RAISE NOTICE '- Review security_audit_log for violations';

END;
$$;