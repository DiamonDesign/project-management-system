-- ============================================================================
-- QUICK MIGRATION FIX - Execute this if you get validation errors
-- ============================================================================

-- This script creates a minimal working tasks table without complex migration functions
-- Use this if the full migration scripts are too complex for your current setup

-- Create tasks table directly
CREATE TABLE IF NOT EXISTS tasks (
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

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ QUICK MIGRATION COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Results:';
    RAISE NOTICE '   - tasks table created successfully';
    RAISE NOTICE '   - RLS policies configured';
    RAISE NOTICE '   - Performance indexes added';
    RAISE NOTICE '   - Auto-update triggers installed';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your tasks page should now work!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Note: This creates an empty tasks table.';
    RAISE NOTICE '    You can start creating tasks normally in the app.';
END;
$$;