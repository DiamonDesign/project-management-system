import { useEffect, useRef } from 'react';

/**
 * Hook to ensure loading states don't persist indefinitely
 * Automatically sets loading to false after the specified timeout
 */
export const useLoadingTimeout = (
  isLoading: boolean,
  setIsLoading: (loading: boolean) => void,
  timeoutMs: number = 15000 // 15 seconds default
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout to force loading to false
      timeoutRef.current = setTimeout(() => {
        console.warn(`Loading state timed out after ${timeoutMs}ms, forcing loading to false`);
        setIsLoading(false);
      }, timeoutMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    } else {
      // Clear timeout when loading becomes false naturally
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isLoading, setIsLoading, timeoutMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};