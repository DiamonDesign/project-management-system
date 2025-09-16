-- ============================================================================
-- CONNECTION POOLING CONFIGURATION FOR SUPABASE
-- Optimized connection management for production workloads
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONNECTION POOL MONITORING SETUP
-- ----------------------------------------------------------------------------

-- Table to track connection pool metrics
CREATE TABLE IF NOT EXISTS connection_pool_metrics (
    id BIGSERIAL PRIMARY KEY,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_connections INTEGER NOT NULL,
    active_connections INTEGER NOT NULL,
    idle_connections INTEGER NOT NULL,
    waiting_connections INTEGER NOT NULL,
    max_connections INTEGER NOT NULL,
    pool_utilization_percent NUMERIC(5,2) NOT NULL,
    avg_query_duration_ms NUMERIC(10,2),
    slow_queries_count INTEGER DEFAULT 0,
    connection_errors_count INTEGER DEFAULT 0,
    pool_mode TEXT DEFAULT 'transaction',
    database_name TEXT DEFAULT current_database()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_connection_metrics_timestamp ON connection_pool_metrics(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_metrics_utilization ON connection_pool_metrics(pool_utilization_percent);

-- Function to collect current connection pool statistics
CREATE OR REPLACE FUNCTION collect_connection_metrics()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conn_stats RECORD;
    slow_query_count INTEGER;
    total_conn INTEGER;
    active_conn INTEGER;
    idle_conn INTEGER;
    max_conn INTEGER;
    utilization NUMERIC;
BEGIN
    -- Get connection statistics from pg_stat_activity
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle,
        (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as max_conn
    INTO conn_stats
    FROM pg_stat_activity 
    WHERE backend_type = 'client backend';
    
    -- Get slow query count (queries running > 5 seconds)
    SELECT COUNT(*) INTO slow_query_count
    FROM pg_stat_activity 
    WHERE state = 'active' 
    AND now() - query_start > INTERVAL '5 seconds'
    AND backend_type = 'client backend';
    
    -- Calculate utilization percentage
    utilization := (conn_stats.total::NUMERIC / conn_stats.max_conn::NUMERIC) * 100;
    
    -- Insert metrics
    INSERT INTO connection_pool_metrics (
        total_connections,
        active_connections,
        idle_connections,
        waiting_connections,
        max_connections,
        pool_utilization_percent,
        slow_queries_count
    ) VALUES (
        conn_stats.total,
        conn_stats.active,
        conn_stats.idle,
        GREATEST(0, conn_stats.total - conn_stats.active - conn_stats.idle), -- waiting
        conn_stats.max_conn,
        utilization,
        slow_query_count
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail
        INSERT INTO connection_pool_metrics (
            total_connections, active_connections, idle_connections, 
            waiting_connections, max_connections, pool_utilization_percent,
            connection_errors_count
        ) VALUES (0, 0, 0, 0, 0, 0, 1);
        RETURN FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. CONNECTION POOL HEALTH MONITORING
-- ----------------------------------------------------------------------------

-- Function to get current connection pool health status
CREATE OR REPLACE FUNCTION get_connection_pool_health()
RETURNS TABLE(
    metric_name TEXT,
    current_value NUMERIC,
    threshold_warning NUMERIC,
    threshold_critical NUMERIC,
    status TEXT,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_utilization NUMERIC;
    avg_utilization NUMERIC;
    max_utilization NUMERIC;
    active_conn INTEGER;
    total_conn INTEGER;
    slow_queries INTEGER;
BEGIN
    -- Get current connection statistics
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'active') as active
    INTO total_conn, active_conn
    FROM pg_stat_activity 
    WHERE backend_type = 'client backend';
    
    -- Calculate current utilization
    SELECT 
        (total_conn::NUMERIC / (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')::NUMERIC) * 100
    INTO current_utilization;
    
    -- Get recent average utilization (last hour)
    SELECT 
        AVG(pool_utilization_percent),
        MAX(pool_utilization_percent)
    INTO avg_utilization, max_utilization
    FROM connection_pool_metrics 
    WHERE measured_at > NOW() - INTERVAL '1 hour';
    
    -- Get slow query count
    SELECT COUNT(*) INTO slow_queries
    FROM pg_stat_activity 
    WHERE state = 'active' 
    AND now() - query_start > INTERVAL '10 seconds'
    AND backend_type = 'client backend';
    
    -- Return connection utilization metric
    RETURN QUERY SELECT 
        'connection_utilization'::TEXT,
        COALESCE(current_utilization, 0),
        75.0, -- Warning at 75%
        90.0, -- Critical at 90%
        CASE 
            WHEN current_utilization >= 90 THEN 'CRITICAL'
            WHEN current_utilization >= 75 THEN 'WARNING'
            ELSE 'HEALTHY'
        END,
        CASE 
            WHEN current_utilization >= 90 THEN 'Immediate action required: Scale up connection pool or optimize queries'
            WHEN current_utilization >= 75 THEN 'Monitor closely: Consider connection pool optimization'
            ELSE 'Connection utilization is within healthy range'
        END;
    
    -- Return active connection ratio metric
    RETURN QUERY SELECT 
        'active_connection_ratio'::TEXT,
        CASE WHEN total_conn > 0 THEN (active_conn::NUMERIC / total_conn::NUMERIC) * 100 ELSE 0 END,
        30.0, -- Warning if >30% connections are active (might indicate bottleneck)
        50.0, -- Critical if >50% connections are active
        CASE 
            WHEN total_conn = 0 THEN 'HEALTHY'
            WHEN (active_conn::NUMERIC / total_conn::NUMERIC) * 100 >= 50 THEN 'CRITICAL'
            WHEN (active_conn::NUMERIC / total_conn::NUMERIC) * 100 >= 30 THEN 'WARNING'
            ELSE 'HEALTHY'
        END,
        CASE 
            WHEN total_conn = 0 THEN 'No active connections'
            WHEN (active_conn::NUMERIC / total_conn::NUMERIC) * 100 >= 50 THEN 'High active connection ratio: Check for slow queries or connection leaks'
            WHEN (active_conn::NUMERIC / total_conn::NUMERIC) * 100 >= 30 THEN 'Moderate active connection ratio: Monitor query performance'
            ELSE 'Active connection ratio is healthy'
        END;
    
    -- Return slow query metric
    RETURN QUERY SELECT 
        'slow_queries'::TEXT,
        slow_queries::NUMERIC,
        5.0, -- Warning if >5 slow queries
        15.0, -- Critical if >15 slow queries
        CASE 
            WHEN slow_queries >= 15 THEN 'CRITICAL'
            WHEN slow_queries >= 5 THEN 'WARNING'
            ELSE 'HEALTHY'
        END,
        CASE 
            WHEN slow_queries >= 15 THEN 'Critical: Many slow queries detected - investigate immediately'
            WHEN slow_queries >= 5 THEN 'Warning: Several slow queries detected - optimize query performance'
            ELSE 'Query performance is healthy'
        END;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. CONNECTION POOL OPTIMIZATION RECOMMENDATIONS
-- ----------------------------------------------------------------------------

-- Function to analyze connection patterns and provide optimization recommendations
CREATE OR REPLACE FUNCTION analyze_connection_patterns()
RETURNS TABLE(
    analysis_type TEXT,
    finding TEXT,
    recommendation TEXT,
    priority TEXT,
    estimated_impact TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    avg_conn_duration INTERVAL;
    peak_utilization NUMERIC;
    conn_variance NUMERIC;
    idle_connection_ratio NUMERIC;
BEGIN
    -- Analyze connection duration patterns
    SELECT 
        AVG(now() - backend_start) 
    INTO avg_conn_duration
    FROM pg_stat_activity 
    WHERE backend_type = 'client backend'
    AND state != 'idle';
    
    -- Analyze peak utilization
    SELECT 
        MAX(pool_utilization_percent),
        VARIANCE(pool_utilization_percent)
    INTO peak_utilization, conn_variance
    FROM connection_pool_metrics 
    WHERE measured_at > NOW() - INTERVAL '24 hours';
    
    -- Analyze idle connection ratio
    SELECT 
        (COUNT(*) FILTER (WHERE state = 'idle')::NUMERIC / COUNT(*)::NUMERIC) * 100
    INTO idle_connection_ratio
    FROM pg_stat_activity 
    WHERE backend_type = 'client backend';
    
    -- Connection duration analysis
    RETURN QUERY SELECT 
        'connection_duration'::TEXT,
        'Average connection duration: ' || COALESCE(avg_conn_duration::TEXT, 'N/A'),
        CASE 
            WHEN avg_conn_duration > INTERVAL '1 hour' THEN 'Consider connection recycling and shorter connection lifetimes'
            WHEN avg_conn_duration < INTERVAL '1 minute' THEN 'Very short connections - consider connection reuse optimization'
            ELSE 'Connection duration appears optimal'
        END,
        CASE 
            WHEN avg_conn_duration > INTERVAL '2 hours' THEN 'HIGH'
            WHEN avg_conn_duration > INTERVAL '1 hour' OR avg_conn_duration < INTERVAL '30 seconds' THEN 'MEDIUM'
            ELSE 'LOW'
        END,
        CASE 
            WHEN avg_conn_duration > INTERVAL '1 hour' THEN 'Reduce connection overhead by 15-30%'
            WHEN avg_conn_duration < INTERVAL '1 minute' THEN 'Improve connection efficiency by 10-20%'
            ELSE 'Current connection duration is efficient'
        END;
    
    -- Peak utilization analysis
    RETURN QUERY SELECT 
        'peak_utilization'::TEXT,
        'Peak utilization: ' || COALESCE(ROUND(peak_utilization, 2)::TEXT || '%', 'N/A'),
        CASE 
            WHEN peak_utilization > 95 THEN 'Critical: Increase max_connections or implement connection queuing'
            WHEN peak_utilization > 85 THEN 'Warning: Monitor closely and prepare for scaling'
            WHEN peak_utilization < 30 THEN 'Consider reducing max_connections to optimize resource usage'
            ELSE 'Peak utilization is within acceptable range'
        END,
        CASE 
            WHEN peak_utilization > 95 THEN 'CRITICAL'
            WHEN peak_utilization > 85 OR peak_utilization < 20 THEN 'MEDIUM'
            ELSE 'LOW'
        END,
        CASE 
            WHEN peak_utilization > 95 THEN 'Prevent connection exhaustion and service degradation'
            WHEN peak_utilization > 85 THEN 'Improve capacity headroom for peak loads'
            WHEN peak_utilization < 30 THEN 'Optimize resource allocation and reduce costs'
            ELSE 'Current peak utilization provides good balance'
        END;
    
    -- Idle connection analysis
    RETURN QUERY SELECT 
        'idle_connections'::TEXT,
        'Idle connection ratio: ' || COALESCE(ROUND(idle_connection_ratio, 2)::TEXT || '%', 'N/A'),
        CASE 
            WHEN idle_connection_ratio > 80 THEN 'High idle ratio - consider shorter idle timeouts or connection pooling optimization'
            WHEN idle_connection_ratio > 60 THEN 'Moderate idle ratio - monitor for connection leaks'
            WHEN idle_connection_ratio < 20 THEN 'Very low idle ratio - may indicate insufficient connection pool size'
            ELSE 'Idle connection ratio is healthy'
        END,
        CASE 
            WHEN idle_connection_ratio > 80 OR idle_connection_ratio < 20 THEN 'MEDIUM'
            ELSE 'LOW'
        END,
        CASE 
            WHEN idle_connection_ratio > 80 THEN 'Reduce resource waste and improve efficiency'
            WHEN idle_connection_ratio < 20 THEN 'Improve connection availability for peak loads'
            ELSE 'Current idle ratio provides good resource utilization'
        END;
    
    -- Connection variance analysis (stability)
    RETURN QUERY SELECT 
        'connection_stability'::TEXT,
        'Connection utilization variance: ' || COALESCE(ROUND(conn_variance, 2)::TEXT, 'N/A'),
        CASE 
            WHEN conn_variance > 400 THEN 'High variance indicates unstable connection patterns - investigate load balancing'
            WHEN conn_variance > 100 THEN 'Moderate variance - consider more predictable connection management'
            ELSE 'Connection utilization is stable'
        END,
        CASE 
            WHEN conn_variance > 400 THEN 'HIGH'
            WHEN conn_variance > 100 THEN 'MEDIUM'
            ELSE 'LOW'
        END,
        CASE 
            WHEN conn_variance > 400 THEN 'Improve application stability and predictable performance'
            WHEN conn_variance > 100 THEN 'Enhance connection management consistency'
            ELSE 'Current connection patterns are stable and predictable'
        END;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. SUPABASE-SPECIFIC CONNECTION POOLING CONFIGURATION
-- ----------------------------------------------------------------------------

-- Recommended Supabase connection pool settings based on application size
CREATE OR REPLACE VIEW supabase_pool_recommendations AS
WITH app_classification AS (
    SELECT 
        CASE 
            WHEN (SELECT COUNT(*) FROM projects) < 100 THEN 'small'
            WHEN (SELECT COUNT(*) FROM projects) < 1000 THEN 'medium'
            WHEN (SELECT COUNT(*) FROM projects) < 10000 THEN 'large'
            ELSE 'enterprise'
        END as app_size,
        (SELECT COUNT(DISTINCT user_id) FROM projects) as active_users,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM tasks) as total_tasks
)
SELECT 
    app_size,
    active_users,
    total_projects,
    total_tasks,
    -- Recommended pool settings
    CASE app_size
        WHEN 'small' THEN 15
        WHEN 'medium' THEN 25
        WHEN 'large' THEN 40
        ELSE 60
    END as recommended_pool_size,
    CASE app_size
        WHEN 'small' THEN 'transaction'
        WHEN 'medium' THEN 'transaction'
        WHEN 'large' THEN 'session'
        ELSE 'session'
    END as recommended_pool_mode,
    CASE app_size
        WHEN 'small' THEN 30
        WHEN 'medium' THEN 60
        WHEN 'large' THEN 120
        ELSE 300
    END as recommended_timeout_seconds,
    -- Optimization recommendations
    CASE app_size
        WHEN 'small' THEN 'Use transaction pooling with connection timeout of 30s'
        WHEN 'medium' THEN 'Use transaction pooling with monitoring for connection spikes'
        WHEN 'large' THEN 'Consider session pooling with load balancing across multiple pools'
        ELSE 'Implement multiple connection pools with intelligent routing'
    END as optimization_strategy
FROM app_classification;

-- ----------------------------------------------------------------------------
-- 5. CONNECTION POOL MAINTENANCE PROCEDURES
-- ----------------------------------------------------------------------------

-- Function to perform connection pool maintenance
CREATE OR REPLACE FUNCTION maintain_connection_pool()
RETURNS TABLE(
    maintenance_action TEXT,
    action_taken TEXT,
    connections_affected INTEGER,
    success BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    long_idle_count INTEGER;
    long_running_count INTEGER;
    maintenance_start TIMESTAMPTZ;
BEGIN
    maintenance_start := NOW();
    
    -- Identify long-idle connections (idle > 10 minutes)
    SELECT COUNT(*) INTO long_idle_count
    FROM pg_stat_activity 
    WHERE state = 'idle' 
    AND state_change < NOW() - INTERVAL '10 minutes'
    AND backend_type = 'client backend';
    
    -- Identify long-running queries (> 30 minutes)
    SELECT COUNT(*) INTO long_running_count
    FROM pg_stat_activity 
    WHERE state = 'active' 
    AND now() - query_start > INTERVAL '30 minutes'
    AND backend_type = 'client backend';
    
    -- Report on long idle connections
    RETURN QUERY SELECT 
        'identify_long_idle_connections'::TEXT,
        'Found ' || long_idle_count || ' connections idle for >10 minutes',
        long_idle_count,
        TRUE;
    
    -- Report on long running queries
    RETURN QUERY SELECT 
        'identify_long_running_queries'::TEXT,
        'Found ' || long_running_count || ' queries running >30 minutes',
        long_running_count,
        TRUE;
    
    -- Collect current metrics
    PERFORM collect_connection_metrics();
    
    RETURN QUERY SELECT 
        'collect_metrics'::TEXT,
        'Connection metrics collected successfully',
        0,
        TRUE;
    
    -- Clean up old metrics (keep 30 days)
    DELETE FROM connection_pool_metrics 
    WHERE measured_at < NOW() - INTERVAL '30 days';
    
    RETURN QUERY SELECT 
        'cleanup_old_metrics'::TEXT,
        'Cleaned up metrics older than 30 days',
        0,
        TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'maintenance_error'::TEXT,
            'Error during maintenance: ' || SQLERRM,
            0,
            FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. MONITORING VIEWS AND DASHBOARDS
-- ----------------------------------------------------------------------------

-- Real-time connection dashboard
CREATE OR REPLACE VIEW connection_pool_dashboard AS
SELECT 
    NOW() as snapshot_time,
    -- Current connection statistics
    (SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'client backend') as total_connections,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'client backend' AND state = 'active') as active_connections,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'client backend' AND state = 'idle') as idle_connections,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'client backend' AND state = 'idle in transaction') as idle_in_transaction,
    -- Pool utilization
    ROUND(
        (SELECT COUNT(*) FROM pg_stat_activity WHERE backend_type = 'client backend')::NUMERIC / 
        (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')::NUMERIC * 100, 
        2
    ) as utilization_percent,
    -- Performance indicators
    (SELECT COUNT(*) FROM pg_stat_activity 
     WHERE backend_type = 'client backend' 
     AND state = 'active' 
     AND now() - query_start > INTERVAL '10 seconds') as slow_queries,
    (SELECT COUNT(*) FROM pg_stat_activity 
     WHERE backend_type = 'client backend' 
     AND state = 'idle' 
     AND state_change < NOW() - INTERVAL '5 minutes') as stale_connections,
    -- Configuration
    (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections_configured,
    (SELECT setting FROM pg_settings WHERE name = 'shared_preload_libraries') as extensions_loaded;

-- Historical trends view
CREATE OR REPLACE VIEW connection_pool_trends AS
SELECT 
    DATE_TRUNC('hour', measured_at) as hour,
    AVG(pool_utilization_percent) as avg_utilization,
    MAX(pool_utilization_percent) as peak_utilization,
    MIN(pool_utilization_percent) as min_utilization,
    AVG(active_connections) as avg_active_connections,
    MAX(active_connections) as peak_active_connections,
    SUM(slow_queries_count) as total_slow_queries,
    SUM(connection_errors_count) as total_connection_errors
FROM connection_pool_metrics 
WHERE measured_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', measured_at)
ORDER BY hour DESC;

-- Grant appropriate permissions
GRANT SELECT ON connection_pool_dashboard TO authenticated;
GRANT SELECT ON connection_pool_trends TO authenticated;
GRANT SELECT ON supabase_pool_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_pool_health() TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_connection_patterns() TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. AUTOMATED MONITORING AND ALERTS
-- ----------------------------------------------------------------------------

-- Create a function that can be called by external monitoring systems
CREATE OR REPLACE FUNCTION get_connection_pool_alerts()
RETURNS TABLE(
    alert_level TEXT,
    alert_message TEXT,
    metric_value NUMERIC,
    threshold_exceeded NUMERIC,
    recommended_action TEXT,
    alert_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_utilization NUMERIC;
    slow_query_count INTEGER;
    idle_connection_percent NUMERIC;
    total_connections INTEGER;
    max_connections INTEGER;
BEGIN
    -- Get current metrics
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'active' AND now() - query_start > INTERVAL '10 seconds') as slow,
        (COUNT(*) FILTER (WHERE state = 'idle')::NUMERIC / COUNT(*)::NUMERIC * 100) as idle_percent,
        (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as max_conn
    INTO total_connections, slow_query_count, idle_connection_percent, max_connections
    FROM pg_stat_activity 
    WHERE backend_type = 'client backend';
    
    current_utilization := (total_connections::NUMERIC / max_connections::NUMERIC) * 100;
    
    -- Critical utilization alert
    IF current_utilization >= 90 THEN
        RETURN QUERY SELECT 
            'CRITICAL'::TEXT,
            'Connection pool utilization critical'::TEXT,
            current_utilization,
            90.0,
            'Immediate action required: Scale connection pool or optimize queries'::TEXT,
            NOW();
    END IF;
    
    -- Warning utilization alert
    IF current_utilization >= 75 AND current_utilization < 90 THEN
        RETURN QUERY SELECT 
            'WARNING'::TEXT,
            'Connection pool utilization high'::TEXT,
            current_utilization,
            75.0,
            'Monitor closely and prepare for scaling'::TEXT,
            NOW();
    END IF;
    
    -- Slow query alert
    IF slow_query_count >= 10 THEN
        RETURN QUERY SELECT 
            'WARNING'::TEXT,
            'Multiple slow queries detected'::TEXT,
            slow_query_count::NUMERIC,
            10.0,
            'Investigate and optimize slow running queries'::TEXT,
            NOW();
    END IF;
    
    -- High idle connection alert
    IF idle_connection_percent >= 80 THEN
        RETURN QUERY SELECT 
            'INFO'::TEXT,
            'High percentage of idle connections'::TEXT,
            idle_connection_percent,
            80.0,
            'Consider reducing connection timeout or pool size'::TEXT,
            NOW();
    END IF;
    
    -- If no alerts, return healthy status
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            'HEALTHY'::TEXT,
            'All connection pool metrics within normal ranges'::TEXT,
            current_utilization,
            0.0,
            'No action required'::TEXT,
            NOW();
    END IF;
END;
$$;

-- Grant permission for monitoring
GRANT EXECUTE ON FUNCTION get_connection_pool_alerts() TO authenticated;

-- Example usage queries for operations team:
/*
-- Daily health check
SELECT * FROM get_connection_pool_health();

-- Weekly analysis
SELECT * FROM analyze_connection_patterns();

-- Real-time monitoring
SELECT * FROM connection_pool_dashboard;

-- Historical trends
SELECT * FROM connection_pool_trends WHERE hour > NOW() - INTERVAL '24 hours';

-- Get current alerts
SELECT * FROM get_connection_pool_alerts();

-- Run maintenance
SELECT * FROM maintain_connection_pool();

-- Get Supabase configuration recommendations
SELECT * FROM supabase_pool_recommendations;
*/