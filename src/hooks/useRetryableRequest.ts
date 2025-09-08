import { useCallback } from 'react';
import { showError } from "@/utils/toast";

interface RetryConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

/**
 * Hook for making retryable requests with timeout handling
 * Provides exponential backoff and graceful failure handling
 */
export const useRetryableRequest = () => {
  const executeWithRetry = useCallback(async <T>(
    requestFn: () => Promise<T>,
    config: RetryConfig = {},
    context: string = 'request'
  ): Promise<T | null> => {
    const {
      maxRetries = 2,
      retryDelayMs = 1000,
      timeoutMs = 10000
    } = config;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create timeout promise that resolves with timeout flag
        const timeoutPromise = new Promise<{ isTimeout: true; data: null; error: Error }>((resolve) => {
          setTimeout(() => resolve({
            isTimeout: true,
            data: null,
            error: new Error(`${context} timed out after ${timeoutMs}ms`)
          }), timeoutMs);
        });

        // Wrap the actual request to include timeout flag
        const requestPromise = requestFn().then(data => ({
          isTimeout: false,
          data,
          error: null
        }));

        const result = await Promise.race([requestPromise, timeoutPromise]);

        if (result.isTimeout) {
          const timeoutError = new Error(`${context} timed out after ${timeoutMs}ms`);
          lastError = timeoutError;
          
          if (attempt === maxRetries) {
            console.warn(`${context} failed after ${maxRetries + 1} attempts (final timeout)`);
            showError(`${context} tardó demasiado en responder. Intenta recargar la página.`);
            return null;
          }
          
          console.warn(`${context} timed out on attempt ${attempt + 1}/${maxRetries + 1}, retrying...`);
        } else if (result.error) {
          throw result.error;
        } else {
          // Success case
          return result.data;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          console.error(`${context} failed after ${maxRetries + 1} attempts:`, lastError);
          // Only show error toast for non-timeout errors
          if (!lastError.message.includes('timed out')) {
            showError(`Error al cargar ${context.toLowerCase()}.`);
          }
          return null;
        }
        
        console.warn(`${context} failed on attempt ${attempt + 1}/${maxRetries + 1}, retrying...`, lastError);
      }

      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = retryDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return null;
  }, []);

  return { executeWithRetry };
};