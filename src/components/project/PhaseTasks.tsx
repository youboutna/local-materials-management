import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Calendar, User, Wand2, Link2 } from 'lucide-react';
import TaskAssigneeSelector from '@/components/selectors/TaskAssigneeSelector';
import { usePhaseTasksHex } from '@/hooks/hexagonal/usePhaseTasksHex';
import { usePhaseTaskGenerationHex } from '@/hooks/hexagonal/usePhaseTaskGenerationHex';

import type { TaskAssignmentDTO as PhaseTask, CreateTaskAssignmentDTO as TaskFormData } from '@/dtos/entities/TaskAssignmentDTO';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { TranslatedPriority, TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';

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
    dueDate: '',
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

  // Chaîne DQE → exécution : les lignes du bordereau deviennent des tâches.
  const { plan, generateTasks, isGenerating } = usePhaseTaskGenerationHex(projectId, phaseId);


  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
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
    const dueDate = (task as any).dueDate || (task as any).dueDate || '';
    const assignedTo = (task as any).assignedTo || (task as any).assignedTo;
    setFormData({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: dueDate,
      assignedTo: assignedTo,
    });
    setEditingId(task.id);
    setIsCreating(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-success-soft text-success';
      default: return 'bg-muted text-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-soft text-success';
      case 'in_progress': return 'bg-primary/10 text-primary';
      case 'pending': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse"><T k="auto.phasetasks.chargement_des_taches" fallback="Chargement des tâches..." /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tâches de la phase ({tasks?.length || 0})
            {plan.linkedToBoq && (
              <Badge variant="secondary" className="gap-1">
                <Link2 className="h-3 w-3" />
                <T k="phase.tasks.from_boq" fallback="Alimenté par le bordereau" />
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {plan.pendingLines > 0 && (
              <Button variant="default" onClick={() => generateTasks()} disabled={isGenerating}>
                <Wand2 className="h-4 w-4 mr-2" />
                {isGenerating
                  ? 'Génération…'
                  : `Générer ${plan.pendingLines} tâche(s) depuis le bordereau`}
              </Button>
            )}
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            {!plan.linkedToBoq && (
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => { resetForm(); setEditingId(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  <T k="auto.phasetasks.ajouter_une_tache" fallback="Ajouter une tâche" />
                </Button>
              </DialogTrigger>
            )}

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
                      value={Array.isArray(formData.assignedTo) ? formData.assignedTo[0] : formData.assignedTo}
                      onChange={(id, name, email, type) => 
                        setFormData({ 
                          ...formData, 
                          assignedTo: id,
                          assigneeName: name,
                          assigneeEmail: email,
                          assigneeType: type
                        })
                      }
                      label="Assigné à"
                      placeholder="Sélectionner un employé ou partie prenante"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description"><T k="auto.phasetasks.description" fallback="Description" /></Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priority"><T k="auto.phasetasks.priorite" fallback="Priorité" /></Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low"><TranslatedPriority code="low" /></SelectItem>
                        <SelectItem value="medium"><TranslatedPriority code="medium" /></SelectItem>
                        <SelectItem value="high"><TranslatedPriority code="high" /></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status"><T k="auto.phasetasks.statut" fallback="Statut" /></Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending"><TranslatedStatus code="pending" /></SelectItem>
                        <SelectItem value="in_progress"><TranslatedStatus code="in_progress" /></SelectItem>
                        <SelectItem value="completed"><TranslatedStatus code="completed" /></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="due_date"><T k="auto.phasetasks.date_d_echeance" fallback="Date d'échéance" /></Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes"><T k="auto.phasetasks.notes" fallback="Notes" /></Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                    <T k="auto.phasetasks.annuler" fallback="Annuler" />
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
                    <Button size="sm" variant="outline" onClick={() => startEdit(task as any)}>
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
                  {((task as any).dueDate || (task as any).dueDate) && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date((task as any).dueDate || (task as any).dueDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>

                {((task as any).assignedTo || (task as any).assignedTo) && (
                  <p className="text-xs text-muted-foreground">
                    Assigné à: {(task as any).assignedTo || (task as any).assignedTo}
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
        ) : plan.pendingLines > 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm space-y-2">
            <p className="font-medium">
              {plan.totalLines} ligne(s) de bordereau rattachée(s) à cette phase, aucune tâche d'exécution.
            </p>
            <p className="text-muted-foreground">
              Générez les tâches depuis le bordereau (DQE / métré / devis accepté) pour ouvrir l'exécution.
            </p>
            <Button onClick={() => generateTasks()} disabled={isGenerating}>
              <Wand2 className="h-4 w-4 mr-2" />
              {isGenerating ? 'Génération…' : `Générer ${plan.pendingLines} tâche(s)`}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground"><T k="auto.phasetasks.aucune_tache_assignee_a_cette_phase" fallback="Aucune tâche assignée à cette phase." /></p>
        )}

      </CardContent>
    </Card>
  );
};

export default PhaseTasks;