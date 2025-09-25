# DATABASE OPERATIONS RUNBOOK
## PROYECTO MANAGEMENT SYSTEM - SUPABASE POSTGRESQL

**Versión**: 2.0
**Fecha de Actualización**: 2025-01-11
**Responsable**: Database Administration Team
**Aplicación**: React Project Management System

---

## 📋 ÍNDICE

1. [Información General del Sistema](#información-general-del-sistema)
2. [Procedimientos de Migración](#procedimientos-de-migración)
3. [Backup y Disaster Recovery](#backup-y-disaster-recovery)
4. [Monitoreo y Alertas](#monitoreo-y-alertas)
5. [Optimización de Performance](#optimización-de-performance)
6. [Seguridad y RLS](#seguridad-y-rls)
7. [Procedimientos de Emergencia](#procedimientos-de-emergencia)
8. [Mantenimiento Rutinario](#mantenimiento-rutinario)
9. [Troubleshooting](#troubleshooting)
10. [Contactos y Escalación](#contactos-y-escalación)

---

## 🗄️ INFORMACIÓN GENERAL DEL SISTEMA

### Arquitectura de Base de Datos

**Plataforma**: Supabase PostgreSQL 15+
**Región Principal**: us-east-1
**Tipo de Aplicación**: React SPA con TypeScript
**Patrón de Acceso**: Multi-tenant por usuario

### Esquemas Principales

```sql
-- Esquemas de datos
public.profiles            → Perfiles de usuario (1:1 con auth.users)
public.projects            → Proyectos principales
public.clients             → Gestión de clientes
public.client_portal_users → Junction table para acceso portal
public.tasks               → Tareas normalizadas (POST-MIGRACIÓN)

-- Esquemas operacionales
monitoring.*               → Sistema de monitoreo
migration_backups.*        → Backups específicos de migración
audit.*                    → Logs de auditoría de seguridad
```

### Métricas de Capacidad Actuales

| Métrica | Valor Típico | Threshold Warning | Threshold Critical |
|---------|--------------|-------------------|-------------------|
| Tamaño BD | < 2GB | 2GB | 5GB |
| Conexiones Activas | < 20 | 75% max_conn | 90% max_conn |
| Cache Hit Ratio | > 95% | < 95% | < 90% |
| Query Response | < 100ms | > 500ms | > 2s |

---

## 🚀 PROCEDIMIENTOS DE MIGRACIÓN

### PRE-REQUISITOS DE MIGRACIÓN

**Antes de ejecutar cualquier migración:**

1. **Validación del Entorno**:
   ```sql
   \i scripts/pre-migration-validation.sql
   ```

2. **Verificación de Permisos**:
   - Usuario con privilegios `postgres` o `supabase_admin`
   - Acceso de escritura al directorio de backups
   - Ventana de mantenimiento de 2-4 horas programada

3. **Backup Completo Pre-Migración**:
   ```sql
   SELECT * FROM migration_backups.create_full_pre_migration_backup(gen_random_uuid());
   ```

### EJECUTAR MIGRACIÓN DE NORMALIZACIÓN DE TASKS

**⚠️ ADVERTENCIA: Solo ejecutar en ventana de mantenimiento**

#### Paso 1: Preparación
```bash
# 1. Verificar estado del sistema
psql -h [supabase-host] -U postgres -d postgres -f scripts/pre-migration-validation.sql

# 2. Confirmar que no hay conexiones activas críticas
SELECT pid, usename, application_name, state
FROM pg_stat_activity
WHERE backend_type = 'client backend' AND state = 'active';
```

#### Paso 2: Ejecutar Migración Principal
```bash
# Ejecutar migración mejorada con validación completa
psql -h [supabase-host] -U postgres -d postgres -f scripts/enhanced-task-migration.sql
```

**Tiempo Estimado**: 15-45 minutos (depende del volumen de datos)

#### Paso 3: Validación Post-Migración
```sql
-- Verificar integridad de datos
SELECT * FROM validate_task_migration_enhanced();

-- Verificar performance
SELECT * FROM get_user_tasks_optimized(
    (SELECT id FROM auth.users LIMIT 1),
    NULL, NULL, NULL, FALSE, 10
);
```

### ROLLBACK DE MIGRACIÓN

**En caso de fallos críticos:**

```sql
-- 1. Verificar plan de rollback
SELECT * FROM migration_backups.create_rollback_plan('[migration-id]');

-- 2. Ejecutar rollback automático (SI EXISTE BACKUP)
BEGIN;
-- Ejecutar pasos del plan de rollback manualmente
-- NUNCA hacer rollback automático en producción sin supervisión
ROLLBACK; -- Solo para testing del plan
```

**⚠️ IMPORTANTE**: El rollback destruye datos post-migración. Solo usar en emergencias críticas.

---

## 💾 BACKUP Y DISASTER RECOVERY

### ESTRATEGIA DE BACKUP

#### Backups Automáticos (Supabase)
- **Point-in-Time Recovery**: 7 días (mínimo)
- **Snapshots Diarios**: Retención 30 días
- **Snapshots Semanales**: Retención 12 semanas
- **Snapshots Mensuales**: Retención 12 meses

#### Backups Manuales Pre-Migración
```sql
-- Crear backup específico de migración
SELECT migration_id, backup_type, status, backup_size, checksum
FROM migration_backups.create_full_pre_migration_backup(gen_random_uuid());
```

#### Verificación de Integridad de Backup
```sql
-- Verificar backup más reciente
SELECT * FROM migration_backups.verify_backup_integrity(
    '[migration-uuid]',
    'pre_migration_full'
);
```

### PROCEDIMIENTOS DE DISASTER RECOVERY

#### RTO (Recovery Time Objective): 4 horas
#### RPO (Recovery Point Objective): 1 hora

#### Escenario 1: Corrupción de Datos Post-Migración
```sql
-- 1. Evaluar alcance del daño
SELECT * FROM monitoring.collect_system_health_metrics()
WHERE metric_category = 'migration';

-- 2. Decidir entre rollback o reparación de datos
-- 3. Si rollback: seguir procedimiento de rollback de migración
-- 4. Si reparación: usar backup parcial y re-ejecutar migración incremental
```

#### Escenario 2: Fallo Total de Base de Datos
```bash
# 1. Activar instancia de backup (Supabase Dashboard)
# 2. Restaurar desde point-in-time más reciente
# 3. Verificar integridad de datos restaurados
# 4. Reconfigurar aplicación con nueva URL de BD
# 5. Validar funcionalidad completa
```

---

## 📊 MONITOREO Y ALERTAS

### SISTEMA DE MONITOREO CONTINUO

#### Ejecutar Ciclo de Monitoreo Completo
```sql
-- Ejecutar manualmente (cada 5 minutos en producción)
SELECT * FROM monitoring.run_monitoring_cycle();
```

#### Dashboard de Salud del Sistema
```sql
-- Vista en tiempo real de todas las métricas
SELECT * FROM monitoring.system_health_dashboard
ORDER BY status, category;
```

#### Métricas Críticas a Monitorear

1. **Database Size Growth**
   ```sql
   SELECT metric_value, status, recommendation
   FROM monitoring.system_health_dashboard
   WHERE metric_name = 'database_size_mb';
   ```

2. **Connection Pool Usage**
   ```sql
   SELECT current_value, threshold_warning, status
   FROM monitoring.system_health_dashboard
   WHERE metric_name = 'active_connections';
   ```

3. **Query Performance**
   ```sql
   SELECT * FROM query_performance_summary
   WHERE avg_execution_time > 1000; -- Queries > 1s
   ```

### CONFIGURACIÓN DE ALERTAS

#### Niveles de Alerta
- **INFO**: Métricas informativas, no requieren acción
- **WARNING**: Atención requerida en 24-48 horas
- **CRITICAL**: Acción inmediata requerida (< 1 hora)

#### Procesamiento de Alertas
```sql
-- Generar alertas basadas en métricas actuales
SELECT alert_level, alert_message, action_required
FROM monitoring.process_alerts()
WHERE alert_level IN ('warning', 'critical');
```

---

## ⚡ OPTIMIZACIÓN DE PERFORMANCE

### ANÁLISIS DE PERFORMANCE POST-MIGRACIÓN

#### Verificar Uso de Índices
```sql
-- Analizar eficiencia de índices
SELECT * FROM analyze_index_usage()
WHERE recommendation LIKE '%UNUSED%' OR usage_efficiency < 50;
```

#### Refresh de Vistas Materializadas
```sql
-- Actualizar estadísticas agregadas (cada hora)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
```

### CONNECTION POOL OPTIMIZATION

#### Monitoreo de Connection Pool
```sql
-- Estado actual del pool de conexiones
SELECT * FROM get_connection_pool_health();
```

---

## 🔐 SEGURIDAD Y RLS

### VALIDACIÓN DE SEGURIDAD POST-MIGRACIÓN

#### Verificar Políticas RLS
```sql
-- Confirmar que RLS está habilitado y funcionando
SELECT * FROM test.validate_task_security_policies();
```

#### Monitoreo de Violaciones de Seguridad
```sql
-- Dashboard de seguridad en tiempo real
SELECT * FROM security_monitoring_dashboard;
```

---

## 🚨 PROCEDIMIENTOS DE EMERGENCIA

### EMERGENCIA NIVEL 1: FALLA CRÍTICA DE APLICACIÓN

**Síntomas**: Aplicación inaccesible, errores 500, timeout de conexiones

**Acciones Inmediatas** (15 minutos):
1. **Verificar Connection Pool**:
   ```sql
   SELECT * FROM get_connection_pool_alerts();
   ```

2. **Liberar Conexiones Colgadas**:
   ```sql
   -- Matar consultas que llevan > 10 minutos
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE now() - query_start > INTERVAL '10 minutes'
   AND backend_type = 'client backend';
   ```

### EMERGENCIA NIVEL 2: PÉRDIDA DE DATOS

**Síntomas**: Datos faltantes, inconsistencias

**Acciones Inmediatas** (30 minutos):
1. **Evaluar Alcance**:
   ```sql
   -- Verificar integridad de tasks
   SELECT * FROM validate_task_migration_enhanced();
   ```

2. **Point-in-Time Recovery via Supabase Dashboard**

---

## 🛠️ MANTENIMIENTO RUTINARIO

### TAREAS DIARIAS (Automatizadas)

#### Monitoreo Automatizado (Cada 5 minutos)
```bash
# Cron job recomendado
*/5 * * * * psql -c "SELECT * FROM monitoring.run_monitoring_cycle();"
```

### TAREAS SEMANALES

#### Performance Review
```sql
-- Revisar tendencias de performance semanal
SELECT * FROM monitoring.system_trends
WHERE hour > NOW() - INTERVAL '7 days';
```

### TAREAS MENSUALES

#### Capacity Planning
```sql
-- Análisis de crecimiento de datos
SELECT
    DATE_TRUNC('month', measured_at) as month,
    AVG(metric_value) as avg_db_size_mb
FROM monitoring.system_health_metrics
WHERE metric_name = 'database_size_mb'
AND measured_at > NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', measured_at)
ORDER BY month;
```

---

## 🔧 TROUBLESHOOTING

### PROBLEMAS COMUNES POST-MIGRACIÓN

#### 1. Queries Lentas en Tasks
**Síntoma**: Aplicación lenta al cargar tasks
```sql
-- Diagnóstico
EXPLAIN ANALYZE SELECT * FROM get_user_tasks_optimized('[user-id]');

-- Solución: Verificar índices
SELECT * FROM analyze_index_usage() WHERE table_name = 'tasks';
```

#### 2. Connection Pool Exhaustion
**Síntoma**: "remaining connection slots are reserved" errors
```sql
-- Diagnóstico
SELECT * FROM get_connection_pool_health();

-- Solución: Liberar conexiones idle
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';
```

---

## 📞 CONTACTOS Y ESCALACIÓN

### NIVELES DE ESCALACIÓN

#### Nivel 1: Database Administrator
- **Responsabilidad**: Operaciones rutinarias, monitoreo
- **SLA**: Respuesta en 4 horas

#### Nivel 2: Senior DBA / DevOps Lead
- **Responsabilidad**: Problemas de performance, emergencias
- **SLA**: Respuesta en 1 hora

#### Nivel 3: CTO / Arquitecto
- **Responsabilidad**: Emergencias críticas, brechas de seguridad
- **SLA**: Respuesta en 30 minutos

### CRITERIOS DE ESCALACIÓN

#### Escalar a Nivel 2 si:
- Connection pool > 90% durante > 15 minutos
- Query performance degradado > 2x baseline
- Migration health score < 85%

#### Escalar a Nivel 3 si:
- Database completamente inaccesible > 5 minutos
- Pérdida de datos confirmada
- Brecha de seguridad confirmada

---

## 📋 CHECKLISTS DE VERIFICACIÓN

### CHECKLIST PRE-MIGRACIÓN
- [ ] Backup completo verificado y testado
- [ ] Ventana de mantenimiento confirmada
- [ ] Scripts validados en staging
- [ ] Plan de rollback documentado
- [ ] Equipo de soporte en standby

### CHECKLIST POST-MIGRACIÓN
- [ ] Validación de integridad completada
- [ ] Performance benchmarks aprobados
- [ ] Security validation passed
- [ ] Aplicación funcionando normalmente
- [ ] Monitoreo configurado y activo

### CHECKLIST SEMANAL DE SALUD
- [ ] System health dashboard revisado
- [ ] Alertas evaluadas y resueltas
- [ ] Backup status verificado
- [ ] Performance trends analizados
- [ ] Security audit log revisado

---

**Fin del Runbook - Versión 2.0**

*Este documento debe ser actualizado después de cada cambio mayor en la infraestructura.*