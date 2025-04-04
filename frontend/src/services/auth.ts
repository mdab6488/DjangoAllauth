import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL,
  timeout: 10000,
});

// User interface
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  dateJoined?: string;
}

// Simplified AuthResponse interface
export interface AuthResponse {
  access: string; // Primary access token
  refresh: string; // Refresh token
  user: User; // User details
}

// Helper to set the auth token in the instance
const setAuthToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

// Login function
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>('/auth/login/', { email, password });

    if (response.data.access && response.data.refresh) {
      // Store tokens and set Authorization header
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      setAuthToken(response.data.access);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorDetail = (error.response?.data as { detail?: string })?.detail;
      console.error('Login failed:', error.response?.data);
      throw new Error(errorDetail || 'Login failed');
    }
    throw error;
  }
};

// Register function
export const register = async (email: string, password1: string, password2: string): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>('/auth/register/', {
      email,
      password1,
      password2,
    });

    if (response.data.access && response.data.refresh) {
      // Store tokens and set Authorization header
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      setAuthToken(response.data.access);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorDetail = (error.response?.data as { detail?: string })?.detail;
      console.error('Registration failed:', error.response?.data);
      throw new Error(errorDetail || 'Registration failed');
    }
    throw error;
  }
};

// Refresh token function
export const refreshToken = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await axiosInstance.post<{ access: string }>('/auth/token/refresh/', {
      refresh: refreshToken,
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

// Get user profile function
export const getUserProfile = async (): Promise<User> => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
        setAuthToken(token);
    }

    const response = await axiosInstance.get<User>('/profile/');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching user profile:', error.message);
      console.error('Request Config:', error.config);
      console.error('Error Response:', error.response?.data);
    }
    throw error;
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await axiosInstance.post('/auth/logout/', { refresh: refreshToken });
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

// Optional: Auth State interface if needed
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Optional: Route Context type
export type RouteContext = {
  params: {
    path: string[];
  };
};

// Optional: API Error interface
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
};