-- Test directo para verificar que RLS funciona con usuario autenticado
-- Ejecutar en Supabase SQL Editor (debe estar logueado como usuario)

-- 1. Verificar usuario actual
SELECT auth.uid() as current_user_id;

-- 2. Verificar políticas actuales
SELECT 
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects';

-- 3. Verificar que RLS está habilitado
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'projects';

-- 4. Test de inserción directa (con usuario autenticado)
INSERT INTO public.projects (
    user_id,
    name,
    description,
    status,
    created_at
) VALUES (
    auth.uid(),
    'Test RLS Direct',
    'Testing RLS policy with direct SQL',
    'pending',
    NOW()
)
RETURNING id, name, user_id, created_at;

-- 5. Verificar que se puede leer el proyecto insertado
SELECT 
    id,
    name,
    user_id,
    created_at
FROM public.projects 
WHERE name = 'Test RLS Direct';

-- 6. Limpiar test (opcional)
-- DELETE FROM public.projects WHERE name = 'Test RLS Direct';