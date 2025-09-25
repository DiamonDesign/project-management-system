-- ============================================================================
-- MIGRATION DIAGNOSIS SCRIPT
-- Diagnoses the current state and identifies what's missing
-- ============================================================================

-- Check if schema tables exist
DO $$
BEGIN
    RAISE NOTICE '🔍 MIGRATION DIAGNOSIS STARTING...';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '';

    -- Check 1: Schema migrations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
        RAISE NOTICE '✅ schema_migrations table EXISTS';

        -- Show applied migrations
        DECLARE
            migration_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO migration_count FROM schema_migrations;
            RAISE NOTICE '   └─ Applied migrations: %', migration_count;

            IF migration_count > 0 THEN
                FOR rec IN SELECT version, description, applied_at FROM schema_migrations ORDER BY applied_at
                LOOP
                    RAISE NOTICE '   └─ %: % (applied: %)', rec.version, rec.description, rec.applied_at;
                END LOOP;
            END IF;
        END;
    ELSE
        RAISE NOTICE '❌ schema_migrations table MISSING';
        RAISE NOTICE '   └─ You need to run: task-normalization-schema.sql first';
    END IF;

    RAISE NOTICE '';

    -- Check 2: Schema version table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_version') THEN
        RAISE NOTICE '✅ schema_version table EXISTS';

        DECLARE
            current_version TEXT;
        BEGIN
            SELECT sv.current_version INTO current_version FROM schema_version sv LIMIT 1;
            RAISE NOTICE '   └─ Current version: %', current_version;

            IF current_version >= '1.3.0' THEN
                RAISE NOTICE '   ✅ Version is sufficient for migration';
            ELSE
                RAISE NOTICE '   ❌ Version % is too old, need 1.3.0+', current_version;
            END IF;
        END;
    ELSE
        RAISE NOTICE '❌ schema_version table MISSING';
        RAISE NOTICE '   └─ You need to run: task-normalization-schema.sql first';
    END IF;

    RAISE NOTICE '';

    -- Check 3: Tasks table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        RAISE NOTICE '✅ tasks table EXISTS';

        DECLARE
            task_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO task_count FROM tasks;
            RAISE NOTICE '   └─ Current task count: %', task_count;
        END;
    ELSE
        RAISE NOTICE '❌ tasks table MISSING';
        RAISE NOTICE '   └─ This will be created by the migration functions';
    END IF;

    RAISE NOTICE '';

    -- Check 4: Migration functions
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'migrate_tasks_from_json') THEN
        RAISE NOTICE '✅ migrate_tasks_from_json function EXISTS';
    ELSE
        RAISE NOTICE '❌ migrate_tasks_from_json function MISSING';
        RAISE NOTICE '   └─ You need to run: task-normalization-schema.sql first';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'validate_task_migration') THEN
        RAISE NOTICE '✅ validate_task_migration function EXISTS';
    ELSE
        RAISE NOTICE '❌ validate_task_migration function MISSING';
        RAISE NOTICE '   └─ You need to run: task-normalization-schema.sql first';
    END IF;

    RAISE NOTICE '';

    -- Check 5: Backup strategy
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_session') THEN
        RAISE NOTICE '✅ migration_session table EXISTS (backup strategy loaded)';
    ELSE
        RAISE NOTICE '❌ migration_session table MISSING';
        RAISE NOTICE '   └─ You need to run: migration-backup-strategy.sql';
    END IF;

    RAISE NOTICE '';

    -- Check 6: Data to migrate
    DECLARE
        projects_with_tasks INTEGER;
        total_json_tasks INTEGER;
    BEGIN
        SELECT
            COUNT(*),
            COALESCE(SUM(jsonb_array_length(COALESCE(tasks, '[]'))), 0)
        INTO projects_with_tasks, total_json_tasks
        FROM projects
        WHERE tasks IS NOT NULL AND jsonb_array_length(COALESCE(tasks, '[]')) > 0;

        RAISE NOTICE '📊 DATA ANALYSIS:';
        RAISE NOTICE '   └─ Projects with tasks: %', projects_with_tasks;
        RAISE NOTICE '   └─ Total JSON tasks to migrate: %', total_json_tasks;

        IF total_json_tasks = 0 THEN
            RAISE NOTICE '   ⚠️  No tasks found to migrate - this is normal for empty projects';
        END IF;
    END;

    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';

    -- Determine what needs to be done
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
        RAISE NOTICE '1. ⚠️  Execute: task-normalization-schema.sql';
        RAISE NOTICE '2. ⏸️  Then: migration-backup-strategy.sql';
        RAISE NOTICE '3. ⏸️  Finally: execute-task-migration.sql';
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_session') THEN
        RAISE NOTICE '1. ✅ Schema loaded';
        RAISE NOTICE '2. ⚠️  Execute: migration-backup-strategy.sql';
        RAISE NOTICE '3. ⏸️  Finally: execute-task-migration.sql';
    ELSE
        RAISE NOTICE '1. ✅ Schema loaded';
        RAISE NOTICE '2. ✅ Backup strategy loaded';
        RAISE NOTICE '3. 🚀 Ready to execute: execute-task-migration.sql';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '===============================================';
    RAISE NOTICE '🔍 MIGRATION DIAGNOSIS COMPLETED';

END;
$$;