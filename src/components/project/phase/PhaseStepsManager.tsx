import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Layers,
  Plus,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PhaseStepDTO, PhaseTaskDTO, PhaseStatus } from "@/types/phase-dto";
import { StepItem } from '@/types/unified-workflow';
import DQEImportDialog from "./DQEImportDialog";
import PhaseStepResourceDialog from "./PhaseStepResourceDialog";

interface PhaseStepsManagerProps {
  // Accept legacy PhaseStepDTO[] or unified StepItem[]
  steps: PhaseStepDTO[] | StepItem[];
  onAddStep: (step: Omit<PhaseStepDTO, 'id'>) => Promise<unknown>;
  onUpdateStep: (stepId: string, updates: Partial<PhaseStepDTO>) => Promise<unknown>;
  onDeleteStep: (stepId: string) => Promise<unknown>;
  onAddTask: (stepId: string, task: Omit<PhaseTaskDTO, 'id'>) => Promise<unknown>;
  onUpdateTask: (stepId: string, taskId: string, updates: Partial<PhaseTaskDTO>) => Promise<unknown>;
  onDeleteTask: (stepId: string, taskId: string) => Promise<unknown>;
  isUpdating?: boolean;
  /** Required to enable per-step DQE import & manual resource entry. */
  projectId?: string;
  phaseId?: string;
}

const statusOptions: { value: PhaseStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-500', icon: <Clock className="h-3 w-3" /> },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-500', icon: <RefreshCw className="h-3 w-3" /> },
  { value: 'completed', label: 'Terminé', color: 'bg-green-500', icon: <CheckCircle className="h-3 w-3" /> },
  { value: 'delayed', label: 'En retard', color: 'bg-red-500', icon: <AlertTriangle className="h-3 w-3" /> },
];

const getStatusColor = (status: PhaseStatus | string) => {
  switch (status) {
    case "completed": return "bg-green-100 text-green-800 border-green-200";
    case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
    case "delayed": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
};

const getStatusLabel = (status: PhaseStatus | string) => {
  const labels: Record<string, string> = {
    completed: "Terminé",
    in_progress: "En cours",
    delayed: "En retard",
    pending: "En attente",
  };
  return labels[status] || status;
};

// Step Edit Form Component
const StepEditDialog: React.FC<{
  step?: PhaseStepDTO;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<PhaseStepDTO>) => void;
  isNew?: boolean;
}> = ({ step, open, onClose, onSave, isNew }) => {
  const [formData, setFormData] = useState<Partial<PhaseStepDTO>>({
    name: step?.name || '',
    description: step?.description || '',
    status: step?.status || 'pending',
    progress: step?.progress || 0,
    estimated_duration_days: step?.estimated_duration_days,
    start_date: step?.start_date || '',
    end_date: step?.end_date || '',
  });

  React.useEffect(() => {
    if (step) {
      setFormData({
        name: step.name,
        description: step.description || '',
        status: step.status,
        progress: step.progress,
        estimated_duration_days: step.estimated_duration_days,
        start_date: step.start_date || '',
        end_date: step.end_date || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        progress: 0,
        estimated_duration_days: undefined,
        start_date: '',
        end_date: '',
      });
    }
  }, [step, open]);

  const handleSave = () => {
    if (!formData.name?.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {isNew ? 'Ajouter une étape' : 'Modifier l\'étape'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nom de l'étape <span className="text-destructive">*</span></Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Analyse des besoins"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de l'étape..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as PhaseStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", opt.color)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Durée estimée (jours)</Label>
              <Input
                type="number"
                min="1"
                value={formData.estimated_duration_days || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimated_duration_days: parseInt(e.target.value) || undefined 
                })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Progression: {formData.progress || 0}%</Label>
            <Slider
              value={[formData.progress || 0]}
              onValueChange={([value]) => setFormData({ ...formData, progress: value })}
              max={100}
              step={5}
              className="py-2"
            />
            <Progress value={formData.progress || 0} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={!formData.name?.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {isNew ? 'Ajouter' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Task Edit Form Component
const TaskEditDialog: React.FC<{
  task?: PhaseTaskDTO;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<PhaseTaskDTO>) => void;
  isNew?: boolean;
}> = ({ task, open, onClose, onSave, isNew }) => {
  const [formData, setFormData] = useState<Partial<PhaseTaskDTO>>({
    name: task?.name || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    progress: task?.progress || 0,
    estimated_duration_days: task?.estimated_duration_days,
  });

  React.useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description || '',
        status: task.status,
        progress: task.progress,
        estimated_duration_days: task.estimated_duration_days,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        progress: 0,
      });
    }
  }, [task, open]);

  const handleSave = () => {
    if (!formData.name?.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            {isNew ? 'Ajouter une tâche' : 'Modifier la tâche'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nom de la tâche <span className="text-destructive">*</span></Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Rédiger le cahier des charges"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la tâche..."
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  const newStatus = value as PhaseStatus;
                  setFormData({ 
                    ...formData, 
                    status: newStatus,
                    progress: newStatus === 'completed' ? 100 : newStatus === 'pending' ? 0 : formData.progress
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", opt.color)} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Durée (jours)</Label>
              <Input
                type="number"
                min="1"
                value={formData.estimated_duration_days || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimated_duration_days: parseInt(e.target.value) || undefined 
                })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Progression: {formData.progress || 0}%</Label>
            <Slider
              value={[formData.progress || 0]}
              onValueChange={([value]) => setFormData({ ...formData, progress: value })}
              max={100}
              step={10}
              className="py-2"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={!formData.name?.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {isNew ? 'Ajouter' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Step Card Component
const StepCard: React.FC<{
  step: PhaseStepDTO;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: PhaseStatus) => void;
  onProgressChange: (progress: number) => void;
  onAddTask: () => void;
  onEditTask: (task: PhaseTaskDTO) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, status: PhaseStatus) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  projectId?: string;
  phaseId?: string;
}> = ({ 
  step, 
  index, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onProgressChange,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTaskStatusChange,
  expanded,
  onToggleExpand,
  projectId,
  phaseId,
}) => {
  const isCompleted = step.status === 'completed';
  const isInProgress = step.status === 'in_progress';
  const isDelayed = step.status === 'delayed';

  return (
    <div className="relative pl-14">
      {/* Step indicator */}
      <div className={cn(
        "absolute left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10",
        isCompleted && "bg-green-500 text-white shadow-lg shadow-green-500/30",
        isInProgress && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20",
        isDelayed && "bg-destructive text-white shadow-lg shadow-destructive/30",
        !isCompleted && !isInProgress && !isDelayed && "bg-muted text-muted-foreground border-2 border-muted-foreground/30"
      )}>
        {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
      </div>
      
      <Card className={cn(
        "transition-all border-2",
        isCompleted && "border-green-200 bg-green-50/30",
        isInProgress && "border-primary/40 bg-primary/5",
        isDelayed && "border-destructive/40 bg-destructive/5",
        !isCompleted && !isInProgress && !isDelayed && "border-muted hover:border-muted-foreground/20"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <button 
                  onClick={onToggleExpand}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <h4 className="font-semibold truncate">{step.name}</h4>
              </div>
              {step.description && (
                <p className="text-sm text-muted-foreground mb-3 ml-7">{step.description}</p>
              )}
              
              {/* Quick status selector */}
              <div className="flex items-center gap-2 ml-7 mb-3">
                <span className="text-xs text-muted-foreground">Statut:</span>
                <div className="flex gap-1">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onStatusChange(opt.value)}
                      className={cn(
                        "px-2 py-1 rounded-full text-xs transition-all flex items-center gap-1",
                        step.status === opt.value 
                          ? getStatusColor(opt.value) + " ring-2 ring-offset-1"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground"
                      )}
                      title={opt.label}
                    >
                      {opt.icon}
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Progress */}
              <div className="flex items-center gap-3 ml-7">
                <div className="flex-1">
                  <Slider
                    value={[step.progress]}
                    onValueChange={([value]) => onProgressChange(value)}
                    max={100}
                    step={5}
                    className="py-1"
                  />
                </div>
                <span className={cn(
                  "text-sm font-bold min-w-[3rem] text-right",
                  step.progress === 100 && "text-green-600",
                  step.progress > 0 && step.progress < 100 && "text-primary",
                  step.progress === 0 && "text-muted-foreground"
                )}>
                  {step.progress}%
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une tâche
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Tasks (expanded) */}
          {expanded && step.tasks.length > 0 && (
            <div className="mt-4 pt-4 border-t ml-7 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {step.tasks.filter(t => t.status === 'completed').length}/{step.tasks.length} tâches
                </p>
                <Button variant="ghost" size="sm" onClick={onAddTask} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Tâche
                </Button>
              </div>
              <div className="space-y-2">
                {step.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors group",
                      task.status === 'completed' ? "bg-green-100/50" : 
                      task.status === 'in_progress' ? "bg-blue-100/50" :
                      task.status === 'delayed' ? "bg-red-100/50" : "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Quick toggle status */}
                      <button
                        onClick={() => onTaskStatusChange(
                          task.id, 
                          task.status === 'completed' ? 'pending' : 'completed'
                        )}
                        className="shrink-0"
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : task.status === "in_progress" ? (
                          <RefreshCw className="h-5 w-5 text-primary" />
                        ) : task.status === "delayed" ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 hover:border-primary transition-colors" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <span className={cn(
                          "text-sm block truncate",
                          task.status === 'completed' && "line-through text-muted-foreground"
                        )}>
                          {task.name}
                        </span>
                        {task.description && (
                          <span className="text-xs text-muted-foreground truncate block">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => onEditTask(task)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Empty tasks state (expanded) */}
          {expanded && step.tasks.length === 0 && (
            <div className="mt-4 pt-4 border-t ml-7">
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Aucune tâche</p>
                <Button variant="outline" size="sm" onClick={onAddTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une tâche
                </Button>
              </div>
            </div>
          )}

          {/* Ressources (expanded) — DQE import + ajout manuel */}
          {expanded && projectId && phaseId && (
            <div
              className="mt-4 pt-4 border-t ml-7"
              data-testid={`step-resources-${step.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Ressources de l'étape
                </p>
                <div className="flex items-center gap-2">
                  <DQEImportDialog
                    projectId={projectId}
                    phaseId={phaseId}
                    stepId={step.id}
                  />
                  <PhaseStepResourceDialog
                    projectId={projectId}
                    phaseId={phaseId}
                    stepId={step.id}
                    stepName={step.name}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Importez un DQE (.xlsx) ou ajoutez à la main matériaux,
                main-d'œuvre et prestations rattachés à cette étape.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main Component
const PhaseStepsManager: React.FC<PhaseStepsManagerProps> = ({
  steps,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  isUpdating,
  projectId,
  phaseId,
}) => {
  // Normalize incoming steps to PhaseStepDTO[] so component logic remains unchanged
  const normalizedSteps: PhaseStepDTO[] = React.useMemo(() => {
    if (!Array.isArray(steps)) return [];
    return (steps as Array<any>).map((s) => {
      // If it's already a PhaseStepDTO (has 'tasks' or 'order_index'), assume shape
      if ((s as PhaseStepDTO).tasks !== undefined || (s as PhaseStepDTO).order_index !== undefined) {
        return s as PhaseStepDTO;
      }
      // Otherwise treat as unified StepItem and map fields
      const si = s as StepItem;
      const mapStatus = (st?: string) => {
        if (!st) return 'pending' as PhaseStatus;
        if (st === 'approved' || st === 'completed') return 'completed' as PhaseStatus;
        if (st === 'in_progress') return 'in_progress' as PhaseStatus;
        if (st === 'delayed') return 'delayed' as PhaseStatus;
        return (st as PhaseStatus) || 'pending';
      };
      return {
        id: si.id,
        name: si.name,
        description: si.description || '',
        status: mapStatus(si.status as string),
        progress: si.progress ?? 0,
        estimated_duration_days: (si.metadata && (si.metadata.estimated_duration_days as number)) || undefined,
        start_date: undefined,
        end_date: undefined,
        order_index: si.order ?? 0,
        tasks: [],
      } as PhaseStepDTO;
    });
  }, [steps]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [editingStep, setEditingStep] = useState<PhaseStepDTO | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [editingTask, setEditingTask] = useState<{ stepId: string; task: PhaseTaskDTO } | null>(null);
  const [addingTaskStepId, setAddingTaskStepId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'step' | 'task'; stepId: string; taskId?: string } | null>(null);

  const completedCount = normalizedSteps.filter(s => s.status === 'completed').length;
  const totalProgress = normalizedSteps.length > 0 
    ? normalizedSteps.reduce((sum, s) => sum + s.progress, 0) / normalizedSteps.length 
    : 0;

  const toggleExpand = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleAddStep = async (data: Partial<PhaseStepDTO>) => {
    await onAddStep({
      name: data.name || '',
      description: data.description,
      status: data.status || 'pending',
      progress: data.progress || 0,
      estimated_duration_days: data.estimated_duration_days,
      start_date: data.start_date,
      end_date: data.end_date,
      order_index: normalizedSteps.length,
      tasks: [],
    });
  };

  const handleUpdateStep = async (stepId: string, data: Partial<PhaseStepDTO>) => {
    await onUpdateStep(stepId, data);
  };

  const handleAddTask = async (stepId: string, data: Partial<PhaseTaskDTO>) => {
    const step = normalizedSteps.find(s => s.id === stepId);
    await onAddTask(stepId, {
      name: data.name || '',
      description: data.description,
      status: data.status || 'pending',
      progress: data.progress || 0,
      estimated_duration_days: data.estimated_duration_days,
      order_index: step?.tasks.length || 0,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.type === 'step') {
      await onDeleteStep(deleteConfirm.stepId);
    } else if (deleteConfirm.taskId) {
      await onDeleteTask(deleteConfirm.stepId, deleteConfirm.taskId);
    }
    setDeleteConfirm(null);
  };

  if (normalizedSteps.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Layers className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground mb-2">Aucune étape définie pour cette phase</p>
        <p className="text-sm text-muted-foreground/70 mb-4">
          Ajoutez des étapes pour suivre la progression
        </p>
        <Button onClick={() => setIsAddingStep(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une étape
        </Button>
        
        <StepEditDialog
          open={isAddingStep}
          onClose={() => setIsAddingStep(false)}
          onSave={handleAddStep}
          isNew
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">{normalizedSteps.length} Étapes</p>
            <p className="text-sm text-muted-foreground">
              {completedCount} terminées • {Math.round(totalProgress)}% progression moyenne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {completedCount}
          </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
            <RefreshCw className="h-3 w-3 mr-1" />
            {normalizedSteps.filter(s => s.status === 'in_progress').length}
          </Badge>
          <Button onClick={() => setIsAddingStep(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-muted" />
        
        <div className="space-y-4">
          {normalizedSteps.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
              expanded={expandedSteps.has(step.id)}
              onToggleExpand={() => toggleExpand(step.id)}
              onEdit={() => setEditingStep(step)}
              onDelete={() => setDeleteConfirm({ type: 'step', stepId: step.id })}
              onStatusChange={(status) => handleUpdateStep(step.id, { 
                status,
                progress: status === 'completed' ? 100 : status === 'pending' ? 0 : step.progress
              })}
              onProgressChange={(progress) => handleUpdateStep(step.id, { progress })}
              onAddTask={() => setAddingTaskStepId(step.id)}
              onEditTask={(task) => setEditingTask({ stepId: step.id, task })}
              onDeleteTask={(taskId) => setDeleteConfirm({ type: 'task', stepId: step.id, taskId })}
              onTaskStatusChange={(taskId, status) => onUpdateTask(step.id, taskId, { 
                status,
                progress: status === 'completed' ? 100 : status === 'pending' ? 0 : undefined
              })}
            />
          ))}
        </div>
      </div>

      {/* Edit Step Dialog */}
      <StepEditDialog
        step={editingStep || undefined}
        open={!!editingStep}
        onClose={() => setEditingStep(null)}
        onSave={(data) => editingStep && handleUpdateStep(editingStep.id, data)}
      />

      {/* Add Step Dialog */}
      <StepEditDialog
        open={isAddingStep}
        onClose={() => setIsAddingStep(false)}
        onSave={handleAddStep}
        isNew
      />

      {/* Add Task Dialog */}
      <TaskEditDialog
        open={!!addingTaskStepId}
        onClose={() => setAddingTaskStepId(null)}
        onSave={(data) => addingTaskStepId && handleAddTask(addingTaskStepId, data)}
        isNew
      />

      {/* Edit Task Dialog */}
      <TaskEditDialog
        task={editingTask?.task}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={(data) => editingTask && onUpdateTask(editingTask.stepId, editingTask.task.id, data)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'step' 
                ? "Êtes-vous sûr de vouloir supprimer cette étape et toutes ses tâches ?"
                : "Êtes-vous sûr de vouloir supprimer cette tâche ?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PhaseStepsManager;
