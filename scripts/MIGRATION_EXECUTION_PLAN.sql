-- ============================================================================
-- MIGRATION EXECUTION PLAN - COMPLETE STEP-BY-STEP GUIDE
-- Task Normalization Migration for Project Management System
-- ============================================================================

-- IMPORTANT: Read complete-operations-runbook.md before executing
-- This is the MASTER execution script that references all other scripts

-- ============================================================================
-- PHASE 0: PRE-MIGRATION SETUP (REQUIRED)
-- ============================================================================

-- Step 0.1: Install base schema and migration system
\echo 'Step 0.1: Installing base schema and migration system...'
\i scripts/task-normalization-schema.sql

-- Step 0.2: Setup backup infrastructure
\echo 'Step 0.2: Setting up backup infrastructure...'
\i scripts/migration-backup-strategy.sql

-- Step 0.3: Install existing backup strategy
\echo 'Step 0.3: Installing comprehensive backup system...'
\i scripts/db-backup-strategy.sql

-- Step 0.4: Setup connection pooling monitoring
\echo 'Step 0.4: Configuring connection pool monitoring...'
\i scripts/connection-pooling-config.sql

-- ============================================================================
-- PHASE 1: PRE-MIGRATION VALIDATION (MANDATORY)
-- ============================================================================

\echo ''
\echo '=============================================='
\echo 'PHASE 1: PRE-MIGRATION VALIDATION'
\echo '=============================================='

-- Step 1.1: Run comprehensive pre-migration validation
\echo 'Step 1.1: Running pre-migration validation...'
\i scripts/pre-migration-validation.sql

-- Step 1.2: Manual checkpoint - Review validation results
\prompt 'Review validation results above. Continue? (y/N) ' continue_migration
\if :{?continue_migration}
\else
\echo 'Migration aborted by user. Fix validation issues before proceeding.'
\q
\endif

-- ============================================================================
-- PHASE 2: BACKUP AND SAFETY (CRITICAL)
-- ============================================================================

\echo ''
\echo '=============================================='
\echo 'PHASE 2: BACKUP AND SAFETY MEASURES'
\echo '=============================================='

-- Step 2.1: Create full pre-migration backup
\echo 'Step 2.1: Creating comprehensive pre-migration backup...'
SELECT 'Creating migration backup...' as status;

DO $$
DECLARE
    migration_uuid UUID := gen_random_uuid();
    backup_result RECORD;
BEGIN
    RAISE NOTICE 'Migration ID: %', migration_uuid;

    -- Create full backup
    SELECT * INTO backup_result
    FROM migration_backups.create_full_pre_migration_backup(migration_uuid);

    RAISE NOTICE 'Backup completed: % - % - %',
                 backup_result.backup_type,
                 backup_result.status,
                 backup_result.backup_size;

    -- Store migration ID for later reference
    CREATE TEMP TABLE current_migration_info (migration_id UUID);
    INSERT INTO current_migration_info VALUES (migration_uuid);
END;
$$;

-- Step 2.2: Verify backup integrity
\echo 'Step 2.2: Verifying backup integrity...'
SELECT * FROM migration_backups.verify_backup_integrity(
    (SELECT migration_id FROM current_migration_info),
    'pre_migration_full'
);

-- ============================================================================
-- PHASE 3: MIGRATION EXECUTION (CRITICAL POINT)
-- ============================================================================

\echo ''
\echo '=============================================='
\echo 'PHASE 3: MIGRATION EXECUTION'
\echo '⚠️  CRITICAL: This is the point of no return'
\echo '=============================================='

\prompt 'FINAL CONFIRMATION: Execute migration? This will modify data. (yes/NO) ' final_confirm

-- Step 3.1: Execute enhanced migration
\echo 'Step 3.1: Executing enhanced task migration...'
\i scripts/enhanced-task-migration.sql

-- ============================================================================
-- PHASE 4: POST-MIGRATION VALIDATION AND OPTIMIZATION
-- ============================================================================

\echo ''
\echo '=============================================='
\echo 'PHASE 4: POST-MIGRATION VALIDATION'
\echo '=============================================='

-- Step 4.1: Install performance optimizations
\echo 'Step 4.1: Installing performance optimizations...'
\i scripts/post-migration-performance-optimization.sql

-- Step 4.2: Configure security and RLS
\echo 'Step 4.2: Configuring security and RLS policies...'
\i scripts/post-migration-security-validation.sql

-- Step 4.3: Setup comprehensive monitoring
\echo 'Step 4.3: Setting up monitoring and alerting...'
\i scripts/comprehensive-monitoring-system.sql

-- ============================================================================
-- PHASE 5: FINAL VALIDATION AND REPORTING
-- ============================================================================

\echo ''
\echo '=============================================='
\echo 'PHASE 5: FINAL VALIDATION AND REPORTING'
\echo '=============================================='

-- Step 5.1: Run final validation suite
\echo 'Step 5.1: Running final validation suite...'

SELECT 'MIGRATION VALIDATION RESULTS' as report_section;
SELECT '================================' as separator;

-- Validate task migration
SELECT * FROM validate_task_migration_enhanced();

-- Validate security
SELECT * FROM test.validate_task_security_policies();

-- Check system health
SELECT * FROM monitoring.system_health_dashboard
WHERE status != 'healthy';

-- Step 5.2: Performance baseline
\echo 'Step 5.2: Establishing performance baseline...'

-- Run performance tests
SELECT * FROM analyze_index_usage()
WHERE usage_efficiency < 80;

-- Test optimized queries
SELECT 'Testing optimized query performance' as test_type;
SELECT * FROM get_user_tasks_optimized(
    (SELECT id FROM auth.users LIMIT 1),
    NULL, NULL, NULL, FALSE, 10
) LIMIT 5;

-- ============================================================================
-- PHASE 6: MONITORING ACTIVATION AND FINAL REPORT
-- ============================================================================

\echo ''
\echo '=============================================='
\echo 'PHASE 6: MONITORING ACTIVATION'
\echo '=============================================='

-- Step 6.1: Initialize monitoring
\echo 'Step 6.1: Initializing monitoring system...'
SELECT * FROM monitoring.run_monitoring_cycle();

-- Step 6.2: Generate final migration report
\echo 'Step 6.2: Generating final migration report...'

DO $$
DECLARE
    migration_uuid UUID;
    total_tasks INTEGER;
    total_projects INTEGER;
    migration_success BOOLEAN := TRUE;
    issues_found INTEGER := 0;
BEGIN
    -- Get migration ID
    SELECT migration_id INTO migration_uuid FROM current_migration_info;

    -- Gather statistics
    SELECT COUNT(*) INTO total_tasks FROM tasks;
    SELECT COUNT(DISTINCT project_id) INTO total_projects FROM tasks;

    -- Check for issues
    SELECT COUNT(*) INTO issues_found
    FROM monitoring.system_health_dashboard
    WHERE status = 'critical';

    IF issues_found > 0 THEN
        migration_success := FALSE;
    END IF;

    -- Generate report
    RAISE NOTICE '';
    RAISE NOTICE '██████████████████████████████████████████████████████████';
    RAISE NOTICE '               MIGRATION COMPLETION REPORT                ';
    RAISE NOTICE '██████████████████████████████████████████████████████████';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration ID: %', migration_uuid;
    RAISE NOTICE 'Completion Time: %', NOW();
    RAISE NOTICE 'Migration Status: %', CASE WHEN migration_success THEN 'SUCCESS ✅' ELSE 'COMPLETED WITH WARNINGS ⚠️' END;
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION STATISTICS:';
    RAISE NOTICE '  • Total Tasks Migrated: %', total_tasks;
    RAISE NOTICE '  • Projects with Tasks: %', total_projects;
    RAISE NOTICE '  • Critical Issues: %', issues_found;
    RAISE NOTICE '';

    IF migration_success THEN
        RAISE NOTICE 'NEXT STEPS:';
        RAISE NOTICE '  1. ✅ Update application code to use normalized tasks table';
        RAISE NOTICE '  2. ✅ Deploy application changes';
        RAISE NOTICE '  3. ✅ Monitor system for 24-48 hours';
        RAISE NOTICE '  4. ✅ Schedule cleanup of JSON tasks (after validation)';
        RAISE NOTICE '';
        RAISE NOTICE 'MONITORING COMMANDS:';
        RAISE NOTICE '  • System Health: SELECT * FROM monitoring.system_health_dashboard;';
        RAISE NOTICE '  • Performance: SELECT * FROM query_performance_summary;';
        RAISE NOTICE '  • Security: SELECT * FROM security_monitoring_dashboard;';
    ELSE
        RAISE NOTICE 'REQUIRED ACTIONS:';
        RAISE NOTICE '  1. ⚠️  Review critical issues in monitoring dashboard';
        RAISE NOTICE '  2. ⚠️  Address any performance or security concerns';
        RAISE NOTICE '  3. ⚠️  Test application functionality thoroughly';
        RAISE NOTICE '  4. ⚠️  Consider additional optimization if needed';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'OPERATIONAL SUPPORT:';
    RAISE NOTICE '  • Complete Runbook: scripts/complete-operations-runbook.md';
    RAISE NOTICE '  • Emergency Procedures: See runbook Section 7';
    RAISE NOTICE '  • Escalation Matrix: See runbook Section 10';
    RAISE NOTICE '';
    RAISE NOTICE '██████████████████████████████████████████████████████████';
END;
$$;

-- ============================================================================
-- CLEANUP AND FINALIZATION
-- ============================================================================

-- Drop temporary tables
DROP TABLE IF EXISTS current_migration_info;

-- Final system status check
SELECT 'FINAL SYSTEM STATUS CHECK' as status_check;
SELECT '========================' as separator;

SELECT
    'System Status' as check_type,
    CASE
        WHEN COUNT(*) FILTER (WHERE status = 'critical') > 0 THEN 'CRITICAL ISSUES PRESENT'
        WHEN COUNT(*) FILTER (WHERE status = 'warning') > 0 THEN 'WARNINGS PRESENT'
        ELSE 'ALL SYSTEMS HEALTHY'
    END as overall_status,
    COUNT(*) FILTER (WHERE status = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE status = 'warning') as warning_count,
    COUNT(*) FILTER (WHERE status = 'healthy') as healthy_count
FROM monitoring.system_health_dashboard;

\echo ''
\echo '=============================================='
\echo 'MIGRATION EXECUTION COMPLETE'
\echo 'Check the report above for next steps'
\echo 'Consult complete-operations-runbook.md for ongoing operations'
\echo '=============================================='