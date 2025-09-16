-- SOLUCIÓN DEFINITIVA: Configurar RLS correctamente de una vez por todas
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estado actual
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('projects', 'profiles');

-- 2. Limpiar todas las políticas existentes problemáticas
DROP POLICY IF EXISTS "Users can CRUD their own projects" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON projects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON projects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON projects;
DROP POLICY IF EXISTS "temp_allow_all" ON projects;

-- 3. Asegurar que RLS está habilitado
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 4. Crear UNA SOLA política simple y correcta
CREATE POLICY "authenticated_users_full_access_own_projects" ON projects
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Verificar que la política se creó correctamente
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- 6. Test directo de inserción (sustituye el UUID por tu user_id real)
-- INSERT INTO projects (user_id, name, description, status) 
-- VALUES (auth.uid(), 'Test Policy', 'Testing RLS policy', 'pending')
-- RETURNING *;

-- 7. Verificar que los usuarios pueden ver sus propios proyectos
-- SELECT * FROM projects WHERE user_id = auth.uid();

-- RESULTADO ESPERADO: 
-- - 1 política llamada "authenticated_users_full_access_own_projects"
-- - cmd = "ALL" 
-- - qual = "(auth.uid() = user_id)"
-- - with_check = "(auth.uid() = user_id)"