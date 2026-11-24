import apiClient from './api';
import type { TokenResponse, User } from '../types';

export const authService = {
  async register(email: string, full_name: string, password: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/register', {
      email,
      full_name,
      password,
    });
    return data;
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
};
