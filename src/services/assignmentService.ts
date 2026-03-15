import api from './api';
import type { Assignment, ApiResponse } from '../types';

interface AssignmentFilters {
  status?: string;
  priority?: string;
  subject?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

interface AssignmentsResponse {
  assignments: Assignment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: Record<string, number>;
}

export const getAssignments = async (filters: AssignmentFilters = {}): Promise<ApiResponse<AssignmentsResponse>> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });
  
  const response = await api.get(`/assignments?${params.toString()}`);
  return response.data;
};

export const getAssignment = async (id: string): Promise<ApiResponse<{ assignment: Assignment }>> => {
  const response = await api.get(`/assignments/${id}`);
  return response.data;
};

export const createAssignment = async (data: Partial<Assignment>): Promise<ApiResponse<{ assignment: Assignment }>> => {
  const response = await api.post('/assignments', data);
  return response.data;
};

export const updateAssignment = async (id: string, data: Partial<Assignment>): Promise<ApiResponse<{ assignment: Assignment }>> => {
  const response = await api.put(`/assignments/${id}`, data);
  return response.data;
};

export const deleteAssignment = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/assignments/${id}`);
  return response.data;
};

export const getUpcomingDeadlines = async (): Promise<ApiResponse<{ upcoming: Assignment[]; grouped: Record<string, Assignment[]>; total: number }>> => {
  const response = await api.get('/assignments/stats/upcoming');
  return response.data;
};

export const getDashboardStats = async (): Promise<ApiResponse<{
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  dueToday: number;
  overdueAssignments: number;
  highPriorityPending: number;
  recentAssignments: Assignment[];
  priorityDistribution: Record<string, number>;
}>> => {
  const response = await api.get('/assignments/stats/dashboard');
  return response.data;
};
