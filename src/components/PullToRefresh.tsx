import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  refreshProgress: number;
  pullDistance: number;
  shouldShow: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  isRefreshing,
  refreshProgress,
  pullDistance,
  shouldShow
}) => {
  if (!shouldShow) return null;

  return (
    <div 
      className="absolute top-0 left-0 right-0 flex justify-center items-center bg-background/80 backdrop-blur-sm border-b border-border transition-all duration-200 z-50"
      style={{ 
        height: Math.min(pullDistance, 80),
        opacity: refreshProgress 
      }}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {isRefreshing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Actualizando...</span>
          </>
        ) : (
          <>
            <ArrowDown 
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                refreshProgress >= 1 && "rotate-180"
              )} 
            />
            <span className="text-sm font-medium">
              {refreshProgress >= 1 ? 'Suelta para actualizar' : 'Tira hacia abajo'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};