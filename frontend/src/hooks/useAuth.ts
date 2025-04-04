import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { 
  getUserProfile, 
  refreshToken, 
  login as apiLogin, 
  register as apiSignup 
} from '../services/auth';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

// Define SignupFormInputs if not already defined
export interface SignupFormInputs {
  email: string;
  password: string;
  name?: string;
  // Add other signup-related fields as needed
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupFormInputs) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isAxiosError = (error: unknown): error is AxiosError => {
    return (error as AxiosError).isAxiosError === true;
  };

  // Login method implementation
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { access, user } = await apiLogin(email, password);
      localStorage.setItem('token', access);
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Signup method implementation
  const signup = useCallback(async (data: SignupFormInputs) => {
    setLoading(true);
    setError(null);
    
    try {
      const { email, password, name } = data;
      const { access, user } = await apiSignup(email, password, name || '');
      localStorage.setItem('token', access);
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    setUser(null);
    router.push('/login');
  }, [router]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 401) {
          try {
            await refreshToken();
            const userData = await getUserProfile();
            setUser(userData);
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
      if (err instanceof Error) {
        setError(err.message);
      }
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    checkAuth,
  };
};