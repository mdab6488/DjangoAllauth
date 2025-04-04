"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import api from '../services/api';
import { AxiosError } from 'axios';

// Define the structure of options for the hook
interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AxiosError | Error) => void;
  autoRefreshToken?: boolean;
}

// Define the response structure for the hook
interface UseApiResponse<T> {
  data: T | null;
  error: AxiosError | Error | null;
  loading: boolean;
  execute: <B extends Record<string, unknown> | undefined>(
    url: string, 
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE', 
    body?: B
  ) => Promise<T>;
  abort: () => void;
}

export const useApi = <T>(options: UseApiOptions<T> = {}): UseApiResponse<T> => {
  // Memoize options to prevent unnecessary re-renders
  const { onSuccess, onError, autoRefreshToken } = options;
  const memoizedOptions = useMemo(() => ({ 
    onSuccess, 
    onError, 
    autoRefreshToken 
  }), [
    onSuccess,
    onError,
    autoRefreshToken
  ]);

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AxiosError | Error | null>(null);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Add cleanup effect to abort any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array ensures this runs only on unmount

  const execute = useCallback(
    async <B extends Record<string, unknown> | undefined>(
      url: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
      body?: B
    ): Promise<T> => {
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

        // Set data on successful response
        setData(response.data);
        memoizedOptions.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        // Handle request abortion
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Request was aborted');
          throw err;
        }

        // Handle 401 errors (unauthorized) and optionally refresh the token
        const error = err as AxiosError;
        if (memoizedOptions.autoRefreshToken && error.response?.status === 401) {
          try {
            // Call your refresh token service
            await refreshToken();
            
            // Retry original request with new token
            const retryResponse = await api({ 
              url,
              method,
              data: body,
              signal: abortControllerRef.current.signal,
            });
            return retryResponse.data;
          } catch (refreshError) {
            logout(); // Add logout if refresh fails
            throw refreshError;
          }
        }

        // Handle other errors
        console.error('API request failed:', error);
        setError(error);
        memoizedOptions.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [memoizedOptions]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { data, error, loading, execute, abort };
};

async function refreshToken() {
  try {
    const response = await api.post<{
      accessToken: string;
      refreshToken?: string;
    }>('/auth/refresh-token', {
      // Assuming the refresh token is stored in localStorage
      refreshToken: localStorage.getItem('refreshToken'),
    });

    // Update the access token in localStorage or wherever it's stored
    localStorage.setItem('accessToken', response.data.accessToken);

    // Optionally update the refresh token if a new one is provided
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }

    // Update the default Authorization header for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;

    return response.data;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
}

function logout() {
  // Clear tokens from localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // Optionally clear other user-related data
  localStorage.removeItem('user');

  // Redirect to login page or home page
  window.location.href = '/login';
}
