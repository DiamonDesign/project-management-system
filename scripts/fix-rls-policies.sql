-- Solución temporal: Desactivar RLS para debugging
-- SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN

-- Verificar políticas actuales
SELECT * FROM pg_policies WHERE tablename = 'projects';

-- Opción 1: Desactivar RLS temporalmente para debugging
-- ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Opción 2: Crear política permisiva temporal
-- DROP POLICY IF EXISTS "temp_allow_all" ON projects;
-- CREATE POLICY "temp_allow_all" ON projects FOR ALL USING (true);

-- Opción 3: Política específica para usuarios autenticados
DROP POLICY IF EXISTS "Users can CRUD their own projects" ON projects;
CREATE POLICY "Users can CRUD their own projects" ON projects 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Verificar que la política se aplicó
SELECT * FROM pg_policies WHERE tablename = 'projects';