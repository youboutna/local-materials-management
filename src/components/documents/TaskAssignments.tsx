
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Plus, Calendar, User, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { sendTaskAssignmentNotifications } from '@/services/notificationService';

interface TaskAssignment {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  priority: string | null;
  status: string | null;
  completion_date: string | null;
  notes: string | null;
  created_at: string;
}

const TaskAssignments = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'pending'
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['task-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TaskAssignment[];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (newTask: typeof formData) => {
      const { data, error } = await supabase
        .from('task_assignments')
        .insert([newTask])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      
      // Send notifications
      try {
        await sendTaskAssignmentNotifications({
          id: data.id,
          title: data.title,
          assigned_to: data.assigned_to || '',
          assigned_by: data.assigned_by || '',
          project_id: data.project_id || undefined
        });
        
        toast({ 
          title: "Succès", 
          description: "Tâche créée avec succès et notifications envoyées." 
        });
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        toast({ 
          title: "Succès", 
          description: "Tâche créée avec succès. Erreur lors de l'envoi des notifications." 
        });
      }
      
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast({ title: "Erreur", description: "Impossible de créer la tâche.", variant: "destructive" });
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completion_date = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('task_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-assignments'] });
      toast({ title: "Succès", description: "Statut de la tâche mis à jour." });
    },
    onError: (error) => {
      console.error('Error updating task status:', error);
      toast({ title: "Erreur", description: "Impossible de mettre à jour le statut.", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_id: '',
      assigned_to: '',
      due_date: '',
      priority: 'medium',
      status: 'pending'
    });
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.assigned_to) {
      toast({
        title: "Erreur",
        description: "Le titre et l'assignation sont obligatoires.",
        variant: "destructive"
      });
      return;
    }

    createTaskMutation.mutate(formData);
  };

  const getPriorityColor = (priority: string | null) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string | null) => {
    const icons = {
      pending: Clock,
      in_progress: AlertTriangle,
      completed: CheckCircle,
      cancelled: XCircle
    };
    return icons[status as keyof typeof icons] || Clock;
  };

  const getStatusColor = (status: string | null) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-adrar-600">Chargement des tâches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-adrar-900">Affectations de Tâches</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une Tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Tâche</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de la tâche"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée de la tâche"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_id">Projet</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assigné à *</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Date d'échéance</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
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

                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  Créer la Tâche
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks?.map((task) => {
          const StatusIcon = getStatusIcon(task.status);
          return (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <ClipboardList className="h-6 w-6 text-terracotta-600" />
                    <div>
                      <CardTitle className="text-lg font-semibold text-adrar-800 line-clamp-1">
                        {task.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {new Date(task.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority || 'medium'}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {task.status?.replace('_', ' ') || 'pending'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {task.due_date && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>Assigné à: {task.assigned_to || 'Non assigné'}</span>
                  </div>
                </div>

                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <div className="flex space-x-2 pt-2">
                    <Select
                      value={task.status || 'pending'}
                      onValueChange={(value) => updateTaskStatusMutation.mutate({ id: task.id, status: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tasks?.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h3>
          <p className="text-gray-500 mb-4">
            Commencez par créer votre première tâche.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskAssignments;
