import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  signup: (data: SignupData) =>
    apiClient.post<AuthResponse>('/api/auth/signup', data),

  login: (data: LoginData) =>
    apiClient.post<AuthResponse>('/api/auth/login', data),

  getProfile: () =>
    apiClient.get<User>('/api/auth/profile'),
};
