-- ============================================================================
-- CURRENT SECURITY STATUS CHECK
-- Run this script to assess the current state of RLS policies and security
-- Execute in Supabase SQL Editor to get baseline before implementing changes
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLE SECURITY STATUS
-- ============================================================================

SELECT 
    '🔍 CURRENT RLS STATUS' as check_category,
    schemaname, 
    tablename, 
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED' 
        ELSE '❌ RLS DISABLED'
    END as rls_status,
    tableowner,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE pg_policies.tablename = pg_tables.tablename
          AND pg_policies.schemaname = pg_tables.schemaname
    ) as policy_count
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename;

-- ============================================================================
-- SECTION 2: EXISTING POLICIES ANALYSIS
-- ============================================================================

SELECT 
    '📋 CURRENT POLICIES' as check_category,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles::text,
    cmd,
    CASE 
        WHEN cmd = 'ALL' THEN '⚠️ BROAD PERMISSIONS'
        ELSE '✅ SPECIFIC PERMISSIONS'
    END as permission_scope,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '✅ USER ISOLATION'
        ELSE '❌ NO USER ISOLATION'
    END as isolation_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename, policyname;

-- ============================================================================
-- SECTION 3: SECURITY INFRASTRUCTURE CHECK
-- ============================================================================

-- Check if audit table exists
SELECT 
    '🛡️ SECURITY INFRASTRUCTURE' as check_category,
    'security_audit_log' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'security_audit_log')
        THEN '✅ AUDIT TABLE EXISTS'
        ELSE '❌ AUDIT TABLE MISSING'
    END as status;

-- Check if security functions exist
SELECT 
    '🛡️ SECURITY INFRASTRUCTURE' as check_category,
    'auth_functions' as component,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' FUNCTIONS EXIST'
        ELSE '❌ NO SECURITY FUNCTIONS'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'auth' 
  AND routine_name LIKE '%validate%';

-- Check if RPC functions exist
SELECT 
    '🛡️ SECURITY INFRASTRUCTURE' as check_category,
    'rpc_functions' as component,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' RPC FUNCTIONS EXIST'
        ELSE '❌ NO RPC FUNCTIONS'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%_rpc';

-- ============================================================================
-- SECTION 4: SECURITY COLUMNS CHECK
-- ============================================================================

-- Check security columns in profiles table
SELECT 
    '🔧 SECURITY COLUMNS' as check_category,
    'profiles' as table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('last_login', 'login_count', 'is_locked', 'failed_login_attempts')
        THEN '✅ SECURITY COLUMN'
        ELSE '📝 REGULAR COLUMN'
    END as column_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('last_login', 'login_count', 'is_locked', 'failed_login_attempts', 'role', 'client_portal_access')
ORDER BY column_name;

-- Check security columns in client_portal_users table
SELECT 
    '🔧 SECURITY COLUMNS' as check_category,
    'client_portal_users' as table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('is_active', 'invited_at', 'invited_by', 'last_access', 'token_expires_at')
        THEN '✅ SECURITY COLUMN'
        ELSE '📝 REGULAR COLUMN'
    END as column_type
FROM information_schema.columns 
WHERE table_name = 'client_portal_users' 
  AND table_schema = 'public'
  AND column_name IN ('is_active', 'invited_at', 'invited_by', 'last_access', 'access_token', 'token_expires_at', 'user_id', 'client_id')
ORDER BY column_name;

-- Check security columns in projects table
SELECT 
    '🔧 SECURITY COLUMNS' as check_category,
    'projects' as table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('is_confidential', 'access_level', 'last_accessed')
        THEN '✅ SECURITY COLUMN'
        ELSE '📝 REGULAR COLUMN'
    END as column_type
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND table_schema = 'public'
  AND column_name IN ('is_confidential', 'access_level', 'last_accessed', 'user_id', 'client_id')
ORDER BY column_name;

-- ============================================================================
-- SECTION 5: INDEX OPTIMIZATION CHECK
-- ============================================================================

SELECT 
    '⚡ PERFORMANCE INDEXES' as check_category,
    schemaname,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE 'idx_%user%' OR indexname LIKE 'idx_%client%' OR indexname LIKE 'idx_%security%'
        THEN '✅ SECURITY INDEX'
        ELSE '📈 REGULAR INDEX'
    END as index_type
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 6: TRIGGER SECURITY CHECK
-- ============================================================================

SELECT 
    '⚙️ SECURITY TRIGGERS' as check_category,
    schemaname,
    tablename,
    triggername,
    CASE 
        WHEN triggername LIKE '%audit%' THEN '✅ AUDIT TRIGGER'
        WHEN triggername LIKE '%security%' THEN '✅ SECURITY TRIGGER'
        ELSE '📝 REGULAR TRIGGER'
    END as trigger_type
FROM pg_triggers 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename, triggername;

-- ============================================================================
-- SECTION 7: SECURITY VULNERABILITIES ASSESSMENT
-- ============================================================================

-- Check for policies that allow cross-user access
WITH policy_analysis AS (
    SELECT 
        schemaname,
        tablename,
        policyname,
        qual,
        CASE 
            WHEN qual IS NULL OR qual = '' THEN 'POLICY_NO_RESTRICTION'
            WHEN qual NOT LIKE '%auth.uid()%' AND qual NOT LIKE '%user_id%' THEN 'POTENTIAL_CROSS_USER_ACCESS'
            WHEN cmd = 'ALL' AND qual LIKE '%true%' THEN 'OVERLY_PERMISSIVE'
            ELSE 'POLICY_OK'
        END as security_risk
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
)
SELECT 
    '🚨 SECURITY VULNERABILITIES' as check_category,
    tablename,
    policyname,
    security_risk,
    CASE 
        WHEN security_risk IN ('POLICY_NO_RESTRICTION', 'POTENTIAL_CROSS_USER_ACCESS', 'OVERLY_PERMISSIVE')
        THEN '❌ HIGH RISK'
        ELSE '✅ LOW RISK'
    END as risk_level
FROM policy_analysis 
WHERE security_risk != 'POLICY_OK'
ORDER BY 
    CASE security_risk 
        WHEN 'POLICY_NO_RESTRICTION' THEN 1
        WHEN 'OVERLY_PERMISSIVE' THEN 2
        WHEN 'POTENTIAL_CROSS_USER_ACCESS' THEN 3
        ELSE 4
    END;

-- ============================================================================
-- SECTION 8: CLIENT PORTAL SECURITY ASSESSMENT
-- ============================================================================

-- Check if client portal table exists and has proper structure
SELECT 
    '🏢 CLIENT PORTAL SECURITY' as check_category,
    'table_structure' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'client_portal_users')
        THEN '✅ CLIENT PORTAL TABLE EXISTS'
        ELSE '❌ CLIENT PORTAL TABLE MISSING'
    END as status;

-- Check for client portal specific policies
SELECT 
    '🏢 CLIENT PORTAL SECURITY' as check_category,
    'client_portal_policies' as component,
    COUNT(*) || ' policies found' as status,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ ADEQUATE POLICIES'
        WHEN COUNT(*) > 0 THEN '⚠️ LIMITED POLICIES'
        ELSE '❌ NO CLIENT PORTAL POLICIES'
    END as assessment
FROM pg_policies 
WHERE tablename = 'client_portal_users';

-- ============================================================================
-- SECTION 9: OVERALL SECURITY SCORE
-- ============================================================================

WITH security_metrics AS (
    SELECT 
        -- RLS enabled count
        (SELECT COUNT(*) FROM pg_tables 
         WHERE schemaname = 'public' 
           AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
           AND rowsecurity = true) as rls_enabled_count,
        
        -- Total tables to secure
        (SELECT COUNT(*) FROM pg_tables 
         WHERE schemaname = 'public' 
           AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')) as total_tables,
        
        -- Policies with user isolation
        (SELECT COUNT(*) FROM pg_policies 
         WHERE schemaname = 'public' 
           AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
           AND qual LIKE '%auth.uid()%') as secure_policies,
        
        -- Total policies
        (SELECT COUNT(*) FROM pg_policies 
         WHERE schemaname = 'public' 
           AND tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')) as total_policies,
        
        -- Security infrastructure components
        (SELECT COUNT(*) FROM information_schema.routines 
         WHERE routine_schema IN ('auth', 'public') 
           AND (routine_name LIKE '%validate%' OR routine_name LIKE '%_rpc')) as security_functions,
        
        -- Audit infrastructure
        (SELECT COUNT(*) FROM pg_tables WHERE tablename = 'security_audit_log') as audit_tables
)
SELECT 
    '📊 OVERALL SECURITY ASSESSMENT' as check_category,
    ROUND(
        (
            (rls_enabled_count * 100.0 / NULLIF(total_tables, 0)) * 0.25 +
            (secure_policies * 100.0 / NULLIF(total_policies, 0)) * 0.35 +
            (LEAST(security_functions, 10) * 10) * 0.25 +
            (audit_tables * 100) * 0.15
        ) / 100.0, 
        2
    ) as security_score_percentage,
    
    CASE 
        WHEN (
            (rls_enabled_count * 100.0 / NULLIF(total_tables, 0)) * 0.25 +
            (secure_policies * 100.0 / NULLIF(total_policies, 0)) * 0.35 +
            (LEAST(security_functions, 10) * 10) * 0.25 +
            (audit_tables * 100) * 0.15
        ) / 100.0 >= 90 THEN '🟢 EXCELLENT SECURITY'
        
        WHEN (
            (rls_enabled_count * 100.0 / NULLIF(total_tables, 0)) * 0.25 +
            (secure_policies * 100.0 / NULLIF(total_policies, 0)) * 0.35 +
            (LEAST(security_functions, 10) * 10) * 0.25 +
            (audit_tables * 100) * 0.15
        ) / 100.0 >= 70 THEN '🟡 GOOD SECURITY - MINOR IMPROVEMENTS NEEDED'
        
        WHEN (
            (rls_enabled_count * 100.0 / NULLIF(total_tables, 0)) * 0.25 +
            (secure_policies * 100.0 / NULLIF(total_policies, 0)) * 0.35 +
            (LEAST(security_functions, 10) * 10) * 0.25 +
            (audit_tables * 100) * 0.15
        ) / 100.0 >= 40 THEN '🟠 MODERATE SECURITY - SIGNIFICANT IMPROVEMENTS REQUIRED'
        
        ELSE '🔴 POOR SECURITY - IMMEDIATE ACTION REQUIRED'
    END as security_grade,
    
    -- Detailed breakdown
    jsonb_build_object(
        'rls_coverage', ROUND(rls_enabled_count * 100.0 / NULLIF(total_tables, 0), 1) || '%',
        'policy_security', ROUND(secure_policies * 100.0 / NULLIF(total_policies, 0), 1) || '%',
        'security_functions', security_functions,
        'audit_infrastructure', CASE WHEN audit_tables > 0 THEN 'Present' ELSE 'Missing' END
    ) as detailed_metrics

FROM security_metrics;

-- ============================================================================
-- SECTION 10: IMPLEMENTATION RECOMMENDATIONS
-- ============================================================================

SELECT 
    '🔧 IMPLEMENTATION PRIORITY' as check_category,
    priority_order,
    task_description,
    risk_level,
    effort_estimate
FROM (
    VALUES 
        (1, 'Create security audit infrastructure', '🔴 CRITICAL', '1-2 hours'),
        (2, 'Implement enhanced RLS policies', '🔴 CRITICAL', '2-4 hours'),
        (3, 'Add security columns to tables', '🟡 HIGH', '1 hour'),
        (4, 'Deploy security functions and triggers', '🟡 HIGH', '2-3 hours'),
        (5, 'Create performance indexes', '🟢 MEDIUM', '30 minutes'),
        (6, 'Implement frontend security integration', '🟡 HIGH', '4-6 hours'),
        (7, 'Deploy comprehensive testing', '🟡 HIGH', '2-3 hours'),
        (8, 'Set up monitoring and alerting', '🟢 MEDIUM', '2-4 hours')
) AS recommendations(priority_order, task_description, risk_level, effort_estimate)
ORDER BY priority_order;

-- ============================================================================
-- EXECUTION SUMMARY
-- ============================================================================

SELECT 
    '✅ SECURITY STATUS CHECK COMPLETE' as status,
    now() as check_completed_at,
    'Review results above to determine implementation priorities' as next_steps,
    'Refer to RLS_IMPLEMENTATION_GUIDE.md for detailed deployment instructions' as guidance;