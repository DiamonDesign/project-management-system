-- ============================================================================
-- POST-MIGRATION PERFORMANCE OPTIMIZATION
-- Comprehensive performance tuning for normalized task structure
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. OPTIMIZED INDEXES FOR NORMALIZED TASKS
-- ----------------------------------------------------------------------------

-- Create specialized indexes for common query patterns
-- Based on analysis of application code and expected usage

-- Primary query patterns identified:
-- 1. User tasks by status and priority
-- 2. Project tasks with sorting
-- 3. Overdue tasks detection
-- 4. Daily tasks queries
-- 5. Task search and filtering

BEGIN;

-- Index 1: User tasks with status filtering (most common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_status_priority
ON tasks(user_id, status, priority DESC, end_date ASC NULLS LAST)
WHERE status IN ('not-started', 'in-progress');

-- Index 2: Project tasks with sorting (project detail views)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_sort
ON tasks(project_id, sort_order ASC, created_at DESC);

-- Index 3: Overdue tasks detection (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_overdue
ON tasks(user_id, end_date, status)
WHERE end_date IS NOT NULL AND status != 'completed';

-- Index 4: Daily tasks queries (recurring task management)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_daily_active
ON tasks(user_id, is_daily_task, status)
WHERE is_daily_task = true;

-- Index 5: Full-text search on task titles and descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_search
ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Index 6: Date-based filtering (calendar views, due dates)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_date_ranges
ON tasks(user_id, start_date, end_date)
WHERE start_date IS NOT NULL OR end_date IS NOT NULL;

-- Index 7: Recently updated tasks (activity tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_recent_activity
ON tasks(user_id, updated_at DESC)
WHERE updated_at > NOW() - INTERVAL '7 days';

-- Index 8: Project-priority combinations (project dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_project_priority
ON tasks(project_id, priority, status)
WHERE priority = 'high' OR status = 'in-progress';

COMMIT;

-- ----------------------------------------------------------------------------
-- 2. OPTIMIZED VIEWS AND MATERIALIZED VIEWS
-- ----------------------------------------------------------------------------

-- Create materialized view for heavy dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS user_dashboard_stats AS
SELECT
    u.id as user_id,
    -- Task statistics
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'not-started') as pending_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'in-progress') as active_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
    COUNT(t.id) FILTER (WHERE t.priority = 'high' AND t.status != 'completed') as high_priority_pending,
    COUNT(t.id) FILTER (WHERE t.is_daily_task = true) as daily_tasks,
    COUNT(t.id) FILTER (WHERE t.end_date < CURRENT_DATE AND t.status != 'completed') as overdue_tasks,
    COUNT(t.id) FILTER (WHERE t.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND t.status != 'completed') as due_this_week,
    COUNT(t.id) FILTER (WHERE t.updated_at > NOW() - INTERVAL '24 hours') as recently_updated,
    -- Project statistics
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'in-progress') as active_projects,
    COUNT(DISTINCT p.id) FILTER (WHERE p.client_id IS NOT NULL) as client_projects,
    -- Performance metrics
    CASE
        WHEN COUNT(t.id) > 0 THEN
            ROUND(COUNT(t.id) FILTER (WHERE t.status = 'completed') * 100.0 / COUNT(t.id), 1)
        ELSE 0
    END as completion_percentage,
    -- Time-based metrics
    MIN(t.created_at) as first_task_created,
    MAX(t.updated_at) as last_activity,
    -- Cache timestamp
    NOW() as cached_at
FROM auth.users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY u.id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboard_stats_user_id ON user_dashboard_stats(user_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh the materialized view concurrently to avoid locking
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-refresh materialized view
DROP TRIGGER IF EXISTS trigger_refresh_dashboard_on_task_change ON tasks;
CREATE TRIGGER trigger_refresh_dashboard_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_user_dashboard_stats();

DROP TRIGGER IF EXISTS trigger_refresh_dashboard_on_project_change ON projects;
CREATE TRIGGER trigger_refresh_dashboard_on_project_change
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_user_dashboard_stats();

-- ----------------------------------------------------------------------------
-- 3. HIGH-PERFORMANCE QUERY FUNCTIONS
-- ----------------------------------------------------------------------------

-- Optimized function for getting user tasks with full context
CREATE OR REPLACE FUNCTION get_user_tasks_optimized(
    p_user_id UUID,
    p_status_filter TEXT[] DEFAULT NULL,
    p_priority_filter TEXT[] DEFAULT NULL,
    p_project_filter UUID DEFAULT NULL,
    p_overdue_only BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
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
    sort_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
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
        (t.end_date IS NOT NULL AND t.end_date < CURRENT_DATE AND t.status != 'completed') as is_overdue,
        CASE
            WHEN t.end_date IS NOT NULL THEN
                EXTRACT(DAYS FROM t.end_date - CURRENT_DATE)::INTEGER
            ELSE NULL
        END as days_until_due,
        t.sort_order,
        t.created_at,
        t.updated_at
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE t.user_id = p_user_id
    AND (p_status_filter IS NULL OR t.status = ANY(p_status_filter))
    AND (p_priority_filter IS NULL OR t.priority = ANY(p_priority_filter))
    AND (p_project_filter IS NULL OR t.project_id = p_project_filter)
    AND (NOT p_overdue_only OR (t.end_date IS NOT NULL AND t.end_date < CURRENT_DATE AND t.status != 'completed'))
    ORDER BY
        -- Smart sorting: overdue first, then by priority, then by due date
        CASE
            WHEN t.end_date IS NOT NULL AND t.end_date < CURRENT_DATE AND t.status != 'completed' THEN 1 -- Overdue
            WHEN t.priority = 'high' AND t.status = 'in-progress' THEN 2 -- High priority active
            WHEN t.status = 'in-progress' THEN 3 -- Other active tasks
            WHEN t.priority = 'high' THEN 4 -- High priority not started
            WHEN t.priority = 'medium' THEN 5 -- Medium priority
            ELSE 6 -- Low priority
        END,
        t.end_date NULLS LAST,
        t.sort_order ASC,
        t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
$$;

-- Optimized function for project task statistics
CREATE OR REPLACE FUNCTION get_project_task_stats_optimized(p_project_id UUID)
RETURNS TABLE(
    project_id UUID,
    project_name TEXT,
    total_tasks BIGINT,
    pending_tasks BIGINT,
    active_tasks BIGINT,
    completed_tasks BIGINT,
    high_priority_tasks BIGINT,
    overdue_tasks BIGINT,
    completion_percentage NUMERIC,
    avg_completion_time INTERVAL,
    most_recent_activity TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        p.id as project_id,
        p.name as project_name,
        COUNT(t.id) as total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'not-started') as pending_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'in-progress') as active_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks,
        COUNT(t.id) FILTER (WHERE t.priority = 'high') as high_priority_tasks,
        COUNT(t.id) FILTER (WHERE t.end_date < CURRENT_DATE AND t.status != 'completed') as overdue_tasks,
        CASE
            WHEN COUNT(t.id) > 0 THEN
                ROUND(COUNT(t.id) FILTER (WHERE t.status = 'completed') * 100.0 / COUNT(t.id), 1)
            ELSE 0
        END as completion_percentage,
        AVG(t.updated_at - t.created_at) FILTER (WHERE t.status = 'completed') as avg_completion_time,
        MAX(t.updated_at) as most_recent_activity
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE p.id = p_project_id
    GROUP BY p.id, p.name;
$$;

-- Bulk task operations for better performance
CREATE OR REPLACE FUNCTION bulk_update_task_status(
    p_task_ids UUID[],
    p_new_status TEXT,
    p_user_id UUID
)
RETURNS TABLE(
    updated_count INTEGER,
    failed_count INTEGER,
    error_details TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    update_count INTEGER;
    error_list TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Validate status
    IF p_new_status NOT IN ('not-started', 'in-progress', 'completed') THEN
        RETURN QUERY SELECT 0, array_length(p_task_ids, 1), ARRAY['Invalid status: ' || p_new_status];
        RETURN;
    END IF;

    -- Perform bulk update with user verification
    UPDATE tasks
    SET
        status = p_new_status,
        updated_at = NOW()
    WHERE id = ANY(p_task_ids)
    AND user_id = p_user_id; -- Security: only update user's own tasks

    GET DIAGNOSTICS update_count = ROW_COUNT;

    -- Return results
    RETURN QUERY SELECT
        update_count,
        array_length(p_task_ids, 1) - update_count,
        CASE
            WHEN update_count < array_length(p_task_ids, 1)
            THEN ARRAY['Some tasks could not be updated - check ownership']
            ELSE ARRAY[]::TEXT[]
        END;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. CONNECTION POOL OPTIMIZATION FOR TASK QUERIES
-- ----------------------------------------------------------------------------

-- Optimize connection pooling for task-heavy workloads
-- These are recommendations for Supabase configuration

DO $$
DECLARE
    total_tasks INTEGER;
    total_users INTEGER;
    pool_recommendation INTEGER;
BEGIN
    -- Analyze current workload
    SELECT COUNT(*) INTO total_tasks FROM tasks;
    SELECT COUNT(DISTINCT user_id) INTO total_users FROM tasks;

    -- Calculate recommended pool size based on task workload
    pool_recommendation := LEAST(GREATEST(total_users * 2, 20), 100);

    RAISE NOTICE 'PERFORMANCE ANALYSIS RESULTS:';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Total tasks in system: %', total_tasks;
    RAISE NOTICE 'Active users with tasks: %', total_users;
    RAISE NOTICE 'Recommended connection pool size: %', pool_recommendation;
    RAISE NOTICE '';

    -- Provide specific recommendations
    IF total_tasks < 1000 THEN
        RAISE NOTICE 'WORKLOAD: Light - Standard configuration suitable';
        RAISE NOTICE 'Recommended settings:';
        RAISE NOTICE '- Pool size: 15-25 connections';
        RAISE NOTICE '- Pool mode: Transaction pooling';
        RAISE NOTICE '- Timeout: 30 seconds';
    ELSIF total_tasks < 10000 THEN
        RAISE NOTICE 'WORKLOAD: Medium - Enhanced configuration recommended';
        RAISE NOTICE 'Recommended settings:';
        RAISE NOTICE '- Pool size: 25-40 connections';
        RAISE NOTICE '- Pool mode: Transaction pooling';
        RAISE NOTICE '- Timeout: 60 seconds';
        RAISE NOTICE '- Consider read replicas for dashboard queries';
    ELSE
        RAISE NOTICE 'WORKLOAD: Heavy - Advanced optimization required';
        RAISE NOTICE 'Recommended settings:';
        RAISE NOTICE '- Pool size: 40-80 connections';
        RAISE NOTICE '- Pool mode: Session pooling';
        RAISE NOTICE '- Timeout: 120 seconds';
        RAISE NOTICE '- Enable read replicas';
        RAISE NOTICE '- Consider connection multiplexing';
        RAISE NOTICE '- Implement query result caching';
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. QUERY PERFORMANCE MONITORING
-- ----------------------------------------------------------------------------

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
    id BIGSERIAL PRIMARY KEY,
    query_name TEXT NOT NULL,
    user_id UUID,
    execution_time_ms NUMERIC(10,2) NOT NULL,
    rows_returned INTEGER,
    rows_examined INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    query_plan_hash TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    query_parameters JSONB
);

-- Index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_query_performance_name_time ON query_performance_log(query_name, executed_at DESC);

-- Function to log query performance
CREATE OR REPLACE FUNCTION log_query_performance(
    p_query_name TEXT,
    p_user_id UUID,
    p_execution_time_ms NUMERIC,
    p_rows_returned INTEGER DEFAULT NULL,
    p_cache_hit BOOLEAN DEFAULT FALSE,
    p_parameters JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO query_performance_log (
        query_name, user_id, execution_time_ms, rows_returned,
        cache_hit, query_parameters
    ) VALUES (
        p_query_name, p_user_id, p_execution_time_ms, p_rows_returned,
        p_cache_hit, p_parameters
    );

    -- Keep only last 7 days of logs to prevent table bloat
    DELETE FROM query_performance_log
    WHERE executed_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Performance monitoring view
CREATE OR REPLACE VIEW query_performance_summary AS
SELECT
    query_name,
    COUNT(*) as total_executions,
    AVG(execution_time_ms) as avg_execution_time,
    MIN(execution_time_ms) as min_execution_time,
    MAX(execution_time_ms) as max_execution_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time,
    AVG(rows_returned) as avg_rows_returned,
    COUNT(*) FILTER (WHERE cache_hit = true)::NUMERIC / COUNT(*) * 100 as cache_hit_rate,
    COUNT(DISTINCT user_id) as unique_users
FROM query_performance_log
WHERE executed_at > NOW() - INTERVAL '24 hours'
GROUP BY query_name
ORDER BY avg_execution_time DESC;

-- ----------------------------------------------------------------------------
-- 6. AUTOMATED PERFORMANCE OPTIMIZATION
-- ----------------------------------------------------------------------------

-- Function to analyze and suggest index optimizations
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    usage_efficiency NUMERIC,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH index_stats AS (
        SELECT
            schemaname,
            tablename,
            indexrelname,
            pg_size_pretty(pg_relation_size(indexrelid)) as size,
            idx_scan,
            idx_tup_read,
            idx_tup_fetch,
            CASE
                WHEN idx_scan > 0 THEN (idx_tup_fetch::NUMERIC / idx_tup_read::NUMERIC) * 100
                ELSE 0
            END as efficiency
        FROM pg_stat_user_indexes
        WHERE tablename IN ('tasks', 'projects', 'clients')
    )
    SELECT
        is.tablename::TEXT,
        is.indexrelname::TEXT,
        is.size::TEXT,
        is.idx_scan,
        is.idx_tup_read,
        is.idx_tup_fetch,
        is.efficiency,
        CASE
            WHEN is.idx_scan = 0 THEN 'UNUSED - Consider dropping'
            WHEN is.idx_scan < 10 AND pg_relation_size(is.indexrelname::regclass) > 1024*1024 THEN 'LOW USAGE - Review necessity'
            WHEN is.efficiency < 50 THEN 'LOW EFFICIENCY - Review index selectivity'
            WHEN is.efficiency > 90 THEN 'HIGH EFFICIENCY - Keep and monitor'
            ELSE 'NORMAL USAGE - No action needed'
        END::TEXT
    FROM index_stats is
    ORDER BY is.efficiency DESC;
END;
$$;

-- Function to suggest query optimizations based on performance logs
CREATE OR REPLACE FUNCTION suggest_query_optimizations()
RETURNS TABLE(
    query_name TEXT,
    avg_execution_time NUMERIC,
    execution_count BIGINT,
    optimization_suggestion TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        qpl.query_name,
        AVG(qpl.execution_time_ms) as avg_time,
        COUNT(*) as exec_count,
        CASE
            WHEN AVG(qpl.execution_time_ms) > 1000 THEN 'SLOW QUERY - Consider adding indexes or optimizing joins'
            WHEN COUNT(*) > 1000 AND AVG(qpl.execution_time_ms) > 100 THEN 'HIGH FREQUENCY - Consider caching or materialized views'
            WHEN AVG(qpl.rows_returned) > 1000 THEN 'LARGE RESULT SET - Consider pagination or filtering'
            WHEN COUNT(DISTINCT qpl.user_id) = 1 AND COUNT(*) > 100 THEN 'USER-SPECIFIC - Consider user-level caching'
            ELSE 'PERFORMING WELL - No optimization needed'
        END::TEXT
    FROM query_performance_log qpl
    WHERE qpl.executed_at > NOW() - INTERVAL '24 hours'
    GROUP BY qpl.query_name
    HAVING AVG(qpl.execution_time_ms) > 50 OR COUNT(*) > 100
    ORDER BY AVG(qpl.execution_time_ms) DESC;
END;
$$;

-- Grant permissions
GRANT SELECT ON user_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tasks_optimized(UUID, TEXT[], TEXT[], UUID, BOOLEAN, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_task_stats_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_task_status(UUID[], TEXT, UUID) TO authenticated;
GRANT SELECT ON query_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_query_optimizations() TO authenticated;

-- Initial materialized view refresh
REFRESH MATERIALIZED VIEW user_dashboard_stats;

-- Final performance recommendations
SELECT
    'PERFORMANCE OPTIMIZATION SETUP COMPLETE' as status,
    NOW() as completed_at,
    'Run ANALYZE on all tables to update statistics' as next_step;

ANALYZE tasks;
ANALYZE projects;
ANALYZE clients;

SELECT 'Database statistics updated' as status;