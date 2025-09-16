import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Special handling for session-related errors
    const isSessionError = error.message.includes('session is not defined') || 
                           error.message.includes('Cannot read properties of null');
    
    if (isSessionError) {
      console.warn('Session-related error detected, attempting recovery');
      
      // Initialize emergency session fallback
      if (!window.session && window.__emergencyFallback) {
        window.session = window.__emergencyFallback.session;
        console.warn('Emergency session fallback activated');
      }
      
      // Try to recover by reloading the page after a delay
      setTimeout(() => {
        console.log('Attempting page reload to recover from session error');
        window.location.reload();
      }, 1000);
    }
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });

    // Call the optional error handler
    this.props.onError?.(error, errorInfo);

    // In a real app, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl">¡Ups! Algo salió mal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                Se ha producido un error inesperado. Puedes intentar recargar la página o volver al inicio.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-4 rounded-md text-sm">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Detalles del error (solo en desarrollo)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={this.handleRetry} 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Ir al inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<Props> = ({ children, ...props }) => (
  <ErrorBoundary 
    {...props}
    fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold">Error en la página</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No se pudo cargar esta sección. Intenta recargar la página.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} size="sm">
              Recargar página
            </Button>
          </CardContent>
        </Card>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<Props> = ({ children, ...props }) => (
  <ErrorBoundary 
    {...props}
    fallback={
      <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Error al cargar componente</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Este componente no se pudo cargar correctamente.
        </p>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

// Hook for functional components to handle errors
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: Record<string, unknown>) => {
    console.error('Unhandled error:', error, errorInfo);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }, []);
}