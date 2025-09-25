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
  Target, DollarSign, TrendingUp, Link, ArrowRight, Layers
} from 'lucide-react';

interface EnhancedTaskManagerProps {
  projectId: string;
  tasks?: any[];
  setTasks?: (tasks: any[]) => void;
  phases?: any[];
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
  construction_phase?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  type?: string;
}

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
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

const EnhancedTaskManager: React.FC<EnhancedTaskManagerProps> = ({ 
  projectId, 
  tasks: propTasks, 
  setTasks: propSetTasks,
  phases: propPhases 
}) => {
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
    weight: '1',
    cost_estimate: '',
    optimistic_estimate: '',
    pessimistic_estimate: '',
    most_likely_estimate: '',
    critical_path: false,
  });
  
  const queryClient = useQueryClient();

  // Use provided tasks or fetch from database
  const { data: fetchedTasks, isLoading } = useQuery({
    queryKey: ['enhanced-task-assignments', projectId],
    queryFn: async (): Promise<TaskAssignmentExtended[]> => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !propTasks,
  });

  // Use props or fallback to fetched data
  const currentTasks = propTasks || fetchedTasks || [];

  // Fetch task dependencies
  const { data: dependencies = [] } = useQuery({
    queryKey: ['task-dependencies', projectId],
    queryFn: async (): Promise<TaskDependency[]> => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('*')
        .in('task_id', (currentTasks || []).map(t => t.id));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentTasks && currentTasks.length > 0,
  });

  // Fetch project phases (required for task creation)
  const { data: phases = [] } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, status, construction_phase')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });
      
      if (error) throw error;
      return data?.map(phase => ({
        ...phase,
        construction_phase: phase.construction_phase || undefined
      })) || [];
    },
    enabled: !!projectId && !propPhases,
  });

  // Use props or fallback to fetched data
  const currentPhases = propPhases || phases || [];

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch suppliers for contractor/consulting assignment
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, contact_person')
        .eq('is_active', true);
      
      if (error) throw error;
      return data?.map(supplier => ({
        ...supplier,
        contact_person: supplier.contact_person || undefined
      })) || [];
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<TaskAssignmentExtended>) => {
      const { error } = await supabase
        .from('task_assignments')
        .insert([{
          ...data,
          title: data.title || 'Untitled Task'
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-task-assignments'] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "Tâche créée",
        description: "La tâche a été créée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la tâche.",
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TaskAssignmentExtended> & { id: string }) => {
      const updateData = {
        ...data,
        title: data.title || undefined
      };
      const { error } = await supabase
        .from('task_assignments')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-task-assignments'] });
      setEditingId(null);
      resetForm();
      toast({
        title: "Tâche mise à jour",
        description: "La tâche a été mise à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-task-assignments'] });
      toast({
        title: "Tâche supprimée",
        description: "La tâche a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la tâche.",
        variant: "destructive",
      });
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
      weight: '1',
      cost_estimate: '',
      optimistic_estimate: '',
      pessimistic_estimate: '',
      most_likely_estimate: '',
      critical_path: false,
    });
  };

  // Get context-aware assignment options based on phase
  const getAssignmentOptions = () => {
    const selectedPhaseData = phases.find(p => p.id === formData.phase_id);
    const isConstructionPhase = selectedPhaseData?.construction_phase && 
      ['foundation', 'structure', 'finishing', 'utilities'].includes(selectedPhaseData.construction_phase);
    
    const options = [
      { category: 'Employés internes', items: employees.map(emp => ({ 
        id: emp.id, 
        name: emp.full_name, 
        subtitle: emp.position,
        type: 'employee'
      })) },
      { category: 'Bureaux d\'études / Consultants', items: suppliers
        .filter(s => s.type === 'consultant' || !s.type)
        .map(supplier => ({ 
          id: supplier.id, 
          name: supplier.name, 
          subtitle: supplier.contact_person || 'Consultant',
          type: 'consultant'
        })) 
      },
      { category: 'Contractants principaux', items: suppliers
        .filter(s => s.type === 'contractor' || !s.type)
        .map(supplier => ({ 
          id: supplier.id, 
          name: supplier.name, 
          subtitle: supplier.contact_person || 'Contractant',
          type: 'contractor'
        })) 
      }
    ];

    // Default assignment logic based on phase
    const defaultType = isConstructionPhase ? 'contractor' : 'employee';
    
    return { options, defaultType };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre de la tâche est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phase_id) {
      toast({
        title: "Erreur",
        description: "Vous devez sélectionner une phase du projet.",
        variant: "destructive",
      });
      return;
    }

    const taskData: Partial<TaskAssignmentExtended> = {
      title: formData.title,
      description: formData.description || null,
      project_id: projectId,
      phase_id: formData.phase_id,
      assigned_to: formData.assigned_to || null,
      due_date: formData.due_date || null,
      priority: formData.priority,
      status: formData.status,
      notes: formData.notes || null,
      estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      weight: formData.weight ? parseFloat(formData.weight) : 1,
      cost_estimate: formData.cost_estimate ? parseFloat(formData.cost_estimate) : null,
      optimistic_estimate: formData.optimistic_estimate ? parseInt(formData.optimistic_estimate) : null,
      pessimistic_estimate: formData.pessimistic_estimate ? parseInt(formData.pessimistic_estimate) : null,
      most_likely_estimate: formData.most_likely_estimate ? parseInt(formData.most_likely_estimate) : null,
      critical_path: formData.critical_path,
    };

    if (editingId) {
      updateTaskMutation.mutate({ id: editingId, ...taskData });
    } else {
      createTaskMutation.mutate(taskData);
    }
  };

  const handleEdit = (task: TaskAssignmentExtended) => {
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
      weight: task.weight?.toString() || '1',
      cost_estimate: task.cost_estimate?.toString() || '',
      optimistic_estimate: task.optimistic_estimate?.toString() || '',
      pessimistic_estimate: task.pessimistic_estimate?.toString() || '',
      most_likely_estimate: task.most_likely_estimate?.toString() || '',
      critical_path: task.critical_path || false,
    });
    setEditingId(task.id);
    setIsCreating(true);
  };

  const filteredTasks = currentTasks?.filter(task => {
    const phaseMatch = selectedPhase === 'all' || task.phase_id === selectedPhase;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    return phaseMatch && statusMatch;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssigneeName = (assignedTo: string) => {
    const employee = employees.find(emp => emp.id === assignedTo);
    if (employee) return employee.full_name;
    
    const supplier = suppliers.find(sup => sup.id === assignedTo);
    if (supplier) return supplier.name;
    
    return 'Non assigné';
  };

  const getPhaseName = (phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId);
    return phase?.phase_name || 'Phase inconnue';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Gestion des tâches</h3>
          <p className="text-sm text-muted-foreground">
            Les tâches sont systématiquement liées aux phases du projet
          </p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingId(null);
            }} disabled={phases.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Modifier la tâche' : 'Créer une nouvelle tâche'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Titre de la tâche *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nom de la tâche"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description détaillée de la tâche"
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phase_id">Phase du projet *</Label>
                  <Select 
                    value={formData.phase_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, phase_id: value, assigned_to: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une phase existante" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentPhases.length === 0 && (
                        <SelectItem value="no_phases" disabled>
                          Aucune phase créée - Créez d'abord des phases
                        </SelectItem>
                      )}
                      {currentPhases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.phase || phase.phase_name} {phase.construction_phase && `(${phase.construction_phase})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentPhases.length === 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Vous devez créer des phases dans l'onglet "Phases" avant de pouvoir créer des tâches
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="assigned_to">Assigné à (délégation publique)</Label>
                  <Select 
                    value={formData.assigned_to} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                    disabled={!formData.phase_id || phases.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner selon le contexte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      {(() => {
                        const { options } = getAssignmentOptions();
                        return options.map((category) => (
                          <React.Fragment key={category.category}>
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
                              {category.category}
                            </div>
                            {category.items.map((item) => (
                              <SelectItem key={`${item.type}-${item.id}`} value={item.id}>
                                {item.name} {item.subtitle && `- ${item.subtitle}`}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const selectedPhaseData = phases.find(p => p.id === formData.phase_id);
                      const isConstructionPhase = selectedPhaseData?.construction_phase && 
                        ['foundation', 'structure', 'finishing', 'utilities'].includes(selectedPhaseData.construction_phase);
                      return isConstructionPhase 
                        ? "Phase construction → Privilégier contractants principaux"
                        : "Phase pré-construction → Privilégier employés/consultants";
                    })()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
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

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                      <SelectItem value="blocked">Bloquée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="due_date">Date d'échéance</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending || !formData.phase_id}
                >
                  {editingId ? 'Mettre à jour' : 'Créer la tâche'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Phase validation warning */}
      {phases.length === 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Aucune phase créée</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Vous devez créer des phases dans l'onglet "Phases" avant de pouvoir gérer les tâches.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {phases.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <div>
            <Label>Filtrer par phase</Label>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les phases</SelectItem>
                {currentPhases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.phase || phase.phase_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Filtrer par statut</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="blocked">Bloquée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Tasks list */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Aucune tâche</h3>
              <p className="text-muted-foreground mb-4">
                {phases.length === 0 
                  ? "Créez d'abord des phases dans l'onglet 'Phases'"
                  : "Commencez par créer votre première tâche"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{task.title}</h4>
                    <p className="text-muted-foreground text-sm mt-1">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        {getPhaseName(task.phase_id || '')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {getAssigneeName(task.assigned_to || '')}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(task.priority || 'medium')}>
                      {task.priority === 'urgent' ? 'Urgente' : 
                       task.priority === 'high' ? 'Élevée' :
                       task.priority === 'low' ? 'Faible' : 'Moyenne'}
                    </Badge>
                    <Badge className={getStatusColor(task.status || 'pending')}>
                      {task.status === 'pending' ? 'En attente' :
                       task.status === 'in_progress' ? 'En cours' :
                       task.status === 'completed' ? 'Terminée' : 'Bloquée'}
                    </Badge>
                  </div>
                </div>

                {task.progress !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progression</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {task.cost_estimate && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {task.cost_estimate} MRU
                      </Badge>
                    )}
                    {task.critical_path && (
                      <Badge variant="destructive">
                        Chemin critique
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EnhancedTaskManager;