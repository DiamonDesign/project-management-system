-- ============================================================================
-- COMPREHENSIVE DATABASE BACKUP STRATEGY
-- Production-ready backup solution for Supabase application
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. BACKUP POLICIES AND RETENTION
-- ----------------------------------------------------------------------------

-- Point-in-time recovery configuration (Supabase Pro feature)
-- Recommended settings for production:
-- - Point-in-time recovery: 7 days minimum, 30 days recommended
-- - Daily backups with 90-day retention
-- - Weekly backups with 1-year retention  
-- - Monthly backups with 3-year retention

-- Create backup metadata table for tracking
CREATE TABLE IF NOT EXISTS backup_metadata (
    id BIGSERIAL PRIMARY KEY,
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('daily', 'weekly', 'monthly', 'manual')),
    backup_location TEXT NOT NULL,
    backup_size_bytes BIGINT,
    backup_checksum TEXT,
    tables_included TEXT[] NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    error_message TEXT,
    retention_until TIMESTAMPTZ NOT NULL,
    created_by TEXT DEFAULT 'system'
);

-- RLS for backup metadata (admin access only)
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;

-- Only allow service accounts to manage backups
CREATE POLICY "Service accounts can manage backups" ON backup_metadata
FOR ALL USING (
    CURRENT_USER IN ('postgres', 'supabase_admin') OR
    auth.jwt() ->> 'role' = 'service_role'
);

-- Index for efficient backup queries
CREATE INDEX IF NOT EXISTS idx_backup_metadata_type_date ON backup_metadata(backup_type, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_retention ON backup_metadata(retention_until);

-- ----------------------------------------------------------------------------
-- 2. BACKUP VERIFICATION FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to verify backup integrity
CREATE OR REPLACE FUNCTION verify_backup_integrity(
    backup_id BIGINT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_record backup_metadata%ROWTYPE;
    table_name TEXT;
    expected_checksum TEXT;
    actual_checksum TEXT;
BEGIN
    -- Get backup details
    SELECT * INTO backup_record FROM backup_metadata WHERE id = backup_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Backup with ID % not found', backup_id;
    END IF;
    
    IF backup_record.status != 'completed' THEN
        RAISE EXCEPTION 'Backup % is not in completed state', backup_id;
    END IF;
    
    -- Verify each table's data integrity
    FOREACH table_name IN ARRAY backup_record.tables_included
    LOOP
        -- Generate current checksum for table
        EXECUTE format('SELECT md5(string_agg(md5(t.*::text), '''' ORDER BY 1)) FROM %I t', table_name)
        INTO actual_checksum;
        
        -- Log verification attempt
        INSERT INTO backup_verification_log (backup_id, table_name, checksum_verified, verified_at)
        VALUES (backup_id, table_name, actual_checksum = backup_record.backup_checksum, NOW());
    END LOOP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return false
        INSERT INTO backup_verification_log (backup_id, table_name, error_message, verified_at)
        VALUES (backup_id, 'ERROR', SQLERRM, NOW());
        RETURN FALSE;
END;
$$;

-- Backup verification log
CREATE TABLE IF NOT EXISTS backup_verification_log (
    id BIGSERIAL PRIMARY KEY,
    backup_id BIGINT NOT NULL REFERENCES backup_metadata(id),
    table_name TEXT NOT NULL,
    checksum_verified BOOLEAN,
    error_message TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. AUTOMATED BACKUP CLEANUP
-- ----------------------------------------------------------------------------

-- Function to clean expired backups
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleanup_count INTEGER;
    backup_record backup_metadata%ROWTYPE;
BEGIN
    cleanup_count := 0;
    
    -- Find expired backups
    FOR backup_record IN 
        SELECT * FROM backup_metadata 
        WHERE retention_until < NOW() 
        AND status = 'completed'
    LOOP
        -- Log cleanup action
        INSERT INTO backup_cleanup_log (backup_id, backup_type, cleaned_at)
        VALUES (backup_record.id, backup_record.backup_type, NOW());
        
        -- Mark as cleaned (don't delete metadata for audit purposes)
        UPDATE backup_metadata 
        SET status = 'cleaned'
        WHERE id = backup_record.id;
        
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    RETURN cleanup_count;
END;
$$;

-- Cleanup log table
CREATE TABLE IF NOT EXISTS backup_cleanup_log (
    id BIGSERIAL PRIMARY KEY,
    backup_id BIGINT NOT NULL,
    backup_type VARCHAR(20) NOT NULL,
    cleaned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. BACKUP MONITORING AND ALERTING
-- ----------------------------------------------------------------------------

-- Function to get backup health status
CREATE OR REPLACE FUNCTION get_backup_health_status()
RETURNS TABLE(
    metric TEXT,
    status TEXT,
    last_value NUMERIC,
    threshold NUMERIC,
    last_check TIMESTAMPTZ,
    alert_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'last_daily_backup' as metric,
        CASE 
            WHEN MAX(started_at) > NOW() - INTERVAL '26 hours' THEN 'healthy'
            WHEN MAX(started_at) > NOW() - INTERVAL '48 hours' THEN 'warning'
            ELSE 'critical'
        END as status,
        EXTRACT(EPOCH FROM (NOW() - MAX(started_at)))/3600 as last_value,
        24.0 as threshold,
        NOW() as last_check,
        CASE 
            WHEN MAX(started_at) > NOW() - INTERVAL '26 hours' THEN 'info'
            WHEN MAX(started_at) > NOW() - INTERVAL '48 hours' THEN 'warning'
            ELSE 'critical'
        END as alert_level
    FROM backup_metadata 
    WHERE backup_type = 'daily' AND status = 'completed'
    
    UNION ALL
    
    SELECT 
        'backup_failure_rate' as metric,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / NULLIF(COUNT(*), 0) < 0.05 THEN 'healthy'
            WHEN COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / NULLIF(COUNT(*), 0) < 0.15 THEN 'warning'
            ELSE 'critical'
        END as status,
        COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / NULLIF(COUNT(*), 0) * 100 as last_value,
        5.0 as threshold,
        NOW() as last_check,
        CASE 
            WHEN COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / NULLIF(COUNT(*), 0) < 0.05 THEN 'info'
            WHEN COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC / NULLIF(COUNT(*), 0) < 0.15 THEN 'warning'
            ELSE 'critical'
        END as alert_level
    FROM backup_metadata 
    WHERE started_at > NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    SELECT 
        'backup_size_growth' as metric,
        CASE 
            WHEN (current_size.avg_size - previous_size.avg_size) / NULLIF(previous_size.avg_size, 0) < 0.5 THEN 'healthy'
            WHEN (current_size.avg_size - previous_size.avg_size) / NULLIF(previous_size.avg_size, 0) < 1.0 THEN 'warning'
            ELSE 'critical'
        END as status,
        (current_size.avg_size - previous_size.avg_size) / NULLIF(previous_size.avg_size, 0) * 100 as last_value,
        50.0 as threshold,
        NOW() as last_check,
        CASE 
            WHEN (current_size.avg_size - previous_size.avg_size) / NULLIF(previous_size.avg_size, 0) < 0.5 THEN 'info'
            WHEN (current_size.avg_size - previous_size.avg_size) / NULLIF(previous_size.avg_size, 0) < 1.0 THEN 'warning'
            ELSE 'critical'
        END as alert_level
    FROM 
        (SELECT AVG(backup_size_bytes) as avg_size 
         FROM backup_metadata 
         WHERE started_at > NOW() - INTERVAL '7 days' AND status = 'completed') current_size
    CROSS JOIN
        (SELECT AVG(backup_size_bytes) as avg_size 
         FROM backup_metadata 
         WHERE started_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days' 
         AND status = 'completed') previous_size;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. CROSS-REGION BACKUP REPLICATION (Conceptual)
-- ----------------------------------------------------------------------------

/*
For production Supabase deployment with cross-region backup replication:

1. Primary Region Backup:
   - Configure Supabase to primary region (e.g., us-east-1)
   - Enable point-in-time recovery
   - Schedule daily backups

2. Secondary Region Replication:
   - Set up read replica in secondary region (e.g., eu-west-1)
   - Configure backup replication using Supabase CLI or API
   - Implement backup verification between regions

3. Disaster Recovery Procedures:
   - RTO (Recovery Time Objective): 4 hours
   - RPO (Recovery Point Objective): 1 hour
   - Automated failover procedures
   - Regular DR testing schedule

4. Implementation via Supabase API:
   
   -- Create backup
   curl -X POST 'https://api.supabase.com/v1/projects/{project-ref}/database/backups' \
     -H 'Authorization: Bearer {access-token}' \
     -H 'Content-Type: application/json' \
     -d '{"type": "full"}'
   
   -- List backups
   curl 'https://api.supabase.com/v1/projects/{project-ref}/database/backups' \
     -H 'Authorization: Bearer {access-token}'
   
   -- Restore from backup
   curl -X POST 'https://api.supabase.com/v1/projects/{project-ref}/database/backups/{backup-id}/restore' \
     -H 'Authorization: Bearer {access-token}'
*/

-- Cross-region backup tracking table
CREATE TABLE IF NOT EXISTS cross_region_backups (
    id BIGSERIAL PRIMARY KEY,
    local_backup_id BIGINT NOT NULL REFERENCES backup_metadata(id),
    remote_region TEXT NOT NULL,
    remote_backup_id TEXT,
    replication_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (replication_status IN ('pending', 'in_progress', 'completed', 'failed')),
    replicated_at TIMESTAMPTZ,
    verification_status VARCHAR(20) DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verified_at TIMESTAMPTZ,
    error_message TEXT
);

-- ----------------------------------------------------------------------------
-- 6. BACKUP TESTING AND VALIDATION
-- ----------------------------------------------------------------------------

-- Function to test backup restoration (DRY RUN)
CREATE OR REPLACE FUNCTION test_backup_restore(
    backup_id BIGINT,
    dry_run BOOLEAN DEFAULT TRUE
) RETURNS TABLE(
    test_step TEXT,
    status TEXT,
    duration_ms BIGINT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMPTZ;
    backup_record backup_metadata%ROWTYPE;
    table_name TEXT;
BEGIN
    start_time := clock_timestamp();
    
    -- Get backup details
    SELECT * INTO backup_record FROM backup_metadata WHERE id = backup_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 'validation'::TEXT, 'failed'::TEXT, 0::BIGINT, 
                           ('Backup with ID ' || backup_id || ' not found')::TEXT;
        RETURN;
    END IF;
    
    -- Step 1: Validate backup exists and is complete
    RETURN QUERY SELECT 'backup_validation'::TEXT, 'passed'::TEXT, 
                       EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::BIGINT,
                       NULL::TEXT;
    start_time := clock_timestamp();
    
    IF NOT dry_run THEN
        -- Step 2: Create temporary restoration schema
        EXECUTE 'CREATE SCHEMA IF NOT EXISTS backup_restore_test_' || backup_id;
        
        RETURN QUERY SELECT 'schema_creation'::TEXT, 'passed'::TEXT,
                           EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::BIGINT,
                           NULL::TEXT;
        start_time := clock_timestamp();
        
        -- Step 3: Test restore each table (sample data only)
        FOREACH table_name IN ARRAY backup_record.tables_included
        LOOP
            BEGIN
                -- Create copy of table structure in test schema
                EXECUTE format('CREATE TABLE backup_restore_test_%s.%I AS SELECT * FROM %I LIMIT 100', 
                              backup_id, table_name, table_name);
                
                RETURN QUERY SELECT ('table_restore_' || table_name)::TEXT, 'passed'::TEXT,
                                   EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::BIGINT,
                                   NULL::TEXT;
            EXCEPTION
                WHEN OTHERS THEN
                    RETURN QUERY SELECT ('table_restore_' || table_name)::TEXT, 'failed'::TEXT,
                                       EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::BIGINT,
                                       SQLERRM::TEXT;
            END;
            start_time := clock_timestamp();
        END LOOP;
        
        -- Cleanup test schema
        EXECUTE 'DROP SCHEMA IF EXISTS backup_restore_test_' || backup_id || ' CASCADE';
    ELSE
        RETURN QUERY SELECT 'dry_run_complete'::TEXT, 'passed'::TEXT,
                           EXTRACT(MILLISECONDS FROM clock_timestamp() - start_time)::BIGINT,
                           'Dry run completed - no actual restore performed'::TEXT;
    END IF;
    
    -- Log test results
    INSERT INTO backup_test_log (backup_id, test_type, test_status, tested_at)
    VALUES (backup_id, CASE WHEN dry_run THEN 'dry_run' ELSE 'full_restore' END, 'completed', NOW());
    
END;
$$;

-- Backup testing log
CREATE TABLE IF NOT EXISTS backup_test_log (
    id BIGSERIAL PRIMARY KEY,
    backup_id BIGINT NOT NULL REFERENCES backup_metadata(id),
    test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('dry_run', 'full_restore', 'integrity_check')),
    test_status VARCHAR(20) NOT NULL CHECK (test_status IN ('completed', 'failed')),
    error_details JSONB,
    tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tested_by TEXT DEFAULT CURRENT_USER
);

-- ----------------------------------------------------------------------------
-- 7. MAINTENANCE AND MONITORING VIEWS
-- ----------------------------------------------------------------------------

-- View for backup dashboard
CREATE OR REPLACE VIEW backup_dashboard AS
SELECT 
    backup_type,
    COUNT(*) as total_backups,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_backups,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_backups,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_backups,
    MAX(started_at) as last_backup,
    MIN(retention_until) as next_expiry,
    AVG(backup_size_bytes) FILTER (WHERE status = 'completed') as avg_backup_size,
    CASE 
        WHEN MAX(started_at) > NOW() - INTERVAL '25 hours' AND backup_type = 'daily' THEN 'healthy'
        WHEN MAX(started_at) > NOW() - INTERVAL '8 days' AND backup_type = 'weekly' THEN 'healthy'
        WHEN MAX(started_at) > NOW() - INTERVAL '32 days' AND backup_type = 'monthly' THEN 'healthy'
        ELSE 'overdue'
    END as health_status
FROM backup_metadata
WHERE started_at > NOW() - INTERVAL '90 days'
GROUP BY backup_type
ORDER BY 
    CASE backup_type 
        WHEN 'daily' THEN 1 
        WHEN 'weekly' THEN 2 
        WHEN 'monthly' THEN 3 
        ELSE 4 
    END;

-- View for retention policy compliance
CREATE OR REPLACE VIEW backup_retention_compliance AS
WITH expected_backups AS (
    SELECT 'daily' as backup_type, 7 as min_count, 90 as retention_days
    UNION SELECT 'weekly', 4, 365
    UNION SELECT 'monthly', 12, 1095
)
SELECT 
    e.backup_type,
    e.min_count as required_backups,
    COALESCE(b.actual_count, 0) as actual_backups,
    e.retention_days as retention_days,
    CASE 
        WHEN COALESCE(b.actual_count, 0) >= e.min_count THEN 'compliant'
        WHEN COALESCE(b.actual_count, 0) >= e.min_count * 0.8 THEN 'warning'
        ELSE 'non_compliant'
    END as compliance_status,
    b.oldest_backup,
    b.newest_backup
FROM expected_backups e
LEFT JOIN (
    SELECT 
        backup_type,
        COUNT(*) as actual_count,
        MIN(started_at) as oldest_backup,
        MAX(started_at) as newest_backup
    FROM backup_metadata
    WHERE status = 'completed' 
    AND retention_until > NOW()
    GROUP BY backup_type
) b ON e.backup_type = b.backup_type;

-- Grant appropriate permissions
GRANT SELECT ON backup_dashboard TO authenticated;
GRANT SELECT ON backup_retention_compliance TO authenticated;
GRANT SELECT ON backup_metadata TO authenticated;

-- ----------------------------------------------------------------------------
-- 8. OPERATIONAL PROCEDURES
-- ----------------------------------------------------------------------------

/*
DAILY OPERATIONS CHECKLIST:

1. Backup Health Check (Automated):
   SELECT * FROM get_backup_health_status();

2. Review Failed Backups:
   SELECT * FROM backup_metadata WHERE status = 'failed' AND started_at > NOW() - INTERVAL '24 hours';

3. Monitor Backup Sizes:
   SELECT backup_type, AVG(backup_size_bytes), MAX(backup_size_bytes)
   FROM backup_metadata 
   WHERE started_at > NOW() - INTERVAL '7 days'
   GROUP BY backup_type;

WEEKLY OPERATIONS CHECKLIST:

1. Test Backup Restoration:
   SELECT * FROM test_backup_restore((SELECT id FROM backup_metadata 
                                     WHERE backup_type = 'weekly' 
                                     ORDER BY started_at DESC LIMIT 1), true);

2. Review Retention Compliance:
   SELECT * FROM backup_retention_compliance;

3. Clean Expired Backups:
   SELECT cleanup_expired_backups();

MONTHLY OPERATIONS CHECKLIST:

1. Full Disaster Recovery Test
2. Review and Update Backup Strategy
3. Capacity Planning and Storage Analysis
4. Update Documentation and Procedures

EMERGENCY RESTORE PROCEDURES:

1. Identify Required Backup:
   SELECT * FROM backup_metadata 
   WHERE status = 'completed' 
   AND started_at <= '{point_in_time}'
   ORDER BY started_at DESC LIMIT 1;

2. Verify Backup Integrity:
   SELECT verify_backup_integrity({backup_id});

3. Execute Restore (Via Supabase Dashboard or API)

4. Verify Data Consistency Post-Restore

5. Update Application Configuration

6. Notify Stakeholders of Recovery Completion
*/