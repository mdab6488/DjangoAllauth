import api from './api';
import { AuthResponse } from '../types';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login/', { email, password });
  return response.data;
};

export const register = async (email: string, password1: string, password2: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/registration/', {
    email,
    password1,
    password2,
  });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/api/profile/');
  return response.data;
};