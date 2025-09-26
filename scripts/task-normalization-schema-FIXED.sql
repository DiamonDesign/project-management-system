-- ============================================================================
-- TASK NORMALIZATION SCHEMA - FIXED VERSION
-- Migration from JSON storage to proper relational structure
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SCHEMA MIGRATION SYSTEM
-- ----------------------------------------------------------------------------

-- Schema version tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id BIGSERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by TEXT DEFAULT CURRENT_USER,
    checksum TEXT NOT NULL,
    execution_time_ms BIGINT,
    rollback_sql TEXT
);

-- Current schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensure single row
    current_version VARCHAR(50) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by TEXT DEFAULT CURRENT_USER
);

-- Insert initial version if not exists
INSERT INTO schema_version (current_version)
VALUES ('1.0.0')
ON CONFLICT (id) DO NOTHING;

-- Function to register migration
CREATE OR REPLACE FUNCTION register_migration(
    p_version VARCHAR(50),
    p_description TEXT,
    p_sql_content TEXT,
    p_rollback_sql TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    checksum TEXT;
BEGIN
    start_time := clock_timestamp();

    -- Calculate checksum
    checksum := md5(p_sql_content);

    -- Check if migration already applied
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = p_version) THEN
        RAISE EXCEPTION 'Migration % already applied', p_version;
    END IF;

    -- Execute the migration SQL
    EXECUTE p_sql_content;

    end_time := clock_timestamp();

    -- Record migration
    INSERT INTO schema_migrations (version, description, checksum, execution_time_ms, rollback_sql)
    VALUES (
        p_version,
        p_description,
        checksum,
        EXTRACT(MILLISECONDS FROM end_time - start_time)::BIGINT,
        p_rollback_sql
    );

    -- Update current version
    UPDATE schema_version SET current_version = p_version, updated_at = NOW();

    RAISE NOTICE 'Migration % applied successfully in %ms', p_version, EXTRACT(MILLISECONDS FROM end_time - start_time);
END;
$$;

-- Function to rollback migration
CREATE OR REPLACE FUNCTION rollback_migration(p_version VARCHAR(50))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    migration_record schema_migrations%ROWTYPE;
    previous_version VARCHAR(50);
BEGIN
    -- Get migration details
    SELECT * INTO migration_record
    FROM schema_migrations
    WHERE version = p_version;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Migration % not found', p_version;
    END IF;

    IF migration_record.rollback_sql IS NULL THEN
        RAISE EXCEPTION 'No rollback SQL available for migration %', p_version;
    END IF;

    -- Execute rollback
    EXECUTE migration_record.rollback_sql;

    -- Get previous version
    SELECT version INTO previous_version
    FROM schema_migrations
    WHERE applied_at < migration_record.applied_at
    ORDER BY applied_at DESC
    LIMIT 1;

    -- Delete migration record
    DELETE FROM schema_migrations WHERE version = p_version;

    -- Update current version
    UPDATE schema_version
    SET current_version = COALESCE(previous_version, '1.0.0'),
        updated_at = NOW();

    RAISE NOTICE 'Migration % rolled back successfully', p_version;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. NORMALIZED TASKS TABLE SCHEMA
-- ----------------------------------------------------------------------------

-- Migration 1.1.0: Create normalized tasks table
DO $$
BEGIN
    PERFORM register_migration(
        '1.1.0',
        'Create normalized tasks table with proper relational structure',
        '
        -- Create tasks table with proper normalization
        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL CHECK (length(trim(title)) > 0),
            description TEXT DEFAULT '''',
            status TEXT NOT NULL DEFAULT ''not-started''
                CHECK (status IN (''not-started'', ''in-progress'', ''completed'')),
            priority TEXT NOT NULL DEFAULT ''medium''
                CHECK (priority IN (''low'', ''medium'', ''high'')),
            start_date DATE,
            end_date DATE,
            is_daily_task BOOLEAN NOT NULL DEFAULT false,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            -- Constraints
            CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
            CONSTRAINT valid_title_length CHECK (length(title) <= 500),
            CONSTRAINT valid_description_length CHECK (length(description) <= 5000)
        );

        -- Enable RLS
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view own tasks" ON tasks
        FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own tasks" ON tasks
        FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own tasks" ON tasks
        FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete own tasks" ON tasks
        FOR DELETE USING (auth.uid() = user_id);

        -- Performance indexes
        CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date) WHERE end_date IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_tasks_is_daily ON tasks(is_daily_task) WHERE is_daily_task = true;
        CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
        CREATE INDEX IF NOT EXISTS idx_tasks_project_priority ON tasks(project_id, priority);

        -- Composite index for common queries
        CREATE INDEX IF NOT EXISTS idx_tasks_user_status_priority ON tasks(user_id, status, priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_project_sort ON tasks(project_id, sort_order, created_at);

        -- Trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_tasks_updated_at
            BEFORE UPDATE ON tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ',
        '
        -- Rollback: Drop tasks table and related objects
        DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON tasks;
        DROP FUNCTION IF EXISTS update_updated_at_column();
        DROP TABLE IF EXISTS tasks CASCADE;
        '
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. DATA MIGRATION FUNCTIONS
-- ----------------------------------------------------------------------------

-- Migration 1.2.0: Data migration utilities
DO $$
BEGIN
    PERFORM register_migration(
        '1.2.0',
        'Create data migration utilities for task normalization',
        '
        -- Function to migrate tasks from JSON to normalized table
        CREATE OR REPLACE FUNCTION migrate_tasks_from_json()
        RETURNS TABLE(
            project_id UUID,
            migrated_tasks INTEGER,
            failed_tasks INTEGER,
            errors TEXT[]
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        DECLARE
            project_record RECORD;
            task_json JSONB;
            task_record RECORD;
            migrated_count INTEGER := 0;
            failed_count INTEGER := 0;
            error_list TEXT[] := ARRAY[]::TEXT[];
            new_task_id UUID;
        BEGIN
            -- Create temporary migration log
            CREATE TEMP TABLE IF NOT EXISTS migration_log (
                project_id UUID,
                task_data JSONB,
                status TEXT,
                error_message TEXT
            );

            -- Iterate through all projects with tasks
            FOR project_record IN
                SELECT id, user_id, tasks, name
                FROM projects
                WHERE tasks IS NOT NULL
                AND jsonb_array_length(tasks) > 0
            LOOP
                -- Process each task in the JSON array
                FOR task_json IN
                    SELECT * FROM jsonb_array_elements(project_record.tasks)
                LOOP
                    BEGIN
                        -- Extract task data with proper defaults and validation
                        SELECT
                            COALESCE(task_json->>''id'', gen_random_uuid()::text)::UUID as task_id,
                            TRIM(COALESCE(task_json->>''title'', task_json->>''description'', ''Untitled Task'')) as title,
                            TRIM(COALESCE(task_json->>''description'', task_json->>''details'', '''')) as description,
                            CASE
                                WHEN task_json->>''status'' IN (''not-started'', ''in-progress'', ''completed'')
                                THEN task_json->>''status''
                                WHEN (task_json->>''completed'')::boolean = true THEN ''completed''
                                ELSE ''not-started''
                            END as status,
                            CASE
                                WHEN task_json->>''priority'' IN (''low'', ''medium'', ''high'')
                                THEN task_json->>''priority''::TEXT
                                ELSE ''medium''
                            END as priority,
                            CASE
                                WHEN task_json->>''start_date'' IS NOT NULL
                                AND task_json->>''start_date'' != ''''
                                THEN (task_json->>''start_date'')::DATE
                                ELSE NULL
                            END as start_date,
                            CASE
                                WHEN task_json->>''end_date'' IS NOT NULL
                                AND task_json->>''end_date'' != ''''
                                THEN (task_json->>''end_date'')::DATE
                                ELSE NULL
                            END as end_date,
                            COALESCE((task_json->>''is_daily_task'')::boolean, false) as is_daily_task,
                            CASE
                                WHEN task_json->>''createdAt'' IS NOT NULL
                                THEN (task_json->>''createdAt'')::TIMESTAMPTZ
                                WHEN task_json->>''created_at'' IS NOT NULL
                                THEN (task_json->>''created_at'')::TIMESTAMPTZ
                                ELSE NOW()
                            END as created_at
                        INTO task_record;

                        -- Validate required fields
                        IF task_record.title IS NULL OR LENGTH(TRIM(task_record.title)) = 0 THEN
                            task_record.title := ''Migrated Task #'' || (migrated_count + failed_count + 1);
                        END IF;

                        -- Insert into normalized tasks table
                        INSERT INTO tasks (
                            id, project_id, user_id, title, description, status, priority,
                            start_date, end_date, is_daily_task, created_at, updated_at
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
                            task_record.created_at,
                            task_record.created_at
                        );

                        migrated_count := migrated_count + 1;

                        -- Log successful migration
                        INSERT INTO migration_log VALUES (
                            project_record.id, task_json, ''success'', NULL
                        );

                    EXCEPTION
                        WHEN OTHERS THEN
                            failed_count := failed_count + 1;
                            error_list := array_append(error_list,
                                ''Project: '' || project_record.name || '' - '' || SQLERRM);

                            -- Log failed migration
                            INSERT INTO migration_log VALUES (
                                project_record.id, task_json, ''failed'', SQLERRM
                            );
                    END;
                END LOOP;

                -- Return results for this project
                RETURN QUERY SELECT
                    project_record.id,
                    migrated_count,
                    failed_count,
                    error_list;

                -- Reset counters for next project
                migrated_count := 0;
                failed_count := 0;
                error_list := ARRAY[]::TEXT[];
            END LOOP;
        END;
        $func$;

        -- Function to backup existing JSON tasks before migration
        CREATE OR REPLACE FUNCTION backup_json_tasks()
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
            -- Create backup table
            CREATE TABLE IF NOT EXISTS tasks_json_backup (
                id BIGSERIAL PRIMARY KEY,
                project_id UUID NOT NULL,
                project_name TEXT,
                user_id UUID NOT NULL,
                tasks_data JSONB,
                backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Insert all existing task data
            INSERT INTO tasks_json_backup (project_id, project_name, user_id, tasks_data)
            SELECT id, name, user_id, tasks
            FROM projects
            WHERE tasks IS NOT NULL
            AND jsonb_array_length(tasks) > 0;

            RETURN TRUE;
        END;
        $func$;

        -- Function to validate migration integrity
        CREATE OR REPLACE FUNCTION validate_task_migration()
        RETURNS TABLE(
            validation_check TEXT,
            expected_count BIGINT,
            actual_count BIGINT,
            status TEXT
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
            -- Count JSON tasks vs normalized tasks
            RETURN QUERY
            SELECT
                ''total_task_count'' as validation_check,
                (
                    SELECT SUM(jsonb_array_length(COALESCE(tasks, ''[]'')))
                    FROM projects
                    WHERE tasks IS NOT NULL
                ) as expected_count,
                (
                    SELECT COUNT(*)
                    FROM tasks
                ) as actual_count,
                CASE
                    WHEN (SELECT SUM(jsonb_array_length(COALESCE(tasks, ''[]''))) FROM projects WHERE tasks IS NOT NULL) =
                         (SELECT COUNT(*) FROM tasks)
                    THEN ''PASS''
                    ELSE ''FAIL''
                END as status;

            -- Validate project-task relationships
            RETURN QUERY
            SELECT
                ''project_relationships'' as validation_check,
                (
                    SELECT COUNT(DISTINCT id)
                    FROM projects
                    WHERE tasks IS NOT NULL
                    AND jsonb_array_length(tasks) > 0
                ) as expected_count,
                (
                    SELECT COUNT(DISTINCT project_id)
                    FROM tasks
                ) as actual_count,
                CASE
                    WHEN (SELECT COUNT(DISTINCT id) FROM projects WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0) =
                         (SELECT COUNT(DISTINCT project_id) FROM tasks)
                    THEN ''PASS''
                    ELSE ''FAIL''
                END as status;

            -- Validate user ownership consistency
            RETURN QUERY
            SELECT
                ''user_ownership'' as validation_check,
                0::BIGINT as expected_count,
                (
                    SELECT COUNT(*)
                    FROM tasks t
                    LEFT JOIN projects p ON t.project_id = p.id
                    WHERE t.user_id != p.user_id
                ) as actual_count,
                CASE
                    WHEN (SELECT COUNT(*) FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.user_id != p.user_id) = 0
                    THEN ''PASS''
                    ELSE ''FAIL''
                END as status;
        END;
        $func$;
        ',
        '
        -- Rollback: Drop migration functions
        DROP FUNCTION IF EXISTS migrate_tasks_from_json();
        DROP FUNCTION IF EXISTS backup_json_tasks();
        DROP FUNCTION IF EXISTS validate_task_migration();
        DROP TABLE IF EXISTS tasks_json_backup CASCADE;
        '
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. OPTIMIZED QUERIES FOR NORMALIZED TASKS
-- ----------------------------------------------------------------------------

-- Migration 1.3.0: Create optimized views and functions
DO $$
BEGIN
    PERFORM register_migration(
        '1.3.0',
        'Create optimized views and functions for normalized tasks',
        '
        -- View for project task statistics
        CREATE OR REPLACE VIEW project_task_stats AS
        SELECT
            p.id as project_id,
            p.name as project_name,
            p.status as project_status,
            COUNT(t.id) as total_tasks,
            COUNT(t.id) FILTER (WHERE t.status = ''not-started'') as pending_tasks,
            COUNT(t.id) FILTER (WHERE t.status = ''in-progress'') as active_tasks,
            COUNT(t.id) FILTER (WHERE t.status = ''completed'') as completed_tasks,
            COUNT(t.id) FILTER (WHERE t.priority = ''high'') as high_priority_tasks,
            COUNT(t.id) FILTER (WHERE t.is_daily_task = true) as daily_tasks,
            COUNT(t.id) FILTER (WHERE t.end_date < CURRENT_DATE AND t.status != ''completed'') as overdue_tasks,
            CASE
                WHEN COUNT(t.id) > 0 THEN
                    ROUND(COUNT(t.id) FILTER (WHERE t.status = ''completed'') * 100.0 / COUNT(t.id), 1)
                ELSE 0
            END as completion_percentage,
            MIN(t.created_at) as first_task_created,
            MAX(t.updated_at) as last_task_updated
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, p.name, p.status;

        -- View for user task dashboard
        CREATE OR REPLACE VIEW user_task_dashboard AS
        SELECT
            u.id as user_id,
            COUNT(t.id) as total_tasks,
            COUNT(t.id) FILTER (WHERE t.status = ''not-started'') as pending_tasks,
            COUNT(t.id) FILTER (WHERE t.status = ''in-progress'') as active_tasks,
            COUNT(t.id) FILTER (WHERE t.status = ''completed'') as completed_tasks,
            COUNT(t.id) FILTER (WHERE t.priority = ''high'' AND t.status != ''completed'') as high_priority_pending,
            COUNT(t.id) FILTER (WHERE t.is_daily_task = true) as daily_tasks,
            COUNT(t.id) FILTER (WHERE t.end_date < CURRENT_DATE AND t.status != ''completed'') as overdue_tasks,
            COUNT(t.id) FILTER (WHERE t.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL ''7 days'' AND t.status != ''completed'') as due_this_week,
            CASE
                WHEN COUNT(t.id) > 0 THEN
                    ROUND(COUNT(t.id) FILTER (WHERE t.status = ''completed'') * 100.0 / COUNT(t.id), 1)
                ELSE 0
            END as overall_completion_rate
        FROM auth.users u
        LEFT JOIN tasks t ON u.id = t.user_id
        GROUP BY u.id;

        -- Function to get tasks with project context - FIXED EXTRACT ISSUE
        CREATE OR REPLACE FUNCTION get_user_tasks_with_context(p_user_id UUID, p_limit INTEGER DEFAULT 100)
        RETURNS TABLE(
            task_id UUID,
            project_id UUID,
            project_name TEXT,
            project_status TEXT,
            client_name TEXT,
            title TEXT,
            description TEXT,
            status TEXT,
            priority TEXT,
            start_date DATE,
            end_date DATE,
            is_daily_task BOOLEAN,
            is_overdue BOOLEAN,
            days_until_due INTEGER,
            created_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ
        )
        LANGUAGE sql
        SECURITY DEFINER
        STABLE
        AS $func$
            SELECT
                t.id as task_id,
                t.project_id,
                p.name as project_name,
                p.status as project_status,
                c.name as client_name,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.start_date,
                t.end_date,
                t.is_daily_task,
                (t.end_date IS NOT NULL AND t.end_date < CURRENT_DATE AND t.status != ''completed'') as is_overdue,
                CASE
                    WHEN t.end_date IS NOT NULL THEN
                        (t.end_date - CURRENT_DATE)::INTEGER
                    ELSE NULL
                END as days_until_due,
                t.created_at,
                t.updated_at
            FROM tasks t
            JOIN projects p ON t.project_id = p.id
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE t.user_id = p_user_id
            ORDER BY
                CASE
                    WHEN t.end_date IS NOT NULL AND t.end_date < CURRENT_DATE AND t.status != ''completed'' THEN 1 -- Overdue first
                    WHEN t.priority = ''high'' THEN 2
                    WHEN t.status = ''in-progress'' THEN 3
                    WHEN t.priority = ''medium'' THEN 4
                    ELSE 5
                END,
                t.end_date NULLS LAST,
                t.created_at DESC
            LIMIT p_limit;
        $func$;

        -- Function to reorder tasks within a project
        CREATE OR REPLACE FUNCTION reorder_project_tasks(
            p_project_id UUID,
            p_task_orders JSONB -- Array of {task_id: UUID, sort_order: INTEGER}
        )
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        DECLARE
            task_order JSONB;
            updated_count INTEGER := 0;
        BEGIN
            -- Validate project ownership
            IF NOT EXISTS (
                SELECT 1 FROM projects
                WHERE id = p_project_id
                AND user_id = auth.uid()
            ) THEN
                RAISE EXCEPTION ''Project not found or access denied'';
            END IF;

            -- Update sort order for each task
            FOR task_order IN SELECT * FROM jsonb_array_elements(p_task_orders)
            LOOP
                UPDATE tasks
                SET sort_order = (task_order->>''sort_order'')::INTEGER,
                    updated_at = NOW()
                WHERE id = (task_order->>''task_id'')::UUID
                AND project_id = p_project_id
                AND user_id = auth.uid();

                updated_count := updated_count + SQL%ROWCOUNT;
            END LOOP;

            RETURN updated_count > 0;
        END;
        $func$;

        -- Grant permissions
        GRANT SELECT ON project_task_stats TO authenticated;
        GRANT SELECT ON user_task_dashboard TO authenticated;
        ',
        '
        -- Rollback: Drop views and functions
        DROP FUNCTION IF EXISTS reorder_project_tasks(UUID, JSONB);
        DROP FUNCTION IF EXISTS get_user_tasks_with_context(UUID, INTEGER);
        DROP VIEW IF EXISTS user_task_dashboard;
        DROP VIEW IF EXISTS project_task_stats;
        '
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. MIGRATION EXECUTION PLAN
-- ----------------------------------------------------------------------------

/*
MIGRATION EXECUTION STEPS:

1. Pre-Migration Validation:
   - Verify current schema version
   - Check data integrity
   - Ensure sufficient disk space
   - Create full database backup

2. Execute Migration:
   SELECT backup_json_tasks(); -- Backup existing data
   SELECT * FROM migrate_tasks_from_json(); -- Migrate data
   SELECT * FROM validate_task_migration(); -- Verify migration

3. Post-Migration Validation:
   - Compare task counts
   - Verify relationships
   - Test application functionality
   - Performance benchmarks

4. Cleanup (After validation):
   - Remove JSON tasks from projects table (separate migration)
   - Update application code to use normalized tasks
   - Remove legacy code paths

ROLLBACK PLAN:
   - If migration fails: SELECT rollback_migration('1.1.0');
   - If data issues found: Restore from backup and investigate
   - If application issues: Use feature flags to switch back to JSON mode

MONITORING:
   - Track migration performance
   - Monitor query performance post-migration
   - Validate data consistency
   - User experience testing
*/

-- View current migration status
CREATE OR REPLACE VIEW migration_status AS
SELECT
    sv.current_version,
    sv.updated_at as version_updated,
    COUNT(sm.version) as total_migrations,
    MAX(sm.applied_at) as last_migration,
    CASE
        WHEN sv.current_version >= '1.3.0' THEN 'READY_FOR_TASK_MIGRATION'
        WHEN sv.current_version >= '1.1.0' THEN 'SCHEMA_READY'
        ELSE 'INITIAL_STATE'
    END as migration_stage
FROM schema_version sv
CROSS JOIN schema_migrations sm
GROUP BY sv.current_version, sv.updated_at;

-- Grant permissions
GRANT SELECT ON migration_status TO authenticated;
GRANT SELECT ON schema_migrations TO authenticated;
GRANT SELECT ON schema_version TO authenticated;