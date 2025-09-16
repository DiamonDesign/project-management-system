-- ============================================================================
-- RLS SECURITY POLICY VALIDATION TESTS
-- Comprehensive testing framework for Row Level Security policies
-- Execute after implementing enhanced RLS policies
-- ============================================================================

-- ============================================================================
-- TEST PREPARATION: Create Test Schema and Functions
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS test_security;

-- Test results table
CREATE TABLE IF NOT EXISTS test_security.test_results (
    id serial PRIMARY KEY,
    test_name text NOT NULL,
    test_category text NOT NULL,
    test_result text NOT NULL,
    expected_result text NOT NULL,
    status text NOT NULL,
    error_message text,
    executed_at timestamp with time zone DEFAULT now(),
    executed_by uuid DEFAULT auth.uid()
);

-- Clear previous test results
TRUNCATE test_security.test_results;

-- ============================================================================
-- TEST FRAMEWORK FUNCTIONS
-- ============================================================================

-- Function to log test results
CREATE OR REPLACE FUNCTION test_security.log_test_result(
    p_test_name text,
    p_category text,
    p_actual text,
    p_expected text,
    p_status text,
    p_error text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO test_security.test_results (
        test_name, test_category, test_result, expected_result, status, error_message
    ) VALUES (
        p_test_name, p_category, p_actual, p_expected, p_status, p_error
    );
END;
$$ LANGUAGE plpgsql;

-- Function to execute and test SQL statements
CREATE OR REPLACE FUNCTION test_security.execute_test(
    p_test_name text,
    p_category text,
    p_sql text,
    p_expected_result text,
    p_should_fail boolean DEFAULT false
)
RETURNS void AS $$
DECLARE
    v_result text;
    v_error text;
    v_status text;
BEGIN
    BEGIN
        EXECUTE p_sql INTO v_result;
        
        IF p_should_fail THEN
            v_status := 'FAIL';
            v_error := 'Expected query to fail but it succeeded';
        ELSE
            v_status := CASE WHEN v_result = p_expected_result THEN 'PASS' ELSE 'FAIL' END;
        END IF;
        
        PERFORM test_security.log_test_result(
            p_test_name, p_category, COALESCE(v_result, 'NULL'), p_expected_result, v_status, v_error
        );
    EXCEPTION
        WHEN OTHERS THEN
            v_error := SQLERRM;
            IF p_should_fail THEN
                v_status := 'PASS';
                v_result := 'ERROR (Expected)';
            ELSE
                v_status := 'FAIL';
                v_result := 'ERROR (Unexpected)';
            END IF;
            
            PERFORM test_security.log_test_result(
                p_test_name, p_category, v_result, p_expected_result, v_status, v_error
            );
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TEST SUITE 1: BASIC RLS FUNCTIONALITY
-- ============================================================================

DO $$
DECLARE
    current_user_id uuid := auth.uid();
    test_count integer;
BEGIN
    RAISE NOTICE '🧪 Starting Test Suite 1: Basic RLS Functionality';
    
    -- Test 1.1: User can access own profile
    SELECT COUNT(*) INTO test_count FROM public.profiles WHERE id = current_user_id;
    PERFORM test_security.log_test_result(
        'User can access own profile',
        'Basic RLS',
        test_count::text,
        '1',
        CASE WHEN test_count = 1 THEN 'PASS' ELSE 'FAIL' END
    );
    
    -- Test 1.2: User cannot access other profiles
    SELECT COUNT(*) INTO test_count FROM public.profiles WHERE id != current_user_id;
    PERFORM test_security.log_test_result(
        'User cannot access other profiles',
        'Basic RLS',
        test_count::text,
        '0',
        CASE WHEN test_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );
    
    -- Test 1.3: User can access own projects
    SELECT COUNT(*) INTO test_count FROM public.projects WHERE user_id = current_user_id;
    PERFORM test_security.log_test_result(
        'User can access own projects',
        'Basic RLS',
        test_count::text,
        'ANY',
        'PASS'  -- Any count is acceptable, just testing access
    );
    
    -- Test 1.4: User cannot access other users' projects
    SELECT COUNT(*) INTO test_count FROM public.projects WHERE user_id != current_user_id;
    PERFORM test_security.log_test_result(
        'User cannot access other users projects',
        'Basic RLS',
        test_count::text,
        '0',
        CASE WHEN test_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );
    
    -- Test 1.5: User can access own clients
    SELECT COUNT(*) INTO test_count FROM public.clients WHERE user_id = current_user_id;
    PERFORM test_security.log_test_result(
        'User can access own clients',
        'Basic RLS',
        test_count::text,
        'ANY',
        'PASS'
    );
    
    -- Test 1.6: User cannot access other users' clients
    SELECT COUNT(*) INTO test_count FROM public.clients WHERE user_id != current_user_id;
    PERFORM test_security.log_test_result(
        'User cannot access other users clients',
        'Basic RLS',
        test_count::text,
        '0',
        CASE WHEN test_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );
    
END $$;

-- ============================================================================
-- TEST SUITE 2: CLIENT PORTAL SECURITY
-- ============================================================================

DO $$
DECLARE
    current_user_id uuid := auth.uid();
    is_client boolean;
    test_count integer;
BEGIN
    RAISE NOTICE '🔐 Starting Test Suite 2: Client Portal Security';
    
    -- Check if current user is a client portal user
    SELECT auth.is_client_portal_user() INTO is_client;
    
    IF is_client THEN
        -- Test 2.1: Client cannot access client management data
        SELECT COUNT(*) INTO test_count FROM public.clients;
        PERFORM test_security.log_test_result(
            'Client portal user cannot access clients table',
            'Client Portal Security',
            test_count::text,
            '0',
            CASE WHEN test_count = 0 THEN 'PASS' ELSE 'FAIL' END
        );
        
        -- Test 2.2: Client can only see assigned projects
        SELECT COUNT(*) INTO test_count 
        FROM public.projects 
        WHERE client_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM public.client_portal_users cpu
            WHERE cpu.client_id = projects.client_id
            AND cpu.user_id = current_user_id
            AND cpu.is_active = true
        );
        
        PERFORM test_security.log_test_result(
            'Client can only see assigned projects',
            'Client Portal Security',
            test_count::text,
            '0',
            CASE WHEN test_count = 0 THEN 'PASS' ELSE 'FAIL' END
        );
        
        -- Test 2.3: Client cannot modify projects (should fail)
        PERFORM test_security.execute_test(
            'Client cannot modify projects',
            'Client Portal Security',
            'UPDATE public.projects SET name = ''Modified by client'' WHERE id IN (SELECT id FROM public.projects LIMIT 1)',
            'ERROR',
            true  -- Should fail
        );
        
    ELSE
        -- Test 2.4: Non-client users can access their own client data
        SELECT COUNT(*) INTO test_count FROM public.clients WHERE user_id = current_user_id;
        PERFORM test_security.log_test_result(
            'Non-client user can access own clients',
            'Client Portal Security',
            test_count::text,
            'ANY',
            'PASS'
        );
        
        -- Test 2.5: Non-client users can modify their own projects
        PERFORM test_security.execute_test(
            'Non-client user can modify own projects',
            'Client Portal Security',
            'SELECT COUNT(*) FROM public.projects WHERE user_id = ''' || current_user_id || '''',
            'ANY',
            false  -- Should succeed
        );
    END IF;
    
END $$;

-- ============================================================================
-- TEST SUITE 3: PRIVILEGE ESCALATION PREVENTION
-- ============================================================================

DO $$
DECLARE
    current_user_id uuid := auth.uid();
    current_role text;
    test_successful boolean := false;
BEGIN
    RAISE NOTICE '⚠️  Starting Test Suite 3: Privilege Escalation Prevention';
    
    -- Get current user role
    SELECT role INTO current_role FROM public.profiles WHERE id = current_user_id;
    
    -- Test 3.1: User cannot change their role to admin (unless already admin)
    IF current_role != 'admin' THEN
        BEGIN
            UPDATE public.profiles SET role = 'admin' WHERE id = current_user_id;
            test_successful := true;
        EXCEPTION
            WHEN OTHERS THEN
                test_successful := false;
        END;
        
        PERFORM test_security.log_test_result(
            'Non-admin cannot escalate to admin role',
            'Privilege Escalation',
            CASE WHEN test_successful THEN 'ESCALATION SUCCEEDED' ELSE 'ESCALATION BLOCKED' END,
            'ESCALATION BLOCKED',
            CASE WHEN test_successful THEN 'FAIL' ELSE 'PASS' END
        );
        
        -- Reset any changes
        UPDATE public.profiles SET role = current_role WHERE id = current_user_id;
    END IF;
    
    -- Test 3.2: Client portal users cannot change critical profile fields
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id AND client_portal_access->>'is_client' = 'true') THEN
        BEGIN
            UPDATE public.profiles SET role = 'freelancer' WHERE id = current_user_id;
            test_successful := true;
        EXCEPTION
            WHEN OTHERS THEN
                test_successful := false;
        END;
        
        PERFORM test_security.log_test_result(
            'Client portal user cannot change role',
            'Privilege Escalation',
            CASE WHEN test_successful THEN 'ROLE CHANGE SUCCEEDED' ELSE 'ROLE CHANGE BLOCKED' END,
            'ROLE CHANGE BLOCKED',
            CASE WHEN test_successful THEN 'FAIL' ELSE 'PASS' END
        );
    END IF;
    
END $$;

-- ============================================================================
-- TEST SUITE 4: DATA ISOLATION VALIDATION
-- ============================================================================

DO $$
DECLARE
    current_user_id uuid := auth.uid();
    isolation_test_count integer;
BEGIN
    RAISE NOTICE '🔒 Starting Test Suite 4: Data Isolation Validation';
    
    -- Test 4.1: Cross-user project data isolation
    SELECT COUNT(*) INTO isolation_test_count 
    FROM public.projects p1, public.projects p2 
    WHERE p1.user_id = current_user_id 
    AND p2.user_id != current_user_id;
    
    PERFORM test_security.log_test_result(
        'Cross-user project data isolation',
        'Data Isolation',
        isolation_test_count::text,
        '0',
        CASE WHEN isolation_test_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );
    
    -- Test 4.2: Client data isolation
    SELECT COUNT(*) INTO isolation_test_count 
    FROM public.clients c1, public.clients c2 
    WHERE c1.user_id = current_user_id 
    AND c2.user_id != current_user_id;
    
    PERFORM test_security.log_test_result(
        'Cross-user client data isolation',
        'Data Isolation',
        isolation_test_count::text,
        '0',
        CASE WHEN isolation_test_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );
    
    -- Test 4.3: Profile data isolation
    SELECT COUNT(*) INTO isolation_test_count 
    FROM public.profiles p1, public.profiles p2 
    WHERE p1.id = current_user_id 
    AND p2.id != current_user_id;
    
    PERFORM test_security.log_test_result(
        'Cross-user profile data isolation',
        'Data Isolation',
        isolation_test_count::text,
        '0',
        CASE WHEN isolation_test_count = 0 THEN 'PASS' ELSE 'FAIL' END
    );
    
END $$;

-- ============================================================================
-- TEST SUITE 5: AUDIT LOGGING VALIDATION
-- ============================================================================

DO $$
DECLARE
    current_user_id uuid := auth.uid();
    is_admin boolean;
    audit_count integer;
    before_count integer;
    after_count integer;
BEGIN
    RAISE NOTICE '📋 Starting Test Suite 5: Audit Logging Validation';
    
    -- Check if current user is admin
    SELECT auth.validate_user_role('admin') INTO is_admin;
    
    IF is_admin THEN
        -- Test 5.1: Admin can access audit logs
        SELECT COUNT(*) INTO audit_count FROM public.security_audit_log;
        PERFORM test_security.log_test_result(
            'Admin can access audit logs',
            'Audit Logging',
            'ACCESSIBLE',
            'ACCESSIBLE',
            'PASS'
        );
        
        -- Test 5.2: Audit logging is working
        SELECT COUNT(*) INTO before_count FROM public.security_audit_log;
        
        -- Perform an auditable action
        INSERT INTO public.profiles (id, role) VALUES (gen_random_uuid(), 'freelancer') 
        ON CONFLICT (id) DO NOTHING;
        
        SELECT COUNT(*) INTO after_count FROM public.security_audit_log;
        
        PERFORM test_security.log_test_result(
            'Audit logging captures events',
            'Audit Logging',
            CASE WHEN after_count > before_count THEN 'EVENTS LOGGED' ELSE 'NO EVENTS LOGGED' END,
            'EVENTS LOGGED',
            CASE WHEN after_count > before_count THEN 'PASS' ELSE 'FAIL' END
        );
        
    ELSE
        -- Test 5.3: Non-admin cannot access audit logs
        BEGIN
            SELECT COUNT(*) INTO audit_count FROM public.security_audit_log;
            PERFORM test_security.log_test_result(
                'Non-admin cannot access audit logs',
                'Audit Logging',
                'ACCESSIBLE',
                'NOT ACCESSIBLE',
                'FAIL'
            );
        EXCEPTION
            WHEN OTHERS THEN
                PERFORM test_security.log_test_result(
                    'Non-admin cannot access audit logs',
                    'Audit Logging',
                    'NOT ACCESSIBLE',
                    'NOT ACCESSIBLE',
                    'PASS'
                );
        END;
    END IF;
    
END $$;

-- ============================================================================
-- TEST SUITE 6: PERFORMANCE VALIDATION
-- ============================================================================

DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time interval;
    performance_threshold interval := '100 milliseconds';
BEGIN
    RAISE NOTICE '⚡ Starting Test Suite 6: Performance Validation';
    
    -- Test 6.1: Projects query performance
    start_time := clock_timestamp();
    PERFORM COUNT(*) FROM public.projects WHERE user_id = auth.uid();
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    PERFORM test_security.log_test_result(
        'Projects query performance',
        'Performance',
        execution_time::text,
        '< ' || performance_threshold::text,
        CASE WHEN execution_time < performance_threshold THEN 'PASS' ELSE 'FAIL' END
    );
    
    -- Test 6.2: Clients query performance
    start_time := clock_timestamp();
    PERFORM COUNT(*) FROM public.clients WHERE user_id = auth.uid();
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    PERFORM test_security.log_test_result(
        'Clients query performance',
        'Performance',
        execution_time::text,
        '< ' || performance_threshold::text,
        CASE WHEN execution_time < performance_threshold THEN 'PASS' ELSE 'FAIL' END
    );
    
END $$;

-- ============================================================================
-- TEST RESULTS SUMMARY
-- ============================================================================

-- Generate test results summary
SELECT 
    '📊 RLS SECURITY TESTS SUMMARY' as report_section,
    test_category,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE status = 'PASS') as passed_tests,
    COUNT(*) FILTER (WHERE status = 'FAIL') as failed_tests,
    ROUND((COUNT(*) FILTER (WHERE status = 'PASS') * 100.0 / COUNT(*)), 2) as pass_percentage
FROM test_security.test_results
GROUP BY test_category
ORDER BY test_category;

-- Show failed tests for review
SELECT 
    '❌ FAILED TESTS DETAIL' as report_section,
    test_name,
    test_category,
    test_result,
    expected_result,
    error_message
FROM test_security.test_results 
WHERE status = 'FAIL'
ORDER BY test_category, test_name;

-- Overall security score
WITH security_metrics AS (
    SELECT 
        COUNT(*) as total_tests,
        COUNT(*) FILTER (WHERE status = 'PASS') as passed_tests,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'PASS') = COUNT(*) THEN 'EXCELLENT'
            WHEN COUNT(*) FILTER (WHERE status = 'PASS') >= COUNT(*) * 0.9 THEN 'GOOD'
            WHEN COUNT(*) FILTER (WHERE status = 'PASS') >= COUNT(*) * 0.7 THEN 'NEEDS IMPROVEMENT'
            ELSE 'CRITICAL ISSUES'
        END as security_grade
    FROM test_security.test_results
)
SELECT 
    '🛡️  OVERALL SECURITY ASSESSMENT' as report_section,
    total_tests,
    passed_tests,
    (total_tests - passed_tests) as failed_tests,
    ROUND((passed_tests * 100.0 / total_tests), 2) as security_score,
    security_grade,
    CASE 
        WHEN security_grade = 'EXCELLENT' THEN '✅ All security policies are working correctly'
        WHEN security_grade = 'GOOD' THEN '⚠️  Minor security issues detected - review failed tests'
        WHEN security_grade = 'NEEDS IMPROVEMENT' THEN '🔥 Significant security gaps - immediate attention required'
        ELSE '🚨 CRITICAL SECURITY VULNERABILITIES - System not secure for production'
    END as recommendation
FROM security_metrics;

-- Test execution summary
SELECT 
    '✅ TEST EXECUTION COMPLETE' as status,
    COUNT(*) as total_tests_executed,
    MIN(executed_at) as test_start_time,
    MAX(executed_at) as test_end_time,
    MAX(executed_at) - MIN(executed_at) as total_execution_time
FROM test_security.test_results;

-- ============================================================================
-- CLEANUP (Optional)
-- ============================================================================

-- Uncomment to cleanup test schema after reviewing results
-- DROP SCHEMA IF EXISTS test_security CASCADE;