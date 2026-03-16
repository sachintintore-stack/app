import { useEffect, useState } from 'react';
import type { Assignment } from '../types';
import * as assignmentService from '../services/assignmentService';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const priorityColors = {
  low: 'bg-[#10b981]',
  medium: 'bg-[#7c3aed]',
  high: 'bg-[#f59e0b]',
  urgent: 'bg-[#ef4444]',
};

const statusColors = {
  pending: 'bg-[#94a3b8]',
  in_progress: 'bg-[#7c3aed]',
  completed: 'bg-[#10b981]',
  overdue: 'bg-[#ef4444]',
};

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    subject: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    estimatedHours: string;
  }>({
    title: '',
    subject: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    estimatedHours: '',
  });

  useEffect(() => {
    fetchAssignments();
  }, [filterStatus, filterPriority, searchQuery]);

  const fetchAssignments = async () => {
    try {
      const response = await assignmentService.getAssignments({
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
        search: searchQuery || undefined,
      });
      if (response.success) {
        setAssignments(response.data.assignments);
      }
    } catch (error) {
      toast.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAssignment) {
        await assignmentService.updateAssignment(editingAssignment.id, {
          ...formData,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        });
        toast.success('Assignment updated successfully');
      } else {
        await assignmentService.createAssignment({
          ...formData,
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        });
        toast.success('Assignment created successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      if (error.response?.data?.upgradeRequired) {
        toast.error(error.response.data.message);
      } else {
        toast.error(editingAssignment ? 'Failed to update assignment' : 'Failed to create assignment');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await assignmentService.deleteAssignment(id);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'in_progress' | 'completed' | 'overdue') => {
    try {
      await assignmentService.updateAssignment(id, { status });
      toast.success('Status updated');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      subject: assignment.subject,
      description: assignment.description || '',
      dueDate: new Date(assignment.dueDate).toISOString().slice(0, 16),
      priority: assignment.priority,
      estimatedHours: assignment.estimatedHours?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAssignment(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      estimatedHours: '',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
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
          <h1 className="text-3xl font-bold text-white">Assignments</h1>
          <p className="text-[#94a3b8] mt-1">
            Manage and track all your assignments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899]"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1e293b] border-purple-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}
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
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#0f172a] border-purple-500/30 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-white">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="bg-[#0f172a] border-purple-500/30 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-white">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' | 'urgent' })}
                  >
                    <SelectTrigger className="bg-[#0f172a] border-purple-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-purple-500/30">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedHours" className="text-white">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                  className="bg-[#0f172a] border-purple-500/30 text-white"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899]">
                {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-[#1e293b] border-purple-500/20">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#0f172a] border-purple-500/30 text-white"
              />
            </div>
            <div className="flex gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-[#0f172a] border-purple-500/30 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-purple-500/30">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40 bg-[#0f172a] border-purple-500/30 text-white">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-purple-500/30">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card className="bg-[#1e293b] border-purple-500/20">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-[#10b981] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No assignments found</h3>
              <p className="text-[#94a3b8] mb-6">Get started by adding your first assignment</p>
              <Button 
                className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899]"
                onClick={openCreateDialog}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => {
            const daysUntilDue = getDaysUntilDue(assignment.dueDate);
            const isOverdue = daysUntilDue < 0 && assignment.status !== 'completed';
            
            return (
              <Card 
                key={assignment.id} 
                className={`bg-[#1e293b] border-purple-500/20 hover:border-purple-500/40 transition-all ${
                  isOverdue ? 'border-l-4 border-l-[#ef4444]' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleStatusChange(
                          assignment.id, 
                          assignment.status === 'completed' ? 'pending' : 'completed'
                        )}
                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          assignment.status === 'completed'
                            ? 'bg-[#10b981] border-[#10b981]'
                            : 'border-[#94a3b8] hover:border-[#7c3aed]'
                        }`}
                      >
                        {assignment.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <div>
                        <h3 className={`font-semibold text-lg ${
                          assignment.status === 'completed' ? 'line-through text-[#94a3b8]' : 'text-white'
                        }`}>
                          {assignment.title}
                        </h3>
                        <p className="text-[#94a3b8] text-sm">{assignment.subject}</p>
                        {assignment.description && (
                          <p className="text-[#64748b] text-sm mt-1">{assignment.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1 text-sm text-[#94a3b8]">
                            <Calendar className="w-4 h-4" />
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </div>
                          {assignment.estimatedHours && (
                            <div className="flex items-center gap-1 text-sm text-[#94a3b8]">
                              <Clock className="w-4 h-4" />
                              {assignment.estimatedHours}h estimated
                            </div>
                          )}
                          <Badge className={`${priorityColors[assignment.priority]} text-white`}>
                            {assignment.priority}
                          </Badge>
                          <Badge className={`${statusColors[assignment.status]} text-white`}>
                            {assignment.status.replace('_', ' ')}
                          </Badge>
                          {isOverdue && (
                            <Badge className="bg-[#ef4444] text-white">
                              {Math.abs(daysUntilDue)} days overdue
                            </Badge>
                          )}
                          {!isOverdue && daysUntilDue <= 3 && assignment.status !== 'completed' && (
                            <Badge className="bg-[#f59e0b] text-white">
                              {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days left`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1e293b] border-purple-500/30">
                        <DropdownMenuItem onClick={() => openEditDialog(assignment)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(assignment.id)}
                          className="text-[#ef4444]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
