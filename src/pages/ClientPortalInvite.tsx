"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useSession } from "@/context/SessionContext";

const ClientPortalInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, isLoading: isLoadingSession } = useSession();
  const [loading, setLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isPasswordSet, setIsPasswordSet] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setInviteToken(token);
      // Optionally, you could fetch client_portal_users table to get email from token
      // For now, we'll assume the user will enter their email or it's handled by Auth component
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

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      showError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSettingPassword(true);
    try {
      // This assumes the user has already been created by the Edge Function
      // and is now just setting their password.
      // Supabase's `updateUser` can be used for this.
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      showSuccess("Contraseña establecida exitosamente. Por favor, inicia sesión.");
      setIsPasswordSet(true);
      setPassword("");
      setConfirmPassword("");
      // After setting password, user should log in.
      // The Auth component below will handle the login flow.
    } catch (error: any) {
      showError("Error al establecer la contraseña: " + error.message);
      console.error("Error setting password:", error);
    } finally {
      setIsSettingPassword(false);
    }
  };

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
          Has sido invitado a un portal de cliente. Por favor, inicia sesión o establece tu contraseña.
        </p>

        {isPasswordSet ? (
          <div className="text-center">
            <p className="text-lg text-green-600 mb-4">¡Contraseña establecida!</p>
            <p className="text-muted-foreground mb-4">Ahora puedes iniciar sesión con tu email y nueva contraseña.</p>
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: "hsl(var(--primary))",
                      brandAccent: "hsl(var(--primary-foreground))",
                    },
                  },
                },
              }}
              theme="light"
              redirectTo={window.location.origin + "/client-portal/dashboard"}
            />
          </div>
        ) : (
          <>
            {/* Check if user is already logged in or needs to set password */}
            {session ? (
              <p className="text-center text-green-600">Ya has iniciado sesión. Redirigiendo...</p>
            ) : (
              <>
                {/* If the user was created with a temporary password, they need to set a new one */}
                {/* This part is tricky as we don't know if they have a temp password without another API call.
                    For simplicity, we'll offer a password reset/update flow.
                    Supabase's Auth component handles the "update password" flow if the user is already logged in
                    or if they use the "Forgot password?" link.
                    Here, we'll provide a direct form for setting a new password if they are not logged in
                    and have just been created by the invite.
                */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Establecer Nueva Contraseña</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSetPassword} className="space-y-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="********"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="********"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSettingPassword}>
                        {isSettingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Estableciendo...
                          </>
                        ) : (
                          "Establecer Contraseña"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="relative flex justify-center text-xs uppercase mb-6">
                  <span className="bg-background px-2 text-muted-foreground">
                    O inicia sesión si ya tienes una cuenta
                  </span>
                </div>

                <Auth
                  supabaseClient={supabase}
                  providers={[]}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: "hsl(var(--primary))",
                          brandAccent: "hsl(var(--primary-foreground))",
                        },
                      },
                    },
                  }}
                  theme="light"
                  redirectTo={window.location.origin + "/client-portal/dashboard"}
                />
              </>
            )}
          </>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ClientPortalInvite;