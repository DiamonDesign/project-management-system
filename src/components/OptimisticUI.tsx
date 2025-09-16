import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  RefreshCw,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimisticOperation } from '@/hooks/useOptimisticUpdates';
import { AnimatePresence, motion } from 'framer-motion';

interface OptimisticStatusIndicatorProps {
  operations: OptimisticOperation[];
  className?: string;
  compact?: boolean;
  showProgress?: boolean;
}

export const OptimisticStatusIndicator: React.FC<OptimisticStatusIndicatorProps> = ({
  operations,
  className,
  compact = false,
  showProgress = true
}) => {
  const pendingOps = operations.filter(op => op.status === 'pending');
  const errorOps = operations.filter(op => op.status === 'error');
  const successOps = operations.filter(op => op.status === 'success');
  
  const totalOps = operations.length;
  const completedOps = successOps.length + errorOps.length;
  const progressPercentage = totalOps > 0 ? (completedOps / totalOps) * 100 : 0;

  if (operations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("space-y-2", className)}
    >
      {!compact && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Actualizaciones en tiempo real</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {pendingOps.length} pendientes
          </Badge>
        </div>
      )}

      {showProgress && totalOps > 0 && (
        <Progress 
          value={progressPercentage} 
          className="h-1"
        />
      )}

      {/* Operation Status Summary */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {pendingOps.length > 0 && (
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{pendingOps.length} procesando</span>
          </div>
        )}
        
        {successOps.length > 0 && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>{successOps.length} completadas</span>
          </div>
        )}
        
        {errorOps.length > 0 && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>{errorOps.length} fallidas</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface OptimisticOperationCardProps {
  operation: OptimisticOperation;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  showActions?: boolean;
}

export const OptimisticOperationCard: React.FC<OptimisticOperationCardProps> = ({
  operation,
  onRetry,
  onCancel,
  showActions = true
}) => {
  const getStatusIcon = () => {
    switch (operation.status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (operation.status) {
      case 'pending':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20';
      case 'cancelled':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
      default:
        return 'border-border bg-background';
    }
  };

  const getOperationDescription = () => {
    switch (operation.type) {
      case 'create':
        return 'Creando elemento...';
      case 'update':
        return 'Actualizando...';
      case 'delete':
        return 'Eliminando...';
      default:
        return 'Procesando...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full"
    >
      <Card className={cn("transition-all duration-200", getStatusColor())}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {operation.status === 'pending' 
                    ? getOperationDescription()
                    : operation.status === 'success'
                    ? '✓ Completado'
                    : operation.status === 'error'
                    ? '✗ Error'
                    : '↻ Cancelado'
                  }
                </p>
                {operation.error && (
                  <p className="text-xs text-red-600 mt-1">
                    {operation.error}
                  </p>
                )}
              </div>
            </div>
            
            {showActions && operation.status === 'error' && (
              <div className="flex gap-1">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onRetry?.(operation.id)}
                  className="h-6 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onCancel?.(operation.id)}
                  className="h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Progress indicator for pending operations */}
          {operation.status === 'pending' && (
            <div className="mt-2">
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full animate-pulse"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface OptimisticToastProps {
  operations: OptimisticOperation[];
  maxVisible?: number;
}

export const OptimisticToast: React.FC<OptimisticToastProps> = ({
  operations,
  maxVisible = 3
}) => {
  const recentOperations = operations
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxVisible);

  if (recentOperations.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {recentOperations.map((operation) => (
          <OptimisticOperationCard
            key={operation.id}
            operation={operation}
            showActions={false}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Enhanced loading spinner with operation context
interface SmartLoadingSpinnerProps {
  isLoading: boolean;
  operations?: OptimisticOperation[];
  size?: 'sm' | 'md' | 'lg';
  showOperationCount?: boolean;
}

export const SmartLoadingSpinner: React.FC<SmartLoadingSpinnerProps> = ({
  isLoading,
  operations = [],
  size = 'md',
  showOperationCount = true
}) => {
  const pendingCount = operations.filter(op => op.status === 'pending').length;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  if (!isLoading && pendingCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {showOperationCount && pendingCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {pendingCount} operación{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
        </span>
      )}
    </motion.div>
  );
};

// Optimistic state wrapper component
interface OptimisticWrapperProps {
  children: React.ReactNode;
  operations: OptimisticOperation[];
  showToast?: boolean;
  showStatusBar?: boolean;
}

export const OptimisticWrapper: React.FC<OptimisticWrapperProps> = ({
  children,
  operations,
  showToast = true,
  showStatusBar = false
}) => {
  return (
    <>
      {showStatusBar && operations.length > 0 && (
        <OptimisticStatusIndicator 
          operations={operations}
          className="mb-4"
        />
      )}
      
      {children}
      
      {showToast && (
        <OptimisticToast operations={operations} />
      )}
    </>
  );
};