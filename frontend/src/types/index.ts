export interface User {
  id: number; // Unique identifier for the user
  email: string; // User's email address
  firstName?: string; // Optional: User's first name
  lastName?: string; // Optional: User's last name
  isActive?: boolean; // User account status
  dateJoined?: string; // ISO date string when the user joined
}

/**
 * Represents the response from the authentication API.
 */
export interface AuthResponse {
  access: string; // Access token for authenticated requests
  refresh: string; // Refresh token for obtaining new access tokens
  user: User; // User details
}

/**
 * Represents the context object for dynamic route handlers.
 */
export type RouteContext = {
  params: {
    path: string[]; // Array of path segments for dynamic routes
  };
};

/**
 * API Error response structure
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Auth state
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}