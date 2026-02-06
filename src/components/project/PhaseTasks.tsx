import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Calendar, User } from 'lucide-react';
import TaskAssigneeSelector from '@/components/selectors/TaskAssigneeSelector';
import { usePhaseTasksHex, type TaskFormData, type PhaseTask } from '@/hooks/hexagonal/usePhaseTasksHex';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface PhaseTasksProps {
  phaseId: string;
  projectId: string;
}

const PhaseTasks: React.FC<PhaseTasksProps> = ({ phaseId, projectId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
  });
  
  const { 
    tasks, 
    isLoading, 
    createTask, 
    updateTask, 
    deleteTask,
    isCreating: isCreatingTask,
    isUpdating,
    isDeleting
  } = usePhaseTasksHex(phaseId);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      due_date: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.info('PHASE_TASKS_001: Starting task submission', {
        code: 'PHASE_TASKS_001',
        message: 'Début de la soumission de tâche',
        phaseId,
        projectId,
        isEditing: !!editingId,
        taskTitle: formData.title,
        stack: new Error().stack
      });

      // Validation
      if (!formData.title.trim()) {
        console.error('PHASE_TASKS_002: Task title validation failed', {
          code: 'PHASE_TASKS_002',
          message: 'Le titre de la tâche est requis',
          phaseId,
          projectId,
          stack: new Error().stack
        });
        return;
      }
      
      console.info('PHASE_TASKS_003: Task validation passed', {
        code: 'PHASE_TASKS_003',
        message: 'Validation de la tâche réussie',
        taskData: formData,
        stack: new Error().stack
      });

      if (editingId) {
        console.info('PHASE_TASKS_004: Updating existing task', {
          code: 'PHASE_TASKS_004',
          message: 'Mise à jour de la tâche existante',
          taskId: editingId,
          taskData: formData,
          stack: new Error().stack
        });

        await updateTask({ id: editingId, data: formData });
        
        console.info('PHASE_TASKS_005: Task updated successfully', {
          code: 'PHASE_TASKS_005',
          message: 'Tâche mise à jour avec succès',
          taskId: editingId,
          stack: new Error().stack
        });

        setEditingId(null);
      } else {
        console.info('PHASE_TASKS_006: Creating new task', {
          code: 'PHASE_TASKS_006',
          message: 'Création d\'une nouvelle tâche',
          taskData: formData,
          stack: new Error().stack
        });

        await createTask(formData);
        
        console.info('PHASE_TASKS_007: Task created successfully', {
          code: 'PHASE_TASKS_007',
          message: 'Tâche créée avec succès',
          taskTitle: formData.title,
          stack: new Error().stack
        });
      }
      
      setIsCreating(false);
      resetForm();

      console.info('PHASE_TASKS_008: Task submission completed', {
        code: 'PHASE_TASKS_008',
        message: 'Soumission de tâche terminée avec succès',
        phaseId,
        projectId,
        taskTitle: formData.title,
        stack: new Error().stack
      });
    } catch (error) {
      console.error('PHASE_TASKS_009: Task submission failed', {
        code: 'PHASE_TASKS_009',
        message: 'Échec de la soumission de tâche',
        phaseId,
        projectId,
        taskTitle: formData.title,
        isEditing: !!editingId,
        technicalError: error,
        stack: new Error().stack
      });
      // Le hook gère déjà les notifications d'erreur
    }
  };

  const startEdit = (task: PhaseTask) => {
    // Support both camelCase and snake_case
    const dueDate = (task as any).dueDate || (task as any).due_date || '';
    const assignedTo = (task as any).assignedTo || (task as any).assigned_to;
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      due_date: dueDate,
      assigned_to: assignedTo,
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
                      placeholder="Titre de la tâche"
                    />
                  </div>
                  <div>
                    <TaskAssigneeSelector
                      projectId={projectId}
                      value={formData.assigned_to}
                      onChange={(id, name, email, type) => 
                        setFormData({ 
                          ...formData, 
                          assigned_to: id,
                          assignee_name: name,
                          assignee_email: email,
                          assignee_type: type
                        })
                      }
                      label="Assigné à"
                      placeholder="Sélectionner un employé ou partie prenante"
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
                  <Button type="submit" disabled={isCreatingTask || isUpdating}>
                    {(isCreatingTask || isUpdating) 
                      ? 'Enregistrement...' 
                      : editingId ? 'Mettre à jour' : 'Créer la tâche'}
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
                      onClick={() => deleteTask(task.id)}
                      disabled={isDeleting}
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
                  {((task as any).dueDate || (task as any).due_date) && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date((task as any).dueDate || (task as any).due_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                {((task as any).assignedTo || (task as any).assigned_to) && (
                  <p className="text-xs text-muted-foreground">
                    Assigné à: {(task as any).assignedTo || (task as any).assigned_to}
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