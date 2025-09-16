-- ============================================================================
-- SUPABASE QUERY OPTIMIZATIONS
-- Database performance improvements for project management app
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ESSENTIAL INDEXES (Add these first for immediate performance gains)
-- ----------------------------------------------------------------------------

-- Primary relationship indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Status-based filtering (very common in dashboard queries)
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- Date-based queries (for due dates and overdue items)
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date) 
WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Task indexes (if tasks are stored in separate table)
-- CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
-- CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
-- CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
-- CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date) WHERE end_date IS NOT NULL;

-- ----------------------------------------------------------------------------
-- OPTIMIZED QUERIES FOR COMMON OPERATIONS
-- ----------------------------------------------------------------------------

-- ✅ OPTIMIZED: Fetch projects with client data (eliminates N+1)
-- Use this instead of separate projects and clients queries
SELECT 
  p.id,
  p.user_id,
  p.name,
  p.description,
  p.status,
  p.due_date,
  p.client_id,
  p.notes,
  p.pages,
  p.tasks,
  p.created_at,
  -- Include client data to avoid separate lookups
  c.id as client_id,
  c.name as client_name,
  c.email as client_email,
  c.company as client_company
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.user_id = $1
ORDER BY p.created_at DESC;

-- ✅ OPTIMIZED: Dashboard statistics in single query
-- Pre-calculate all dashboard metrics
WITH project_stats AS (
  SELECT 
    user_id,
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE status = 'in-progress') as active_projects,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
    COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'completed') as overdue_projects
  FROM projects 
  WHERE user_id = $1
  GROUP BY user_id
),
task_stats AS (
  SELECT 
    p.user_id,
    -- If tasks are JSONB, extract and count them
    -- For demonstration - adapt based on your actual schema
    SUM(jsonb_array_length(COALESCE(p.tasks, '[]'))) as total_tasks,
    -- Count completed tasks (this would need to be adapted to your task structure)
    SUM(
      (SELECT COUNT(*) 
       FROM jsonb_array_elements(COALESCE(p.tasks, '[]')) as task 
       WHERE task->>'status' = 'completed')
    ) as completed_tasks,
    SUM(
      (SELECT COUNT(*) 
       FROM jsonb_array_elements(COALESCE(p.tasks, '[]')) as task 
       WHERE task->>'priority' = 'high' AND task->>'status' != 'completed')
    ) as high_priority_tasks
  FROM projects p
  WHERE p.user_id = $1
  GROUP BY p.user_id
)
SELECT 
  ps.*,
  ts.total_tasks,
  ts.completed_tasks,
  ts.high_priority_tasks,
  (ts.completed_tasks::float / NULLIF(ts.total_tasks, 0) * 100) as completion_rate
FROM project_stats ps
LEFT JOIN task_stats ts ON ps.user_id = ts.user_id;

-- ✅ OPTIMIZED: Client project distribution
-- Get project count per client in single query
SELECT 
  c.id,
  c.name,
  c.company,
  COUNT(p.id) as project_count,
  COUNT(p.id) FILTER (WHERE p.status = 'completed') as completed_projects,
  COUNT(p.id) FILTER (WHERE p.status = 'in-progress') as active_projects
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id AND p.user_id = $1
WHERE c.user_id = $1
GROUP BY c.id, c.name, c.company
ORDER BY project_count DESC;

-- ✅ OPTIMIZED: Overdue items report
-- Single query for all overdue projects and tasks
SELECT 
  'project' as type,
  p.id,
  p.name as title,
  p.due_date as end_date,
  p.status,
  c.name as client_name,
  (NOW()::date - p.due_date::date) as days_overdue
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.user_id = $1 
  AND p.due_date < NOW()
  AND p.status != 'completed'

UNION ALL

-- Add task-level overdue items if tasks are in separate table
-- SELECT 
--   'task' as type,
--   t.id,
--   t.title,
--   t.end_date,
--   t.status,
--   p.name as client_name,
--   (NOW()::date - t.end_date::date) as days_overdue
-- FROM tasks t
-- JOIN projects p ON t.project_id = p.id
-- WHERE p.user_id = $1
--   AND t.end_date < NOW()
--   AND t.status != 'completed'

ORDER BY days_overdue DESC;

-- ----------------------------------------------------------------------------
-- PERFORMANCE MONITORING QUERIES
-- ----------------------------------------------------------------------------

-- Check query performance
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'clients');

-- Analyze index usage
SELECT 
  t.schemaname,
  t.tablename,
  c.reltuples::BIGINT AS num_rows,
  pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
  psai.indexrelname AS index_name,
  psai.idx_tup_read AS index_reads,
  psai.idx_tup_fetch AS index_fetches
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_stat_all_indexes psai ON psai.relid = c.oid
WHERE t.schemaname = 'public' 
  AND t.tablename IN ('projects', 'clients')
ORDER BY c.reltuples DESC;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) OPTIMIZATIONS
-- ----------------------------------------------------------------------------

-- Ensure RLS policies are optimized
-- Projects policy should use the user_id index
CREATE POLICY "Users can view own projects" ON projects
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
FOR DELETE USING (auth.uid() = user_id);

-- Clients policy
CREATE POLICY "Users can view own clients" ON clients
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON clients
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients
FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- QUERY EXECUTION PLAN ANALYSIS
-- ----------------------------------------------------------------------------

-- Use EXPLAIN ANALYZE to check query performance
-- Example for the main projects query:
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT 
  p.*,
  c.name as client_name,
  c.email as client_email,
  c.company as client_company
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY p.created_at DESC;

-- Expected output should show:
-- - Index Scan on idx_projects_user_id
-- - Nested Loop with clients table
-- - Total cost < 100 for reasonable dataset sizes

-- ----------------------------------------------------------------------------
-- VACUUM AND MAINTENANCE
-- ----------------------------------------------------------------------------

-- Regular maintenance for optimal performance
ANALYZE projects;
ANALYZE clients;

-- Check for bloated tables (run periodically)
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_stat_get_live_tuples(c.oid) AS live_tuples,
  pg_stat_get_dead_tuples(c.oid) AS dead_tuples
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ----------------------------------------------------------------------------
-- CONNECTION POOLING RECOMMENDATIONS
-- ----------------------------------------------------------------------------

/*
For Supabase connection pooling optimization:

1. Use Supabase's built-in connection pooling
2. Set appropriate pool sizes based on usage:
   - Small app: pool_size = 15
   - Medium app: pool_size = 25  
   - Large app: pool_size = 40+

3. Configure pool modes:
   - Transaction mode for short queries
   - Session mode for complex transactions

4. Monitor connection usage in Supabase dashboard
*/

-- ----------------------------------------------------------------------------
-- QUERY CACHING STRATEGY
-- ----------------------------------------------------------------------------

-- Queries that benefit from caching (implement in application):

-- 1. Dashboard KPIs (cache for 5 minutes)
-- SELECT user_stats FROM cache WHERE user_id = $1 AND updated_at > NOW() - INTERVAL '5 minutes';

-- 2. Client list (cache for 15 minutes - rarely changes)
-- SELECT clients FROM cache WHERE user_id = $1 AND type = 'clients' AND updated_at > NOW() - INTERVAL '15 minutes';

-- 3. Project statistics (cache for 10 minutes)
-- SELECT project_stats FROM cache WHERE user_id = $1 AND type = 'project_stats' AND updated_at > NOW() - INTERVAL '10 minutes';

-- ----------------------------------------------------------------------------
-- ALERTS AND MONITORING
-- ----------------------------------------------------------------------------

-- Set up alerts for:
-- 1. Query execution time > 2 seconds
-- 2. Connection pool utilization > 80%
-- 3. Index usage ratio < 95% for frequently queried tables
-- 4. Table size growth > 20% per week

-- Monitor these metrics:
SELECT 
  'Query Performance' as metric,
  COUNT(*) as slow_queries
FROM pg_stat_statements 
WHERE mean_time > 2000; -- Queries slower than 2 seconds

-- ----------------------------------------------------------------------------
-- BACKUP QUERY OPTIMIZATION
-- ----------------------------------------------------------------------------

-- For analytics and reporting, create materialized views:

CREATE MATERIALIZED VIEW user_project_summary AS
SELECT 
  p.user_id,
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE p.status = 'completed') as completed_projects,
  AVG(jsonb_array_length(COALESCE(p.tasks, '[]'))) as avg_tasks_per_project,
  MAX(p.created_at) as last_project_date
FROM projects p
GROUP BY p.user_id;

-- Refresh materialized views periodically
-- REFRESH MATERIALIZED VIEW user_project_summary;

-- Create index on materialized view
CREATE INDEX idx_user_project_summary_user_id ON user_project_summary(user_id);

-- Use materialized view for analytics
SELECT * FROM user_project_summary WHERE user_id = $1;