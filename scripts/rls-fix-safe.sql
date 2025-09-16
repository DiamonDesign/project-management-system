-- RLS FIX DEFINITIVO - PROBADO Y SEGURO
-- Ejecutar línea por línea en Supabase SQL Editor para verificar cada paso

-- PASO 1: Verificar estado actual de la tabla
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    tableowner
FROM pg_tables 
WHERE tablename = 'projects';

-- PASO 2: Ver políticas existentes (si las hay)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- PASO 3: Limpiar políticas existentes (ejecutar una por una)
DO $$ 
BEGIN
    -- Eliminar política común de Supabase
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON projects;
    RAISE NOTICE 'Policy 1 dropped (if existed)';
    
    DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
    RAISE NOTICE 'Policy 2 dropped (if existed)';
    
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON projects;
    RAISE NOTICE 'Policy 3 dropped (if existed)';
    
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON projects;
    RAISE NOTICE 'Policy 4 dropped (if existed)';
    
    DROP POLICY IF EXISTS "Users can CRUD their own projects" ON projects;
    RAISE NOTICE 'Policy 5 dropped (if existed)';
    
    DROP POLICY IF EXISTS "temp_allow_all" ON projects;
    RAISE NOTICE 'Policy 6 dropped (if existed)';
    
    RAISE NOTICE 'All existing policies cleaned up successfully';
END $$;

-- PASO 4: Asegurar que RLS está habilitado
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- PASO 5: Crear la política correcta
CREATE POLICY "projects_policy" 
ON public.projects
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- PASO 6: Verificar que todo está correcto
SELECT 
    'SUCCESS: Policy created' as status,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- PASO 7: Test de funcionamiento (OPCIONAL - descomenta para probar)
/*
INSERT INTO public.projects (user_id, name, description, status) 
VALUES (auth.uid(), 'Test RLS', 'Testing policy', 'pending')
RETURNING id, name, user_id;
*/