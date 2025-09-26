-- ============================================================================
-- SCRIPT FINAL - MIGRACIÓN DE TASKS SIN ERRORES
-- Este script maneja TODOS los casos y NO da errores si ya existe algo
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 INICIANDO MIGRACIÓN FINAL DE TASKS...';
    RAISE NOTICE '====================================================';

    -- PASO 1: Crear tabla tasks solo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
        CREATE TABLE tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL CHECK (length(trim(title)) > 0),
            description TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'not-started'
                CHECK (status IN ('not-started', 'in-progress', 'completed')),
            priority TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
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
        RAISE NOTICE '✅ Tabla tasks creada exitosamente';
    ELSE
        RAISE NOTICE '✅ Tabla tasks ya existe - no se modifica';
    END IF;

    -- PASO 2: Habilitar RLS solo si no está habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'tasks'
        AND schemaname = 'public'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado en tabla tasks';
    ELSE
        RAISE NOTICE '✅ RLS ya está habilitado en tabla tasks';
    END IF;

    -- PASO 3: Crear políticas RLS solo si no existen
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view own tasks') THEN
        CREATE POLICY "Users can view own tasks" ON tasks
        FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política SELECT creada';
    ELSE
        RAISE NOTICE '✅ Política SELECT ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can insert own tasks') THEN
        CREATE POLICY "Users can insert own tasks" ON tasks
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Política INSERT creada';
    ELSE
        RAISE NOTICE '✅ Política INSERT ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update own tasks') THEN
        CREATE POLICY "Users can update own tasks" ON tasks
        FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política UPDATE creada';
    ELSE
        RAISE NOTICE '✅ Política UPDATE ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can delete own tasks') THEN
        CREATE POLICY "Users can delete own tasks" ON tasks
        FOR DELETE USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Política DELETE creada';
    ELSE
        RAISE NOTICE '✅ Política DELETE ya existe';
    END IF;

    -- PASO 4: Crear índices solo si no existen
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_project_id') THEN
        CREATE INDEX idx_tasks_project_id ON tasks(project_id);
        RAISE NOTICE '✅ Índice project_id creado';
    ELSE
        RAISE NOTICE '✅ Índice project_id ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_user_id') THEN
        CREATE INDEX idx_tasks_user_id ON tasks(user_id);
        RAISE NOTICE '✅ Índice user_id creado';
    ELSE
        RAISE NOTICE '✅ Índice user_id ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_status') THEN
        CREATE INDEX idx_tasks_status ON tasks(status);
        RAISE NOTICE '✅ Índice status creado';
    ELSE
        RAISE NOTICE '✅ Índice status ya existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_priority') THEN
        CREATE INDEX idx_tasks_priority ON tasks(priority);
        RAISE NOTICE '✅ Índice priority creado';
    ELSE
        RAISE NOTICE '✅ Índice priority ya existe';
    END IF;

    -- PASO 5: Crear función de trigger solo si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        RAISE NOTICE '✅ Función de trigger creada';
    ELSE
        RAISE NOTICE '✅ Función de trigger ya existe';
    END IF;

    -- PASO 6: Crear trigger solo si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_tasks_updated_at') THEN
        CREATE TRIGGER trigger_tasks_updated_at
            BEFORE UPDATE ON tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✅ Trigger updated_at creado';
    ELSE
        RAISE NOTICE '✅ Trigger updated_at ya existe';
    END IF;

    -- PASO 7: Verificación final
    DECLARE
        task_count INTEGER;
        index_count INTEGER;
        policy_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO task_count FROM tasks;
        SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE tablename = 'tasks';
        SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'tasks';

        RAISE NOTICE '';
        RAISE NOTICE '====================================================';
        RAISE NOTICE '🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE';
        RAISE NOTICE '====================================================';
        RAISE NOTICE '';
        RAISE NOTICE '📊 RESUMEN:';
        RAISE NOTICE '   ✅ Tabla tasks: CONFIGURADA';
        RAISE NOTICE '   ✅ Tareas existentes: %', task_count;
        RAISE NOTICE '   ✅ Índices creados: %', index_count;
        RAISE NOTICE '   ✅ Políticas RLS: %', policy_count;
        RAISE NOTICE '   ✅ Triggers: ACTIVOS';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 LA PÁGINA DE TAREAS YA DEBE FUNCIONAR PERFECTAMENTE';
        RAISE NOTICE '';
        RAISE NOTICE '💡 Puedes crear, editar y eliminar tareas normalmente en la app';
        RAISE NOTICE '';

    END;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Error durante la migración: %', SQLERRM;
END;
$$;