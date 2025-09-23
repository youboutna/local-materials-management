import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, Edit, Trash2, Calendar, User, AlertCircle, CheckCircle, Clock, Filter, 
  Target, DollarSign, TrendingUp, Link, ArrowRight
} from 'lucide-react';

interface EnhancedTaskManagerProps {
  projectId: string;
}

interface TaskAssignmentExtended {
  id: string;
  title: string | null;
  description: string | null;
  project_id: string | null;
  phase_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  completion_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Enhanced fields
  estimated_duration: number | null;
  actual_duration: number | null;
  start_date: string | null;
  end_date: string | null;
  progress: number | null;
  weight: number | null;
  cost_estimate: number | null;
  actual_cost: number | null;
  optimistic_estimate: number | null;
  pessimistic_estimate: number | null;
  most_likely_estimate: number | null;
  critical_path: boolean | null;
}

interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string | null;
  lag_days: number | null;
}

interface ProjectPhase {
  id: string;
  phase_name: string;
  status: string;
}

interface TaskFormData {
  title: string;
  description: string;
  phase_id: string;
  assigned_to: string;
  due_date: string;
  priority: string;
  status: string;
  notes: string;
  estimated_duration: string;
  start_date: string;
  end_date: string;
  weight: string;
  cost_estimate: string;
  optimistic_estimate: string;
  pessimistic_estimate: string;
  most_likely_estimate: string;
  critical_path: boolean;
}

const EnhancedTaskManager: React.FC<EnhancedTaskManagerProps> = ({ projectId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showDependencies, setShowDependencies] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    phase_id: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    notes: '',
    estimated_duration: '',
    start_date: '',
    end_date: '',
    weight: '0.1',
    cost_estimate: '',
    optimistic_estimate: '',
    pessimistic_estimate: '',
    most_likely_estimate: '',
    critical_path: false,
  });
  
  const queryClient = useQueryClient();

  // Fetch project phases
  const { data: phases } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, status, construction_phase, construction_stage')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employees for assignment
  const { data: employees } = useQuery({
    queryKey: ['project-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch enhanced tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['enhanced-project-tasks', projectId],
    queryFn: async (): Promise<TaskAssignmentExtended[]> => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch task dependencies
  const { data: dependencies } = useQuery({
    queryKey: ['task-dependencies', projectId],
    queryFn: async (): Promise<TaskDependency[]> => {
      if (!tasks?.length) return [];
      
      const taskIds = tasks.map(t => t.id);
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .in('task_id', taskIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!tasks?.length,
  });

  // Filter tasks based on selected phase and status
  const filteredTasks = tasks?.filter(task => {
    const phaseMatch = selectedPhase === 'all' || task.phase_id === selectedPhase;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    return phaseMatch && statusMatch;
  }) || [];

  // Calculate project metrics
  const projectMetrics = React.useMemo(() => {
    if (!filteredTasks.length) return { totalCost: 0, totalProgress: 0, criticalPathTasks: 0 };
    
    const totalCost = filteredTasks.reduce((sum, task) => sum + (task.actual_cost || task.cost_estimate || 0), 0);
    const totalProgress = filteredTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / filteredTasks.length;
    const criticalPathTasks = filteredTasks.filter(task => task.critical_path).length;
    
    return { totalCost, totalProgress, criticalPathTasks };
  }, [filteredTasks]);

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          title: taskData.title,
          description: taskData.description,
          project_id: projectId,
          phase_id: taskData.phase_id === 'no-phase' ? null : taskData.phase_id || null,
          assigned_to: taskData.assigned_to || null,
          assigned_by: user.id,
          due_date: taskData.due_date || null,
          priority: taskData.priority,
          status: taskData.status,
          notes: taskData.notes,
          estimated_duration: taskData.estimated_duration ? parseInt(taskData.estimated_duration) : null,
          start_date: taskData.start_date || null,
          end_date: taskData.end_date || null,
          weight: taskData.weight ? parseFloat(taskData.weight) : 0.1,
          cost_estimate: taskData.cost_estimate ? parseFloat(taskData.cost_estimate) : null,
          optimistic_estimate: taskData.optimistic_estimate ? parseInt(taskData.optimistic_estimate) : null,
          pessimistic_estimate: taskData.pessimistic_estimate ? parseInt(taskData.pessimistic_estimate) : null,
          most_likely_estimate: taskData.most_likely_estimate ? parseInt(taskData.most_likely_estimate) : null,
          critical_path: taskData.critical_path,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-tasks', projectId] });
      setIsCreating(false);
      resetForm();
      toast({ title: 'Tâche créée avec succès' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      const updateData: any = { ...data };
      
      // Convert string fields to appropriate types
      if (updateData.estimated_duration) updateData.estimated_duration = parseInt(updateData.estimated_duration);
      if (updateData.weight) updateData.weight = parseFloat(updateData.weight);
      if (updateData.cost_estimate) updateData.cost_estimate = parseFloat(updateData.cost_estimate);
      if (updateData.optimistic_estimate) updateData.optimistic_estimate = parseInt(updateData.optimistic_estimate);
      if (updateData.pessimistic_estimate) updateData.pessimistic_estimate = parseInt(updateData.pessimistic_estimate);
      if (updateData.most_likely_estimate) updateData.most_likely_estimate = parseInt(updateData.most_likely_estimate);
      
      const { error } = await supabase
        .from('task_assignments')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-tasks', projectId] });
      setEditingId(null);
      resetForm();
      toast({ title: 'Tâche mise à jour avec succès' });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-tasks', projectId] });
      toast({ title: 'Tâche supprimée avec succès' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      phase_id: '',
      assigned_to: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
      notes: '',
      estimated_duration: '',
      start_date: '',
      end_date: '',
      weight: '0.1',
      cost_estimate: '',
      optimistic_estimate: '',
      pessimistic_estimate: '',
      most_likely_estimate: '',
      critical_path: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTaskMutation.mutate({ id: editingId, data: formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  const startEdit = (task: TaskAssignmentExtended) => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      phase_id: task.phase_id || '',
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      notes: task.notes || '',
      estimated_duration: task.estimated_duration?.toString() || '',
      start_date: task.start_date || '',
      end_date: task.end_date || '',
      weight: task.weight?.toString() || '0.1',
      cost_estimate: task.cost_estimate?.toString() || '',
      optimistic_estimate: task.optimistic_estimate?.toString() || '',
      pessimistic_estimate: task.pessimistic_estimate?.toString() || '',
      most_likely_estimate: task.most_likely_estimate?.toString() || '',
      critical_path: task.critical_path || false,
    });
    setEditingId(task.id);
    setIsCreating(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTaskDependencies = (taskId: string) => {
    return dependencies?.filter(dep => dep.task_id === taskId) || [];
  };

  const getDependentTasks = (taskId: string) => {
    return dependencies?.filter(dep => dep.depends_on_task_id === taskId) || [];
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des tâches...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Project Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Coût Total</p>
                <p className="text-2xl font-bold">{projectMetrics.totalCost.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Progression Moyenne</p>
                <p className="text-2xl font-bold">{projectMetrics.totalProgress.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Chemin Critique</p>
                <p className="text-2xl font-bold">{projectMetrics.criticalPathTasks} tâches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Tâches Avancées ({filteredTasks.length})
            </CardTitle>
            <div className="flex gap-2">
              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les phases</SelectItem>
                  {phases?.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.phase_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
              
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setEditingId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle tâche
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? 'Modifier la tâche' : 'Nouvelle tâche avancée'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phase_id">Phase *</Label>
                        <Select
                          value={formData.phase_id}
                          onValueChange={(value) => setFormData({ ...formData, phase_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une phase" />
                          </SelectTrigger>
                          <SelectContent>
                            {phases?.map((phase) => (
                              <SelectItem key={phase.id} value={phase.id}>
                                {phase.phase_name}
                                {(phase as any).construction_phase && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({(phase as any).construction_phase})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="assigned_to">Assigné à</Label>
                        <Select
                          value={formData.assigned_to}
                          onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un responsable" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Non assigné</SelectItem>
                            {employees?.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.full_name}
                                {employee.position && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({employee.position})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="priority">Priorité</Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Statut</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="completed">Terminée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="start_date">Date de début</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">Date de fin</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="due_date">Date d'échéance</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="estimated_duration">Durée estimée (jours)</Label>
                        <Input
                          id="estimated_duration"
                          type="number"
                          value={formData.estimated_duration}
                          onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Poids (0-1)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cost_estimate">Coût estimé (€)</Label>
                        <Input
                          id="cost_estimate"
                          type="number"
                          value={formData.cost_estimate}
                          onChange={(e) => setFormData({ ...formData, cost_estimate: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="critical_path"
                          checked={formData.critical_path}
                          onCheckedChange={(checked) => setFormData({ ...formData, critical_path: !!checked })}
                        />
                        <Label htmlFor="critical_path">Chemin critique</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="optimistic_estimate">Estimation optimiste (jours)</Label>
                        <Input
                          id="optimistic_estimate"
                          type="number"
                          value={formData.optimistic_estimate}
                          onChange={(e) => setFormData({ ...formData, optimistic_estimate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="most_likely_estimate">Estimation la plus probable (jours)</Label>
                        <Input
                          id="most_likely_estimate"
                          type="number"
                          value={formData.most_likely_estimate}
                          onChange={(e) => setFormData({ ...formData, most_likely_estimate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pessimistic_estimate">Estimation pessimiste (jours)</Label>
                        <Input
                          id="pessimistic_estimate"
                          type="number"
                          value={formData.pessimistic_estimate}
                          onChange={(e) => setFormData({ ...formData, pessimistic_estimate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingId ? 'Mettre à jour' : 'Créer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks && filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const taskPhase = phases?.find(p => p.id === task.phase_id);
                const taskDeps = getTaskDependencies(task.id);
                const dependentTasks = getDependentTasks(task.id);
                
                return (
                  <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          {task.critical_path && (
                            <Badge variant="destructive" className="text-xs">
                              <Target className="h-3 w-3 mr-1" />
                              Critique
                            </Badge>
                          )}
                          {taskPhase && (
                            <Badge variant="secondary" className="text-xs">
                              {taskPhase.phase_name}
                            </Badge>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}
                        
                        {task.progress !== null && (
                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progression</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={getPriorityColor(task.priority || 'medium')}>
                            {task.priority === 'urgent' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {task.priority === 'high' ? 'Élevée' : 
                             task.priority === 'medium' ? 'Moyenne' : 
                             task.priority === 'urgent' ? 'Urgente' : 'Faible'}
                          </Badge>
                          
                          <Badge className={getStatusColor(task.status || 'pending')}>
                            {task.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {task.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
                            {task.status === 'completed' ? 'Terminée' : 
                             task.status === 'in_progress' ? 'En cours' : 
                             task.status === 'cancelled' ? 'Annulée' : 'En attente'}
                          </Badge>
                          
                          {task.due_date && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </Badge>
                          )}
                          
                          {task.cost_estimate && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {task.cost_estimate.toLocaleString()}€
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                          {task.estimated_duration && (
                            <div>Durée: {task.estimated_duration}j</div>
                          )}
                          {task.weight && (
                            <div>Poids: {(task.weight * 100).toFixed(1)}%</div>
                          )}
                          {task.start_date && (
                            <div>Début: {new Date(task.start_date).toLocaleDateString()}</div>
                          )}
                          {task.end_date && (
                            <div>Fin: {new Date(task.end_date).toLocaleDateString()}</div>
                          )}
                        </div>
                        
                        {(taskDeps.length > 0 || dependentTasks.length > 0) && (
                          <div className="mt-2 text-xs">
                            {taskDeps.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Link className="h-3 w-3" />
                                <span>Dépend de {taskDeps.length} tâche(s)</span>
                              </div>
                            )}
                            {dependentTasks.length > 0 && (
                              <div className="flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" />
                                <span>{dependentTasks.length} tâche(s) dépendante(s)</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {task.assigned_to && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Assigné à: {task.assigned_to}
                          </p>
                        )}
                        
                        {task.notes && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Notes: {task.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => startEdit(task)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune tâche assignée pour ce projet.
              {selectedPhase !== 'all' || selectedStatus !== 'all' ? ' Essayez de changer les filtres.' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTaskManager;