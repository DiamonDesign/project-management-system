-- ============================================================================
-- COMPREHENSIVE MONITORING AND ALERTING SYSTEM
-- Complete operational monitoring for post-migration database
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MONITORING INFRASTRUCTURE
-- ----------------------------------------------------------------------------

-- Create monitoring schema
CREATE SCHEMA IF NOT EXISTS monitoring;

-- System health metrics table
CREATE TABLE IF NOT EXISTS monitoring.system_health_metrics (
    id BIGSERIAL PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT NOT NULL,
    warning_threshold NUMERIC,
    critical_threshold NUMERIC,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    additional_info JSONB
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_system_health_name_time ON monitoring.system_health_metrics(metric_name, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_measured_at ON monitoring.system_health_metrics(measured_at DESC);

-- Alert history table
CREATE TABLE IF NOT EXISTS monitoring.alert_history (
    id BIGSERIAL PRIMARY KEY,
    alert_level TEXT NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical')),
    alert_category TEXT NOT NULL,
    alert_message TEXT NOT NULL,
    metric_value NUMERIC,
    threshold_exceeded NUMERIC,
    first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    occurrence_count INTEGER DEFAULT 1,
    additional_context JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

-- Alert suppression table (prevent spam)
CREATE TABLE IF NOT EXISTS monitoring.alert_suppression (
    id BIGSERIAL PRIMARY KEY,
    alert_category TEXT NOT NULL,
    suppressed_until TIMESTAMPTZ NOT NULL,
    suppression_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. COMPREHENSIVE HEALTH MONITORING FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION monitoring.collect_system_health_metrics()
RETURNS TABLE(
    metric_category TEXT,
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
    db_size_bytes BIGINT;
    connection_count INTEGER;
    max_connections INTEGER;
    long_running_queries INTEGER;
    slow_queries INTEGER;
    table_sizes RECORD;
    largest_table_size BIGINT;
    backup_age_hours NUMERIC;
    disk_usage_pct NUMERIC;
    cache_hit_ratio NUMERIC;
    deadlock_count INTEGER;
    failed_connections INTEGER;
    migration_health_score NUMERIC;
BEGIN
    -- Database Size Monitoring
    SELECT pg_database_size(current_database()) INTO db_size_bytes;

    RETURN QUERY SELECT
        'database'::TEXT,
        'database_size_mb'::TEXT,
        (db_size_bytes / 1024 / 1024)::NUMERIC,
        2048.0, -- 2GB warning
        5120.0, -- 5GB critical
        CASE
            WHEN db_size_bytes > 5368709120 THEN 'critical' -- 5GB
            WHEN db_size_bytes > 2147483648 THEN 'warning'  -- 2GB
            ELSE 'healthy'
        END,
        CASE
            WHEN db_size_bytes > 5368709120 THEN 'Database approaching size limits - consider cleanup or upgrade'
            WHEN db_size_bytes > 2147483648 THEN 'Monitor database growth - plan for capacity expansion'
            ELSE 'Database size is healthy'
        END;

    -- Connection Monitoring
    SELECT COUNT(*), (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')
    INTO connection_count, max_connections
    FROM pg_stat_activity WHERE backend_type = 'client backend';

    RETURN QUERY SELECT
        'connections'::TEXT,
        'active_connections'::TEXT,
        connection_count::NUMERIC,
        (max_connections * 0.75)::NUMERIC, -- 75% warning
        (max_connections * 0.9)::NUMERIC,  -- 90% critical
        CASE
            WHEN connection_count >= max_connections * 0.9 THEN 'critical'
            WHEN connection_count >= max_connections * 0.75 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN connection_count >= max_connections * 0.9 THEN 'Connection pool near exhaustion - scale immediately'
            WHEN connection_count >= max_connections * 0.75 THEN 'High connection usage - monitor closely'
            ELSE 'Connection usage is healthy'
        END;

    -- Long Running Queries
    SELECT COUNT(*) INTO long_running_queries
    FROM pg_stat_activity
    WHERE state = 'active'
    AND now() - query_start > INTERVAL '5 minutes'
    AND backend_type = 'client backend';

    RETURN QUERY SELECT
        'performance'::TEXT,
        'long_running_queries'::TEXT,
        long_running_queries::NUMERIC,
        2.0, -- 2 queries warning
        5.0, -- 5 queries critical
        CASE
            WHEN long_running_queries >= 5 THEN 'critical'
            WHEN long_running_queries >= 2 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN long_running_queries >= 5 THEN 'Multiple long-running queries detected - investigate immediately'
            WHEN long_running_queries >= 2 THEN 'Some long-running queries - monitor and optimize'
            ELSE 'Query performance is healthy'
        END;

    -- Slow Queries (last hour)
    SELECT COUNT(*) INTO slow_queries
    FROM pg_stat_activity
    WHERE state = 'active'
    AND now() - query_start > INTERVAL '30 seconds'
    AND backend_type = 'client backend';

    RETURN QUERY SELECT
        'performance'::TEXT,
        'slow_queries_current'::TEXT,
        slow_queries::NUMERIC,
        5.0,
        15.0,
        CASE
            WHEN slow_queries >= 15 THEN 'critical'
            WHEN slow_queries >= 5 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN slow_queries >= 15 THEN 'High number of slow queries - database performance degraded'
            WHEN slow_queries >= 5 THEN 'Several slow queries detected - consider optimization'
            ELSE 'Query response times are healthy'
        END;

    -- Table Size Monitoring (identify largest tables)
    SELECT pg_total_relation_size('public.tasks'::regclass) INTO largest_table_size;

    RETURN QUERY SELECT
        'storage'::TEXT,
        'tasks_table_size_mb'::TEXT,
        (largest_table_size / 1024 / 1024)::NUMERIC,
        500.0, -- 500MB warning
        1024.0, -- 1GB critical
        CASE
            WHEN largest_table_size > 1073741824 THEN 'critical' -- 1GB
            WHEN largest_table_size > 524288000 THEN 'warning'   -- 500MB
            ELSE 'healthy'
        END,
        CASE
            WHEN largest_table_size > 1073741824 THEN 'Tasks table very large - consider partitioning or archival'
            WHEN largest_table_size > 524288000 THEN 'Tasks table growing large - monitor and plan optimization'
            ELSE 'Task table size is manageable'
        END;

    -- Cache Hit Ratio
    SELECT
        CASE WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 100
             ELSE round(sum(heap_blks_hit) * 100.0 / (sum(heap_blks_hit) + sum(heap_blks_read)), 2)
        END INTO cache_hit_ratio
    FROM pg_statio_user_tables;

    RETURN QUERY SELECT
        'performance'::TEXT,
        'cache_hit_ratio_pct'::TEXT,
        cache_hit_ratio::NUMERIC,
        95.0, -- 95% minimum for good performance
        90.0, -- 90% critical threshold
        CASE
            WHEN cache_hit_ratio < 90 THEN 'critical'
            WHEN cache_hit_ratio < 95 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN cache_hit_ratio < 90 THEN 'Very low cache hit ratio - consider memory increase'
            WHEN cache_hit_ratio < 95 THEN 'Cache hit ratio could be improved - monitor memory usage'
            ELSE 'Cache performance is excellent'
        END;

    -- Backup Monitoring
    SELECT
        EXTRACT(HOURS FROM NOW() - MAX(backup_start_time))
    INTO backup_age_hours
    FROM backup_metadata
    WHERE status = 'completed' AND backup_type IN ('daily', 'manual');

    RETURN QUERY SELECT
        'backup'::TEXT,
        'last_backup_age_hours'::TEXT,
        COALESCE(backup_age_hours, 999)::NUMERIC,
        26.0, -- 26 hours warning (daily backup + 2h buffer)
        48.0, -- 48 hours critical
        CASE
            WHEN backup_age_hours IS NULL OR backup_age_hours > 48 THEN 'critical'
            WHEN backup_age_hours > 26 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN backup_age_hours IS NULL THEN 'No recent backups found - backup system may be failing'
            WHEN backup_age_hours > 48 THEN 'Backup seriously overdue - immediate attention required'
            WHEN backup_age_hours > 26 THEN 'Backup slightly overdue - check backup processes'
            ELSE 'Backup schedule is on track'
        END;

    -- Migration Health Score (based on task normalization success)
    WITH migration_stats AS (
        SELECT
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE status IN ('not-started', 'in-progress', 'completed')) as valid_tasks,
            COUNT(DISTINCT project_id) as projects_with_tasks,
            COUNT(*) FILTER (WHERE title IS NOT NULL AND LENGTH(TRIM(title)) > 0) as tasks_with_titles
        FROM tasks
    )
    SELECT
        CASE
            WHEN total_tasks = 0 THEN 0
            ELSE (valid_tasks + tasks_with_titles + projects_with_tasks) * 100.0 / (total_tasks * 3)
        END INTO migration_health_score
    FROM migration_stats;

    RETURN QUERY SELECT
        'migration'::TEXT,
        'migration_health_score'::TEXT,
        migration_health_score::NUMERIC,
        95.0, -- 95% minimum health score
        85.0, -- 85% critical threshold
        CASE
            WHEN migration_health_score < 85 THEN 'critical'
            WHEN migration_health_score < 95 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN migration_health_score < 85 THEN 'Migration has significant data quality issues'
            WHEN migration_health_score < 95 THEN 'Migration has minor data quality issues to address'
            ELSE 'Migration data quality is excellent'
        END;

    -- Security Monitoring
    SELECT COUNT(*) INTO failed_connections
    FROM security_audit_log
    WHERE policy_violated IS NOT NULL
    AND created_at > NOW() - INTERVAL '1 hour';

    RETURN QUERY SELECT
        'security'::TEXT,
        'security_violations_hourly'::TEXT,
        failed_connections::NUMERIC,
        5.0,  -- 5 violations per hour warning
        15.0, -- 15 violations per hour critical
        CASE
            WHEN failed_connections >= 15 THEN 'critical'
            WHEN failed_connections >= 5 THEN 'warning'
            ELSE 'healthy'
        END,
        CASE
            WHEN failed_connections >= 15 THEN 'High number of security violations - possible attack or misconfiguration'
            WHEN failed_connections >= 5 THEN 'Several security violations detected - review logs'
            ELSE 'Security status is normal'
        END;

    -- Store metrics in monitoring table
    INSERT INTO monitoring.system_health_metrics (metric_name, metric_value, metric_unit, warning_threshold, critical_threshold, additional_info)
    SELECT
        metric_name,
        current_value,
        CASE
            WHEN metric_name LIKE '%_mb' THEN 'MB'
            WHEN metric_name LIKE '%_pct' THEN '%'
            WHEN metric_name LIKE '%_hours' THEN 'hours'
            ELSE 'count'
        END,
        threshold_warning,
        threshold_critical,
        jsonb_build_object(
            'status', status,
            'recommendation', recommendation,
            'category', metric_category
        )
    FROM (
        SELECT * FROM monitoring.collect_system_health_metrics()
    ) current_metrics;

    -- Clean up old metrics (keep 7 days)
    DELETE FROM monitoring.system_health_metrics
    WHERE measured_at < NOW() - INTERVAL '7 days';

END;
$$;

-- ----------------------------------------------------------------------------
-- 3. INTELLIGENT ALERTING SYSTEM
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION monitoring.process_alerts()
RETURNS TABLE(
    alert_id BIGINT,
    alert_level TEXT,
    alert_category TEXT,
    alert_message TEXT,
    action_required TEXT,
    escalation_needed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    metric_record RECORD;
    existing_alert RECORD;
    alert_record_id BIGINT;
    suppression_active BOOLEAN;
BEGIN
    -- Process each recent metric
    FOR metric_record IN
        SELECT
            metric_name,
            metric_value,
            warning_threshold,
            critical_threshold,
            additional_info->>'status' as status,
            additional_info->>'recommendation' as recommendation,
            additional_info->>'category' as category,
            measured_at
        FROM monitoring.system_health_metrics
        WHERE measured_at > NOW() - INTERVAL '5 minutes'
        AND (metric_value >= warning_threshold OR additional_info->>'status' != 'healthy')
    LOOP
        -- Check if alert is suppressed
        SELECT EXISTS (
            SELECT 1 FROM monitoring.alert_suppression
            WHERE alert_category = metric_record.category
            AND suppressed_until > NOW()
        ) INTO suppression_active;

        IF suppression_active THEN
            CONTINUE;
        END IF;

        -- Check for existing active alert
        SELECT * INTO existing_alert
        FROM monitoring.alert_history
        WHERE alert_category = metric_record.category
        AND metric_record.metric_name = ANY(string_to_array(alert_message, ' '))
        AND is_active = true
        ORDER BY first_detected_at DESC
        LIMIT 1;

        IF FOUND THEN
            -- Update existing alert
            UPDATE monitoring.alert_history
            SET
                last_detected_at = NOW(),
                occurrence_count = occurrence_count + 1,
                metric_value = metric_record.metric_value,
                additional_context = jsonb_build_object(
                    'latest_recommendation', metric_record.recommendation,
                    'trend', CASE
                        WHEN metric_record.metric_value > existing_alert.metric_value THEN 'worsening'
                        WHEN metric_record.metric_value < existing_alert.metric_value THEN 'improving'
                        ELSE 'stable'
                    END
                )
            WHERE id = existing_alert.id
            RETURNING id INTO alert_record_id;
        ELSE
            -- Create new alert
            INSERT INTO monitoring.alert_history (
                alert_level,
                alert_category,
                alert_message,
                metric_value,
                threshold_exceeded,
                additional_context
            ) VALUES (
                CASE
                    WHEN metric_record.status = 'critical' THEN 'critical'
                    WHEN metric_record.status = 'warning' THEN 'warning'
                    ELSE 'info'
                END,
                metric_record.category,
                metric_record.metric_name || ' threshold exceeded: ' || metric_record.recommendation,
                metric_record.metric_value,
                CASE
                    WHEN metric_record.status = 'critical' THEN metric_record.critical_threshold
                    ELSE metric_record.warning_threshold
                END,
                jsonb_build_object(
                    'metric_name', metric_record.metric_name,
                    'measured_at', metric_record.measured_at,
                    'status', metric_record.status,
                    'recommendation', metric_record.recommendation
                )
            ) RETURNING id INTO alert_record_id;
        END IF;

        -- Return alert for notification
        RETURN QUERY SELECT
            alert_record_id,
            CASE
                WHEN metric_record.status = 'critical' THEN 'critical'
                WHEN metric_record.status = 'warning' THEN 'warning'
                ELSE 'info'
            END,
            metric_record.category,
            metric_record.metric_name || ' - ' || metric_record.recommendation,
            CASE
                WHEN metric_record.status = 'critical' THEN 'IMMEDIATE ACTION REQUIRED'
                WHEN metric_record.status = 'warning' THEN 'Monitor and plan corrective action'
                ELSE 'Informational - no immediate action needed'
            END,
            metric_record.status = 'critical' AND
            COALESCE(existing_alert.occurrence_count, 0) > 3; -- Escalate after 3 occurrences
    END LOOP;

    -- Auto-resolve alerts for metrics that are now healthy
    UPDATE monitoring.alert_history
    SET
        resolved_at = NOW(),
        is_active = false,
        additional_context = additional_context || jsonb_build_object('auto_resolved', true)
    WHERE is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM monitoring.system_health_metrics shm
        WHERE shm.additional_info->>'category' = alert_history.alert_category
        AND shm.additional_info->>'status' != 'healthy'
        AND shm.measured_at > NOW() - INTERVAL '10 minutes'
    );

END;
$$;

-- ----------------------------------------------------------------------------
-- 4. AUTOMATED MAINTENANCE TASKS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION monitoring.automated_maintenance()
RETURNS TABLE(
    maintenance_task TEXT,
    status TEXT,
    details TEXT,
    duration_ms BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
    task_duration BIGINT;
    cleaned_records INTEGER;
    refreshed_views INTEGER;
    analyzed_tables INTEGER;
BEGIN
    -- Task 1: Clean up old monitoring data
    start_time := clock_timestamp();

    DELETE FROM monitoring.system_health_metrics
    WHERE measured_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS cleaned_records = ROW_COUNT;

    task_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);

    RETURN QUERY SELECT
        'cleanup_old_metrics'::TEXT,
        'completed'::TEXT,
        'Cleaned ' || cleaned_records || ' old metric records'::TEXT,
        task_duration;

    -- Task 2: Refresh materialized views
    start_time := clock_timestamp();

    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
        refreshed_views := 1;

        task_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);

        RETURN QUERY SELECT
            'refresh_materialized_views'::TEXT,
            'completed'::TEXT,
            'Refreshed ' || refreshed_views || ' materialized views'::TEXT,
            task_duration;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT
                'refresh_materialized_views'::TEXT,
                'failed'::TEXT,
                'Error refreshing views: ' || SQLERRM,
                EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);
    END;

    -- Task 3: Update table statistics
    start_time := clock_timestamp();

    ANALYZE tasks;
    ANALYZE projects;
    ANALYZE clients;
    analyzed_tables := 3;

    task_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);

    RETURN QUERY SELECT
        'update_table_statistics'::TEXT,
        'completed'::TEXT,
        'Analyzed ' || analyzed_tables || ' tables'::TEXT,
        task_duration;

    -- Task 4: Check for long-running transactions and alert
    start_time := clock_timestamp();

    INSERT INTO monitoring.alert_history (alert_level, alert_category, alert_message, additional_context)
    SELECT
        'warning',
        'performance',
        'Long-running transaction detected: ' || EXTRACT(MINUTES FROM now() - xact_start) || ' minutes',
        jsonb_build_object(
            'pid', pid,
            'user', usename,
            'duration_minutes', EXTRACT(MINUTES FROM now() - xact_start),
            'query', LEFT(query, 200)
        )
    FROM pg_stat_activity
    WHERE xact_start IS NOT NULL
    AND now() - xact_start > INTERVAL '10 minutes'
    AND backend_type = 'client backend'
    AND NOT EXISTS (
        SELECT 1 FROM monitoring.alert_history ah
        WHERE ah.alert_category = 'performance'
        AND ah.additional_context->>'pid' = pg_stat_activity.pid::text
        AND ah.is_active = true
    );

    task_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);

    RETURN QUERY SELECT
        'check_long_transactions'::TEXT,
        'completed'::TEXT,
        'Checked for long-running transactions'::TEXT,
        task_duration;

    -- Task 5: Backup health check
    start_time := clock_timestamp();

    PERFORM * FROM backup_health_status;

    task_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);

    RETURN QUERY SELECT
        'backup_health_check'::TEXT,
        'completed'::TEXT,
        'Verified backup system health'::TEXT,
        task_duration;

END;
$$;

-- ----------------------------------------------------------------------------
-- 5. MONITORING DASHBOARDS AND VIEWS
-- ----------------------------------------------------------------------------

-- Real-time system health dashboard
CREATE OR REPLACE VIEW monitoring.system_health_dashboard AS
WITH latest_metrics AS (
    SELECT DISTINCT ON (metric_name)
        metric_name,
        metric_value,
        metric_unit,
        warning_threshold,
        critical_threshold,
        additional_info->>'status' as status,
        additional_info->>'recommendation' as recommendation,
        additional_info->>'category' as category,
        measured_at
    FROM monitoring.system_health_metrics
    ORDER BY metric_name, measured_at DESC
),
active_alerts AS (
    SELECT
        alert_category,
        COUNT(*) as alert_count,
        MAX(alert_level) as highest_severity
    FROM monitoring.alert_history
    WHERE is_active = true
    GROUP BY alert_category
)
SELECT
    lm.category,
    lm.metric_name,
    lm.metric_value,
    lm.metric_unit,
    lm.status,
    lm.recommendation,
    COALESCE(aa.alert_count, 0) as active_alerts,
    COALESCE(aa.highest_severity, 'none') as alert_severity,
    lm.measured_at as last_measured
FROM latest_metrics lm
LEFT JOIN active_alerts aa ON aa.alert_category = lm.category
ORDER BY
    CASE lm.status
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        ELSE 3
    END,
    lm.category,
    lm.metric_name;

-- Historical trends view
CREATE OR REPLACE VIEW monitoring.system_trends AS
SELECT
    DATE_TRUNC('hour', measured_at) as hour,
    metric_name,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    COUNT(*) as measurement_count
FROM monitoring.system_health_metrics
WHERE measured_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', measured_at), metric_name
ORDER BY hour DESC, metric_name;

-- Alert summary view
CREATE OR REPLACE VIEW monitoring.alert_summary AS
SELECT
    alert_level,
    alert_category,
    COUNT(*) as total_alerts,
    COUNT(*) FILTER (WHERE is_active = true) as active_alerts,
    COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as resolved_alerts,
    MAX(last_detected_at) as most_recent_alert,
    AVG(occurrence_count) as avg_occurrences
FROM monitoring.alert_history
WHERE first_detected_at > NOW() - INTERVAL '7 days'
GROUP BY alert_level, alert_category
ORDER BY
    CASE alert_level
        WHEN 'critical' THEN 1
        WHEN 'warning' THEN 2
        ELSE 3
    END,
    active_alerts DESC;

-- ----------------------------------------------------------------------------
-- 6. SCHEDULED MONITORING JOBS (Functions for external scheduling)
-- ----------------------------------------------------------------------------

-- Function to run complete monitoring cycle
CREATE OR REPLACE FUNCTION monitoring.run_monitoring_cycle()
RETURNS TABLE(
    cycle_step TEXT,
    status TEXT,
    duration_ms BIGINT,
    details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
    step_duration BIGINT;
    metric_count INTEGER;
    alert_count INTEGER;
    maintenance_tasks INTEGER;
BEGIN
    -- Step 1: Collect metrics
    start_time := clock_timestamp();
    PERFORM * FROM monitoring.collect_system_health_metrics();
    step_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);

    SELECT COUNT(*) INTO metric_count
    FROM monitoring.system_health_metrics
    WHERE measured_at > start_time;

    RETURN QUERY SELECT
        'collect_metrics'::TEXT,
        'completed'::TEXT,
        step_duration,
        'Collected ' || metric_count || ' system health metrics';

    -- Step 2: Process alerts
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO alert_count FROM monitoring.process_alerts();
    step_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);

    RETURN QUERY SELECT
        'process_alerts'::TEXT,
        'completed'::TEXT,
        step_duration,
        'Processed ' || alert_count || ' alerts';

    -- Step 3: Run maintenance tasks
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO maintenance_tasks FROM monitoring.automated_maintenance();
    step_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time);

    RETURN QUERY SELECT
        'automated_maintenance'::TEXT,
        'completed'::TEXT,
        step_duration,
        'Completed ' || maintenance_tasks || ' maintenance tasks';

    -- Step 4: Generate summary
    RETURN QUERY SELECT
        'monitoring_summary'::TEXT,
        'completed'::TEXT,
        0::BIGINT,
        'Monitoring cycle completed successfully';
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA monitoring TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA monitoring TO authenticated;
GRANT SELECT ON ALL VIEWS IN SCHEMA monitoring TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA monitoring TO authenticated;

-- Create backup health status function (referenced in maintenance)
CREATE OR REPLACE FUNCTION backup_health_status()
RETURNS TABLE(
    backup_type TEXT,
    last_backup TIMESTAMPTZ,
    status TEXT,
    recommendation TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT
        bm.backup_type,
        MAX(bm.started_at) as last_backup,
        CASE
            WHEN MAX(bm.started_at) < NOW() - INTERVAL '26 hours' AND bm.backup_type = 'daily' THEN 'overdue'
            WHEN MAX(bm.started_at) < NOW() - INTERVAL '8 days' AND bm.backup_type = 'weekly' THEN 'overdue'
            WHEN MAX(bm.started_at) < NOW() - INTERVAL '32 days' AND bm.backup_type = 'monthly' THEN 'overdue'
            ELSE 'healthy'
        END as status,
        CASE
            WHEN MAX(bm.started_at) < NOW() - INTERVAL '26 hours' AND bm.backup_type = 'daily' THEN 'Daily backup is overdue - check backup process'
            WHEN MAX(bm.started_at) < NOW() - INTERVAL '8 days' AND bm.backup_type = 'weekly' THEN 'Weekly backup is overdue - verify schedule'
            WHEN MAX(bm.started_at) < NOW() - INTERVAL '32 days' AND bm.backup_type = 'monthly' THEN 'Monthly backup is overdue - immediate attention needed'
            ELSE 'Backup schedule is on track'
        END as recommendation
    FROM backup_metadata bm
    WHERE bm.status = 'completed'
    GROUP BY bm.backup_type
    ORDER BY
        CASE bm.backup_type
            WHEN 'daily' THEN 1
            WHEN 'weekly' THEN 2
            WHEN 'monthly' THEN 3
            ELSE 4
        END;
$$;

-- Final setup message
SELECT
    'COMPREHENSIVE MONITORING SYSTEM SETUP COMPLETE' as status,
    NOW() as completed_at,
    'Run monitoring.run_monitoring_cycle() to start monitoring' as next_step;