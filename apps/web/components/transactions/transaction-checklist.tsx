'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TransactionChecklistProps {
  transactionId: string;
  preview?: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  due_date: string;
  completed: boolean;
  completed_at: string;
  priority: string;
  assignee_name: string;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const categoryColors = {
  disclosures: 'bg-purple-100 text-purple-800',
  financing: 'bg-green-100 text-green-800',
  inspection: 'bg-blue-100 text-blue-800',
  appraisal: 'bg-yellow-100 text-yellow-800',
  title: 'bg-indigo-100 text-indigo-800',
  insurance: 'bg-cyan-100 text-cyan-800',
  repairs: 'bg-orange-100 text-orange-800',
  closing: 'bg-emerald-100 text-emerald-800',
  post_closing: 'bg-gray-100 text-gray-800',
  marketing: 'bg-pink-100 text-pink-800',
  legal: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800',
};

export function TransactionChecklist({ transactionId, preview = false }: TransactionChecklistProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'other',
    due_date: '',
    priority: 'medium',
  });
  const supabase = createClient();

  useEffect(() => {
    loadTasks();
  }, [transactionId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transaction_tasks')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('due_date', { ascending: true });

      if (!error && data) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('transaction_tasks')
        .update({
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
          completed_by: 'current-user-id', // You'll replace this with actual user ID
        })
        .eq('id', taskId);

      if (!error) {
        setTasks(tasks.map(task =>
          task.id === taskId
            ? { ...task, completed: !completed, completed_at: !completed ? new Date().toISOString() : undefined }
            : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_tasks')
        .insert({
          transaction_id: transactionId,
          title: newTask.title,
          description: newTask.description || null,
          category: newTask.category,
          due_date: newTask.due_date || null,
          priority: newTask.priority,
          assignee_name: 'Current User', // You'll replace this
        })
        .select()
        .single();

      if (!error && data) {
        setTasks([...tasks, data]);
        setNewTask({
          title: '',
          description: '',
          category: 'other',
          due_date: '',
          priority: 'medium',
        });
        setShowNewTask(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => 
      !t.completed && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filteredTasks = preview 
    ? tasks.filter(task => !task.completed).slice(0, 5)
    : tasks;

  return (
    <div className="space-y-6">
      {!preview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Task Form */}
      {showNewTask && !preview && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g., Schedule Home Inspection"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Additional details about this task..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  >
                    <option value="disclosures">Disclosures</option>
                    <option value="financing">Financing</option>
                    <option value="inspection">Inspection</option>
                    <option value="appraisal">Appraisal</option>
                    <option value="title">Title</option>
                    <option value="insurance">Insurance</option>
                    <option value="repairs">Repairs</option>
                    <option value="closing">Closing</option>
                    <option value="post_closing">Post-Closing</option>
                    <option value="marketing">Marketing</option>
                    <option value="legal">Legal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNewTask(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  disabled={!newTask.title}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  Create Task
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {preview ? 'No pending tasks' : 'No tasks yet'}
            </p>
            {!preview && (
              <Button
                className="mt-4"
                onClick={() => setShowNewTask(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date();
            
            return (
              <div
                key={task.id}
                className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                  task.completed ? 'bg-gray-50' : 'bg-white'
                } ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleTaskToggle(task.id, task.completed)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </span>
                      <Badge className={categoryColors[task.category as keyof typeof categoryColors]}>
                        {task.category}
                      </Badge>
                      {task.priority !== 'medium' && (
                        <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    {!preview && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {task.due_date && (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(task.due_date), 'MMM d, yyyy')}
                        {isOverdue && (
                          <Badge className="ml-2 bg-red-100 text-red-800">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    )}
                    {task.assignee_name && (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {task.assignee_name}
                      </div>
                    )}
                    {task.completed && task.completed_at && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed {format(new Date(task.completed_at), 'MMM d')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!preview && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setShowNewTask(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      )}

      {preview && tasks.filter(t => !t.completed).length > 5 && (
        <Button
          className="w-full"
          variant="ghost"
          onClick={() => {/* Navigate to full checklist */}}
        >
          View All Tasks ({tasks.filter(t => !t.completed).length})
        </Button>
      )}
    </div>
  );
}