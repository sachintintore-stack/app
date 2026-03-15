import { useEffect, useState } from 'react';
import * as analyticsService from '../services/analyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Clock,
  Target,
  BarChart3,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function Analytics() {
  const [productivityData, setProductivityData] = useState<any>(null);
  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [productivityRes, assignmentRes] = await Promise.all([
        analyticsService.getProductivityAnalytics(30),
        analyticsService.getAssignmentAnalytics(30),
      ]);
      
      if (productivityRes.success) {
        setProductivityData(productivityRes.data);
      }
      if (assignmentRes.success) {
        setAssignmentData(assignmentRes.data);
      }
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#7c3aed]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-[#94a3b8] mt-1">
          Track your productivity and study patterns
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#7c3aed]" />
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Total Study Time</p>
                <p className="text-xl font-bold text-white">
                  {productivityData?.summary?.totalHours || 0}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Avg Daily</p>
                <p className="text-xl font-bold text-white">
                  {productivityData?.summary?.avgDailyMinutes || 0}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#f59e0b]" />
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Completion Rate</p>
                <p className="text-xl font-bold text-white">
                  {assignmentData?.summary?.completionRate || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ec4899]/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#ec4899]" />
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">On-Time Rate</p>
                <p className="text-xl font-bold text-white">
                  {assignmentData?.summary?.onTimeRate || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Study Chart */}
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#7c3aed]" />
              Daily Study Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productivityData?.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="minutes" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-[#ec4899]" />
              Study Time by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productivityData?.dayOfWeekData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="minutes"
                  >
                    {(productivityData?.dayOfWeekData || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Productivity */}
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#f59e0b]" />
              Productivity by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productivityData?.hourlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#94a3b8"
                    tickFormatter={(value) => `${value}:00`}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => `${value}:00`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minutes" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Trends */}
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#10b981]" />
              Assignment Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assignmentData?.weeklyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="created" fill="#7c3aed" name="Created" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Analysis */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Priority Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {assignmentData?.priorityAnalysis?.map((item: any) => (
              <div key={item.priority} className="p-4 rounded-xl bg-[#0f172a]">
                <p className="text-[#94a3b8] text-sm capitalize">{item.priority} Priority</p>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-2xl font-bold text-white">{item.completed}/{item.total}</p>
                    <p className="text-sm text-[#10b981]">{item.rate}% completed</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    item.priority === 'urgent' ? 'bg-[#ef4444]' :
                    item.priority === 'high' ? 'bg-[#f59e0b]' :
                    item.priority === 'medium' ? 'bg-[#7c3aed]' :
                    'bg-[#10b981]'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
