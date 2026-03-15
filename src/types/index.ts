export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'user' | 'admin';
  subscriptionPlan: 'free' | 'monthly' | 'yearly';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  studyStreak: number;
  lastStudyDate?: string;
  totalStudyMinutes: number;
  emailNotifications: boolean;
  reminderTime: number;
  createdAt: string;
}

export interface Assignment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  estimatedHours?: number;
  actualHours: number;
  reminderSent: boolean;
  reminderSentAt?: string;
  completedAt?: string;
  attachments: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  assignmentId?: string;
  title: string;
  subject?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  productivityRating?: number;
  breakCount: number;
  pomodoroSessions: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  plan: 'monthly' | 'yearly';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  assignmentId?: string;
  type: 'deadline' | 'study_session' | 'streak' | 'custom';
  title: string;
  message: string;
  scheduledAt: string;
  sentAt?: string;
  sentVia: 'email' | 'push' | 'in_app';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  assignments: {
    total: number;
    pending: number;
    completed: number;
    dueToday: number;
    dueThisWeek: number;
    overdue: number;
    completionRate: number;
  };
  study: {
    totalSessions: number;
    totalMinutes: number;
    totalHours: number;
    thisWeekMinutes: number;
    weeklyChart: { day: string; minutes: number }[];
  };
  recentActivity: Assignment[];
  upcomingDeadlines: Assignment[];
}

export interface SubscriptionData {
  plan: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  daysRemaining: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
