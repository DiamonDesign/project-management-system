import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { ContentLoading } from '@/components/ui/loading';

interface SessionGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * SessionGuard component provides session-aware routing and loading states
 * This helps prevent "session is not defined" errors by properly handling loading states
 */
export const SessionGuard: React.FC<SessionGuardProps> = ({ 
  children, 
  redirectTo = '/login',
  requireAuth = true 
}) => {
  try {
    const { session, isLoading } = useSession();

    // Show loading state while session is being determined
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
          <ContentLoading lines={3} showHeader />
        </div>
      );
    }

    // Redirect if authentication is required but user is not authenticated
    if (requireAuth && !session) {
      return <Navigate to={redirectTo} replace />;
    }

    // Redirect if authentication is not required but user is authenticated
    if (!requireAuth && session) {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('SessionGuard error:', error);
    
    // Fallback to login page on any session-related error
    if (requireAuth) {
      return <Navigate to={redirectTo} replace />;
    }
    
    // For non-auth pages, still render children but log the error
    return <>{children}</>;
  }
};