import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { DashboardStats } from '../types';
import * as analyticsService from '../services/analyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Flame,
  ArrowRight,
  Plus,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await analyticsService.getDashboardAnalytics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
      </div>
    );
  }

  const assignmentStats = stats?.assignments;
  const studyStats = stats?.study;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-[#94a3b8] mt-1">
            Here's what's happening with your studies today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/assignments">
            <Button variant="outline" className="border-purple-500/30">
              <ClipboardList className="w-4 h-4 mr-2" />
              View Assignments
            </Button>
          </Link>
          <Link to="/assignments">
            <Button className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899]">
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm">Total Assignments</p>
                <p className="text-2xl font-bold text-white">{assignmentStats?.total || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[#7c3aed]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm">Due Today</p>
                <p className="text-2xl font-bold text-white">{assignmentStats?.dueToday || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[#f59e0b]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm">Study Hours</p>
                <p className="text-2xl font-bold text-white">{studyStats?.totalHours || 0}h</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#10b981]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm">Study Streak</p>
                <p className="text-2xl font-bold text-white">{user?.studyStreak || 0} days</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Study Chart */}
        <Card className="lg:col-span-2 bg-[#1e293b] border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#7c3aed]" />
              Weekly Study Activity
            </CardTitle>
            <Link to="/analytics">
              <Button variant="ghost" size="sm" className="text-[#7c3aed]">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyStats?.weeklyChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Bar
                    dataKey="minutes"
                    fill="url(#colorGradient)"
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Progress */}
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#10b981]" />
              Assignment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#94a3b8]">Completion Rate</span>
                <span className="text-white font-medium">
                  {assignmentStats?.completionRate || 0}%
                </span>
              </div>
              <Progress
                value={assignmentStats?.completionRate || 0}
                className="h-2 bg-[#0f172a]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#0f172a]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                  <span className="text-[#94a3b8]">Pending</span>
                </div>
                <span className="text-white font-medium">{assignmentStats?.pending || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#0f172a]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                  <span className="text-[#94a3b8]">Completed</span>
                </div>
                <span className="text-white font-medium">{assignmentStats?.completed || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[#0f172a]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                  <span className="text-[#94a3b8]">Overdue</span>
                </div>
                <span className="text-white font-medium">{assignmentStats?.overdue || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#f59e0b]" />
            Upcoming Deadlines
          </CardTitle>
          <Link to="/assignments">
            <Button variant="ghost" size="sm" className="text-[#7c3aed]">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingDeadlines.slice(0, 5).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a] hover:bg-[#0f172a]/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      assignment.priority === 'urgent' ? 'bg-[#ef4444]' :
                      assignment.priority === 'high' ? 'bg-[#f59e0b]' :
                      assignment.priority === 'medium' ? 'bg-[#7c3aed]' :
                      'bg-[#10b981]'
                    }`} />
                    <div>
                      <p className="font-medium text-white">{assignment.title}</p>
                      <p className="text-sm text-[#94a3b8]">{assignment.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#94a3b8]">
                      Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                    <p className={`text-xs ${
                      new Date(assignment.dueDate) < new Date() 
                        ? 'text-[#ef4444]' 
                        : 'text-[#94a3b8]'
                    }`}>
                      {new Date(assignment.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-[#10b981] mx-auto mb-3" />
              <p className="text-[#94a3b8]">No upcoming deadlines! You're all caught up.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Banner (for free users) */}
      {user?.subscriptionPlan === 'free' && (
        <Card className="bg-gradient-to-r from-[#7c3aed]/20 to-[#ec4899]/20 border-[#7c3aed]/30">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Upgrade to Pro</h3>
                <p className="text-[#94a3b8]">Unlock unlimited assignments and premium features</p>
              </div>
            </div>
            <Link to="/subscription">
              <Button className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899]">
                Upgrade Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
