import api from './api';
import type { StudySession, ApiResponse } from '../types';

interface StudySessionsResponse {
  sessions: StudySession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StudyStats {
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  todayMinutes: number;
  studyStreak: number;
  lastStudyDate?: string;
  subjectStats: {
    subject: string;
    totalMinutes: number;
    sessionCount: number;
  }[];
  weeklyData: {
    day: string;
    minutes: number;
  }[];
}

export const getStudySessions = async (filters: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<StudySessionsResponse>> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  });
  
  const response = await api.get(`/study-sessions?${params.toString()}`);
  return response.data;
};

export const getStudySession = async (id: string): Promise<ApiResponse<{ session: StudySession }>> => {
  const response = await api.get(`/study-sessions/${id}`);
  return response.data;
};

export const createStudySession = async (data: Partial<StudySession>): Promise<ApiResponse<{ session: StudySession }>> => {
  const response = await api.post('/study-sessions', data);
  return response.data;
};

export const updateStudySession = async (id: string, data: Partial<StudySession>): Promise<ApiResponse<{ session: StudySession }>> => {
  const response = await api.put(`/study-sessions/${id}`, data);
  return response.data;
};

export const deleteStudySession = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/study-sessions/${id}`);
  return response.data;
};

export const startStudySession = async (id: string): Promise<ApiResponse<{ session: StudySession }>> => {
  const response = await api.post(`/study-sessions/${id}/start`);
  return response.data;
};

export const completeStudySession = async (id: string): Promise<ApiResponse<{ session: StudySession }>> => {
  const response = await api.post(`/study-sessions/${id}/complete`);
  return response.data;
};

export const getStudyStats = async (): Promise<ApiResponse<StudyStats>> => {
  const response = await api.get('/study-sessions/stats/overview');
  return response.data;
};
