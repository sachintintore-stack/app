import { useEffect, useState } from 'react';
import type { StudySession } from '../types';
import * as studySessionService from '../services/studySessionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
// Select components removed - not used
import {
  Plus,
  Calendar,
  Clock,
  Play,
  CheckCircle,
  Trash2,
  Edit,
  MoreVertical,
  Timer,
  Flame,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusColors = {
  scheduled: 'bg-[#7c3aed]',
  in_progress: 'bg-[#f59e0b]',
  completed: 'bg-[#10b981]',
  cancelled: 'bg-[#94a3b8]',
};

export default function StudyPlanner() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        studySessionService.getStudySessions(),
        studySessionService.getStudyStats(),
      ]);
      
      if (sessionsRes.success) {
        setSessions(sessionsRes.data.sessions);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      toast.error('Failed to load study data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSession) {
        await studySessionService.updateStudySession(editingSession.id, formData);
        toast.success('Study session updated');
      } else {
        await studySessionService.createStudySession(formData);
        toast.success('Study session scheduled');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(editingSession ? 'Failed to update session' : 'Failed to create session');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    
    try {
      await studySessionService.deleteStudySession(id);
      toast.success('Session deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete session');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await studySessionService.startStudySession(id);
      setActiveSession(id);
      toast.success('Study session started!');
      fetchData();
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await studySessionService.completeStudySession(id);
      setActiveSession(null);
      toast.success('Study session completed! Great job!');
      fetchData();
    } catch (error) {
      toast.error('Failed to complete session');
    }
  };

  const openEditDialog = (session: StudySession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      subject: session.subject || '',
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: session.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
      notes: session.notes || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSession(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      startTime: '',
      endTime: '',
      notes: '',
    });
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Study Planner</h1>
          <p className="text-[#94a3b8] mt-1">
            Schedule and track your study sessions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899]"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e293b] border-purple-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingSession ? 'Edit Study Session' : 'Schedule Study Session'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-[#0f172a] border-purple-500/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-white">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-[#0f172a] border-purple-500/30 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-white">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="bg-[#0f172a] border-purple-500/30 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-white">End Time (Optional)</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="bg-[#0f172a] border-purple-500/30 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-white">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#0f172a] border-purple-500/30 text-white"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899]">
                {editingSession ? 'Update Session' : 'Schedule Session'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm">Total Sessions</p>
                <p className="text-2xl font-bold text-white">{stats?.totalSessions || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#7c3aed]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm">Total Hours</p>
                <p className="text-2xl font-bold text-white">{stats?.totalHours || 0}h</p>
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
                <p className="text-[#94a3b8] text-sm">This Week</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round((stats?.weeklyMinutes || 0) / 60 * 10) / 10}h
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#f59e0b]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm">Study Streak</p>
                <p className="text-2xl font-bold text-white">{stats?.studyStreak || 0} days</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Session Alert */}
      {activeSession && (
        <Card className="bg-gradient-to-r from-[#f59e0b]/20 to-[#f59e0b]/10 border-[#f59e0b]/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f59e0b] flex items-center justify-center animate-pulse">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Study Session in Progress</p>
                <p className="text-sm text-[#94a3b8]">Keep focusing! You're doing great!</p>
              </div>
            </div>
            <Button 
              onClick={() => handleComplete(activeSession)}
              className="bg-[#10b981] hover:bg-[#10b981]/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
              <p className="text-[#94a3b8]">No study sessions scheduled</p>
              <Button 
                className="mt-4 bg-gradient-to-r from-[#7c3aed] to-[#ec4899]"
                onClick={openCreateDialog}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Your First Session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${statusColors[session.status]}`} />
                    <div>
                      <p className="font-medium text-white">{session.title}</p>
                      {session.subject && (
                        <p className="text-sm text-[#94a3b8]">{session.subject}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-[#94a3b8]">
                          {new Date(session.startTime).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-[#94a3b8]">
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {session.duration && (
                          <span className="text-sm text-[#10b981]">
                            {Math.round(session.duration / 60 * 10) / 10}h
                          </span>
                        )}
                        <Badge className={`${statusColors[session.status]} text-white`}>
                          {session.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleStart(session.id)}
                        className="bg-[#f59e0b] hover:bg-[#f59e0b]/90"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1e293b] border-purple-500/30">
                        <DropdownMenuItem onClick={() => openEditDialog(session)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(session.id)}
                          className="text-[#ef4444]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}