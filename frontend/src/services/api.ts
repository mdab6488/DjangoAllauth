import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { refreshToken } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1/auth/',
  timeout: 10000, // 10 seconds timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token and handling other request modifications
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh and errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // If unauthorized error and not already retrying
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshed = await refreshToken();
        
        if (refreshed) {
          // Update the token in the request and retry
          const token = localStorage.getItem('token');
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;