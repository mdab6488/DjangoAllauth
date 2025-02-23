import axios, { AxiosError } from 'axios';
import { AuthResponse, User } from '../types';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1/auth/';

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
});

// Helper to set the auth token in the instance
const setAuthToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>('/auth/login/', { email, password });
    
    if (response.data.access && response.data.refresh) {
      // Set the tokens in localStorage
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      
      // Set the token for future requests
      setAuthToken(response.data.access);
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Login failed:', axiosError.response?.data);
      const errorDetail = (axiosError.response?.data as { detail?: string })?.detail;
      throw new Error(errorDetail || 'Login failed');
    }
    throw error;
  }
};

export const register = async (email: string, password1: string, password2: string): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>('/auth/registration/', {
      email,
      password1,
      password2,
    });
    
    if (response.data.access && response.data.refresh) {
      // Set the tokens in localStorage
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      
      // Set the token for future requests
      setAuthToken(response.data.access);
    }
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Registration failed:', axiosError.response?.data);
      const errorDetail = (axiosError.response?.data as { detail?: string })?.detail;
      throw new Error(errorDetail || 'Registration failed');
    }
    throw error;
  }
};

export const refreshToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await axiosInstance.post<{ access: string }>('/auth/token/refresh/', {
      refresh: refreshToken
    });
    
    if (response.data.access) {
      localStorage.setItem('token', response.data.access);
      setAuthToken(response.data.access);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

export const getUserProfile = async (): Promise<User> => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
    
    const response = await axiosInstance.get<User>('/profile/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios Error:', error.message);
      console.error('Request Config:', error.config);
      console.error('Error Response:', error.response?.data);
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await axiosInstance.post('/auth/logout/', {
        refresh: refreshToken
      });
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Clear tokens regardless of API success
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setAuthToken(null);
  }
};
