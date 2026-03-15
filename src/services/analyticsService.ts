import api from './api';
import type { DashboardStats, ApiResponse } from '../types';

interface ProductivityAnalytics {
  dailyData: {
    date: string;
    minutes: number;
    sessions: number;
  }[];
  summary: {
    totalMinutes: number;
    totalHours: number;
    avgDailyMinutes: number;
    bestDay: {
      date: string;
      minutes: number;
    } | null;
    bestHour: {
      hour: number;
      minutes: number;
    } | null;
  };
  dayOfWeekData: {
    day: string;
    minutes: number;
    sessions: number;
  }[];
  hourlyData: {
    hour: number;
    minutes: number;
    sessions: number;
  }[];
}

interface AssignmentAnalytics {
  summary: {
    totalCreated: number;
    completed: number;
    completionRate: number;
    avgCompletionTime: number;
    onTimeRate: number;
  };
  priorityAnalysis: {
    priority: string;
    total: number;
    completed: number;
    rate: number;
  }[];
  weeklyTrend: {
    week: string;
    created: number;
    completed: number;
  }[];
}

export const getDashboardAnalytics = async (): Promise<ApiResponse<DashboardStats>> => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

export const getProductivityAnalytics = async (range: number = 30): Promise<ApiResponse<ProductivityAnalytics>> => {
  const response = await api.get(`/analytics/productivity?range=${range}`);
  return response.data;
};

export const getAssignmentAnalytics = async (range: number = 30): Promise<ApiResponse<AssignmentAnalytics>> => {
  const response = await api.get(`/analytics/assignments?range=${range}`);
  return response.data;
};
