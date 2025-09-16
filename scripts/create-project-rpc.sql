-- Función RPC para crear proyectos (bypassa posibles problemas de RLS)
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION create_project(
  project_name TEXT,
  project_description TEXT DEFAULT '',
  project_status TEXT DEFAULT 'pending',
  project_due_date DATE DEFAULT NULL,
  project_client_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_project_id UUID;
  current_user_id UUID;
BEGIN
  -- Obtener el usuario actual autenticado
  current_user_id := auth.uid();
  
  -- Verificar que el usuario está autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Insertar el proyecto
  INSERT INTO projects (
    user_id,
    name,
    description,
    status,
    due_date,
    client_id,
    created_at
  ) VALUES (
    current_user_id,
    project_name,
    project_description,
    project_status,
    project_due_date,
    project_client_id,
    NOW()
  ) RETURNING id INTO new_project_id;
  
  RETURN new_project_id;
END;
$$;

-- Dar permisos a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_project TO authenticated;

-- Test de la función (opcional - sustituye por tu user_id real)
-- SELECT create_project('Test RPC Project', 'Creado via RPC function', 'pending');