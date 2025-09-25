-- ============================================================================
-- TASK MIGRATION EXECUTION SCRIPT
-- Safe execution of task normalization with validation and rollback capability
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PRE-MIGRATION VALIDATION
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    schema_version_val TEXT;
    task_count INTEGER;
    project_count INTEGER;
    disk_space_mb INTEGER;
BEGIN
    -- Check current schema version
    SELECT current_version INTO schema_version_val FROM schema_version;
    
    IF schema_version_val < '1.3.0' THEN
        RAISE EXCEPTION 'Schema version % is too old. Please run task-normalization-schema.sql first', schema_version_val;
    END IF;
    
    -- Count existing tasks in JSON format
    SELECT 
        SUM(jsonb_array_length(COALESCE(tasks, '[]'))),
        COUNT(*)
    INTO task_count, project_count
    FROM projects 
    WHERE tasks IS NOT NULL;
    
    -- Basic validations
    IF task_count IS NULL OR task_count = 0 THEN
        RAISE NOTICE 'No tasks found to migrate';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Pre-migration validation passed:';
    RAISE NOTICE '- Schema version: %', schema_version_val;
    RAISE NOTICE '- Tasks to migrate: %', task_count;
    RAISE NOTICE '- Projects with tasks: %', project_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- MIGRATION EXECUTION WITH MONITORING
-- ----------------------------------------------------------------------------

-- Create migration session log
CREATE TEMP TABLE migration_session (
    id SERIAL PRIMARY KEY,
    step_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('running', 'completed', 'failed')),
    records_processed INTEGER,
    error_message TEXT
);

-- Step 1: Create backup of existing JSON data
INSERT INTO migration_session (step_name, status) VALUES ('backup_json_tasks', 'running');

DO $$
DECLARE
    backup_success BOOLEAN;
    session_id INTEGER;
BEGIN
    SELECT id INTO session_id FROM migration_session WHERE step_name = 'backup_json_tasks' ORDER BY id DESC LIMIT 1;
    
    SELECT backup_json_tasks() INTO backup_success;
    
    IF backup_success THEN
        UPDATE migration_session 
        SET status = 'completed', completed_at = NOW(), 
            records_processed = (SELECT COUNT(*) FROM tasks_json_backup)
        WHERE id = session_id;
        RAISE NOTICE 'Backup completed successfully';
    ELSE
        UPDATE migration_session 
        SET status = 'failed', completed_at = NOW(), error_message = 'Backup function returned false'
        WHERE id = session_id;
        RAISE EXCEPTION 'Backup failed';
    END IF;
END;
$$;

-- Step 2: Execute task migration
INSERT INTO migration_session (step_name, status) VALUES ('migrate_tasks', 'running');

DO $$
DECLARE
    migration_result RECORD;
    total_migrated INTEGER := 0;
    total_failed INTEGER := 0;
    session_id INTEGER;
    error_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
    SELECT id INTO session_id FROM migration_session WHERE step_name = 'migrate_tasks' ORDER BY id DESC LIMIT 1;
    
    -- Execute migration and collect results
    FOR migration_result IN 
        SELECT * FROM migrate_tasks_from_json()
    LOOP
        total_migrated := total_migrated + migration_result.migrated_tasks;
        total_failed := total_failed + migration_result.failed_tasks;
        
        IF array_length(migration_result.errors, 1) > 0 THEN
            error_messages := error_messages || migration_result.errors;
        END IF;
        
        RAISE NOTICE 'Project %: migrated %, failed %', 
                     migration_result.project_id, 
                     migration_result.migrated_tasks, 
                     migration_result.failed_tasks;
    END LOOP;
    
    -- Update session log
    IF total_failed = 0 THEN
        UPDATE migration_session 
        SET status = 'completed', completed_at = NOW(), records_processed = total_migrated
        WHERE id = session_id;
        RAISE NOTICE 'Migration completed successfully: % tasks migrated', total_migrated;
    ELSE
        UPDATE migration_session 
        SET status = 'failed', completed_at = NOW(), 
            records_processed = total_migrated,
            error_message = 'Migration completed with errors: ' || total_failed || ' failed tasks'
        WHERE id = session_id;
        RAISE NOTICE 'Migration completed with % failures out of % total tasks', total_failed, (total_migrated + total_failed);
        
        -- Log errors for review
        RAISE NOTICE 'Migration errors: %', array_to_string(error_messages, '; ');
    END IF;
END;
$$;

-- Step 3: Validate migration integrity
INSERT INTO migration_session (step_name, status) VALUES ('validate_migration', 'running');

DO $$
DECLARE
    validation_result RECORD;
    all_validations_passed BOOLEAN := TRUE;
    session_id INTEGER;
BEGIN
    SELECT id INTO session_id FROM migration_session WHERE step_name = 'validate_migration' ORDER BY id DESC LIMIT 1;
    
    RAISE NOTICE 'Migration Validation Results:';
    RAISE NOTICE '============================';
    
    FOR validation_result IN 
        SELECT * FROM validate_task_migration()
    LOOP
        RAISE NOTICE '% - Expected: %, Actual: %, Status: %', 
                     validation_result.validation_check,
                     validation_result.expected_count,
                     validation_result.actual_count,
                     validation_result.status;
        
        IF validation_result.status != 'PASS' THEN
            all_validations_passed := FALSE;
        END IF;
    END LOOP;
    
    IF all_validations_passed THEN
        UPDATE migration_session 
        SET status = 'completed', completed_at = NOW()
        WHERE id = session_id;
        RAISE NOTICE 'All validation checks passed';
    ELSE
        UPDATE migration_session 
        SET status = 'failed', completed_at = NOW(), 
            error_message = 'One or more validation checks failed'
        WHERE id = session_id;
        RAISE EXCEPTION 'Migration validation failed - check results above';
    END IF;
END;
$$;

-- Step 4: Performance benchmarking
INSERT INTO migration_session (step_name, status) VALUES ('performance_benchmark', 'running');

DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    query_duration_ms BIGINT;
    session_id INTEGER;
    sample_user_id UUID;
BEGIN
    SELECT id INTO session_id FROM migration_session WHERE step_name = 'performance_benchmark' ORDER BY id DESC LIMIT 1;
    
    -- Get a sample user with tasks
    SELECT DISTINCT user_id INTO sample_user_id FROM tasks LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        RAISE NOTICE 'No users with tasks found for benchmarking';
        UPDATE migration_session SET status = 'completed', completed_at = NOW() WHERE id = session_id;
        RETURN;
    END IF;
    
    -- Benchmark 1: Get user tasks with context
    start_time := clock_timestamp();
    PERFORM * FROM get_user_tasks_with_context(sample_user_id, 50);
    end_time := clock_timestamp();
    query_duration_ms := EXTRACT(MILLISECONDS FROM end_time - start_time);
    
    RAISE NOTICE 'Performance Benchmark Results:';
    RAISE NOTICE '==============================';
    RAISE NOTICE 'get_user_tasks_with_context(50): %ms', query_duration_ms;
    
    -- Benchmark 2: Project task stats
    start_time := clock_timestamp();
    PERFORM * FROM project_task_stats WHERE project_id IN (
        SELECT DISTINCT project_id FROM tasks LIMIT 10
    );
    end_time := clock_timestamp();
    query_duration_ms := EXTRACT(MILLISECONDS FROM end_time - start_time);
    
    RAISE NOTICE 'project_task_stats (10 projects): %ms', query_duration_ms;
    
    -- Benchmark 3: User dashboard
    start_time := clock_timestamp();
    PERFORM * FROM user_task_dashboard WHERE user_id = sample_user_id;
    end_time := clock_timestamp();
    query_duration_ms := EXTRACT(MILLISECONDS FROM end_time - start_time);
    
    RAISE NOTICE 'user_task_dashboard: %ms', query_duration_ms;
    
    UPDATE migration_session SET status = 'completed', completed_at = NOW() WHERE id = session_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- MIGRATION SUMMARY REPORT
-- ----------------------------------------------------------------------------

CREATE TEMP VIEW migration_summary AS
SELECT 
    step_name,
    status,
    started_at,
    completed_at,
    completed_at - started_at as duration,
    records_processed,
    error_message
FROM migration_session
ORDER BY id;

-- Display final migration report
DO $$
DECLARE
    summary_record RECORD;
    total_duration INTERVAL := '0 seconds';
    failed_steps INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'TASK MIGRATION SUMMARY REPORT';
    RAISE NOTICE '==============================';
    
    FOR summary_record IN SELECT * FROM migration_summary
    LOOP
        RAISE NOTICE 'Step: % | Status: % | Duration: % | Records: % | Error: %', 
                     summary_record.step_name,
                     summary_record.status,
                     COALESCE(summary_record.duration::TEXT, 'N/A'),
                     COALESCE(summary_record.records_processed::TEXT, 'N/A'),
                     COALESCE(summary_record.error_message, 'None');
        
        IF summary_record.duration IS NOT NULL THEN
            total_duration := total_duration + summary_record.duration;
        END IF;
        
        IF summary_record.status = 'failed' THEN
            failed_steps := failed_steps + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total Migration Duration: %', total_duration;
    RAISE NOTICE 'Failed Steps: %', failed_steps;
    
    IF failed_steps = 0 THEN
        RAISE NOTICE 'Migration Status: SUCCESS - All steps completed successfully';
        RAISE NOTICE '';
        RAISE NOTICE 'NEXT STEPS:';
        RAISE NOTICE '1. Update application code to use normalized tasks table';
        RAISE NOTICE '2. Deploy application changes';
        RAISE NOTICE '3. Test application functionality';
        RAISE NOTICE '4. Monitor performance for 24-48 hours';
        RAISE NOTICE '5. If stable, run cleanup script to remove JSON tasks';
    ELSE
        RAISE NOTICE 'Migration Status: PARTIAL FAILURE - % steps failed', failed_steps;
        RAISE NOTICE '';
        RAISE NOTICE 'RECOVERY ACTIONS:';
        RAISE NOTICE '1. Review error messages above';
        RAISE NOTICE '2. Fix underlying issues';
        RAISE NOTICE '3. Consider rollback if critical issues found';
        RAISE NOTICE '4. Re-run migration after fixes';
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- POST-MIGRATION DATA ANALYSIS
-- ----------------------------------------------------------------------------

-- Analyze migrated data distribution
SELECT 
    'Task Status Distribution' as analysis_type,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM tasks
GROUP BY status
ORDER BY count DESC;

-- Analyze task priority distribution
SELECT 
    'Task Priority Distribution' as analysis_type,
    priority,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM tasks
GROUP BY priority
ORDER BY 
    CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END;

-- Analyze tasks per project
SELECT 
    'Tasks per Project Distribution' as analysis_type,
    COUNT(t.id) as task_count,
    COUNT(p.id) as project_count,
    ROUND(COUNT(t.id)::NUMERIC / COUNT(p.id), 2) as avg_tasks_per_project
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY ()
ORDER BY task_count;

-- Analyze overdue tasks
SELECT 
    'Overdue Tasks Analysis' as analysis_type,
    COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND status != 'completed') as overdue_count,
    COUNT(*) FILTER (WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status != 'completed') as due_this_week,
    COUNT(*) FILTER (WHERE end_date > CURRENT_DATE + INTERVAL '7 days' AND status != 'completed') as future_tasks,
    COUNT(*) FILTER (WHERE end_date IS NULL AND status != 'completed') as no_due_date
FROM tasks;

-- Create indexes usage report
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename = 'tasks'
ORDER BY idx_scan DESC;

-- Final validation query - this should return TRUE
SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM tasks_json_backup bjb
        ) > 0 
        AND (
            SELECT COUNT(*) 
            FROM tasks t
        ) > 0
        AND NOT EXISTS (
            SELECT 1 
            FROM migration_session 
            WHERE status = 'failed'
        )
        THEN 'MIGRATION_SUCCESSFUL'
        ELSE 'MIGRATION_NEEDS_REVIEW'
    END as final_status;

-- Store migration completion timestamp
INSERT INTO backup_metadata (
    backup_type, 
    backup_location, 
    tables_included, 
    status, 
    retention_until,
    created_by
) VALUES (
    'manual',
    'Task Migration Completion - ' || NOW()::TEXT,
    ARRAY['tasks', 'projects'],
    'completed',
    NOW() + INTERVAL '1 year',
    'task_migration_script'
);