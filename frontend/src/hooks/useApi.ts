import { useState, useCallback } from 'react';
import api from '../services/api';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export const useApi = <T>(options: UseApiOptions<T> = {}) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (url: string, method = 'GET', body?: any) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api({
          url,
          method,
          data: body,
        });
        setData(response.data);
        options.onSuccess?.(response.data);
        return response.data;
      } catch (err) {
        setError(err);
        options.onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { data, error, loading, execute };
};