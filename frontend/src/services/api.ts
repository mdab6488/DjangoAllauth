import axios, { 
  AxiosError, 
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import { refreshToken } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1/auth/',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling auth and errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      
      try {
        const refreshed = await refreshToken();
        
        if (refreshed) {
          // Update token and retry original request
          const token = localStorage.getItem('token');
          if (token) {
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            return api(originalRequest);
          }
        }
        
        // If refresh failed or no new token, redirect to login
        throw new Error('Token refresh failed');
        
      } catch (refreshError) {
        // Clear auth state and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;