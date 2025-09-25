import * as React from "react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { useLoading } from "@/context/LoadingContext";
import { LoadingPhase, LoadingStrategy } from "@/types/loading";
import { Spinner, ProgressBar } from "./loading";
import { Button } from "./button";
import { AlertTriangle, Wifi, WifiOff, Clock, RefreshCw, Play, SkipForward } from "lucide-react";

// Enhanced Progress Indicator
interface ProgressIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const ProgressIndicator = ({ showDetails = false, className }: ProgressIndicatorProps) => {
  const {
    progressPercentage,
    elapsedTime,
    phaseElapsedTime,
    state,
    networkQuality
  } = useLoading();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getPhaseLabel = (phase: LoadingPhase) => {
    switch (phase) {
      case 'initializing': return 'Inicializando aplicación';
      case 'authenticating': return 'Verificando sesión';
      case 'enhancing': return 'Cargando perfil';
      case 'ready': return 'Listo';
      case 'error': return 'Error';
      case 'timeout': return 'Tiempo agotado';
      case 'retrying': return 'Reintentando';
      case 'degraded': return 'Modo limitado';
      default: return 'Cargando';
    }
  };

  const getNetworkIcon = () => {
    switch (networkQuality) {
      case 'fast': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'medium': return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'slow': return <Wifi className="h-4 w-4 text-orange-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      default: return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{getPhaseLabel(state.phase)}</span>
          <span className="text-muted-foreground">{progressPercentage}%</span>
        </div>

        <ProgressBar
          value={progressPercentage}
          variant={
            state.phase === 'error' ? 'error' :
            state.phase === 'timeout' ? 'warning' :
            state.phase === 'ready' ? 'success' :
            'default'
          }
          size="default"
          indeterminate={['retrying', 'initializing'].includes(state.phase)}
        />
      </div>

      {/* Detailed information */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Tiempo total: {formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            {getNetworkIcon()}
            <span>Red: {networkQuality}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-current" />
            <span>Fase: {formatTime(phaseElapsedTime)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Estrategia: {state.strategy}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Smart Loading Screen with user controls
interface SmartLoadingScreenProps {
  title?: string;
  description?: string;
  showProgress?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const SmartLoadingScreen = ({
  title = "Cargando VisionDay",
  description,
  showProgress = true,
  showDetails = false,
  className
}: SmartLoadingScreenProps) => {
  const {
    state,
    hasError,
    hasTimedOut,
    isDegraded,
    retry,
    changeStrategy,
    reset
  } = useLoading();

  const getDescription = () => {
    if (description) return description;

    switch (state.phase) {
      case 'initializing':
        return 'Preparando la aplicación para su uso...';
      case 'authenticating':
        return 'Verificando tu sesión de usuario...';
      case 'enhancing':
        return 'Cargando tu perfil y configuración...';
      case 'timeout':
        return 'La carga está tardando más de lo esperado';
      case 'error':
        return state.error?.message || 'Se produjo un error durante la carga';
      case 'degraded':
        return 'Funcionando con capacidades limitadas';
      case 'retrying':
        return 'Reintentando la conexión...';
      default:
        return 'Configurando tu experiencia...';
    }
  };

  const handleContinueWithLimited = () => {
    changeStrategy('graceful');
  };

  const handleRetry = () => {
    retry();
  };

  const handleFullReload = () => {
    window.location.reload();
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-background/95 backdrop-blur-sm",
      className
    )}>
      <div className="max-w-md w-full px-6">
        <div className="text-center space-y-6">
          {/* Logo/Brand Area */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {!hasError && !hasTimedOut && (
              <Spinner size="lg" className="mx-auto" />
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            {getDescription()}
          </p>

          {/* Progress indicator */}
          {showProgress && !hasError && (
            <ProgressIndicator showDetails={showDetails} />
          )}

          {/* Error state controls */}
          {(hasError || hasTimedOut) && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {hasTimedOut ? 'Tiempo de espera agotado' : 'Error de carga'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {state.userControlled.canRetry && (
                  <Button
                    onClick={handleRetry}
                    className="w-full"
                    disabled={state.phase === 'retrying'}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {state.phase === 'retrying' ? 'Reintentando...' : 'Reintentar'}
                  </Button>
                )}

                {state.userControlled.canContinue && (
                  <Button
                    onClick={handleContinueWithLimited}
                    variant="outline"
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continuar con funcionalidad limitada
                  </Button>
                )}

                <Button
                  onClick={handleFullReload}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar página completa
                </Button>
              </div>
            </div>
          )}

          {/* Degraded mode notice */}
          {isDegraded && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-amber-800 text-sm">
                ⚠️ Funcionando en modo limitado. Algunas funciones pueden no estar disponibles.
              </p>
              <Button
                onClick={handleRetry}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                Intentar cargar completamente
              </Button>
            </div>
          )}

          {/* Skip option for non-critical loading */}
          {state.userControlled.canSkip && state.phase === 'enhancing' && (
            <Button
              onClick={() => changeStrategy('graceful')}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Saltar carga de perfil
            </Button>
          )}

          {/* Network quality indicator */}
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            {state.network.quality === 'fast' && <Wifi className="h-3 w-3 text-green-500" />}
            {state.network.quality === 'medium' && <Wifi className="h-3 w-3 text-yellow-500" />}
            {state.network.quality === 'slow' && <Wifi className="h-3 w-3 text-orange-500" />}
            {state.network.quality === 'offline' && <WifiOff className="h-3 w-3 text-red-500" />}
            <span>
              Conexión: {state.network.quality} ({Math.round(state.network.rtt)}ms)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component loading wrapper for partial UI
interface ComponentLoadingWrapperProps {
  children: ReactNode;
  componentName: keyof LoadingState['components'];
  fallback?: ReactNode;
  showError?: boolean;
  className?: string;
}

export const ComponentLoadingWrapper = ({
  children,
  componentName,
  fallback,
  showError = true,
  className
}: ComponentLoadingWrapperProps) => {
  const { state } = useLoading();
  const componentPhase = state.components[componentName];

  if (componentPhase === 'ready') {
    return <>{children}</>;
  }

  if (componentPhase === 'error' && showError) {
    return (
      <div className={cn("p-4 border border-red-200 rounded-lg bg-red-50", className)}>
        <p className="text-red-800 text-sm">
          Error cargando {componentName}
        </p>
      </div>
    );
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default loading UI
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
};