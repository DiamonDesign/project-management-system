import { useSession } from "@/hooks/useSession";
import { Navigate } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useState, useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { supabase } from "@/integrations/supabase/client-v2";
import type { AuthError } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

const Login = () => {
  const { session, isLoading } = useSession();

  // Production-ready redirect URL
  const getRedirectUrl = () => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/projects`;
  };

  const handleAuthError = (error: AuthError) => {
    logger.auth('Authentication error', error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-lg text-gray-600 dark:text-gray-400">Cargando...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
          Bienvenido
        </h1>

        <AuthForm
          onError={handleAuthError}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;