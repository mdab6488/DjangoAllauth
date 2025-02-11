export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  }
  
  export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
  }
  