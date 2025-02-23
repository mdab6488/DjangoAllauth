"use client";

import { useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { AxiosError } from 'axios';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AxiosError | Error) => void;
  autoRefreshToken?: boolean;
}

export const useApi = <T>(options: UseApiOptions<T> = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | AxiosError | null>(null);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (url: string, method = 'GET', body?: Record<string, unknown>) => {
      // Abort any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      setError(null);

      try {
        const response = await api({
          url,
          method,
          data: body,
          signal: abortControllerRef.current.signal,
        });
        setData(response.data);
        options.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        // Handle request abortion
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        // Handle other errors
        const error = err as AxiosError | Error;
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [options]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { data, error, loading, execute, abort };
};