-- COMPREHENSIVE RLS FIX - All Tables P1-4 Solution
-- Ejecutar paso a paso en Supabase SQL Editor para verificar cada operación

-- ============================================
-- PASO 1: VERIFICAR ESTADO ACTUAL DE TODAS LAS TABLAS
-- ============================================

SELECT 
    'Current RLS Status' as step,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    tableowner
FROM pg_tables 
WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename;

-- ============================================
-- PASO 2: VER POLÍTICAS EXISTENTES EN TODAS LAS TABLAS
-- ============================================

SELECT 
    'Existing Policies' as step,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename, policyname;

-- ============================================
-- PASO 3: LIMPIAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================

DO $$ 
BEGIN
    -- PROJECTS table policies
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON projects;
    DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON projects;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON projects;
    DROP POLICY IF EXISTS "Users can CRUD their own projects" ON projects;
    DROP POLICY IF EXISTS "temp_allow_all" ON projects;
    DROP POLICY IF EXISTS "projects_policy" ON projects;
    DROP POLICY IF EXISTS "authenticated_users_full_access_own_projects" ON projects;
    RAISE NOTICE 'Projects policies cleaned up';
    
    -- CLIENTS table policies
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
    DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON clients;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON clients;
    DROP POLICY IF EXISTS "Users can CRUD their own clients" ON clients;
    DROP POLICY IF EXISTS "clients_policy" ON clients;
    RAISE NOTICE 'Clients policies cleaned up';
    
    -- PROFILES table policies
    DROP POLICY IF EXISTS "Users can view own profile only" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
    DROP POLICY IF EXISTS "profiles_policy" ON profiles;
    RAISE NOTICE 'Profiles policies cleaned up';
    
    -- CLIENT_PORTAL_USERS table policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON client_portal_users;
    DROP POLICY IF EXISTS "client_portal_users_policy" ON client_portal_users;
    RAISE NOTICE 'Client portal users policies cleaned up';
    
    RAISE NOTICE 'All existing policies cleaned up successfully';
END $$;

-- ============================================
-- PASO 4: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 5: CREAR POLÍTICAS CORRECTAS Y CONSISTENTES
-- ============================================

-- PROJECTS: Users can only access their own projects
CREATE POLICY "projects_user_access" 
ON public.projects
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CLIENTS: Users can only access their own clients
CREATE POLICY "clients_user_access" 
ON public.clients
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- PROFILES: Users can only access their own profile
CREATE POLICY "profiles_user_access" 
ON public.profiles
FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- CLIENT_PORTAL_USERS: Users can only access their own portal mapping
CREATE POLICY "client_portal_users_access" 
ON public.client_portal_users
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PASO 6: VERIFICAR QUE TODAS LAS POLÍTICAS SE CREARON CORRECTAMENTE
-- ============================================

SELECT 
    'SUCCESS: Policies Created' as status,
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename, policyname;

-- ============================================
-- PASO 7: VERIFICAR ESTADO FINAL DE RLS
-- ============================================

SELECT 
    'Final RLS Status' as step,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE pg_policies.tablename = pg_tables.tablename
    ) as policy_count
FROM pg_tables 
WHERE tablename IN ('projects', 'clients', 'profiles', 'client_portal_users')
ORDER BY tablename;

-- ============================================
-- PASO 8: TEST DE FUNCIONAMIENTO (OPCIONAL - descomenta para probar)
-- ============================================

/*
-- Test Projects table
INSERT INTO public.projects (user_id, name, description, status) 
VALUES (auth.uid(), 'Test RLS Projects', 'Testing RLS policy', 'pending')
RETURNING id, name, user_id;

-- Test Clients table  
INSERT INTO public.clients (user_id, name, email) 
VALUES (auth.uid(), 'Test RLS Client', 'test@example.com')
RETURNING id, name, user_id;

-- Verify data isolation
SELECT 'Projects Count' as test, COUNT(*) as count FROM public.projects WHERE user_id = auth.uid();
SELECT 'Clients Count' as test, COUNT(*) as count FROM public.clients WHERE user_id = auth.uid();
SELECT 'Profile Access' as test, COUNT(*) as count FROM public.profiles WHERE id = auth.uid();
*/

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- ✅ 4 tablas con RLS habilitado
-- ✅ 1 política por tabla con nombres descriptivos:
--    - projects_user_access
--    - clients_user_access  
--    - profiles_user_access
--    - client_portal_users_access
-- ✅ Todas las políticas usan auth.uid() consistentemente
-- ✅ Políticas FOR ALL con USING y WITH CHECK idénticos
-- ✅ Acceso restringido por user_id (id para profiles)