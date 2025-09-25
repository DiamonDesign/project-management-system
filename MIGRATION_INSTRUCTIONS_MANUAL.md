# 🚨 MIGRACIÓN CRÍTICA REQUERIDA - INSTRUCCIONES MANUALES

## 📋 RESUMEN DEL PROBLEMA

**CAUSA RAÍZ IDENTIFICADA:** La página "tareas" muestra error porque el código frontend está intentando consultar una tabla `tasks` que NO existe en la base de datos.

**ESTADO ACTUAL:**
- ❌ Tabla `tasks` no existe (Error: PGRST205)
- ✅ Tabla `projects` existe pero está configurada para JSON tasks
- ❌ Sistema de migración no configurado

**IMPACTO:** La funcionalidad de tareas está completamente no operativa.

**🔧 ÚLTIMA ACTUALIZACIÓN:** Script de migración corregido - eliminada ambigüedad de variable `current_version`.

---

## 🎯 SOLUCIÓN: MIGRACIÓN MANUAL EN SUPABASE DASHBOARD

### PASO 1: Acceder a Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto: `nktdqpzxzouxcsvmijvt`
4. Ve a **SQL Editor** en el menú lateral

### PASO 2A: OPCIÓN RÁPIDA (RECOMENDADA)

**Si solo quieres que funcione rápidamente:**

```sql
-- Ejecuta este script único: scripts/quick-migration-fix.sql
-- Crea la tabla tasks directamente sin migración de datos
-- ✅ Más simple y seguro
```

### PASO 2B: MIGRACIÓN COMPLETA (Para proyectos con datos existentes)

**Para migrar datos existentes de JSON a tabla relacional:**

**⚠️ IMPORTANTE:** Ejecuta estos scripts EN EL ORDEN EXACTO indicado.

#### Script 1: Configurar Sistema de Migración
```sql
-- Ejecutar primero: scripts/task-normalization-schema.sql
-- Copia y pega el contenido completo del archivo
```

#### Script 2: Configurar Backup Strategy
```sql
-- Ejecutar segundo: scripts/migration-backup-strategy.sql
-- Copia y pega el contenido completo del archivo
```

#### Script 3: Ejecutar Migración Principal
```sql
-- Ejecutar tercero: scripts/execute-task-migration.sql
-- Copia y pega el contenido completo del archivo
-- NOTA: Si obtienes error "column reference current_version is ambiguous"
-- usa la versión corregida del script que resuelve la ambigüedad de variables
```

#### Script 4: Optimización Post-Migración
```sql
-- Ejecutar cuarto: scripts/post-migration-performance-optimization.sql
-- Copia y pega el contenido completo del archivo
```

### PASO 3: Verificación Post-Migración

Después de ejecutar todos los scripts, ejecuta esto para verificar:

```sql
-- Verificar que la tabla tasks existe
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;

-- Verificar migración registrada
SELECT version, description, applied_at
FROM schema_migrations
ORDER BY applied_at DESC;

-- Verificar RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'tasks';
```

**RESULTADO ESPERADO:**
- Tabla `tasks` con columnas: id, title, description, status, etc.
- Registros en `schema_migrations`
- Políticas RLS configuradas

---

## 🔧 ALTERNATIVA: MIGRACIÓN AUTOMATIZADA CON SERVICE ROLE KEY

Si tienes acceso al `SUPABASE_SERVICE_ROLE_KEY`:

1. Añádelo al archivo `.env`:
```bash
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

2. Ejecuta el script automatizado:
```bash
node scripts/run-migration.js
```

---

## 🛠️ SOLUCIÓN DE PROBLEMAS COMUNES

### Error: "column reference current_version is ambiguous"

**Causa:** Conflicto entre variable PL/pgSQL y nombre de columna en el script de migración.

**Solución:**
1. El error ha sido corregido en la versión actual del script
2. Si usas una versión anterior, reemplaza todas las instancias de la variable `current_version` por `schema_version_val` en el script de migración

**Scripts afectados:**
- `execute-task-migration.sql` (ya corregido)

### Error: "Migration validation failed - check results above"

**Causa:** Las funciones de migración no están creadas porque los scripts previos no se ejecutaron.

**Solución Rápida:**
1. Ejecuta `scripts/quick-migration-fix.sql` - Crea tabla tasks directamente
2. O sigue el orden completo: schema → backup → migration

**Scripts para diagnosticar:**
- `scripts/migration-diagnosis.sql` - Muestra qué falta exactamente

### Error: "relation does not exist"

**Causa:** Los scripts deben ejecutarse en el orden exacto indicado.

**Solución:**
1. Ejecuta primero `task-normalization-schema.sql`
2. Luego `migration-backup-strategy.sql`
3. Finalmente `execute-task-migration.sql`

---

## 📊 ARCHIVOS INVOLUCRADOS

- `scripts/MIGRATION_EXECUTION_PLAN.sql` - Plan maestro completo
- `scripts/task-normalization-schema.sql` - Schema principal
- `scripts/execute-task-migration.sql` - Migración principal
- `scripts/migration-backup-strategy.sql` - Sistema de backup
- `scripts/post-migration-performance-optimization.sql` - Optimización

---

## ⚡ URGENCIA: ALTA

Esta migración es **CRÍTICA** para restaurar la funcionalidad completa de la aplicación. Sin ella, la página de tareas permanecerá inoperativa.

**TIEMPO ESTIMADO:** 15-30 minutos de ejecución manual

**PRÓXIMOS PASOS DESPUÉS DE LA MIGRACIÓN:**
1. Verificar que la página "tareas" funciona correctamente
2. Continuar con las correcciones restantes (WebSocket conflicts, limpieza de logs)
3. Testing completo de funcionalidad de tasks

---

📧 **¿Necesitas ayuda?** Si encuentras errores durante la migración, guarda los mensajes de error exactos para troubleshooting.