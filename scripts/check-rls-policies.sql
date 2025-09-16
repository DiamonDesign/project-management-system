-- Verificar políticas RLS en la tabla projects
-- Ejecutar esto en Supabase SQL Editor

-- 1. Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects';

-- 2. Ver todas las políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- 3. Verificar estructura de la tabla
\d projects;

-- 4. Probar inserción directa (sustituye el user_id por tu ID real)
INSERT INTO projects (
    user_id,
    name,
    description,
    status,
    due_date,
    client_id
) VALUES (
    '59e49b27-57ec-4a29-919d-21e856ed6ed0', -- Tu user_id real
    'Test Project',
    'Test from SQL',
    'pending',
    null,
    null
) RETURNING *;