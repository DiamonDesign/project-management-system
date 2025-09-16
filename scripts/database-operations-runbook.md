# Database Operations Runbook
## Backup Strategy, Disaster Recovery & Task Migration Guide

### Table of Contents
1. [Executive Summary](#executive-summary)
2. [Backup Strategy Overview](#backup-strategy-overview)
3. [Daily Operations](#daily-operations)
4. [Weekly Operations](#weekly-operations)
5. [Monthly Operations](#monthly-operations)
6. [Emergency Procedures](#emergency-procedures)
7. [Task Migration Guide](#task-migration-guide)
8. [Monitoring and Alerting](#monitoring-and-alerting)
9. [Performance Tuning](#performance-tuning)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

This runbook provides comprehensive operational procedures for database backup, disaster recovery, and task storage normalization for the Supabase-based project management application.

### Key Metrics and Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 1 hour
- **Backup Retention**: Daily (90 days), Weekly (1 year), Monthly (3 years)
- **Availability Target**: 99.9% uptime
- **Data Integrity**: 100% (zero tolerance for data loss)

### Critical Files Overview
```
scripts/
├── db-backup-strategy.sql           # Backup infrastructure & policies
├── task-normalization-schema.sql    # Task migration schema & functions
├── execute-task-migration.sql       # Migration execution script
└── backup-verification-tests.sql    # Testing & verification procedures
```

---

## Backup Strategy Overview

### Backup Types and Schedule

#### Daily Backups
- **Frequency**: Every day at 2:00 AM UTC
- **Retention**: 90 days
- **Scope**: Full database with all user data
- **Storage**: Supabase managed backup + cross-region replication
- **Verification**: Automated integrity checks within 2 hours

#### Weekly Backups
- **Frequency**: Every Sunday at 1:00 AM UTC
- **Retention**: 1 year
- **Scope**: Full database with schema verification
- **Testing**: Sample restoration test performed
- **Verification**: Full data consistency check

#### Monthly Backups
- **Frequency**: First Sunday of each month
- **Retention**: 3 years
- **Scope**: Full database with compliance documentation
- **Testing**: Complete disaster recovery simulation
- **Verification**: Cross-region integrity validation

### Backup Infrastructure Components

1. **Primary Backup System**: Supabase native backup service
2. **Metadata Tracking**: `backup_metadata` table
3. **Verification System**: Automated integrity checking
4. **Cross-Region Replication**: Secondary region backup copies
5. **Monitoring Dashboard**: Real-time backup health status

---

## Daily Operations

### Morning Health Check (9:00 AM Local Time)

```sql
-- 1. Check backup health status
SELECT * FROM get_backup_health_status();

-- 2. Verify last night's backup
SELECT * FROM backup_dashboard WHERE backup_type = 'daily';

-- 3. Run daily verification
SELECT * FROM run_daily_backup_verification();
```

**Expected Results:**
- All backups should show `status = 'healthy'`
- Last backup should be < 10 hours old
- No critical alerts in verification results

**Action Items if Issues Found:**
1. **Red Status**: Immediately escalate to on-call engineer
2. **Yellow Status**: Investigate within 2 hours, document findings
3. **Green Status**: No action required, log results

### Database Performance Monitoring

```sql
-- Check query performance
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements 
WHERE mean_time > 1000  -- Queries slower than 1 second
ORDER BY mean_time DESC 
LIMIT 10;

-- Check connection pool utilization
SELECT 
    state,
    COUNT(*) as connections
FROM pg_stat_activity 
GROUP BY state;
```

### Data Quality Checks

```sql
-- Verify referential integrity
SELECT * FROM validate_task_migration();

-- Check for data anomalies
SELECT 
    table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM (VALUES ('projects'), ('tasks'), ('clients')) t(table_name)
GROUP BY table_name;
```

---

## Weekly Operations

### Sunday Backup Verification (Every Sunday)

```sql
-- 1. Run comprehensive weekly restore test
SELECT * FROM run_weekly_restore_test();

-- 2. Check retention policy compliance
SELECT * FROM backup_retention_compliance;

-- 3. Clean up expired backups
SELECT cleanup_expired_backups();
```

**Validation Checklist:**
- [ ] Weekly backup completed successfully
- [ ] Restore test passed with >95% data integrity score
- [ ] Performance metrics within acceptable ranges
- [ ] No critical issues in retention compliance
- [ ] Expired backups cleaned up automatically

### Performance Review

```sql
-- Analyze backup performance trends
SELECT 
    DATE_TRUNC('week', started_at) as week,
    backup_type,
    AVG(backup_size_bytes) as avg_size,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM backup_metadata 
WHERE started_at > NOW() - INTERVAL '4 weeks'
AND status = 'completed'
GROUP BY week, backup_type
ORDER BY week DESC;

-- Check index usage statistics
SELECT * FROM test_monitoring_system();
```

### Security Audit

```sql
-- Review backup access logs
SELECT 
    created_by,
    COUNT(*) as backup_count,
    MAX(started_at) as last_backup
FROM backup_metadata 
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY created_by;

-- Verify RLS policies are active
SELECT 
    tablename,
    rowsecurity,
    hasrlspolicy
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
AND tablename IN ('projects', 'tasks', 'clients', 'backup_metadata');
```

---

## Monthly Operations

### Comprehensive Disaster Recovery Test (First Sunday of Month)

```sql
-- Run full disaster recovery simulation
SELECT * FROM simulate_disaster_recovery('complete_data_loss');

-- Execute comprehensive test suite
SELECT * FROM run_comprehensive_backup_tests();
```

**Monthly Review Checklist:**
- [ ] All DR simulation steps completed within RTO
- [ ] Data recovery achieved within RPO targets
- [ ] All automated systems functioning correctly
- [ ] Documentation updated with any procedural changes
- [ ] Stakeholder communication plan validated

### Capacity Planning Review

```sql
-- Analyze storage growth trends
WITH monthly_growth AS (
    SELECT 
        DATE_TRUNC('month', started_at) as month,
        AVG(backup_size_bytes) as avg_backup_size,
        LAG(AVG(backup_size_bytes)) OVER (ORDER BY DATE_TRUNC('month', started_at)) as prev_month_size
    FROM backup_metadata
    WHERE backup_type = 'weekly'
    AND started_at > NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', started_at)
)
SELECT 
    month,
    pg_size_pretty(avg_backup_size::bigint) as avg_size,
    CASE 
        WHEN prev_month_size IS NOT NULL THEN 
            ROUND(((avg_backup_size - prev_month_size) / prev_month_size * 100)::numeric, 2)
        ELSE NULL 
    END as growth_percentage
FROM monthly_growth
ORDER BY month DESC;
```

### Compliance Documentation Update

1. **Backup Retention Audit**: Verify all retention policies are being followed
2. **Access Control Review**: Ensure only authorized personnel have backup access
3. **Encryption Verification**: Confirm all backups are properly encrypted
4. **Cross-Region Replication**: Validate secondary region backup integrity

---

## Emergency Procedures

### Critical Backup Failure Response

**Severity Level: CRITICAL**
**Response Time: Immediate (within 15 minutes)**

#### Step 1: Initial Assessment
```bash
# Check Supabase dashboard for system status
# Verify database connectivity
psql -h [supabase_host] -U [user] -d [database] -c "SELECT NOW();"
```

#### Step 2: Immediate Actions
1. **Alert stakeholders** using emergency contact list
2. **Create manual backup** if database is accessible:
```sql
-- Create emergency manual backup
INSERT INTO backup_metadata (
    backup_type, 
    backup_location, 
    tables_included, 
    status,
    retention_until,
    created_by
) VALUES (
    'manual',
    'EMERGENCY_BACKUP_' || NOW()::TEXT,
    ARRAY['projects', 'tasks', 'clients', 'backup_metadata'],
    'in_progress',
    NOW() + INTERVAL '1 year',
    'emergency_response'
);
```

#### Step 3: Root Cause Analysis
- Review Supabase logs and monitoring dashboards
- Check backup automation system status
- Verify network connectivity and authentication
- Document timeline and symptoms

#### Step 4: Resolution and Recovery
- Fix underlying infrastructure issues
- Resume automated backup schedule
- Verify backup integrity post-recovery
- Update incident documentation

### Data Corruption Response

**Severity Level: HIGH**
**Response Time: Within 1 hour**

#### Step 1: Containment
```sql
-- Identify scope of corruption
SELECT 
    table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_rows
FROM (
    SELECT 'projects' as table_name, created_at FROM projects
    UNION ALL
    SELECT 'tasks', created_at FROM tasks
    UNION ALL
    SELECT 'clients', created_at FROM clients
) data
GROUP BY table_name;
```

#### Step 2: Impact Assessment
- Determine affected data scope and user impact
- Identify last known good backup point
- Estimate data loss and recovery time

#### Step 3: Recovery Options
1. **Point-in-Time Recovery** (if corruption is recent):
```sql
-- Identify recovery point
SELECT id, started_at, backup_location
FROM backup_metadata
WHERE status = 'completed'
AND started_at < '[corruption_detected_time]'
ORDER BY started_at DESC
LIMIT 5;
```

2. **Partial Data Recovery** (if corruption is isolated):
```sql
-- Restore specific tables from backup
SELECT test_backup_restore([backup_id], false);
```

#### Step 4: Validation and Monitoring
- Run comprehensive data integrity checks
- Monitor application functionality
- Communicate status to affected users

### Complete Database Loss Response

**Severity Level: CRITICAL**
**Response Time: Immediate**

This is the most severe scenario requiring full disaster recovery implementation.

#### Step 1: Emergency Response Activation (0-15 minutes)
1. **Activate incident response team**
2. **Notify all stakeholders** using emergency communication plan
3. **Assess infrastructure status** and available resources
4. **Identify best recovery point** from available backups

#### Step 2: Infrastructure Recovery (15 minutes - 2 hours)
1. **Provision new database infrastructure**
   - Deploy new Supabase instance or use standby
   - Configure networking and security settings
   - Verify connectivity from application servers

2. **Prepare for data restoration**
   - Identify most recent complete backup
   - Verify backup integrity and accessibility
   - Calculate expected RPO (data loss window)

#### Step 3: Data Restoration (2-4 hours)
```sql
-- Execute full database restoration
SELECT simulate_disaster_recovery('complete_data_loss');
```

1. **Restore core schema** (projects, tasks, clients tables)
2. **Restore user data** from most recent backup
3. **Verify referential integrity** and data consistency
4. **Restore supporting tables** (metadata, configurations)

#### Step 4: Application Recovery (4-6 hours)
1. **Update connection strings** in application configuration
2. **Deploy application** to point to recovered database
3. **Run smoke tests** on core functionality
4. **Gradually restore user access**

#### Step 5: Post-Recovery Validation (Ongoing)
1. **Monitor system performance** and stability
2. **Validate data completeness** with business stakeholders
3. **Document lessons learned** and process improvements
4. **Update disaster recovery procedures** based on experience

---

## Task Migration Guide

### Pre-Migration Checklist

**Planning Phase (1 week before execution):**
- [ ] Review current task data structure and volume
- [ ] Identify peak and off-peak usage windows
- [ ] Coordinate with application development team
- [ ] Schedule maintenance window with stakeholders
- [ ] Prepare rollback procedures

**Technical Prerequisites:**
```sql
-- 1. Verify schema version
SELECT current_version FROM schema_version;

-- 2. Check data volume
SELECT 
    COUNT(DISTINCT id) as projects_with_tasks,
    SUM(jsonb_array_length(COALESCE(tasks, '[]'))) as total_tasks
FROM projects 
WHERE tasks IS NOT NULL;

-- 3. Validate current data integrity
SELECT 
    COUNT(*) as projects,
    COUNT(*) FILTER (WHERE tasks IS NOT NULL) as projects_with_tasks,
    AVG(jsonb_array_length(COALESCE(tasks, '[]'))) as avg_tasks_per_project
FROM projects;
```

### Migration Execution Steps

#### Step 1: Schema Preparation
```bash
# Execute schema migration scripts in order:
psql -f scripts/task-normalization-schema.sql
```

**Validation:**
```sql
SELECT * FROM migration_status;
-- Expected: migration_stage = 'READY_FOR_TASK_MIGRATION'
```

#### Step 2: Data Backup and Migration
```bash
# Execute data migration with monitoring
psql -f scripts/execute-task-migration.sql
```

**Monitor Progress:**
- Check migration session logs in real-time
- Validate each step completion
- Monitor system performance during migration

#### Step 3: Application Code Deployment
1. **Deploy new TaskContext** with normalized schema support
2. **Update database queries** to use tasks table instead of JSON
3. **Implement feature flags** to switch between old/new systems
4. **Test core functionality** with sample users

#### Step 4: Validation and Cutover
```sql
-- Validate migration completeness
SELECT * FROM validate_task_migration();

-- Test new task operations
SELECT * FROM get_user_tasks_with_context('[sample_user_id]', 10);

-- Verify performance improvements
SELECT * FROM test_backup_performance();
```

#### Step 5: Post-Migration Cleanup
**After 7 days of stable operation:**
```sql
-- Remove JSON task data from projects table (optional)
-- This should be done carefully and only after full validation
-- ALTER TABLE projects DROP COLUMN tasks; -- DO NOT RUN YET
```

### Rollback Procedures

If issues are discovered during migration:

```sql
-- Emergency rollback to previous schema version
SELECT rollback_migration('1.3.0');
SELECT rollback_migration('1.2.0');
SELECT rollback_migration('1.1.0');

-- Restore from JSON backup if needed
SELECT * FROM tasks_json_backup ORDER BY backed_up_at DESC LIMIT 10;
```

### Migration Success Criteria

- [ ] All tasks successfully migrated (0% data loss)
- [ ] Application functionality fully restored
- [ ] Query performance improved by >30%
- [ ] User experience remains unchanged or improved
- [ ] Backup and monitoring systems functioning normally

---

## Monitoring and Alerting

### Key Performance Indicators (KPIs)

#### Backup System Health
```sql
-- Daily KPI dashboard
SELECT 
    'backup_success_rate' as metric,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*),
        2
    ) as value,
    '%' as unit
FROM backup_metadata 
WHERE started_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'avg_backup_duration',
    ROUND(
        AVG(EXTRACT(MINUTES FROM completed_at - started_at))::numeric,
        1
    ),
    'minutes'
FROM backup_metadata 
WHERE status = 'completed' 
AND started_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'data_growth_rate',
    ROUND(
        (MAX(backup_size_bytes) - MIN(backup_size_bytes)) * 100.0 / MIN(backup_size_bytes),
        2
    ),
    '%'
FROM backup_metadata 
WHERE status = 'completed' 
AND started_at > NOW() - INTERVAL '30 days';
```

### Alert Thresholds

| Metric | Warning Threshold | Critical Threshold | Action Required |
|--------|-------------------|-------------------|-----------------|
| Last Backup Age | > 26 hours | > 48 hours | Check backup automation |
| Backup Failure Rate | > 5% | > 15% | Review backup infrastructure |
| Backup Duration | > 30 minutes | > 2 hours | Investigate performance |
| Storage Growth | > 50% monthly | > 100% monthly | Capacity planning |
| RTO Actual | > 6 hours | > 12 hours | Improve procedures |
| RPO Actual | > 2 hours | > 4 hours | Increase backup frequency |

### Automated Monitoring Setup

```sql
-- Create monitoring views for external systems
CREATE OR REPLACE VIEW backup_alerts AS
SELECT 
    'backup_overdue' as alert_type,
    'CRITICAL' as severity,
    'Last backup is ' || 
    EXTRACT(HOURS FROM NOW() - MAX(started_at))::TEXT || 
    ' hours old' as message,
    NOW() as alert_time
FROM backup_metadata 
WHERE backup_type = 'daily' 
AND status = 'completed'
HAVING MAX(started_at) < NOW() - INTERVAL '48 hours'

UNION ALL

SELECT 
    'high_failure_rate',
    'WARNING',
    'Backup failure rate: ' ||
    ROUND(COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*), 1)::TEXT || 
    '%' as message,
    NOW()
FROM backup_metadata 
WHERE started_at > NOW() - INTERVAL '7 days'
HAVING COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) > 5;
```

---

## Performance Tuning

### Database Optimization

#### Index Monitoring and Maintenance
```sql
-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Identify unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
AND schemaname = 'public'
AND pg_relation_size(indexname::regclass) > 1024 * 1024; -- > 1MB
```

#### Query Performance Analysis
```sql
-- Top slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows
FROM pg_stat_statements 
WHERE calls > 10
ORDER BY mean_time DESC 
LIMIT 20;

-- Lock analysis
SELECT 
    relation::regclass as table_name,
    mode,
    count(*) as lock_count
FROM pg_locks 
WHERE relation IS NOT NULL
GROUP BY relation, mode
ORDER BY lock_count DESC;
```

### Backup Performance Optimization

#### Storage I/O Optimization
```sql
-- Monitor backup I/O patterns
SELECT * FROM test_backup_performance();

-- Analyze storage performance
SELECT 
    backup_type,
    AVG(backup_size_bytes) as avg_size,
    AVG(EXTRACT(SECONDS FROM completed_at - started_at)) as avg_duration,
    AVG(backup_size_bytes / EXTRACT(SECONDS FROM completed_at - started_at)) as avg_throughput
FROM backup_metadata 
WHERE status = 'completed'
AND started_at > NOW() - INTERVAL '30 days'
GROUP BY backup_type;
```

#### Backup Strategy Optimization
Based on performance metrics:

1. **Small databases (< 100MB)**: Single-threaded backup, full daily backups
2. **Medium databases (100MB - 1GB)**: Parallel backup processes, incremental options
3. **Large databases (> 1GB)**: Advanced backup strategies, compression, archival policies

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Backup Process Hanging
**Symptoms**: Backup status stuck at 'in_progress' for >2 hours

**Diagnosis:**
```sql
-- Check for long-running transactions
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '1 hour';

-- Check for locks blocking backup
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Resolution:**
1. Identify blocking processes and resolve if safe
2. Cancel backup process and restart
3. Check Supabase system status and resource utilization

#### Issue: Migration Validation Failures
**Symptoms**: `validate_task_migration()` returns FAIL status

**Diagnosis:**
```sql
-- Detailed validation breakdown
SELECT 
    validation_check,
    expected_count,
    actual_count,
    (actual_count - expected_count) as difference
FROM validate_task_migration();

-- Check for orphaned or missing records
SELECT 
    'orphaned_tasks' as issue,
    COUNT(*) as count
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
    'user_mismatch',
    COUNT(*)
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE t.user_id != p.user_id;
```

**Resolution:**
1. Fix data inconsistencies identified in validation
2. Re-run migration for affected records
3. Consider rollback if issues are extensive

#### Issue: Poor Query Performance Post-Migration
**Symptoms**: Application response times >5 seconds after task migration

**Diagnosis:**
```sql
-- Check if statistics are up to date
SELECT 
    schemaname,
    tablename,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('tasks', 'projects', 'clients');

-- Verify index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM get_user_tasks_with_context('[user_id]', 50);
```

**Resolution:**
1. Update table statistics: `ANALYZE tasks;`
2. Verify indexes are being used efficiently
3. Consider additional indexes based on query patterns
4. Review and optimize complex queries

### Emergency Contacts

**Database Administrator (Primary)**: [Contact Information]
**DevOps Engineer (Secondary)**: [Contact Information]
**Application Lead (Tertiary)**: [Contact Information]

**Escalation Path:**
1. **L1 Response** (0-15 minutes): On-call engineer
2. **L2 Escalation** (15-30 minutes): Database team lead
3. **L3 Escalation** (30+ minutes): Engineering manager + CTO

### Communication Templates

#### Critical Issue Alert
```
SUBJECT: CRITICAL - Database Backup Failure - [TIMESTAMP]

Summary: [Brief description of issue]
Impact: [User/system impact assessment]
Current Status: [What's being done]
ETA for Resolution: [Estimated timeline]
Next Update: [When next update will be provided]

[Detailed technical information]
```

#### Recovery Completion Notice
```
SUBJECT: RESOLVED - Database Recovery Completed - [TIMESTAMP]

Summary: Database recovery has been successfully completed
Downtime: [Total downtime duration]
Data Loss: [RPO achieved - data loss window]
Validation: [Post-recovery validation results]
Lessons Learned: [Key improvements identified]

Full incident report will be available within 24 hours.
```

---

## Conclusion

This runbook provides comprehensive procedures for maintaining database operational excellence. Regular practice of these procedures, combined with continuous monitoring and improvement, ensures robust data protection and rapid recovery capabilities.

### Key Success Factors:
1. **Proactive Monitoring**: Daily health checks prevent small issues from becoming critical
2. **Regular Testing**: Weekly and monthly tests validate recovery procedures
3. **Clear Documentation**: Step-by-step procedures enable consistent execution
4. **Continuous Improvement**: Regular review and updates based on lessons learned

### Maintenance Schedule for This Document:
- **Monthly**: Review and update based on operational experience
- **Quarterly**: Full procedure validation and improvement
- **Annually**: Comprehensive disaster recovery strategy review

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Next Review**: [Monthly Review Date]  
**Document Owner**: Database Operations Team