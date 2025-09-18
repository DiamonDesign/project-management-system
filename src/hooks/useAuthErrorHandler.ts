import { useEffect, useState } from 'react';
import { AuthError } from '@supabase/supabase-js';

export interface AuthErrorMessage {
  type: 'error' | 'info' | 'success';
  message: string;
}

export const useAuthErrorHandler = () => {
  const [errorMessage, setErrorMessage] = useState<AuthErrorMessage | null>(null);

  const handleAuthError = (error: AuthError | null) => {
    if (!error) {
      setErrorMessage(null);
      return;
    }

    let message: AuthErrorMessage;

    switch (error.message) {
      case 'Invalid login credentials':
        message = {
          type: 'error',
          message: 'Credenciales de acceso incorrectas. Por favor, verifica tu email y contraseña.'
        };
        break;
      case 'Email not confirmed':
        message = {
          type: 'info',
          message: 'Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'
        };
        break;
      case 'Password should be at least 6 characters':
        message = {
          type: 'error',
          message: 'La contraseña debe tener al menos 6 caracteres.'
        };
        break;
      case 'Unable to validate email address: invalid format':
        message = {
          type: 'error',
          message: 'El formato del email no es válido.'
        };
        break;
      case 'User already registered':
        message = {
          type: 'error',
          message: 'Este email ya está registrado. ¿Quizás quieres iniciar sesión?'
        };
        break;
      case 'Signup is disabled':
        message = {
          type: 'error',
          message: 'El registro de nuevos usuarios está deshabilitado. Contacta al administrador.'
        };
        break;
      default:
        message = {
          type: 'error',
          message: error.message || 'Ha ocurrido un error durante la autenticación.'
        };
    }

    setErrorMessage(message);
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  return {
    errorMessage,
    handleAuthError,
    clearError
  };
};