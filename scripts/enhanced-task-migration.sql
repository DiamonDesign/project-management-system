-- ============================================================================
-- ENHANCED TASK MIGRATION EXECUTION
-- Production-safe task normalization with comprehensive validation and rollback
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SAFETY PARAMETERS AND CONFIGURATION
-- ----------------------------------------------------------------------------

-- Set transaction timeout and connection limits
SET statement_timeout = '30min';
SET lock_timeout = '5min';
SET idle_in_transaction_session_timeout = '10min';

-- Enable detailed logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000; -- Log queries taking >1s

-- Start migration session
BEGIN;

-- Create migration execution log
CREATE TEMP TABLE IF NOT EXISTS migration_execution_log (
    id SERIAL PRIMARY KEY,
    phase TEXT NOT NULL,
    step_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
    records_affected INTEGER DEFAULT 0,
    duration_ms BIGINT,
    error_message TEXT,
    recovery_action TEXT
);

-- Migration state tracking
CREATE TEMP TABLE migration_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial state
INSERT INTO migration_state (key, value) VALUES
    ('migration_id', gen_random_uuid()::TEXT),
    ('started_at', NOW()::TEXT),
    ('current_phase', 'initialization'),
    ('can_rollback', 'true');

-- ----------------------------------------------------------------------------
-- PHASE 1: INITIALIZATION AND VALIDATION
-- ----------------------------------------------------------------------------

-- Log phase start
INSERT INTO migration_execution_log (phase, step_name) VALUES ('initialization', 'phase_start');

DO $$
DECLARE
    current_version TEXT;
    projects_count INTEGER;
    tasks_count INTEGER;
    critical_issues INTEGER;
    log_id INTEGER;
BEGIN
    -- Get current step log id
    SELECT id INTO log_id FROM migration_execution_log
    WHERE phase = 'initialization' AND step_name = 'phase_start'
    ORDER BY id DESC LIMIT 1;

    -- Validate schema version
    SELECT current_version INTO current_version FROM schema_version;

    IF current_version < '1.3.0' THEN
        UPDATE migration_execution_log
        SET status = 'failed', completed_at = NOW(),
            error_message = 'Schema version ' || current_version || ' insufficient. Requires >= 1.3.0',
            recovery_action = 'Run task-normalization-schema.sql first'
        WHERE id = log_id;
        RAISE EXCEPTION 'Migration aborted: Insufficient schema version';
    END IF;

    -- Count data to migrate
    SELECT
        COUNT(*) as projects,
        SUM(jsonb_array_length(COALESCE(tasks, '[]'))) as tasks
    INTO projects_count, tasks_count
    FROM projects
    WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0;

    -- Check for critical data issues
    SELECT COUNT(*) INTO critical_issues
    FROM (
        -- Check for projects without valid users
        SELECT 1 FROM projects p
        LEFT JOIN auth.users u ON p.user_id = u.id
        WHERE u.id IS NULL
        UNION ALL
        -- Check for invalid date formats that would break migration
        SELECT 1 FROM projects p,
        jsonb_array_elements(p.tasks) as task_element
        WHERE p.tasks IS NOT NULL
        AND ((task_element->>'start_date' IS NOT NULL
              AND task_element->>'start_date' != ''
              AND task_element->>'start_date' !~ '^\d{4}-\d{2}-\d{2}')
         OR (task_element->>'end_date' IS NOT NULL
             AND task_element->>'end_date' != ''
             AND task_element->>'end_date' !~ '^\d{4}-\d{2}-\d{2}'))
    ) critical_data_issues;

    IF critical_issues > 0 THEN
        UPDATE migration_execution_log
        SET status = 'failed', completed_at = NOW(),
            error_message = critical_issues || ' critical data issues found',
            recovery_action = 'Run pre-migration-validation.sql and fix critical issues'
        WHERE id = log_id;
        RAISE EXCEPTION 'Migration aborted: % critical data issues found', critical_issues;
    END IF;

    -- Update migration state
    INSERT INTO migration_state (key, value) VALUES
        ('projects_to_migrate', projects_count::TEXT),
        ('tasks_to_migrate', tasks_count::TEXT),
        ('validation_passed', 'true');

    -- Complete initialization
    UPDATE migration_execution_log
    SET status = 'completed', completed_at = NOW(),
        records_affected = projects_count,
        duration_ms = EXTRACT(MILLISECONDS FROM NOW() - started_at)::BIGINT
    WHERE id = log_id;

    RAISE NOTICE 'INITIALIZATION COMPLETE: % projects with % tasks to migrate',
                 projects_count, tasks_count;
END;
$$;

-- Update migration state
UPDATE migration_state SET value = 'backup', updated_at = NOW() WHERE key = 'current_phase';

-- ----------------------------------------------------------------------------
-- PHASE 2: COMPREHENSIVE BACKUP
-- ----------------------------------------------------------------------------

INSERT INTO migration_execution_log (phase, step_name) VALUES ('backup', 'create_full_backup');

DO $$
DECLARE
    backup_success BOOLEAN;
    backup_count INTEGER;
    log_id INTEGER;
    backup_checksum TEXT;
BEGIN
    SELECT id INTO log_id FROM migration_execution_log
    WHERE phase = 'backup' AND step_name = 'create_full_backup'
    ORDER BY id DESC LIMIT 1;

    -- Create comprehensive backup
    SELECT backup_json_tasks() INTO backup_success;

    IF NOT backup_success THEN
        UPDATE migration_execution_log
        SET status = 'failed', completed_at = NOW(),
            error_message = 'Backup creation failed',
            recovery_action = 'Check backup_json_tasks() function and retry'
        WHERE id = log_id;
        RAISE EXCEPTION 'Backup creation failed - migration aborted';
    END IF;

    -- Verify backup integrity
    SELECT COUNT(*) INTO backup_count FROM tasks_json_backup;

    -- Generate backup checksum
    SELECT md5(string_agg(md5(row(bjb.*)::text), '' ORDER BY bjb.id))
    INTO backup_checksum
    FROM tasks_json_backup bjb;

    -- Store backup metadata
    INSERT INTO backup_metadata (
        backup_type, backup_location, tables_included, status,
        retention_until, created_by, backup_checksum
    ) VALUES (
        'manual',
        'task_migration_' || (SELECT value FROM migration_state WHERE key = 'migration_id'),
        ARRAY['projects', 'tasks'],
        'completed',
        NOW() + INTERVAL '1 year',
        'task_migration_script',
        backup_checksum
    );

    -- Validate backup completeness
    IF backup_count != (SELECT value::INTEGER FROM migration_state WHERE key = 'projects_to_migrate') THEN
        UPDATE migration_execution_log
        SET status = 'failed', completed_at = NOW(),
            error_message = 'Backup incomplete: expected ' ||
                          (SELECT value FROM migration_state WHERE key = 'projects_to_migrate') ||
                          ' but got ' || backup_count,
            recovery_action = 'Investigate backup function and retry'
        WHERE id = log_id;
        RAISE EXCEPTION 'Backup validation failed';
    END IF;

    UPDATE migration_execution_log
    SET status = 'completed', completed_at = NOW(),
        records_affected = backup_count,
        duration_ms = EXTRACT(MILLISECONDS FROM NOW() - started_at)::BIGINT
    WHERE id = log_id;

    INSERT INTO migration_state (key, value) VALUES
        ('backup_checksum', backup_checksum),
        ('backup_count', backup_count::TEXT);

    RAISE NOTICE 'BACKUP COMPLETE: % projects backed up with checksum %',
                 backup_count, backup_checksum;
END;
$$;

-- Update migration state
UPDATE migration_state SET value = 'migration', updated_at = NOW() WHERE key = 'current_phase';

-- ----------------------------------------------------------------------------
-- PHASE 3: INCREMENTAL DATA MIGRATION WITH PROGRESS TRACKING
-- ----------------------------------------------------------------------------

INSERT INTO migration_execution_log (phase, step_name) VALUES ('migration', 'migrate_tasks_incremental');

DO $$
DECLARE
    migration_result RECORD;
    total_migrated INTEGER := 0;
    total_failed INTEGER := 0;
    batch_size INTEGER := 10; -- Process 10 projects at a time
    batch_count INTEGER := 0;
    log_id INTEGER;
    project_batch RECORD;
    error_summary TEXT[] := ARRAY[]::TEXT[];
    start_time TIMESTAMPTZ;
BEGIN
    SELECT id INTO log_id FROM migration_execution_log
    WHERE phase = 'migration' AND step_name = 'migrate_tasks_incremental'
    ORDER BY id DESC LIMIT 1;

    start_time := NOW();

    -- Process projects in batches to prevent memory issues
    FOR project_batch IN
        WITH numbered_projects AS (
            SELECT
                id, name, user_id, tasks,
                ROW_NUMBER() OVER (ORDER BY created_at) as rn,
                CEILING(ROW_NUMBER() OVER (ORDER BY created_at) / batch_size::NUMERIC) as batch_num
            FROM projects
            WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0
        )
        SELECT batch_num, COUNT(*) as projects_in_batch, MIN(rn) as start_row, MAX(rn) as end_row
        FROM numbered_projects
        GROUP BY batch_num
        ORDER BY batch_num
    LOOP
        batch_count := batch_count + 1;

        RAISE NOTICE 'Processing batch %: projects % to % (%/%)',
                     project_batch.batch_num,
                     project_batch.start_row,
                     project_batch.end_row,
                     project_batch.projects_in_batch,
                     (SELECT value FROM migration_state WHERE key = 'projects_to_migrate');

        -- Process current batch
        FOR migration_result IN
            SELECT * FROM migrate_tasks_from_json_batch(project_batch.batch_num, batch_size)
        LOOP
            total_migrated := total_migrated + migration_result.migrated_tasks;
            total_failed := total_failed + migration_result.failed_tasks;

            IF array_length(migration_result.errors, 1) > 0 THEN
                error_summary := error_summary || migration_result.errors;
            END IF;
        END LOOP;

        -- Prevent transaction timeouts on large datasets
        IF batch_count % 5 = 0 THEN
            RAISE NOTICE 'Checkpoint: Processed % batches, % tasks migrated, % failed',
                         batch_count, total_migrated, total_failed;
        END IF;
    END LOOP;

    -- Final migration summary
    UPDATE migration_execution_log
    SET status = CASE WHEN total_failed = 0 THEN 'completed' ELSE 'completed_with_warnings' END,
        completed_at = NOW(),
        records_affected = total_migrated,
        duration_ms = EXTRACT(MILLISECONDS FROM NOW() - start_time)::BIGINT,
        error_message = CASE
            WHEN total_failed > 0 THEN
                'Migration completed with ' || total_failed || ' failures. See error details in logs.'
            ELSE NULL
        END
    WHERE id = log_id;

    -- Update state
    INSERT INTO migration_state (key, value) VALUES
        ('tasks_migrated', total_migrated::TEXT),
        ('tasks_failed', total_failed::TEXT),
        ('migration_errors', array_to_string(error_summary, '; '));

    RAISE NOTICE 'TASK MIGRATION COMPLETE: % migrated, % failed', total_migrated, total_failed;

    IF total_failed > 0 THEN
        RAISE NOTICE 'ERRORS SUMMARY: %', array_to_string(error_summary, '; ');
    END IF;
END;
$$;

-- Create batch migration function for better control
CREATE OR REPLACE FUNCTION migrate_tasks_from_json_batch(batch_num INTEGER, batch_size INTEGER)
RETURNS TABLE(
    project_id UUID,
    migrated_tasks INTEGER,
    failed_tasks INTEGER,
    errors TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_record RECORD;
    task_json JSONB;
    migrated_count INTEGER := 0;
    failed_count INTEGER := 0;
    error_list TEXT[] := ARRAY[]::TEXT[];
    task_record RECORD;
BEGIN
    -- Select projects for this batch
    FOR project_record IN
        WITH numbered_projects AS (
            SELECT
                p.id, p.user_id, p.tasks, p.name,
                ROW_NUMBER() OVER (ORDER BY p.created_at) as rn
            FROM projects p
            WHERE p.tasks IS NOT NULL AND jsonb_array_length(p.tasks) > 0
        )
        SELECT id, user_id, tasks, name, rn
        FROM numbered_projects
        WHERE rn BETWEEN ((batch_num - 1) * batch_size + 1) AND (batch_num * batch_size)
    LOOP
        -- Reset counters for this project
        migrated_count := 0;
        failed_count := 0;
        error_list := ARRAY[]::TEXT[];

        -- Process each task in the project
        FOR task_json IN
            SELECT * FROM jsonb_array_elements(project_record.tasks)
        LOOP
            BEGIN
                -- Enhanced data extraction with more validation
                SELECT
                    COALESCE(task_json->>'id', gen_random_uuid()::text)::UUID as task_id,
                    TRIM(COALESCE(
                        NULLIF(task_json->>'title', ''),
                        NULLIF(task_json->>'description', ''),
                        'Migrated Task #' || (migrated_count + failed_count + 1)
                    )) as title,
                    TRIM(COALESCE(task_json->>'description', '')) as description,
                    CASE
                        WHEN task_json->>'status' IN ('not-started', 'in-progress', 'completed')
                        THEN task_json->>'status'
                        WHEN COALESCE((task_json->>'completed')::boolean, false) = true THEN 'completed'
                        WHEN task_json->>'status' = 'todo' THEN 'not-started'
                        WHEN task_json->>'status' = 'doing' THEN 'in-progress'
                        WHEN task_json->>'status' = 'done' THEN 'completed'
                        ELSE 'not-started'
                    END as status,
                    CASE
                        WHEN task_json->>'priority' IN ('low', 'medium', 'high')
                        THEN task_json->>'priority'::TEXT
                        ELSE 'medium'
                    END as priority,
                    -- Safe date parsing
                    CASE
                        WHEN task_json->>'start_date' IS NOT NULL
                        AND task_json->>'start_date' != ''
                        AND task_json->>'start_date' ~ '^\d{4}-\d{2}-\d{2}'
                        THEN (task_json->>'start_date')::DATE
                        ELSE NULL
                    END as start_date,
                    CASE
                        WHEN task_json->>'end_date' IS NOT NULL
                        AND task_json->>'end_date' != ''
                        AND task_json->>'end_date' ~ '^\d{4}-\d{2}-\d{2}'
                        THEN (task_json->>'end_date')::DATE
                        ELSE NULL
                    END as end_date,
                    COALESCE((task_json->>'is_daily_task')::boolean, false) as is_daily_task,
                    COALESCE((task_json->>'sort_order')::integer, 0) as sort_order,
                    -- Preserve original timestamps where possible
                    CASE
                        WHEN task_json->>'createdAt' IS NOT NULL
                        THEN (task_json->>'createdAt')::TIMESTAMPTZ
                        WHEN task_json->>'created_at' IS NOT NULL
                        THEN (task_json->>'created_at')::TIMESTAMPTZ
                        ELSE NOW()
                    END as created_at
                INTO task_record;

                -- Additional validation
                IF LENGTH(task_record.title) > 500 THEN
                    task_record.title := LEFT(task_record.title, 497) || '...';
                END IF;

                IF LENGTH(task_record.description) > 5000 THEN
                    task_record.description := LEFT(task_record.description, 4997) || '...';
                END IF;

                -- Insert into normalized tasks table
                INSERT INTO tasks (
                    id, project_id, user_id, title, description, status, priority,
                    start_date, end_date, is_daily_task, sort_order, created_at, updated_at
                ) VALUES (
                    task_record.task_id,
                    project_record.id,
                    project_record.user_id,
                    task_record.title,
                    task_record.description,
                    task_record.status,
                    task_record.priority,
                    task_record.start_date,
                    task_record.end_date,
                    task_record.is_daily_task,
                    task_record.sort_order,
                    task_record.created_at,
                    task_record.created_at
                );

                migrated_count := migrated_count + 1;

            EXCEPTION
                WHEN OTHERS THEN
                    failed_count := failed_count + 1;
                    error_list := array_append(error_list,
                        'Project: ' || project_record.name || ' - Task JSON: ' ||
                        task_json::text || ' - Error: ' || SQLERRM);
            END;
        END LOOP;

        -- Return results for this project
        RETURN QUERY SELECT
            project_record.id,
            migrated_count,
            failed_count,
            error_list;
    END LOOP;
END;
$$;

-- Update migration state
UPDATE migration_state SET value = 'validation', updated_at = NOW() WHERE key = 'current_phase';

-- ----------------------------------------------------------------------------
-- PHASE 4: COMPREHENSIVE VALIDATION
-- ----------------------------------------------------------------------------

INSERT INTO migration_execution_log (phase, step_name) VALUES ('validation', 'validate_migration_integrity');

DO $$
DECLARE
    validation_result RECORD;
    all_validations_passed BOOLEAN := TRUE;
    log_id INTEGER;
    expected_tasks INTEGER;
    actual_tasks INTEGER;
    validation_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    SELECT id INTO log_id FROM migration_execution_log
    WHERE phase = 'validation' AND step_name = 'validate_migration_integrity'
    ORDER BY id DESC LIMIT 1;

    RAISE NOTICE 'VALIDATION PHASE: Running comprehensive integrity checks...';

    -- Enhanced validation with detailed reporting
    FOR validation_result IN
        SELECT * FROM validate_task_migration_enhanced()
    LOOP
        RAISE NOTICE 'Validation: % - Expected: %, Actual: %, Status: %, Details: %',
                     validation_result.validation_check,
                     validation_result.expected_count,
                     validation_result.actual_count,
                     validation_result.status,
                     validation_result.details;

        IF validation_result.status != 'PASS' THEN
            all_validations_passed := FALSE;
            validation_errors := array_append(validation_errors,
                validation_result.validation_check || ': ' || validation_result.details);
        END IF;
    END LOOP;

    -- Additional custom validations
    -- Check for data loss
    SELECT (SELECT value FROM migration_state WHERE key = 'tasks_to_migrate')::INTEGER,
           COUNT(*)
    INTO expected_tasks, actual_tasks
    FROM tasks;

    IF actual_tasks < expected_tasks * 0.95 THEN -- Allow 5% tolerance for invalid data
        all_validations_passed := FALSE;
        validation_errors := array_append(validation_errors,
            'Significant data loss detected: expected ~' || expected_tasks ||
            ' but migrated only ' || actual_tasks);
    END IF;

    -- Check for orphaned tasks (should never happen with proper FK constraints)
    IF EXISTS (SELECT 1 FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE p.id IS NULL) THEN
        all_validations_passed := FALSE;
        validation_errors := array_append(validation_errors, 'Orphaned tasks found');
    END IF;

    -- Check for user ownership consistency
    IF EXISTS (SELECT 1 FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.user_id != p.user_id) THEN
        all_validations_passed := FALSE;
        validation_errors := array_append(validation_errors, 'User ownership inconsistency detected');
    END IF;

    IF all_validations_passed THEN
        UPDATE migration_execution_log
        SET status = 'completed', completed_at = NOW(),
            duration_ms = EXTRACT(MILLISECONDS FROM NOW() - started_at)::BIGINT
        WHERE id = log_id;

        UPDATE migration_state SET value = 'validation_passed', updated_at = NOW() WHERE key = 'current_phase';
        RAISE NOTICE 'VALIDATION COMPLETE: All checks passed';
    ELSE
        UPDATE migration_execution_log
        SET status = 'failed', completed_at = NOW(),
            error_message = 'Validation failures: ' || array_to_string(validation_errors, '; '),
            recovery_action = 'Review validation errors and consider rollback',
            duration_ms = EXTRACT(MILLISECONDS FROM NOW() - started_at)::BIGINT
        WHERE id = log_id;

        UPDATE migration_state SET value = 'validation_failed', updated_at = NOW() WHERE key = 'current_phase';
        UPDATE migration_state SET value = 'false', updated_at = NOW() WHERE key = 'can_rollback';

        RAISE EXCEPTION 'VALIDATION FAILED: %', array_to_string(validation_errors, '; ');
    END IF;
END;
$$;

-- Enhanced validation function
CREATE OR REPLACE FUNCTION validate_task_migration_enhanced()
RETURNS TABLE(
    validation_check TEXT,
    expected_count BIGINT,
    actual_count BIGINT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Total task count validation
    RETURN QUERY
    SELECT
        'total_task_count'::TEXT,
        (SELECT value FROM migration_state WHERE key = 'tasks_to_migrate')::BIGINT,
        (SELECT COUNT(*) FROM tasks)::BIGINT,
        CASE
            WHEN (SELECT COUNT(*) FROM tasks) >=
                 (SELECT value FROM migration_state WHERE key = 'tasks_to_migrate')::BIGINT * 0.95
            THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT,
        CASE
            WHEN (SELECT COUNT(*) FROM tasks) =
                 (SELECT value FROM migration_state WHERE key = 'tasks_to_migrate')::BIGINT
            THEN 'Exact match - perfect migration'
            WHEN (SELECT COUNT(*) FROM tasks) >=
                 (SELECT value FROM migration_state WHERE key = 'tasks_to_migrate')::BIGINT * 0.95
            THEN 'Within acceptable range (>95%)'
            ELSE 'Significant data loss detected'
        END::TEXT;

    -- Project relationship validation
    RETURN QUERY
    SELECT
        'project_relationships'::TEXT,
        (SELECT COUNT(DISTINCT id) FROM projects WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0)::BIGINT,
        (SELECT COUNT(DISTINCT project_id) FROM tasks)::BIGINT,
        CASE
            WHEN (SELECT COUNT(DISTINCT project_id) FROM tasks) =
                 (SELECT COUNT(DISTINCT id) FROM projects WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0)
            THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT,
        'All projects with tasks should have corresponding normalized tasks'::TEXT;

    -- User ownership consistency validation
    RETURN QUERY
    SELECT
        'user_ownership_consistency'::TEXT,
        0::BIGINT,
        (SELECT COUNT(*) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.user_id != p.user_id)::BIGINT,
        CASE
            WHEN (SELECT COUNT(*) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.user_id != p.user_id) = 0
            THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT,
        'Task user_id should match project user_id'::TEXT;

    -- Data quality validation
    RETURN QUERY
    SELECT
        'required_fields_populated'::TEXT,
        (SELECT COUNT(*) FROM tasks)::BIGINT,
        (SELECT COUNT(*) FROM tasks WHERE title IS NOT NULL AND LENGTH(TRIM(title)) > 0)::BIGINT,
        CASE
            WHEN (SELECT COUNT(*) FROM tasks WHERE title IS NULL OR LENGTH(TRIM(title)) = 0) = 0
            THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT,
        'All tasks should have non-empty titles'::TEXT;

    -- Enum validation
    RETURN QUERY
    SELECT
        'valid_enum_values'::TEXT,
        (SELECT COUNT(*) FROM tasks)::BIGINT,
        (SELECT COUNT(*) FROM tasks
         WHERE status IN ('not-started', 'in-progress', 'completed')
         AND priority IN ('low', 'medium', 'high'))::BIGINT,
        CASE
            WHEN (SELECT COUNT(*) FROM tasks
                  WHERE status NOT IN ('not-started', 'in-progress', 'completed')
                  OR priority NOT IN ('low', 'medium', 'high')) = 0
            THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT,
        'All tasks should have valid status and priority enum values'::TEXT;

END;
$$;

-- ----------------------------------------------------------------------------
-- PHASE 5: PERFORMANCE VALIDATION
-- ----------------------------------------------------------------------------

INSERT INTO migration_execution_log (phase, step_name) VALUES ('performance', 'benchmark_queries');

DO $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    query_duration_ms BIGINT;
    sample_user_id UUID;
    sample_project_id UUID;
    log_id INTEGER;
    performance_results TEXT[] := ARRAY[]::TEXT[];
BEGIN
    SELECT id INTO log_id FROM migration_execution_log
    WHERE phase = 'performance' AND step_name = 'benchmark_queries'
    ORDER BY id DESC LIMIT 1;

    -- Get sample IDs
    SELECT DISTINCT user_id INTO sample_user_id FROM tasks LIMIT 1;
    SELECT DISTINCT project_id INTO sample_project_id FROM tasks LIMIT 1;

    IF sample_user_id IS NULL OR sample_project_id IS NULL THEN
        RAISE NOTICE 'No sample data found for performance testing';
        UPDATE migration_execution_log
        SET status = 'skipped', completed_at = NOW() WHERE id = log_id;
        RETURN;
    END IF;

    RAISE NOTICE 'PERFORMANCE BENCHMARKING with user % and project %',
                 sample_user_id, sample_project_id;

    -- Benchmark 1: User tasks query
    start_time := clock_timestamp();
    PERFORM * FROM get_user_tasks_with_context(sample_user_id, 100);
    end_time := clock_timestamp();
    query_duration_ms := EXTRACT(MILLISECONDS FROM end_time - start_time);

    performance_results := array_append(performance_results,
        'get_user_tasks_with_context(100): ' || query_duration_ms || 'ms');
    RAISE NOTICE 'Query benchmark - get_user_tasks_with_context: %ms', query_duration_ms;

    -- Benchmark 2: Project task stats
    start_time := clock_timestamp();
    PERFORM * FROM project_task_stats WHERE project_id = sample_project_id;
    end_time := clock_timestamp();
    query_duration_ms := EXTRACT(MILLISECONDS FROM end_time - start_time);

    performance_results := array_append(performance_results,
        'project_task_stats: ' || query_duration_ms || 'ms');
    RAISE NOTICE 'Query benchmark - project_task_stats: %ms', query_duration_ms;

    -- Benchmark 3: User dashboard aggregation
    start_time := clock_timestamp();
    PERFORM * FROM user_task_dashboard WHERE user_id = sample_user_id;
    end_time := clock_timestamp();
    query_duration_ms := EXTRACT(MILLISECONDS FROM end_time - start_time);

    performance_results := array_append(performance_results,
        'user_task_dashboard: ' || query_duration_ms || 'ms');
    RAISE NOTICE 'Query benchmark - user_task_dashboard: %ms', query_duration_ms;

    -- Benchmark 4: Task filtering and sorting
    start_time := clock_timestamp();
    PERFORM * FROM tasks
    WHERE user_id = sample_user_id
    AND status IN ('in-progress', 'not-started')
    ORDER BY priority DESC, end_date ASC NULLS LAST
    LIMIT 50;
    end_time := clock_timestamp();
    query_duration_ms := EXTRACT(MILLISECONDS FROM end_time - start_time);

    performance_results := array_append(performance_results,
        'filtered_sorted_tasks: ' || query_duration_ms || 'ms');
    RAISE NOTICE 'Query benchmark - filtered/sorted tasks: %ms', query_duration_ms;

    UPDATE migration_execution_log
    SET status = 'completed', completed_at = NOW(),
        error_message = array_to_string(performance_results, '; '),
        duration_ms = EXTRACT(MILLISECONDS FROM NOW() - started_at)::BIGINT
    WHERE id = log_id;

    INSERT INTO migration_state (key, value) VALUES
        ('performance_results', array_to_string(performance_results, '; '));

    RAISE NOTICE 'PERFORMANCE BENCHMARKS COMPLETE';
END;
$$;

-- Update migration state
UPDATE migration_state SET value = 'completed', updated_at = NOW() WHERE key = 'current_phase';

-- ----------------------------------------------------------------------------
-- FINAL MIGRATION REPORT
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    migration_summary RECORD;
    total_duration INTERVAL;
    success_rate NUMERIC;
    final_status TEXT;
BEGIN
    -- Calculate overall statistics
    SELECT
        COUNT(*) as total_steps,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_steps,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_steps,
        COUNT(*) FILTER (WHERE status = 'completed_with_warnings') as warning_steps,
        SUM(duration_ms) as total_duration_ms,
        MAX(completed_at) - MIN(started_at) as wall_clock_duration
    INTO migration_summary
    FROM migration_execution_log;

    success_rate := (migration_summary.completed_steps + migration_summary.warning_steps) * 100.0 /
                    migration_summary.total_steps;

    final_status := CASE
        WHEN migration_summary.failed_steps > 0 THEN 'FAILED'
        WHEN migration_summary.warning_steps > 0 THEN 'COMPLETED_WITH_WARNINGS'
        ELSE 'SUCCESS'
    END;

    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '        TASK MIGRATION FINAL REPORT      ';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration Status: %', final_status;
    RAISE NOTICE 'Success Rate: %% (%/%)', ROUND(success_rate, 1),
                 migration_summary.completed_steps + migration_summary.warning_steps,
                 migration_summary.total_steps;
    RAISE NOTICE 'Total Duration: %', migration_summary.wall_clock_duration;
    RAISE NOTICE 'Processing Time: % ms', migration_summary.total_duration_ms;
    RAISE NOTICE '';

    -- Detailed statistics
    RAISE NOTICE 'MIGRATION STATISTICS:';
    RAISE NOTICE 'Projects Migrated: %', (SELECT value FROM migration_state WHERE key = 'projects_to_migrate');
    RAISE NOTICE 'Tasks Migrated: %', (SELECT value FROM migration_state WHERE key = 'tasks_migrated');
    RAISE NOTICE 'Tasks Failed: %', COALESCE((SELECT value FROM migration_state WHERE key = 'tasks_failed'), '0');
    RAISE NOTICE 'Backup Created: % projects', (SELECT value FROM migration_state WHERE key = 'backup_count');
    RAISE NOTICE 'Backup Checksum: %', (SELECT value FROM migration_state WHERE key = 'backup_checksum');
    RAISE NOTICE '';

    -- Performance results
    IF EXISTS (SELECT 1 FROM migration_state WHERE key = 'performance_results') THEN
        RAISE NOTICE 'PERFORMANCE BENCHMARKS:';
        RAISE NOTICE '%', (SELECT value FROM migration_state WHERE key = 'performance_results');
        RAISE NOTICE '';
    END IF;

    -- Next steps recommendation
    IF final_status = 'SUCCESS' THEN
        RAISE NOTICE 'NEXT STEPS:';
        RAISE NOTICE '1. ✅ Update application code to use normalized tasks table';
        RAISE NOTICE '2. ✅ Deploy application changes';
        RAISE NOTICE '3. ✅ Monitor performance for 24-48 hours';
        RAISE NOTICE '4. ✅ Run cleanup script to remove JSON tasks column';
        RAISE NOTICE '5. ✅ Update backup schedules to include tasks table';
    ELSIF final_status = 'COMPLETED_WITH_WARNINGS' THEN
        RAISE NOTICE 'NEXT STEPS:';
        RAISE NOTICE '1. ⚠️  Review warnings in migration log';
        RAISE NOTICE '2. ✅ Test application functionality thoroughly';
        RAISE NOTICE '3. ✅ Monitor for data consistency issues';
        RAISE NOTICE '4. ✅ Consider re-migrating failed tasks manually';
    ELSE
        RAISE NOTICE 'RECOVERY ACTIONS REQUIRED:';
        RAISE NOTICE '1. ❌ Review detailed error logs';
        RAISE NOTICE '2. ❌ Consider rolling back migration';
        RAISE NOTICE '3. ❌ Fix underlying issues';
        RAISE NOTICE '4. ❌ Re-run migration after fixes';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Migration ID: %', (SELECT value FROM migration_state WHERE key = 'migration_id');
    RAISE NOTICE 'Completed At: %', NOW();
    RAISE NOTICE '==========================================';

    -- Store final state
    INSERT INTO migration_state (key, value) VALUES
        ('final_status', final_status),
        ('success_rate', success_rate::TEXT),
        ('completed_at', NOW()::TEXT);

END;
$$;

-- Commit the transaction if everything succeeded
COMMIT;

-- Create permanent record of migration
INSERT INTO backup_metadata (
    backup_type, backup_location, tables_included, status,
    retention_until, created_by
) VALUES (
    'manual',
    'task_migration_completion_' || NOW()::DATE,
    ARRAY['tasks', 'projects', 'migration_logs'],
    'completed',
    NOW() + INTERVAL '2 years',
    'enhanced_task_migration_script'
);

-- Grant permissions for new normalized structure
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON SEQUENCE tasks_id_seq TO authenticated;

-- Final verification query
SELECT
    'FINAL VERIFICATION' as check_type,
    (SELECT COUNT(*) FROM tasks) as total_tasks,
    (SELECT COUNT(DISTINCT project_id) FROM tasks) as projects_with_tasks,
    (SELECT COUNT(DISTINCT user_id) FROM tasks) as users_with_tasks,
    NOW() as verified_at;