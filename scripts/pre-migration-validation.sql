-- ============================================================================
-- PRE-MIGRATION VALIDATION AND PREPARATION
-- Comprehensive validation before task normalization migration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENVIRONMENT VALIDATION
-- ----------------------------------------------------------------------------

-- Check current database state
DO $$
DECLARE
    supabase_version TEXT;
    postgres_version TEXT;
    current_db TEXT;
    backup_space BIGINT;
    table_sizes RECORD;
BEGIN
    -- Get versions
    SELECT version() INTO postgres_version;
    SELECT current_database() INTO current_db;

    RAISE NOTICE 'ENVIRONMENT VALIDATION';
    RAISE NOTICE '====================';
    RAISE NOTICE 'Database: %', current_db;
    RAISE NOTICE 'PostgreSQL Version: %', postgres_version;

    -- Check table sizes and estimate migration impact
    FOR table_sizes IN
        SELECT
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
        ORDER BY size_bytes DESC
    LOOP
        RAISE NOTICE 'Table %.%: %', table_sizes.schemaname, table_sizes.tablename, table_sizes.size;
    END LOOP;

    -- Estimate disk space needed (150% of projects table for safety)
    SELECT pg_total_relation_size('public.projects') * 1.5 INTO backup_space;
    RAISE NOTICE 'Estimated space needed for migration: %', pg_size_pretty(backup_space);

    -- Check available connections
    RAISE NOTICE 'Max connections: %', (SELECT setting FROM pg_settings WHERE name = 'max_connections');
    RAISE NOTICE 'Current connections: %', (SELECT count(*) FROM pg_stat_activity);

END;
$$;

-- ----------------------------------------------------------------------------
-- 2. DATA INTEGRITY VALIDATION
-- ----------------------------------------------------------------------------

-- Create comprehensive data analysis
CREATE OR REPLACE FUNCTION analyze_current_data_quality()
RETURNS TABLE(
    analysis_category TEXT,
    issue_type TEXT,
    count_affected BIGINT,
    severity TEXT,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Analyze projects with tasks
    RETURN QUERY
    SELECT
        'projects_with_tasks'::TEXT,
        'total_projects_with_json_tasks'::TEXT,
        COUNT(*)::BIGINT,
        'info'::TEXT,
        'Projects that will be affected by migration'::TEXT
    FROM projects
    WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0;

    -- Analyze task data quality
    RETURN QUERY
    WITH task_analysis AS (
        SELECT
            p.id as project_id,
            p.name as project_name,
            task_element,
            task_element->>'title' as task_title,
            task_element->>'status' as task_status,
            task_element->>'priority' as task_priority,
            task_element->>'start_date' as start_date,
            task_element->>'end_date' as end_date
        FROM projects p,
        jsonb_array_elements(p.tasks) as task_element
        WHERE p.tasks IS NOT NULL
        AND jsonb_array_length(p.tasks) > 0
    )
    SELECT
        'task_data_quality'::TEXT,
        'tasks_missing_title'::TEXT,
        COUNT(*)::BIGINT,
        CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'info' END::TEXT,
        'Tasks without title will be assigned default titles'::TEXT
    FROM task_analysis
    WHERE task_title IS NULL OR trim(task_title) = '';

    -- Check invalid status values
    RETURN QUERY
    WITH task_analysis AS (
        SELECT
            task_element->>'status' as task_status
        FROM projects p,
        jsonb_array_elements(p.tasks) as task_element
        WHERE p.tasks IS NOT NULL
    )
    SELECT
        'task_data_quality'::TEXT,
        'invalid_status_values'::TEXT,
        COUNT(*)::BIGINT,
        CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'info' END::TEXT,
        'Invalid status values will be normalized to valid enums'::TEXT
    FROM task_analysis
    WHERE task_status IS NOT NULL
    AND task_status NOT IN ('not-started', 'in-progress', 'completed');

    -- Check invalid priority values
    RETURN QUERY
    WITH task_analysis AS (
        SELECT
            task_element->>'priority' as task_priority
        FROM projects p,
        jsonb_array_elements(p.tasks) as task_element
        WHERE p.tasks IS NOT NULL
    )
    SELECT
        'task_data_quality'::TEXT,
        'invalid_priority_values'::TEXT,
        COUNT(*)::BIGINT,
        CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'info' END::TEXT,
        'Invalid priority values will be normalized to medium'::TEXT
    FROM task_analysis
    WHERE task_priority IS NOT NULL
    AND task_priority NOT IN ('low', 'medium', 'high');

    -- Check date format issues
    RETURN QUERY
    WITH task_analysis AS (
        SELECT
            task_element->>'start_date' as start_date,
            task_element->>'end_date' as end_date
        FROM projects p,
        jsonb_array_elements(p.tasks) as task_element
        WHERE p.tasks IS NOT NULL
    )
    SELECT
        'task_data_quality'::TEXT,
        'invalid_date_formats'::TEXT,
        COUNT(*)::BIGINT,
        CASE WHEN COUNT(*) > 0 THEN 'error' ELSE 'info' END::TEXT,
        'Invalid date formats may cause migration failures - review manually'::TEXT
    FROM task_analysis
    WHERE (start_date IS NOT NULL AND start_date != '' AND start_date !~ '^\d{4}-\d{2}-\d{2}')
    OR (end_date IS NOT NULL AND end_date != '' AND end_date !~ '^\d{4}-\d{2}-\d{2}');

    -- Check orphaned project references
    RETURN QUERY
    SELECT
        'referential_integrity'::TEXT,
        'projects_without_valid_users'::TEXT,
        COUNT(*)::BIGINT,
        'critical'::TEXT,
        'These projects have invalid user_id references and must be fixed before migration'::TEXT
    FROM projects p
    LEFT JOIN auth.users u ON p.user_id = u.id
    WHERE u.id IS NULL;

    -- Check client references
    RETURN QUERY
    SELECT
        'referential_integrity'::TEXT,
        'projects_with_invalid_client_references'::TEXT,
        COUNT(*)::BIGINT,
        'warning'::TEXT,
        'Projects with invalid client_id will have client_id set to NULL'::TEXT
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.client_id IS NOT NULL AND c.id IS NULL;

END;
$$;

-- Run data quality analysis
SELECT 'DATA QUALITY ANALYSIS RESULTS' as section;
SELECT * FROM analyze_current_data_quality() ORDER BY severity DESC, analysis_category;

-- ----------------------------------------------------------------------------
-- 3. DEPENDENCY VALIDATION
-- ----------------------------------------------------------------------------

-- Check for active connections that might block migration
SELECT
    'ACTIVE CONNECTIONS CHECK' as section,
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    now() - query_start as duration
FROM pg_stat_activity
WHERE state != 'idle'
AND backend_type = 'client backend'
AND datname = current_database()
ORDER BY query_start;

-- Check for long-running transactions
SELECT
    'LONG RUNNING TRANSACTIONS' as section,
    pid,
    usename,
    state,
    xact_start,
    now() - xact_start as xact_duration,
    query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
AND now() - xact_start > INTERVAL '1 minute'
AND backend_type = 'client backend';

-- Check for blocking locks
SELECT
    'BLOCKING LOCKS CHECK' as section,
    bl.pid as blocked_pid,
    bl.usename as blocked_user,
    kl.pid as blocking_pid,
    kl.usename as blocking_user,
    bl.query as blocked_query
FROM pg_stat_activity bl
JOIN pg_locks blocked_locks ON bl.pid = blocked_locks.pid
JOIN pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_stat_activity kl ON blocking_locks.pid = kl.pid
WHERE NOT blocked_locks.granted;

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE BASELINE
-- ----------------------------------------------------------------------------

-- Create baseline performance metrics
CREATE TEMP TABLE migration_baseline AS
SELECT
    'baseline_metrics' as metric_type,
    NOW() as measured_at,
    -- Table sizes
    (SELECT pg_total_relation_size('public.projects')) as projects_table_size,
    (SELECT pg_total_relation_size('public.clients')) as clients_table_size,
    -- Row counts
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM projects WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0) as projects_with_tasks,
    (SELECT SUM(jsonb_array_length(tasks)) FROM projects WHERE tasks IS NOT NULL) as total_tasks_in_json,
    (SELECT COUNT(*) FROM clients) as total_clients,
    -- Connection metrics
    (SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'client backend') as active_connections,
    -- Query performance baseline
    (SELECT AVG(mean_exec_time) FROM pg_stat_statements WHERE query ILIKE '%projects%' AND calls > 10) as avg_project_query_time;

SELECT 'PERFORMANCE BASELINE' as section, * FROM migration_baseline;

-- ----------------------------------------------------------------------------
-- 5. BACKUP VALIDATION
-- ----------------------------------------------------------------------------

-- Verify backup functionality before migration
DO $$
DECLARE
    backup_test_result BOOLEAN;
    backup_size BIGINT;
BEGIN
    RAISE NOTICE 'BACKUP VALIDATION';
    RAISE NOTICE '=================';

    -- Test backup functionality
    SELECT backup_json_tasks() INTO backup_test_result;

    IF backup_test_result THEN
        SELECT COUNT(*) INTO backup_size FROM tasks_json_backup;
        RAISE NOTICE 'Backup test SUCCESSFUL: % projects backed up', backup_size;
    ELSE
        RAISE EXCEPTION 'Backup test FAILED - cannot proceed with migration';
    END IF;

    -- Clean up test backup
    TRUNCATE tasks_json_backup;
    RAISE NOTICE 'Test backup cleaned up';
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. SCHEMA VERSION VALIDATION
-- ----------------------------------------------------------------------------

-- Check if we're ready for migration
DO $$
DECLARE
    current_version TEXT;
    schema_ready BOOLEAN := FALSE;
BEGIN
    -- Check if schema migration system exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_version') THEN
        SELECT current_version INTO current_version FROM schema_version;
        RAISE NOTICE 'Current schema version: %', current_version;

        -- Check if we have the required migration functions
        IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'migrate_tasks_from_json') THEN
            schema_ready := TRUE;
            RAISE NOTICE 'Migration functions are ready';
        ELSE
            RAISE NOTICE 'WARNING: Migration functions not found - run task-normalization-schema.sql first';
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: Schema version system not initialized - run task-normalization-schema.sql first';
    END IF;

    -- Final readiness check
    IF schema_ready THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ MIGRATION READINESS: READY TO PROCEED';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Review data quality issues above';
        RAISE NOTICE '2. Fix any CRITICAL issues';
        RAISE NOTICE '3. Schedule maintenance window';
        RAISE NOTICE '4. Execute migration script';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ MIGRATION READINESS: NOT READY';
        RAISE NOTICE '';
        RAISE NOTICE 'Required actions:';
        RAISE NOTICE '1. Run task-normalization-schema.sql';
        RAISE NOTICE '2. Re-run this validation script';
    END IF;
END;
$$;

-- Create migration readiness report
CREATE OR REPLACE VIEW migration_readiness_report AS
SELECT
    'migration_readiness' as report_type,
    NOW() as generated_at,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_version') as schema_system_ready,
    EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'migrate_tasks_from_json') as migration_functions_ready,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks_json_backup') as backup_system_ready,
    (SELECT COUNT(*) FROM projects WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0) as projects_to_migrate,
    (SELECT SUM(jsonb_array_length(tasks)) FROM projects WHERE tasks IS NOT NULL) as tasks_to_migrate,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'client backend') as current_connections,
    (SELECT COUNT(*) FROM analyze_current_data_quality() WHERE severity = 'critical') as critical_issues;

-- Final report
SELECT 'FINAL MIGRATION READINESS REPORT' as section;
SELECT * FROM migration_readiness_report;

-- Cleanup
DROP FUNCTION IF EXISTS analyze_current_data_quality();