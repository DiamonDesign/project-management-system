-- ============================================================================
-- MIGRATION-SPECIFIC BACKUP AND DISASTER RECOVERY STRATEGY
-- Specialized backup procedures for task normalization migration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PRE-MIGRATION BACKUP CONFIGURATION
-- ----------------------------------------------------------------------------

-- Create migration-specific backup schema
CREATE SCHEMA IF NOT EXISTS migration_backups;

-- Migration backup tracking table
CREATE TABLE IF NOT EXISTS migration_backups.migration_backup_log (
    id BIGSERIAL PRIMARY KEY,
    migration_id UUID NOT NULL,
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN (
        'pre_migration_full', 'pre_migration_json', 'incremental', 'rollback_point', 'post_migration'
    )),
    backup_location TEXT NOT NULL,
    backup_size_bytes BIGINT,
    backup_start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    backup_end_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    checksum TEXT,
    compression_ratio NUMERIC(5,2),
    restoration_tested BOOLEAN DEFAULT FALSE,
    retention_until TIMESTAMPTZ NOT NULL,
    backup_metadata JSONB,
    error_details TEXT,
    created_by TEXT DEFAULT CURRENT_USER
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_migration_backup_migration_id ON migration_backups.migration_backup_log(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_backup_type_status ON migration_backups.migration_backup_log(backup_type, status);
CREATE INDEX IF NOT EXISTS idx_migration_backup_retention ON migration_backups.migration_backup_log(retention_until);

-- ----------------------------------------------------------------------------
-- 2. COMPREHENSIVE PRE-MIGRATION BACKUP FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION migration_backups.create_full_pre_migration_backup(
    p_migration_id UUID
)
RETURNS TABLE(
    backup_id BIGINT,
    backup_type TEXT,
    status TEXT,
    backup_size TEXT,
    duration_seconds NUMERIC,
    checksum TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_record_id BIGINT;
    backup_start TIMESTAMPTZ;
    backup_end TIMESTAMPTZ;
    backup_checksum TEXT;
    table_sizes RECORD;
    total_size BIGINT := 0;
    projects_count INTEGER;
    tasks_count INTEGER;
BEGIN
    backup_start := NOW();

    -- Create backup log entry
    INSERT INTO migration_backups.migration_backup_log (
        migration_id, backup_type, backup_location, retention_until,
        backup_metadata
    ) VALUES (
        p_migration_id,
        'pre_migration_full',
        'full_backup_' || p_migration_id || '_' || EXTRACT(EPOCH FROM backup_start)::BIGINT,
        backup_start + INTERVAL '2 years',
        jsonb_build_object(
            'postgres_version', version(),
            'supabase_version', current_database(),
            'backup_method', 'logical_full',
            'tables_included', ARRAY['projects', 'clients', 'profiles', 'client_portal_users', 'tasks_json_backup']
        )
    ) RETURNING id INTO backup_record_id;

    -- Calculate baseline metrics
    SELECT COUNT(*) INTO projects_count FROM projects;
    SELECT SUM(jsonb_array_length(COALESCE(tasks, '[]'))) INTO tasks_count
    FROM projects WHERE tasks IS NOT NULL;

    -- Create comprehensive backup tables in backup schema

    -- 1. Backup projects table (full structure + data)
    EXECUTE format('CREATE TABLE migration_backups.projects_backup_%s AS SELECT * FROM public.projects',
                   EXTRACT(EPOCH FROM backup_start)::BIGINT);

    -- 2. Backup clients table
    EXECUTE format('CREATE TABLE migration_backups.clients_backup_%s AS SELECT * FROM public.clients',
                   EXTRACT(EPOCH FROM backup_start)::BIGINT);

    -- 3. Backup profiles table
    EXECUTE format('CREATE TABLE migration_backups.profiles_backup_%s AS SELECT * FROM public.profiles',
                   EXTRACT(EPOCH FROM backup_start)::BIGINT);

    -- 4. Backup client portal users
    EXECUTE format('CREATE TABLE migration_backups.client_portal_users_backup_%s AS SELECT * FROM public.client_portal_users',
                   EXTRACT(EPOCH FROM backup_start)::BIGINT);

    -- 5. Create JSON tasks extraction backup
    EXECUTE format('
        CREATE TABLE migration_backups.json_tasks_backup_%s AS
        SELECT
            p.id as project_id,
            p.name as project_name,
            p.user_id,
            p.created_at as project_created_at,
            p.tasks as original_tasks_json,
            jsonb_array_length(COALESCE(p.tasks, ''[]'')) as task_count,
            md5(p.tasks::text) as tasks_checksum
        FROM public.projects p
        WHERE p.tasks IS NOT NULL AND jsonb_array_length(p.tasks) > 0
    ', EXTRACT(EPOCH FROM backup_start)::BIGINT);

    -- 6. Create individual task extraction for detailed backup
    EXECUTE format('
        CREATE TABLE migration_backups.individual_tasks_backup_%s AS
        WITH extracted_tasks AS (
            SELECT
                p.id as project_id,
                p.name as project_name,
                p.user_id,
                task_element,
                task_element->>''id'' as task_id,
                task_element->>''title'' as task_title,
                task_element->>''status'' as task_status,
                task_element->>''priority'' as task_priority,
                ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY task_element) as task_order
            FROM public.projects p,
            jsonb_array_elements(p.tasks) as task_element
            WHERE p.tasks IS NOT NULL AND jsonb_array_length(p.tasks) > 0
        )
        SELECT
            project_id,
            project_name,
            user_id,
            task_id,
            task_title,
            task_status,
            task_priority,
            task_order,
            task_element,
            md5(task_element::text) as task_checksum
        FROM extracted_tasks
    ', EXTRACT(EPOCH FROM backup_start)::BIGINT);

    -- Calculate total backup size
    FOR table_sizes IN
        SELECT
            schemaname,
            tablename,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'migration_backups'
        AND tablename LIKE '%backup_' || EXTRACT(EPOCH FROM backup_start)::BIGINT
    LOOP
        total_size := total_size + table_sizes.size_bytes;
    END LOOP;

    -- Generate comprehensive checksum
    EXECUTE format('
        SELECT md5(string_agg(table_checksum, '''' ORDER BY table_name))
        FROM (
            SELECT ''projects'' as table_name, md5(string_agg(md5(t.*::text), '''' ORDER BY id)) as table_checksum
            FROM migration_backups.projects_backup_%s t
            UNION ALL
            SELECT ''clients'', md5(string_agg(md5(t.*::text), '''' ORDER BY id))
            FROM migration_backups.clients_backup_%s t
            UNION ALL
            SELECT ''profiles'', md5(string_agg(md5(t.*::text), '''' ORDER BY id))
            FROM migration_backups.profiles_backup_%s t
            UNION ALL
            SELECT ''json_tasks'', md5(string_agg(md5(t.*::text), '''' ORDER BY project_id))
            FROM migration_backups.json_tasks_backup_%s t
        ) checksums
    ',
    EXTRACT(EPOCH FROM backup_start)::BIGINT,
    EXTRACT(EPOCH FROM backup_start)::BIGINT,
    EXTRACT(EPOCH FROM backup_start)::BIGINT,
    EXTRACT(EPOCH FROM backup_start)::BIGINT
    ) INTO backup_checksum;

    backup_end := NOW();

    -- Update backup log
    UPDATE migration_backups.migration_backup_log
    SET
        backup_end_time = backup_end,
        status = 'completed',
        backup_size_bytes = total_size,
        checksum = backup_checksum,
        backup_metadata = backup_metadata || jsonb_build_object(
            'projects_count', projects_count,
            'tasks_count', tasks_count,
            'backup_tables_created', 6,
            'backup_duration_seconds', EXTRACT(SECONDS FROM backup_end - backup_start)
        )
    WHERE id = backup_record_id;

    -- Return backup details
    RETURN QUERY SELECT
        backup_record_id,
        'pre_migration_full'::TEXT,
        'completed'::TEXT,
        pg_size_pretty(total_size),
        EXTRACT(SECONDS FROM backup_end - backup_start),
        backup_checksum;

EXCEPTION
    WHEN OTHERS THEN
        -- Update backup log with error
        UPDATE migration_backups.migration_backup_log
        SET
            backup_end_time = NOW(),
            status = 'failed',
            error_details = SQLERRM
        WHERE id = backup_record_id;

        RAISE EXCEPTION 'Pre-migration backup failed: %', SQLERRM;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. BACKUP VERIFICATION FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION migration_backups.verify_backup_integrity(
    p_migration_id UUID,
    p_backup_type TEXT DEFAULT 'pre_migration_full'
)
RETURNS TABLE(
    verification_check TEXT,
    expected_value TEXT,
    actual_value TEXT,
    status TEXT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_info RECORD;
    backup_timestamp BIGINT;
    verification_start TIMESTAMPTZ;
    table_count INTEGER;
    row_count INTEGER;
    original_checksum TEXT;
    backup_checksum TEXT;
BEGIN
    verification_start := NOW();

    -- Get backup information
    SELECT * INTO backup_info
    FROM migration_backups.migration_backup_log
    WHERE migration_id = p_migration_id
    AND backup_type = p_backup_type
    AND status = 'completed'
    ORDER BY backup_start_time DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT
            'backup_exists'::TEXT,
            'backup record found'::TEXT,
            'no backup record'::TEXT,
            'FAIL'::TEXT,
            'No completed backup found for migration ' || p_migration_id::TEXT;
        RETURN;
    END IF;

    backup_timestamp := EXTRACT(EPOCH FROM backup_info.backup_start_time)::BIGINT;

    -- Check 1: Verify backup tables exist
    SELECT COUNT(*) INTO table_count
    FROM pg_tables
    WHERE schemaname = 'migration_backups'
    AND tablename LIKE '%backup_' || backup_timestamp;

    RETURN QUERY SELECT
        'backup_tables_exist'::TEXT,
        '6'::TEXT,
        table_count::TEXT,
        CASE WHEN table_count = 6 THEN 'PASS' ELSE 'FAIL' END,
        CASE WHEN table_count = 6 THEN 'All backup tables created successfully'
             ELSE 'Missing ' || (6 - table_count)::TEXT || ' backup tables' END;

    -- Check 2: Verify projects backup row count
    EXECUTE format('SELECT COUNT(*) FROM migration_backups.projects_backup_%s', backup_timestamp) INTO row_count;

    RETURN QUERY SELECT
        'projects_row_count'::TEXT,
        (SELECT COUNT(*)::TEXT FROM projects),
        row_count::TEXT,
        CASE WHEN row_count = (SELECT COUNT(*) FROM projects) THEN 'PASS' ELSE 'FAIL' END,
        'Backup should contain all projects';

    -- Check 3: Verify JSON tasks backup
    EXECUTE format('
        SELECT COUNT(*) FROM migration_backups.json_tasks_backup_%s
        WHERE original_tasks_json IS NOT NULL AND task_count > 0
    ', backup_timestamp) INTO row_count;

    RETURN QUERY SELECT
        'json_tasks_backup_count'::TEXT,
        (SELECT COUNT(*)::TEXT FROM projects WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0),
        row_count::TEXT,
        CASE WHEN row_count = (SELECT COUNT(*) FROM projects WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0)
             THEN 'PASS' ELSE 'FAIL' END,
        'JSON tasks backup should match projects with tasks';

    -- Check 4: Verify individual tasks extraction
    EXECUTE format('SELECT COUNT(*) FROM migration_backups.individual_tasks_backup_%s', backup_timestamp) INTO row_count;

    RETURN QUERY SELECT
        'individual_tasks_count'::TEXT,
        (SELECT SUM(jsonb_array_length(COALESCE(tasks, '[]')))::TEXT FROM projects WHERE tasks IS NOT NULL),
        row_count::TEXT,
        CASE WHEN ABS(row_count - (SELECT SUM(jsonb_array_length(COALESCE(tasks, '[]'))) FROM projects WHERE tasks IS NOT NULL)) <=
                  (SELECT SUM(jsonb_array_length(COALESCE(tasks, '[]'))) FROM projects WHERE tasks IS NOT NULL) * 0.01
             THEN 'PASS' ELSE 'FAIL' END,
        'Individual task extraction should match total JSON tasks (±1%)';

    -- Check 5: Verify backup checksums
    RETURN QUERY SELECT
        'backup_checksum_verification'::TEXT,
        'checksum valid'::TEXT,
        CASE WHEN backup_info.checksum IS NOT NULL AND LENGTH(backup_info.checksum) = 32
             THEN 'checksum present' ELSE 'checksum missing' END,
        CASE WHEN backup_info.checksum IS NOT NULL AND LENGTH(backup_info.checksum) = 32
             THEN 'PASS' ELSE 'FAIL' END,
        'Backup checksum should be present and valid MD5 hash';

    -- Check 6: Verify backup metadata
    RETURN QUERY SELECT
        'backup_metadata_completeness'::TEXT,
        'complete metadata'::TEXT,
        CASE WHEN backup_info.backup_metadata ? 'projects_count'
                  AND backup_info.backup_metadata ? 'tasks_count'
                  AND backup_info.backup_metadata ? 'backup_duration_seconds'
             THEN 'complete' ELSE 'incomplete' END,
        CASE WHEN backup_info.backup_metadata ? 'projects_count'
                  AND backup_info.backup_metadata ? 'tasks_count'
                  AND backup_info.backup_metadata ? 'backup_duration_seconds'
             THEN 'PASS' ELSE 'FAIL' END,
        'Backup metadata should contain essential migration information';

    -- Log verification completion
    INSERT INTO migration_backups.migration_backup_log (
        migration_id, backup_type, backup_location, retention_until,
        backup_metadata
    ) VALUES (
        p_migration_id,
        p_backup_type || '_verification',
        'verification_' || p_migration_id || '_' || EXTRACT(EPOCH FROM verification_start)::BIGINT,
        verification_start + INTERVAL '1 month',
        jsonb_build_object(
            'verification_completed_at', verification_start,
            'original_backup_id', backup_info.id,
            'verification_type', 'integrity_check'
        )
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. DISASTER RECOVERY PROCEDURES
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION migration_backups.create_rollback_plan(
    p_migration_id UUID
)
RETURNS TABLE(
    step_order INTEGER,
    step_name TEXT,
    step_description TEXT,
    estimated_duration TEXT,
    risk_level TEXT,
    rollback_sql TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_timestamp BIGINT;
    backup_info RECORD;
BEGIN
    -- Get the pre-migration backup info
    SELECT * INTO backup_info
    FROM migration_backups.migration_backup_log
    WHERE migration_id = p_migration_id
    AND backup_type = 'pre_migration_full'
    AND status = 'completed'
    ORDER BY backup_start_time DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No pre-migration backup found for migration %', p_migration_id;
    END IF;

    backup_timestamp := EXTRACT(EPOCH FROM backup_info.backup_start_time)::BIGINT;

    -- Generate rollback plan
    RETURN QUERY VALUES
        (1, 'Stop Application Access',
         'Put application in maintenance mode and stop all database connections',
         '2-5 minutes', 'LOW',
         '-- Application-level maintenance mode activation required'),

        (2, 'Drop Normalized Tasks Table',
         'Remove the new normalized tasks table to prevent conflicts',
         '1-2 minutes', 'MEDIUM',
         'DROP TABLE IF EXISTS public.tasks CASCADE;'),

        (3, 'Restore Projects Table',
         'Replace current projects table with pre-migration backup',
         '5-15 minutes', 'HIGH',
         format('
BEGIN;
-- Backup current state for investigation
CREATE TABLE projects_failed_migration_backup AS SELECT * FROM public.projects;

-- Restore from backup
DROP TABLE public.projects CASCADE;
CREATE TABLE public.projects AS SELECT * FROM migration_backups.projects_backup_%s;

-- Restore constraints and indexes
ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
-- Add other constraints as needed

COMMIT;', backup_timestamp)),

        (4, 'Restore Related Tables',
         'Restore clients and other related tables if they were modified',
         '3-10 minutes', 'MEDIUM',
         format('
BEGIN;
-- Restore clients if modified
DROP TABLE IF EXISTS public.clients CASCADE;
CREATE TABLE public.clients AS SELECT * FROM migration_backups.clients_backup_%s;

-- Restore profiles if modified
DROP TABLE IF EXISTS public.profiles CASCADE;
CREATE TABLE public.profiles AS SELECT * FROM migration_backups.profiles_backup_%s;

-- Restore client portal users if modified
DROP TABLE IF EXISTS public.client_portal_users CASCADE;
CREATE TABLE public.client_portal_users AS SELECT * FROM migration_backups.client_portal_users_backup_%s;

COMMIT;', backup_timestamp, backup_timestamp, backup_timestamp)),

        (5, 'Restore RLS Policies',
         'Recreate Row Level Security policies that may have been affected',
         '2-5 minutes', 'MEDIUM',
         '-- Re-run RLS policy scripts
\\i enhanced-rls-security-implementation.sql'),

        (6, 'Verify Data Integrity',
         'Run comprehensive verification of restored data',
         '3-10 minutes', 'LOW',
         format('
-- Verify project count
SELECT ''Projects restored'' as check_type, COUNT(*) as count FROM public.projects;

-- Verify JSON tasks integrity
SELECT
    ''JSON Tasks Integrity'' as check_type,
    COUNT(*) as projects_with_tasks,
    SUM(jsonb_array_length(COALESCE(tasks, ''[]''))) as total_tasks
FROM public.projects
WHERE tasks IS NOT NULL;

-- Verify checksums match backup
WITH current_checksum AS (
    SELECT md5(string_agg(md5(p.*::text), '''' ORDER BY id)) as current_hash
    FROM public.projects p
),
backup_checksum AS (
    SELECT checksum as backup_hash
    FROM migration_backups.migration_backup_log
    WHERE id = %s
)
SELECT
    ''Checksum Verification'' as check_type,
    CASE WHEN c.current_hash = b.backup_hash
         THEN ''MATCH - Rollback Successful''
         ELSE ''MISMATCH - Data Integrity Issue''
    END as status
FROM current_checksum c, backup_checksum b;', backup_info.id)),

        (7, 'Restore Application Access',
         'Remove maintenance mode and restore normal application operation',
         '1-2 minutes', 'LOW',
         '-- Application-level maintenance mode deactivation required'),

        (8, 'Monitor and Validate',
         'Monitor application for errors and validate functionality',
         '15-30 minutes', 'LOW',
         '-- Monitor logs, test key functionality, verify user access');
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. BACKUP RETENTION AND CLEANUP
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION migration_backups.cleanup_old_backups(
    p_dry_run BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    action_taken TEXT,
    backup_id BIGINT,
    backup_type TEXT,
    size_freed TEXT,
    retention_expired_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_record RECORD;
    table_size BIGINT;
    freed_space BIGINT := 0;
    table_name TEXT;
    backup_timestamp BIGINT;
BEGIN
    -- Find expired backups
    FOR backup_record IN
        SELECT *
        FROM migration_backups.migration_backup_log
        WHERE retention_until < NOW()
        AND status = 'completed'
        ORDER BY retention_until
    LOOP
        backup_timestamp := EXTRACT(EPOCH FROM backup_record.backup_start_time)::BIGINT;

        -- Calculate space that would be freed
        SELECT SUM(pg_total_relation_size(schemaname||'.'||tablename)) INTO table_size
        FROM pg_tables
        WHERE schemaname = 'migration_backups'
        AND tablename LIKE '%backup_' || backup_timestamp;

        IF NOT p_dry_run THEN
            -- Actually drop the backup tables
            FOR table_name IN
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'migration_backups'
                AND tablename LIKE '%backup_' || backup_timestamp
            LOOP
                EXECUTE format('DROP TABLE IF EXISTS migration_backups.%I CASCADE', table_name);
            END LOOP;

            -- Update backup log
            UPDATE migration_backups.migration_backup_log
            SET
                status = 'cleaned_up',
                backup_metadata = backup_metadata || jsonb_build_object(
                    'cleaned_up_at', NOW(),
                    'space_freed_bytes', table_size
                )
            WHERE id = backup_record.id;
        END IF;

        freed_space := freed_space + COALESCE(table_size, 0);

        RETURN QUERY SELECT
            CASE WHEN p_dry_run THEN 'DRY RUN - Would cleanup' ELSE 'Cleaned up' END,
            backup_record.id,
            backup_record.backup_type,
            pg_size_pretty(COALESCE(table_size, 0)),
            EXTRACT(DAYS FROM NOW() - backup_record.retention_until)::INTEGER;
    END LOOP;

    -- Summary
    RETURN QUERY SELECT
        CASE WHEN p_dry_run THEN 'DRY RUN SUMMARY' ELSE 'CLEANUP SUMMARY' END,
        0::BIGINT,
        'total',
        pg_size_pretty(freed_space),
        0;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. BACKUP MONITORING AND ALERTS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW migration_backups.backup_health_dashboard AS
SELECT
    ml.migration_id,
    ml.backup_type,
    ml.status,
    ml.backup_start_time,
    ml.backup_end_time,
    ml.backup_end_time - ml.backup_start_time as duration,
    pg_size_pretty(ml.backup_size_bytes) as backup_size,
    ml.restoration_tested,
    CASE
        WHEN ml.retention_until < NOW() THEN 'EXPIRED'
        WHEN ml.retention_until < NOW() + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        ELSE 'ACTIVE'
    END as retention_status,
    ml.retention_until - NOW() as time_until_expiry,
    ml.backup_metadata->>'projects_count' as projects_backed_up,
    ml.backup_metadata->>'tasks_count' as tasks_backed_up
FROM migration_backups.migration_backup_log ml
WHERE ml.status IN ('completed', 'cleaned_up')
ORDER BY ml.backup_start_time DESC;

-- Grant permissions
GRANT USAGE ON SCHEMA migration_backups TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA migration_backups TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA migration_backups TO authenticated;