import { useState, useCallback, useRef, useEffect } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

export interface OptimisticOperation<T = Record<string, unknown>> {
  id: string;
  type: 'create' | 'update' | 'delete';
  status: 'pending' | 'success' | 'error' | 'cancelled';
  data: T;
  originalData?: T;
  error?: string;
  timestamp: number;
  rollbackData?: T;
}

interface UseOptimisticOptions<T> {
  onSuccess?: (operation: OptimisticOperation<T>) => void;
  onError?: (operation: OptimisticOperation<T>) => void;
  onRollback?: (operation: OptimisticOperation<T>) => void;
  autoRollbackDelay?: number; // milliseconds before auto-rollback on error
  enableHapticFeedback?: boolean;
  persistOnError?: boolean; // Keep failed operations in the list
}

export function useOptimisticUpdates<T>(options: UseOptimisticOptions<T> = {}) {
  const {
    onSuccess,
    onError,
    onRollback,
    autoRollbackDelay = 5000,
    enableHapticFeedback = true,
    persistOnError = false
  } = options;

  const [operations, setOperations] = useState<Map<string, OptimisticOperation<T>>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { success, error: hapticError } = useHapticFeedback();

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Start an optimistic operation
  const startOperation = useCallback((
    id: string,
    type: OptimisticOperation<T>['type'],
    data: T,
    originalData?: T
  ) => {
    const operation: OptimisticOperation<T> = {
      id,
      type,
      status: 'pending',
      data,
      originalData,
      timestamp: Date.now(),
      rollbackData: type === 'delete' ? data : originalData
    };

    setOperations(prev => new Map(prev.set(id, operation)));
    setIsProcessing(true);

    return operation;
  }, []);

  // Complete an operation successfully
  const completeOperation = useCallback((id: string, finalData?: T) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(id);
      
      if (operation) {
        const updatedOperation = {
          ...operation,
          status: 'success' as const,
          data: finalData || operation.data
        };
        
        newMap.set(id, updatedOperation);
        
        // Provide haptic feedback for success
        if (enableHapticFeedback) {
          success();
        }
        
        onSuccess?.(updatedOperation);
        
        // Remove successful operation after a delay
        setTimeout(() => {
          setOperations(current => {
            const updated = new Map(current);
            updated.delete(id);
            return updated;
          });
        }, 1000);
      }
      
      return newMap;
    });

    // Clear timeout if exists
    const timeout = timeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.current.delete(id);
    }

    // Check if any operations are still processing
    setTimeout(() => {
      setOperations(current => {
        const hasPending = Array.from(current.values()).some(op => op.status === 'pending');
        setIsProcessing(hasPending);
        return current;
      });
    }, 100);
  }, [enableHapticFeedback, success, onSuccess]);

  // Fail an operation
  const failOperation = useCallback((id: string, errorMessage: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(id);
      
      if (operation) {
        const updatedOperation = {
          ...operation,
          status: 'error' as const,
          error: errorMessage
        };
        
        newMap.set(id, updatedOperation);
        
        // Provide haptic feedback for error
        if (enableHapticFeedback) {
          hapticError();
        }
        
        onError?.(updatedOperation);
        
        // Set up auto-rollback timeout
        if (autoRollbackDelay > 0) {
          const timeout = setTimeout(() => {
            rollbackOperation(id);
          }, autoRollbackDelay);
          
          timeouts.current.set(id, timeout);
        }
        
        // Remove failed operation if not persisting
        if (!persistOnError) {
          setTimeout(() => {
            setOperations(current => {
              const updated = new Map(current);
              updated.delete(id);
              return updated;
            });
          }, autoRollbackDelay || 3000);
        }
      }
      
      return newMap;
    });

    // Update processing state
    setTimeout(() => {
      setOperations(current => {
        const hasPending = Array.from(current.values()).some(op => op.status === 'pending');
        setIsProcessing(hasPending);
        return current;
      });
    }, 100);
  }, [enableHapticFeedback, hapticError, onError, autoRollbackDelay, persistOnError]);

  // Rollback an operation
  const rollbackOperation = useCallback((id: string) => {
    setOperations(prev => {
      const newMap = new Map(prev);
      const operation = newMap.get(id);
      
      if (operation) {
        const updatedOperation = {
          ...operation,
          status: 'cancelled' as const
        };
        
        onRollback?.(updatedOperation);
        
        // Remove the operation
        newMap.delete(id);
      }
      
      return newMap;
    });

    // Clear timeout
    const timeout = timeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.current.delete(id);
    }
  }, [onRollback]);

  // Cancel all pending operations
  const cancelAllOperations = useCallback(() => {
    operations.forEach((operation) => {
      if (operation.status === 'pending') {
        rollbackOperation(operation.id);
      }
    });
    
    setIsProcessing(false);
  }, [operations, rollbackOperation]);

  // Get operations by status
  const getOperationsByStatus = useCallback((status: OptimisticOperation<T>['status']) => {
    return Array.from(operations.values()).filter(op => op.status === status);
  }, [operations]);

  // Get operation by ID
  const getOperation = useCallback((id: string) => {
    return operations.get(id);
  }, [operations]);

  // Check if an operation is in progress
  const isOperationPending = useCallback((id: string) => {
    const operation = operations.get(id);
    return operation?.status === 'pending';
  }, [operations]);

  // Retry a failed operation
  const retryOperation = useCallback((id: string, newData?: T) => {
    const operation = operations.get(id);
    if (operation && operation.status === 'error') {
      const retryOperation = {
        ...operation,
        status: 'pending' as const,
        data: newData || operation.data,
        error: undefined,
        timestamp: Date.now()
      };
      
      setOperations(prev => new Map(prev.set(id, retryOperation)));
      setIsProcessing(true);
      
      return retryOperation;
    }
    
    return null;
  }, [operations]);

  return {
    // State
    operations: Array.from(operations.values()),
    operationsMap: operations,
    isProcessing,
    
    // Actions
    startOperation,
    completeOperation,
    failOperation,
    rollbackOperation,
    cancelAllOperations,
    retryOperation,
    
    // Queries
    getOperationsByStatus,
    getOperation,
    isOperationPending,
    
    // Computed
    pendingCount: getOperationsByStatus('pending').length,
    errorCount: getOperationsByStatus('error').length,
    successCount: getOperationsByStatus('success').length,
    hasErrors: getOperationsByStatus('error').length > 0,
    hasPending: getOperationsByStatus('pending').length > 0
  };
}

// Hook for optimistic state management
export function useOptimisticState<T>(initialState: T, options: UseOptimisticOptions<T> = {}) {
  const [optimisticState, setOptimisticState] = useState<T>(initialState);
  const [actualState, setActualState] = useState<T>(initialState);
  
  const optimistic = useOptimisticUpdates<T>({
    ...options,
    onSuccess: (operation) => {
      setActualState(operation.data);
      options.onSuccess?.(operation);
    },
    onRollback: (operation) => {
      setOptimisticState(actualState);
      options.onRollback?.(operation);
    }
  });

  const updateOptimistically = useCallback((
    id: string,
    updateFn: (current: T) => T,
    type: OptimisticOperation<T>['type'] = 'update'
  ) => {
    const newState = updateFn(optimisticState);
    setOptimisticState(newState);
    
    return optimistic.startOperation(id, type, newState, optimisticState);
  }, [optimisticState, optimistic]);

  return {
    ...optimistic,
    state: optimisticState,
    actualState,
    updateOptimistically,
    setState: setOptimisticState,
    setActualState
  };
}