import React from 'react';
import { RotateCcw, RefreshCw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  threshold?: number;
  className?: string;
}

export const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  children,
  onRefresh,
  enabled = true,
  threshold = 80,
  className,
}) => {
  const {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress,
    canRefresh,
  } = usePullToRefresh({
    onRefresh,
    enabled,
    threshold,
  });

  return (
    <div className={cn("relative", className)}>
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          "fixed top-16 left-1/2 transform -translate-x-1/2 z-50",
          "transition-all duration-200 ease-out",
          "flex items-center justify-center",
          "w-16 h-16 bg-background/95 backdrop-blur-md rounded-full shadow-lg border border-border",
          (isPulling || isRefreshing) 
            ? "opacity-100 scale-100" 
            : "opacity-0 scale-75 pointer-events-none"
        )}
        style={{
          transform: `translateX(-50%) translateY(${Math.min(pullDistance * 0.6, 40)}px)`,
        }}
      >
        {/* Refresh states */}
        {isRefreshing ? (
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        ) : canRefresh ? (
          <RotateCcw className="h-6 w-6 text-success animate-pulse" />
        ) : (
          <ChevronDown 
            className={cn(
              "h-6 w-6 text-muted-foreground transition-transform duration-200",
              pullProgress > 0.5 && "text-primary"
            )}
            style={{
              transform: `rotate(${pullProgress * 180}deg)`,
            }}
          />
        )}
        
        {/* Progress ring */}
        <div className="absolute inset-0">
          <svg 
            className="w-full h-full -rotate-90" 
            viewBox="0 0 64 64"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-muted/20"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - pullProgress)}`}
              className={cn(
                "transition-all duration-100",
                canRefresh ? "text-success" : "text-primary"
              )}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Status text */}
      <div
        className={cn(
          "fixed top-32 left-1/2 transform -translate-x-1/2 z-40",
          "transition-all duration-200 ease-out",
          "text-sm font-medium text-center",
          (isPulling || isRefreshing) 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        {isRefreshing ? (
          <span className="text-primary">Actualizando...</span>
        ) : canRefresh ? (
          <span className="text-success">¡Suelta para actualizar!</span>
        ) : isPulling ? (
          <span className="text-muted-foreground">Arrastra para actualizar</span>
        ) : null}
      </div>

      {/* Content with pull transform */}
      <div
        className="transition-transform duration-100 ease-out"
        style={{
          transform: isPulling 
            ? `translateY(${Math.min(pullDistance * 0.3, 30)}px)` 
            : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefreshWrapper;