import api from './api';
import type { AuthResponse, ApiResponse, User } from '../types';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getCurrentUser = async (): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
  const response = await api.put('/auth/change-password', { currentPassword, newPassword });
  return response.data;
};
