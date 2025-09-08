import React, { useState, useCallback } from 'react';
import { showError } from '@/utils/toast';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastFetch: Date | null;
}

interface AsyncOptions {
  retries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  showErrorToast?: boolean;
}

export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  options: AsyncOptions = {}
) {
  const {
    retries = 2,
    retryDelay = 1000,
    onError,
    onSuccess,
    showErrorToast = true,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
  });

  const execute = useCallback(
    async (retryCount = 0): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await operation();
        setState({
          data: result,
          loading: false,
          error: null,
          lastFetch: new Date(),
        });
        onSuccess?.();
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        
        // Retry logic
        if (retryCount < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return execute(retryCount + 1);
        }

        // Final error state
        setState(prev => ({
          ...prev,
          loading: false,
          error: err,
        }));

        if (showErrorToast) {
          showError(`Error: ${err.message}`);
        }
        
        onError?.(err);
        return null;
      }
    },
    [operation, retries, retryDelay, onError, onSuccess, showErrorToast]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastFetch: null,
    });
  }, []);

  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    ...state,
    execute,
    reset,
    retry,
    isStale: state.lastFetch ? Date.now() - state.lastFetch.getTime() > 5 * 60 * 1000 : true, // 5 minutes
  };
}

// Specialized hook for form submissions
export function useFormSubmission<T>(
  submitOperation: (data: T) => Promise<void>,
  options: AsyncOptions = {}
) {
  const [state, setState] = useState({
    submitting: false,
    error: null as Error | null,
    success: false,
  });

  const submit = useCallback(
    async (data: T): Promise<boolean> => {
      setState({ submitting: true, error: null, success: false });

      try {
        await submitOperation(data);
        setState({ submitting: false, error: null, success: true });
        options.onSuccess?.();
        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Submission failed');
        setState({ submitting: false, error: err, success: false });
        
        if (options.showErrorToast !== false) {
          showError(`Error al enviar: ${err.message}`);
        }
        
        options.onError?.(err);
        return false;
      }
    },
    [submitOperation, options]
  );

  const reset = useCallback(() => {
    setState({ submitting: false, error: null, success: false });
  }, []);

  return {
    ...state,
    submit,
    reset,
  };
}

// Hook for data fetching with automatic retries and caching
export function useDataFetcher<T>(
  fetcher: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: AsyncOptions & { immediate?: boolean; cacheTime?: number } = {}
) {
  const { immediate = true, cacheTime = 5 * 60 * 1000, ...asyncOptions } = options; // 5 minutes default cache

  const asyncOperation = useAsyncOperation(fetcher, asyncOptions);

  // Auto-fetch on mount and dependency changes
  React.useEffect(() => {
    if (immediate && (asyncOperation.isStale || !asyncOperation.data)) {
      asyncOperation.execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return asyncOperation;
}

// Batch operations helper
export function useBatchOperations<T>() {
  const [operations, setOperations] = useState<Array<{
    id: string;
    operation: () => Promise<T>;
    status: 'pending' | 'running' | 'completed' | 'error';
    result?: T;
    error?: Error;
  }>>([]);

  const addOperation = useCallback((id: string, operation: () => Promise<T>) => {
    setOperations(prev => [
      ...prev,
      { id, operation, status: 'pending' }
    ]);
  }, []);

  const executeAll = useCallback(async (concurrency = 3) => {
    const pending = operations.filter(op => op.status === 'pending');
    
    const executeBatch = async (batch: typeof pending) => {
      const promises = batch.map(async (op) => {
        setOperations(prev =>
          prev.map(prevOp =>
            prevOp.id === op.id ? { ...prevOp, status: 'running' } : prevOp
          )
        );

        try {
          const result = await op.operation();
          setOperations(prev =>
            prev.map(prevOp =>
              prevOp.id === op.id
                ? { ...prevOp, status: 'completed', result }
                : prevOp
            )
          );
          return { id: op.id, result, error: null };
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Unknown error');
          setOperations(prev =>
            prev.map(prevOp =>
              prevOp.id === op.id
                ? { ...prevOp, status: 'error', error: err }
                : prevOp
            )
          );
          return { id: op.id, result: null, error: err };
        }
      });

      return Promise.all(promises);
    };

    // Execute in batches
    const results = [];
    for (let i = 0; i < pending.length; i += concurrency) {
      const batch = pending.slice(i, i + concurrency);
      const batchResults = await executeBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }, [operations]);

  const reset = useCallback(() => {
    setOperations([]);
  }, []);

  return {
    operations,
    addOperation,
    executeAll,
    reset,
    completed: operations.filter(op => op.status === 'completed').length,
    failed: operations.filter(op => op.status === 'error').length,
    pending: operations.filter(op => op.status === 'pending').length,
    running: operations.filter(op => op.status === 'running').length,
  };
}

