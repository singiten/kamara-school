// src/services/auth.ts
import { api } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  data: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authService = {
  // ✅ Login - sends request to backend
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // ✅ Register
  async register(data: any): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // ✅ Get current user
  async getMe(): Promise<any> {
    const response = await api.get('/users/me');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};