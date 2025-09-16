-- ============================================================================
-- SECURITY RPC FUNCTIONS
-- Database functions to support enhanced security operations
-- Execute after implementing enhanced RLS policies
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: Log Security Audit Events
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_security_audit_event(
    event_type text,
    event_data jsonb DEFAULT '{}'::jsonb,
    ip_address text DEFAULT NULL,
    user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Insert audit event
    INSERT INTO public.security_audit_log (
        user_id,
        table_name,
        operation,
        record_id,
        new_values,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        current_user_id,
        'security_events',
        event_type,
        (event_data->>'resource_id')::uuid,
        event_data,
        ip_address::inet,
        user_agent,
        COALESCE(event_data->>'session_id', 'unknown')
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the calling operation
        RAISE WARNING 'Security audit logging failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_security_audit_event(text, jsonb, text, text) TO authenticated;

-- ============================================================================
-- FUNCTION 2: Validate User Role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_user_role_rpc(
    user_id_param uuid DEFAULT NULL,
    required_role text DEFAULT 'freelancer'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
    user_role text;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    -- Check if user is requesting their own role or if they're admin
    IF target_user_id != auth.uid() AND NOT auth.validate_user_role('admin') THEN
        RETURN false;
    END IF;
    
    -- Get user role from profiles
    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = target_user_id;
    
    -- Return true if role matches
    RETURN COALESCE(user_role, 'freelancer') = required_role;
EXCEPTION
    WHEN OTHERS THEN
        -- Log security event for failed role validation
        PERFORM public.log_security_audit_event(
            'role_validation_error',
            jsonb_build_object(
                'target_user_id', target_user_id,
                'required_role', required_role,
                'error', SQLERRM
            )
        );
        RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_user_role_rpc(uuid, text) TO authenticated;

-- ============================================================================
-- FUNCTION 3: Check Client Portal Project Access
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_client_project_access_rpc(
    project_id uuid,
    user_id_param uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
    project_client_id uuid;
    is_active boolean;
    token_valid boolean;
BEGIN
    -- Use provided user_id or current user
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    -- Only allow users to check their own access or admins to check any access
    IF target_user_id != auth.uid() AND NOT auth.validate_user_role('admin') THEN
        RETURN false;
    END IF;
    
    -- Get project's client_id (this will respect RLS policies)
    SELECT p.client_id INTO project_client_id
    FROM public.projects p
    WHERE p.id = project_id;
    
    -- If no project found or no client assigned, access denied
    IF project_client_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user has active client portal access
    SELECT 
        cpu.is_active,
        (cpu.token_expires_at IS NULL OR cpu.token_expires_at > now())
    INTO is_active, token_valid
    FROM public.client_portal_users cpu
    WHERE cpu.user_id = target_user_id 
    AND cpu.client_id = project_client_id;
    
    -- Return true if active and token is valid
    RETURN COALESCE(is_active, false) AND COALESCE(token_valid, false);
EXCEPTION
    WHEN OTHERS THEN
        -- Log security event for failed access validation
        PERFORM public.log_security_audit_event(
            'project_access_validation_error',
            jsonb_build_object(
                'project_id', project_id,
                'user_id', target_user_id,
                'error', SQLERRM
            )
        );
        RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_client_project_access_rpc(uuid, uuid) TO authenticated;

-- ============================================================================
-- FUNCTION 4: Get User Security Context
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_security_context_rpc()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    user_profile record;
    security_context jsonb;
    client_portal_access boolean;
    active_sessions integer;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'No authenticated user');
    END IF;
    
    -- Get user profile information
    SELECT * INTO user_profile
    FROM public.profiles
    WHERE id = current_user_id;
    
    -- Check if user is a client portal user
    SELECT COUNT(*) > 0 INTO client_portal_access
    FROM public.client_portal_users
    WHERE user_id = current_user_id AND is_active = true;
    
    -- Get active session count (approximate)
    SELECT 1 INTO active_sessions; -- Simplified for now
    
    -- Build security context
    security_context := jsonb_build_object(
        'user_id', current_user_id,
        'role', COALESCE(user_profile.role, 'freelancer'),
        'is_client_portal_user', client_portal_access,
        'is_locked', COALESCE(user_profile.is_locked, false),
        'failed_login_attempts', COALESCE(user_profile.failed_login_attempts, 0),
        'last_login', user_profile.last_login,
        'login_count', COALESCE(user_profile.login_count, 0),
        'password_changed_at', user_profile.password_changed_at,
        'active_sessions', active_sessions,
        'security_clearance', COALESCE(user_profile.security_clearance, 'normal'),
        'context_generated_at', now()
    );
    
    -- Log security context access
    PERFORM public.log_security_audit_event(
        'security_context_accessed',
        jsonb_build_object('user_id', current_user_id)
    );
    
    RETURN security_context;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and return error context
        PERFORM public.log_security_audit_event(
            'security_context_error',
            jsonb_build_object(
                'user_id', current_user_id,
                'error', SQLERRM
            )
        );
        RETURN jsonb_build_object('error', 'Failed to get security context');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_security_context_rpc() TO authenticated;

-- ============================================================================
-- FUNCTION 5: Update Security Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_security_metrics_rpc(
    login_success boolean DEFAULT true,
    ip_address text DEFAULT NULL,
    user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN;
    END IF;
    
    IF login_success THEN
        -- Successful login: update metrics and reset failed attempts
        UPDATE public.profiles
        SET 
            last_login = now(),
            login_count = COALESCE(login_count, 0) + 1,
            failed_login_attempts = 0,
            is_locked = false
        WHERE id = current_user_id;
        
        -- Log successful login
        PERFORM public.log_security_audit_event(
            'login_success',
            jsonb_build_object(
                'user_id', current_user_id,
                'ip_address', ip_address,
                'user_agent', user_agent
            ),
            ip_address,
            user_agent
        );
    ELSE
        -- Failed login: increment failed attempts
        UPDATE public.profiles
        SET 
            failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
            -- Lock account after 5 failed attempts
            is_locked = CASE 
                WHEN COALESCE(failed_login_attempts, 0) + 1 >= 5 THEN true 
                ELSE is_locked 
            END
        WHERE id = current_user_id;
        
        -- Log failed login attempt
        PERFORM public.log_security_audit_event(
            'login_failure',
            jsonb_build_object(
                'user_id', current_user_id,
                'failed_attempts', (SELECT failed_login_attempts FROM public.profiles WHERE id = current_user_id),
                'account_locked', (SELECT is_locked FROM public.profiles WHERE id = current_user_id),
                'ip_address', ip_address,
                'user_agent', user_agent
            ),
            ip_address,
            user_agent
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        PERFORM public.log_security_audit_event(
            'security_metrics_update_error',
            jsonb_build_object(
                'user_id', current_user_id,
                'error', SQLERRM
            )
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_security_metrics_rpc(boolean, text, text) TO authenticated;

-- ============================================================================
-- FUNCTION 6: Get Security Dashboard Data (Admin Only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_security_dashboard_rpc()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    dashboard_data jsonb;
    total_users integer;
    active_users integer;
    locked_users integer;
    recent_logins integer;
    failed_attempts integer;
    security_events integer;
BEGIN
    -- Check if user is admin
    IF NOT auth.validate_user_role('admin') THEN
        RETURN jsonb_build_object('error', 'Insufficient privileges');
    END IF;
    
    -- Get user statistics
    SELECT COUNT(*) INTO total_users FROM public.profiles;
    SELECT COUNT(*) INTO active_users FROM public.profiles WHERE last_login > now() - interval '7 days';
    SELECT COUNT(*) INTO locked_users FROM public.profiles WHERE is_locked = true;
    SELECT COUNT(*) INTO recent_logins FROM public.profiles WHERE last_login > now() - interval '24 hours';
    
    -- Get security metrics
    SELECT SUM(failed_login_attempts) INTO failed_attempts FROM public.profiles;
    SELECT COUNT(*) INTO security_events 
    FROM public.security_audit_log 
    WHERE created_at > now() - interval '24 hours';
    
    -- Build dashboard data
    dashboard_data := jsonb_build_object(
        'user_metrics', jsonb_build_object(
            'total_users', COALESCE(total_users, 0),
            'active_users_7d', COALESCE(active_users, 0),
            'locked_users', COALESCE(locked_users, 0),
            'recent_logins_24h', COALESCE(recent_logins, 0)
        ),
        'security_metrics', jsonb_build_object(
            'total_failed_attempts', COALESCE(failed_attempts, 0),
            'security_events_24h', COALESCE(security_events, 0)
        ),
        'generated_at', now(),
        'generated_by', auth.uid()
    );
    
    -- Log dashboard access
    PERFORM public.log_security_audit_event(
        'security_dashboard_accessed',
        jsonb_build_object('admin_user_id', auth.uid())
    );
    
    RETURN dashboard_data;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        PERFORM public.log_security_audit_event(
            'security_dashboard_error',
            jsonb_build_object(
                'admin_user_id', auth.uid(),
                'error', SQLERRM
            )
        );
        RETURN jsonb_build_object('error', 'Failed to generate dashboard data');
END;
$$;

-- Grant execute permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.get_security_dashboard_rpc() TO authenticated;

-- ============================================================================
-- FUNCTION 7: Unlock User Account (Admin Only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.unlock_user_account_rpc(
    target_user_id uuid,
    reset_failed_attempts boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT auth.validate_user_role('admin') THEN
        RETURN false;
    END IF;
    
    -- Unlock the user account
    UPDATE public.profiles
    SET 
        is_locked = false,
        failed_login_attempts = CASE WHEN reset_failed_attempts THEN 0 ELSE failed_login_attempts END
    WHERE id = target_user_id;
    
    -- Log account unlock
    PERFORM public.log_security_audit_event(
        'account_unlocked',
        jsonb_build_object(
            'target_user_id', target_user_id,
            'admin_user_id', auth.uid(),
            'reset_failed_attempts', reset_failed_attempts
        )
    );
    
    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        PERFORM public.log_security_audit_event(
            'account_unlock_error',
            jsonb_build_object(
                'target_user_id', target_user_id,
                'admin_user_id', auth.uid(),
                'error', SQLERRM
            )
        );
        RETURN false;
END;
$$;

-- Grant execute permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.unlock_user_account_rpc(uuid, boolean) TO authenticated;

-- ============================================================================
-- FUNCTION 8: Get Recent Security Events
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_recent_security_events_rpc(
    event_limit integer DEFAULT 50,
    hours_back integer DEFAULT 24
)
RETURNS TABLE(
    event_id uuid,
    user_id uuid,
    operation text,
    table_name text,
    event_data jsonb,
    created_at timestamp with time zone,
    ip_address inet,
    user_agent text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT auth.validate_user_role('admin') THEN
        RETURN;
    END IF;
    
    -- Log access to security events
    PERFORM public.log_security_audit_event(
        'security_events_accessed',
        jsonb_build_object(
            'admin_user_id', auth.uid(),
            'event_limit', event_limit,
            'hours_back', hours_back
        )
    );
    
    -- Return recent security events
    RETURN QUERY
    SELECT 
        sal.id,
        sal.user_id,
        sal.operation,
        sal.table_name,
        sal.new_values,
        sal.created_at,
        sal.ip_address,
        sal.user_agent
    FROM public.security_audit_log sal
    WHERE sal.created_at > now() - (hours_back || ' hours')::interval
    ORDER BY sal.created_at DESC
    LIMIT event_limit;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        PERFORM public.log_security_audit_event(
            'security_events_access_error',
            jsonb_build_object(
                'admin_user_id', auth.uid(),
                'error', SQLERRM
            )
        );
        RETURN;
END;
$$;

-- Grant execute permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.get_recent_security_events_rpc(integer, integer) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all functions were created successfully
SELECT 
    'SECURITY RPC FUNCTIONS CREATED' as status,
    routine_name,
    routine_type,
    security_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%_rpc'
ORDER BY routine_name;

-- Check function permissions
SELECT 
    'FUNCTION PERMISSIONS' as check_type,
    routine_name,
    string_agg(privilege_type, ', ') as privileges,
    grantee
FROM information_schema.routine_privileges rp
JOIN information_schema.routines r ON r.routine_name = rp.routine_name
WHERE r.routine_schema = 'public' 
AND r.routine_name LIKE '%_rpc'
GROUP BY routine_name, grantee
ORDER BY routine_name, grantee;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Example 1: Log a security event
SELECT public.log_security_audit_event(
    'user_login_attempt',
    '{"ip": "192.168.1.1", "success": true}'::jsonb,
    '192.168.1.1',
    'Mozilla/5.0...'
);

-- Example 2: Validate user role
SELECT public.validate_user_role_rpc(auth.uid(), 'admin');

-- Example 3: Check client project access
SELECT public.validate_client_project_access_rpc('123e4567-e89b-12d3-a456-426614174000');

-- Example 4: Get security context
SELECT public.get_user_security_context_rpc();

-- Example 5: Update security metrics after login
SELECT public.update_user_security_metrics_rpc(true, '192.168.1.1', 'Mozilla/5.0...');

-- Example 6: Get security dashboard (admin only)
SELECT public.get_security_dashboard_rpc();

-- Example 7: Unlock user account (admin only)
SELECT public.unlock_user_account_rpc('123e4567-e89b-12d3-a456-426614174000', true);

-- Example 8: Get recent security events (admin only)
SELECT * FROM public.get_recent_security_events_rpc(20, 48);
*/