# 🚨 MIGRACIÓN CRÍTICA REQUERIDA - INSTRUCCIONES MANUALES

## 📋 RESUMEN DEL PROBLEMA

**CAUSA RAÍZ IDENTIFICADA:** La página "tareas" muestra error porque el código frontend está intentando consultar una tabla `tasks` que NO existe en la base de datos.

**ESTADO ACTUAL:**
- ❌ Tabla `tasks` no existe (Error: PGRST205)
- ✅ Tabla `projects` existe pero está configurada para JSON tasks
- ❌ Sistema de migración no configurado

**IMPACTO:** La funcionalidad de tareas está completamente no operativa.

---

## 🎯 SOLUCIÓN: MIGRACIÓN MANUAL EN SUPABASE DASHBOARD

### PASO 1: Acceder a Supabase Dashboard

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto: `nktdqpzxzouxcsvmijvt`
4. Ve a **SQL Editor** en el menú lateral

### PASO 2: Ejecutar Scripts de Migración en Orden

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