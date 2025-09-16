-- Check existing tables in the database
-- Execute this first in Supabase SQL Editor to see what tables exist

-- 1. List all tables in the public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check if specific tables exist
SELECT
  'client_portal_access' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_portal_access'
  ) THEN 'EXISTS' ELSE 'DOES NOT EXIST' END as status
UNION ALL
SELECT
  'project_client_assignments' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'project_client_assignments'
  ) THEN 'EXISTS' ELSE 'DOES NOT EXIST' END as status
UNION ALL
SELECT
  'client_portal_users' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_portal_users'
  ) THEN 'EXISTS' ELSE 'DOES NOT EXIST' END as status;

-- 3. Check existing constraints for main tables
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('projects', 'clients', 'tasks', 'notes', 'profiles', 'client_portal_users')
ORDER BY tc.table_name, tc.constraint_type;