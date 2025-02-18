import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { getUserProfile, refreshToken } from '../services/auth';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (err: any) {
        // If token expired, try to refresh
        if (err.response?.status === 401) {
          try {
            const refreshed = await refreshToken();
            if (refreshed) {
              const userData = await getUserProfile();
              setUser(userData);
            } else {
              throw new Error('Failed to refresh token');
            }
          } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr);
            setError('Session expired. Please log in again.');
            logout();
          }
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Authentication failed');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  return { 
    user, 
    loading, 
    error, 
    logout,
    isAuthenticated: !!user,
    checkAuth
  };
};
