import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the callback from email confirmation or password reset
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
        }

        setLoading(false);
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError('Ha ocurrido un error inesperado');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Procesando autenticación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p><strong>Error:</strong> {error}</p>
          </div>
          <a
            href="/login"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  // Redirect to dashboard on success
  return <Navigate to="/projects" replace />;
};

export default AuthCallback;