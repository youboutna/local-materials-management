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
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, User, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';

interface EnhancedTaskListProps {
  projectId: string;
}

interface TaskAssignment {
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
  completion_token: string | null;
  completion_url: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
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
}

const EnhancedTaskList: React.FC<EnhancedTaskListProps> = ({ projectId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    phase_id: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    notes: '',
  });
  
  const queryClient = useQueryClient();

  // Fetch project phases
  const { data: phases } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, status')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tasks for the project with phase information
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async (): Promise<TaskAssignment[]> => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filter tasks based on selected phase and status
  const filteredTasks = tasks?.filter(task => {
    const phaseMatch = selectedPhase === 'all' || task.phase_id === selectedPhase;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    return phaseMatch && statusMatch;
  }) || [];

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
          phase_id: taskData.phase_id || null,
          assigned_to: taskData.assigned_to,
          assigned_by: user.id,
          due_date: taskData.due_date || null,
          priority: taskData.priority,
          status: taskData.status,
          notes: taskData.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      setIsCreating(false);
      resetForm();
      toast({ title: 'Tâche créée avec succès' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> }) => {
      const { error } = await supabase
        .from('task_assignments')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
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
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
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

  const startEdit = (task: TaskAssignment) => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      phase_id: task.phase_id || '',
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      notes: task.notes || '',
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

  if (isLoading) {
    return <div className="animate-pulse">Chargement des tâches...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tâches du projet ({filteredTasks.length})
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Modifier la tâche' : 'Nouvelle tâche'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phase_id">Phase</Label>
                      <Select
                        value={formData.phase_id}
                        onValueChange={(value) => setFormData({ ...formData, phase_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une phase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucune phase</SelectItem>
                          {phases?.map((phase) => (
                            <SelectItem key={phase.id} value={phase.id}>
                              {phase.phase_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assigned_to">Assigné à</Label>
                      <Input
                        id="assigned_to"
                        value={formData.assigned_to}
                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                        placeholder="Email ou nom d'utilisateur"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
              return (
                <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        {taskPhase && (
                          <Badge variant="secondary" className="text-xs">
                            {taskPhase.phase_name}
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
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
                      </div>
                      
                      {task.assigned_to && (
                        <p className="text-xs text-muted-foreground">
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
  );
};

export default EnhancedTaskList;