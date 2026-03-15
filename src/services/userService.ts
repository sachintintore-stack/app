import api from './api';
import type { User, ApiResponse, Reminder } from '../types';

interface UserStats {
  assignments: {
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    bySubject: {
      subject: string;
      count: number;
    }[];
  };
  study: {
    totalMinutes: number;
    totalHours: number;
    weeklyMinutes: number;
    monthlyMinutes: number;
    streak: number;
    lastStudyDate?: string;
  };
}

interface NotificationsResponse {
  notifications: Reminder[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getProfile = async (): Promise<ApiResponse<{
  user: User;
  stats: {
    totalAssignments: number;
    completedAssignments: number;
    completionRate: number;
    totalStudySessions: number;
    totalStudyHours: number;
  };
}>> => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
  const response = await api.put('/users/profile', data);
  return response.data;
};

export const getUserStats = async (): Promise<ApiResponse<UserStats>> => {
  const response = await api.get('/users/stats');
  return response.data;
};

export const getNotifications = async (page: number = 1, limit: number = 20): Promise<ApiResponse<NotificationsResponse>> => {
  const response = await api.get(`/users/notifications?page=${page}&limit=${limit}`);
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.put(`/users/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<ApiResponse<void>> => {
  const response = await api.put('/users/notifications/read-all');
  return response.data;
};

export const deleteAccount = async (): Promise<ApiResponse<void>> => {
  const response = await api.delete('/users/account');
  return response.data;
};
