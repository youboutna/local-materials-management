import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, User } from 'lucide-react';

interface PhaseTasksProps {
  phaseId: string;
  projectId: string;
}

interface TaskFormData {
  title: string;
  description: string;
  assigned_to: string;
  due_date: string;
  priority: string;
  status: string;
  notes: string;
}

const PhaseTasks: React.FC<PhaseTasksProps> = ({ phaseId, projectId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    notes: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['phase-tasks', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          ...taskData,
          project_id: projectId,
          phase_id: phaseId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', phaseId] });
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
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', phaseId] });
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
      queryClient.invalidateQueries({ queryKey: ['phase-tasks', phaseId] });
      toast({ title: 'Tâche supprimée avec succès' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
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

  const startEdit = (task: any) => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
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
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
            Tâches de la phase ({tasks?.length || 0})
          </CardTitle>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingId(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Modifier la tâche' : 'Nouvelle tâche'}
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
                    <Label htmlFor="assigned_to">Assigné à (Email)</Label>
                    <Input
                      id="assigned_to"
                      type="email"
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    />
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
      </CardHeader>
      <CardContent>
        {tasks && tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
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
                
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge className={getPriorityColor(task.priority || 'medium')}>
                    {task.priority === 'high' ? 'Élevée' : 
                     task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                  </Badge>
                  <Badge className={getStatusColor(task.status || 'pending')}>
                    {task.status === 'completed' ? 'Terminée' : 
                     task.status === 'in_progress' ? 'En cours' : 'En attente'}
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
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune tâche assignée à cette phase.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseTasks;