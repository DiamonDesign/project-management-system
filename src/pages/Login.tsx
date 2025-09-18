import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Navigate } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError } from "@supabase/supabase-js";

const Login = () => {
  const { session, isLoading } = useSession();
  const [authMessage, setAuthMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  // Production-ready redirect URL
  const getRedirectUrl = () => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/projects`;
  };

  useEffect(() => {
    // Listen for auth state changes to show appropriate messages
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setAuthMessage({type: 'success', message: 'Inicio de sesión exitoso'});
      } else if (event === 'USER_UPDATED') {
        setAuthMessage({type: 'success', message: 'Email confirmado exitosamente'});
      } else if (event === 'SIGNED_UP') {
        setAuthMessage({type: 'info', message: 'Registro exitoso. Por favor revisa tu email para confirmar tu cuenta.'});
      }
    });

    // Listen for auth errors and handle them gracefully
    const handleAuthError = (error: any) => {
      console.error('Auth error caught:', error);
      if (error?.message?.includes('Invalid value')) {
        setAuthMessage({
          type: 'error',
          message: 'Error de configuración. Por favor contacta al administrador.'
        });
      } else if (error?.message?.includes('Invalid login credentials')) {
        setAuthMessage({
          type: 'error',
          message: 'Credenciales incorrectas. Verifica tu email y contraseña.'
        });
      } else if (error?.message?.includes('Email not confirmed')) {
        setAuthMessage({
          type: 'info',
          message: 'Por favor confirma tu email antes de iniciar sesión.'
        });
      }
    };

    // Global error handler for unhandled auth errors
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('fetch') || event.reason?.message?.includes('Invalid value')) {
        event.preventDefault(); // Prevent console spam
        handleAuthError(event.reason);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

        {authMessage && (
          <Alert className={`mb-4 ${
            authMessage.type === 'error' ? 'border-red-500' :
            authMessage.type === 'success' ? 'border-green-500' :
            'border-blue-500'
          }`}>
            <AlertDescription className={
              authMessage.type === 'error' ? 'text-red-600' :
              authMessage.type === 'success' ? 'text-green-600' :
              'text-blue-600'
            }>
              {authMessage.message}
            </AlertDescription>
          </Alert>
        )}

        <Auth
          supabaseClient={supabase}
          providers={[]} // Puedes añadir 'google', 'github', etc. aquí
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
          theme="light" // O "dark" si prefieres
          redirectTo={getRedirectUrl()}
          localization={{
            variables: {
              sign_up: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                button_label: 'Registrarse',
                loading_button_label: 'Registrando...',
                social_provider_text: 'Registrarse con {{provider}}',
                link_text: '¿No tienes cuenta? Regístrate',
                confirmation_text: 'Revisa tu email para el enlace de confirmación'
              },
              sign_in: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                button_label: 'Iniciar sesión',
                loading_button_label: 'Iniciando sesión...',
                social_provider_text: 'Iniciar sesión con {{provider}}',
                link_text: '¿Ya tienes cuenta? Inicia sesión'
              },
              forgotten_password: {
                email_label: 'Correo electrónico',
                button_label: 'Enviar instrucciones de reseteo',
                loading_button_label: 'Enviando...',
                link_text: '¿Olvidaste tu contraseña?',
                confirmation_text: 'Revisa tu email para el enlace de reseteo de contraseña'
              }
            }
          }}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;