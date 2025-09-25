import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AuthError } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

type AuthMode = 'sign_in' | 'sign_up' | 'forgot_password';

interface AuthFormProps {
  mode?: AuthMode;
  redirectTo?: string;
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
}

interface AuthMessage {
  type: 'error' | 'success' | 'info';
  message: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode = 'sign_in',
  redirectTo,
  onSuccess,
  onError
}) => {
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);

  const handleError = (error: AuthError) => {
    let errorMessage: AuthMessage;

    switch (error.message) {
      case 'Invalid login credentials':
        errorMessage = {
          type: 'error',
          message: 'Credenciales incorrectas. Verifica tu email y contraseña.'
        };
        break;
      case 'Email not confirmed':
        errorMessage = {
          type: 'info',
          message: 'Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
        };
        break;
      case 'Password should be at least 6 characters':
        errorMessage = {
          type: 'error',
          message: 'La contraseña debe tener al menos 6 caracteres.'
        };
        break;
      case 'Unable to validate email address: invalid format':
        errorMessage = {
          type: 'error',
          message: 'El formato del email no es válido.'
        };
        break;
      case 'User already registered':
        errorMessage = {
          type: 'error',
          message: 'Este email ya está registrado. ¿Quizás quieres iniciar sesión?'
        };
        break;
      default:
        errorMessage = {
          type: 'error',
          message: error.message || 'Ha ocurrido un error durante la autenticación.'
        };
    }

    setMessage(errorMessage);
    onError?.(error);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Login debugging (safe for production)
    logger.auth('Login attempt initiated');

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        message: 'Inicio de sesión exitoso'
      });

      onSuccess?.();

      // NO REDIRECT - Let React Router handle navigation
      // The SessionContext will handle navigation after successful auth
    } catch (error) {
      handleError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) throw error;

      setMessage({
        type: 'info',
        message: 'Registro exitoso. Por favor revisa tu email para confirmar tu cuenta.'
      });

    } catch (error) {
      handleError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({
        type: 'error',
        message: 'Por favor ingresa tu email.'
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo ? `${redirectTo}?reset=true` : undefined
      });

      if (error) throw error;

      setMessage({
        type: 'info',
        message: 'Se ha enviado un enlace de restablecimiento a tu email.'
      });

    } catch (error) {
      handleError(error as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (currentMode) {
      case 'sign_in': return 'Iniciar Sesión';
      case 'sign_up': return 'Registrarse';
      case 'forgot_password': return 'Recuperar Contraseña';
    }
  };

  const getSubmitText = () => {
    if (loading) {
      switch (currentMode) {
        case 'sign_in': return 'Iniciando sesión...';
        case 'sign_up': return 'Registrando...';
        case 'forgot_password': return 'Enviando...';
      }
    }

    switch (currentMode) {
      case 'sign_in': return 'Iniciar Sesión';
      case 'sign_up': return 'Registrarse';
      case 'forgot_password': return 'Enviar Enlace';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    switch (currentMode) {
      case 'sign_in': return handleSignIn(e);
      case 'sign_up': return handleSignUp(e);
      case 'forgot_password': return handleForgotPassword(e);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {getTitle()}
        </h2>
      </div>

      {message && (
        <Alert className={`${
          message.type === 'error' ? 'border-red-500 bg-red-50' :
          message.type === 'success' ? 'border-green-500 bg-green-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <AlertDescription className={
            message.type === 'error' ? 'text-red-700' :
            message.type === 'success' ? 'text-green-700' :
            'text-blue-700'
          }>
            {message.message}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            disabled={loading}
          />
        </div>

        {currentMode !== 'forgot_password' && (
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email || (currentMode !== 'forgot_password' && !password)}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {getSubmitText()}
        </Button>
      </form>

      <div className="text-center space-y-2">
        {currentMode === 'sign_in' && (
          <>
            <Button
              variant="link"
              onClick={() => setCurrentMode('forgot_password')}
              disabled={loading}
              className="text-sm"
            >
              ¿Olvidaste tu contraseña?
            </Button>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ¿No tienes cuenta?{' '}
              </span>
              <Button
                variant="link"
                onClick={() => setCurrentMode('sign_up')}
                disabled={loading}
                className="text-sm p-0"
              >
                Regístrate
              </Button>
            </div>
          </>
        )}

        {currentMode === 'sign_up' && (
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ¿Ya tienes cuenta?{' '}
            </span>
            <Button
              variant="link"
              onClick={() => setCurrentMode('sign_in')}
              disabled={loading}
              className="text-sm p-0"
            >
              Inicia sesión
            </Button>
          </div>
        )}

        {currentMode === 'forgot_password' && (
          <Button
            variant="link"
            onClick={() => setCurrentMode('sign_in')}
            disabled={loading}
            className="text-sm"
          >
            Volver al inicio de sesión
          </Button>
        )}
      </div>
    </div>
  );
};