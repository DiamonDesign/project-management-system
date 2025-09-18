"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/auth/AuthForm";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Loader2 } from "lucide-react";
import { showError } from "@/utils/toast";
import { useSession } from "@/hooks/useSession";
import type { AuthError } from "@supabase/supabase-js";

const ClientPortalInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, isLoading: isLoadingSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const handleAuthError = (error: AuthError) => {
    console.error('Client portal auth error:', error);
    showError(`Error de autenticación: ${error.message}`);
  };

  const getRedirectUrl = () => {
    return window.location.origin + "/client-portal/dashboard";
  };

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setInviteToken(token);
    } else {
      showError("No se encontró un token de invitación válido.");
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoadingSession && session) {
      // If already logged in, redirect to client portal dashboard
      navigate("/client-portal/dashboard", { replace: true });
    } else if (!isLoadingSession && !session && inviteToken) {
      // If not logged in but has invite token, proceed to auth flow
      setLoading(false);
    } else if (!isLoadingSession && !session && !inviteToken) {
      // If no session and no invite token, redirect to login
      navigate("/login", { replace: true });
    }
  }, [session, isLoadingSession, inviteToken, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-600 dark:text-gray-400">Cargando invitación...</p>
      </div>
    );
  }

  if (!inviteToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
          Portal del Cliente
        </h1>
        <p className="text-center text-muted-foreground mb-4">
          Has sido invitado a un portal de cliente. Por favor, inicia sesión con tu email y la contraseña temporal proporcionada por tu freelancer, o usa la opción "Olvidaste tu contraseña" si necesitas establecer una nueva.
        </p>

        <AuthForm
          redirectTo={getRedirectUrl()}
          onError={handleAuthError}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ClientPortalInvite;