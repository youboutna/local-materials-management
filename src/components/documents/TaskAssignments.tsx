import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Plus, Edit, Trash2, Calendar, User } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';

type TaskAssignment = Database['public']['Tables']['task_assignments']['Row'];
type Project = { id: string; title: string };
type Employee = { id: string; full_name: string; position: string };

const TaskAssignments = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'pending',
    notes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['task_assignments'],
    queryFn: async (): Promise<TaskAssignment[]> => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as TaskAssignment[]) || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects_for_tasks'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return (data as unknown as Project[]) || [];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees_for_tasks'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true as any)
        .order('full_name');
      if (error) throw error;
      return (data as unknown as Employee[]) || [];
    },
  });

  // Sample data creation mutation
  const createSampleData = useMutation({
    mutationFn: async () => {
      const sampleTasks = [
        {
          title: 'Installation électrique',
          description: 'Installation du système électrique principal',
          project_id: 'sample-project-1',
          assigned_to: 'sample-employee-1',
          due_date: '2024-02-15',
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Inspection finale',
          description: 'Inspection finale du projet avant livraison',
          project_id: 'sample-project-2',
          assigned_to: 'sample-employee-2',
          due_date: '2024-02-20',
          priority: 'medium',
          status: 'in_progress'
        }
      ];

      const { data, error } = await supabase
        .from('task_assignments')
        .insert(sampleTasks as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_assignments'] });
      toast({ title: "Succès", description: "Données d'exemple créées avec succès." });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (taskData: typeof formData) => {
      const { data, error } = await supabase
        .from('task_assignments')
        .insert(taskData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_assignments'] });
      toast({ title: "Succès", description: "Tâche créée avec succès." });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('task_assignments')
        .update(data as any)
        .eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_assignments'] });
      toast({ title: "Succès", description: "Tâche mise à jour avec succès." });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_assignments'] });
      toast({ title: "Succès", description: "Tâche supprimée avec succès." });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
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
      status: 'pending',
      notes: ''
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (task: TaskAssignment) => {
    setFormData({
      title: task.title || '',
      description: task.description || '',
      project_id: task.project_id || '',
      assigned_to: task.assigned_to || '',
      due_date: task.due_date || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      notes: task.notes || ''
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
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectTitle = (projectId: string | null) => {
    if (!projectId) return 'N/A';
    const project = projects?.find(p => p.id === projectId);
    return project?.title || projectId;
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return t('task.unassigned') || 'Non assigné';
    const employee = employees?.find(e => e.id === employeeId);
    return employee ? `${employee.full_name} (${employee.position})` : employeeId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('task.assignments_title') || t('documents.type.task_assignment') || 'Affectations de Tâches'}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => createSampleData.mutate()}>
            {t('task.create_sample_data') || "Créer des données d'exemple"}
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('task.new') || 'Nouvelle Tâche'}
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? t('task.edit') || 'Modifier la Tâche' : t('task.new') || 'Nouvelle Tâche'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">{t('task.title')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="project">{t('projects.title')}</Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('task.select_project') || "Sélectionner un projet"} />
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
                <div>
                  <Label htmlFor="assigned_to">{t('task.assigned_to') || 'Assigné à'}</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('task.select_employee') || "Sélectionner un employé"} />
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
                <div>
                  <Label htmlFor="due_date">{t('task.due_date') || "Date d'échéance"}</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">{t('task.priority') || 'Priorité'}</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('task.priority_low') || 'Faible'}</SelectItem>
                      <SelectItem value="medium">{t('task.priority_medium') || 'Moyenne'}</SelectItem>
                      <SelectItem value="high">{t('task.priority_high') || 'Élevée'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">{t('task.status') || 'Statut'}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t('task.status_pending') || 'En attente'}</SelectItem>
                      <SelectItem value="in_progress">{t('task.status_in_progress') || 'En cours'}</SelectItem>
                      <SelectItem value="completed">{t('task.status_completed') || 'Terminé'}</SelectItem>
                      <SelectItem value="cancelled">{t('task.status_cancelled') || 'Annulé'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">{t('task.description') || 'Description'}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">{t('task.notes') || 'Notes'}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? t('task.update') || 'Mettre à jour' : t('task.create') || 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t('task.cancel') || 'Annuler'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks?.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{task.title}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {getProjectTitle(task.project_id)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <Badge className={getPriorityColor(task.priority || 'medium')}>
                    {task.priority === 'high'
                      ? t('task.priority_high') || 'Élevée'
                      : task.priority === 'medium'
                      ? t('task.priority_medium') || 'Moyenne'
                      : t('task.priority_low') || 'Faible'}
                  </Badge>
                  <Badge className={getStatusColor(task.status || 'pending')}>
                    {task.status === 'pending'
                      ? t('task.status_pending') || 'En attente'
                      : task.status === 'in_progress'
                      ? t('task.status_in_progress') || 'En cours'
                      : task.status === 'completed'
                      ? t('task.status_completed') || 'Terminé'
                      : t('task.status_cancelled') || 'Annulé'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {task.description}
                </p>
              )}
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{getEmployeeName(task.assigned_to)}</span>
                </div>
                {task.due_date && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t('task.due') || 'Échéance'}: {new Date(task.due_date).toLocaleDateString(t('locale') || 'fr-FR')}
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {t('task.created') || 'Créé'}: {new Date(task.created_at || '').toLocaleDateString(t('locale') || 'fr-FR')}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(task)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => deleteMutation.mutate(task.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('task.none_found') || 'Aucune tâche trouvée'}</p>
            <Button
              className="mt-4"
              onClick={() => createSampleData.mutate()}
              disabled={createSampleData.isPending}
            >
              {t('task.create_sample_data') || "Créer des données d'exemple"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskAssignments;
