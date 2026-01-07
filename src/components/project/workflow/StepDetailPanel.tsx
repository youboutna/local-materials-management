/**
 * StepDetailPanel - Panneau détaillé pour une étape
 * Actions disponibles: Inspections, Tâches, RH, Matériaux, PV, Paiements
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  X,
  Plus,
  Edit,
  Trash2,
  ClipboardCheck,
  Users,
  Package,
  FileText,
  DollarSign,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Play,
  Pause,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseStepDTO } from '@/types/phase-dto';

interface StepTask {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
  due_date?: string;
}

interface StepResource {
  id: string;
  name: string;
  type: 'human' | 'material' | 'equipment';
  quantity: number;
  unit?: string;
  cost?: number;
}

interface StepInspection {
  id: string;
  date: string;
  inspector: string;
  status: string;
  progress_at_inspection: number;
}

interface StepDetailPanelProps {
  step: PhaseStepDTO;
  phaseId: string;
  projectId: string;
  inspections?: StepInspection[];
  tasks?: StepTask[];
  resources?: StepResource[];
  onClose: () => void;
  onUpdateProgress: (stepId: string, progress: number) => void;
  onScheduleInspection: (stepId: string) => void;
  onAddTask?: (stepId: string, task: Partial<StepTask>) => void;
  onAddResource?: (stepId: string, resource: Partial<StepResource>) => void;
  onGeneratePV?: (stepId: string) => void;
  onRequestPayment?: (stepId: string) => void;
  formatCurrency: (n: number) => string;
}

const StepDetailPanel: React.FC<StepDetailPanelProps> = ({
  step,
  phaseId,
  projectId,
  inspections = [],
  tasks = [],
  resources = [],
  onClose,
  onUpdateProgress,
  onScheduleInspection,
  onAddTask,
  onAddResource,
  onGeneratePV,
  onRequestPayment,
  formatCurrency,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editProgress, setEditProgress] = useState(step.progress || 0);
  const [isEditingProgress, setIsEditingProgress] = useState(false);

  // Forms for adding
  const [newTask, setNewTask] = useState({ name: '', assignee: '' });
  const [newResource, setNewResource] = useState<{ name: string; type: 'human' | 'material' | 'equipment'; quantity: number }>({ name: '', type: 'human', quantity: 1 });

  const handleSaveProgress = () => {
    onUpdateProgress(step.id, editProgress);
    setIsEditingProgress(false);
  };

  const handleAddTask = () => {
    if (newTask.name && onAddTask) {
      onAddTask(step.id, { name: newTask.name, assignee: newTask.assignee, status: 'pending' });
      setNewTask({ name: '', assignee: '' });
    }
  };

  const handleAddResource = () => {
    if (newResource.name && onAddResource) {
      onAddResource(step.id, newResource);
      setNewResource({ name: '', type: 'human', quantity: 1 });
    }
  };

  const humanResources = resources.filter(r => r.type === 'human');
  const materialResources = resources.filter(r => r.type === 'material' || r.type === 'equipment');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'approved': return 'bg-green-100 text-green-700';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto animate-in slide-in-from-right-4">
      <CardHeader className="py-4 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{step.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Étape #{step.order_index + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(step.status)}>{step.status}</Badge>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Progress Section */}
        <div className="p-4 rounded-lg bg-muted/30 border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progression</span>
            {isEditingProgress ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editProgress}
                  onChange={(e) => setEditProgress(Math.min(100, Math.max(0, Number(e.target.value))))}
                  className="w-20 h-8"
                />
                <span className="text-sm">%</span>
                <Button size="sm" onClick={handleSaveProgress}>
                  <Save className="h-3 w-3 mr-1" /> Valider
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingProgress(false)}>
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{step.progress || 0}%</span>
                <Button size="sm" variant="outline" onClick={() => setIsEditingProgress(true)}>
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <Progress value={step.progress || 0} className="h-2" />
        </div>

        {/* Tabs for different actions */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="text-xs">Vue</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tâches</TabsTrigger>
            <TabsTrigger value="resources" className="text-xs">Ressources</TabsTrigger>
            <TabsTrigger value="inspections" className="text-xs">Inspections</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">PV/Docs</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/20 border">
                <p className="text-muted-foreground text-xs">Dates</p>
                <p className="font-medium">
                  {step.start_date ? new Date(step.start_date).toLocaleDateString('fr-FR') : '—'} →{' '}
                  {step.end_date ? new Date(step.end_date).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border">
                <p className="text-muted-foreground text-xs">Budget</p>
                <p className="font-medium">{formatCurrency((step as any).estimated_cost || (step as any).budget || 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border">
                <p className="text-muted-foreground text-xs">Tâches</p>
                <p className="font-medium">{tasks.filter(t => t.status === 'completed').length}/{tasks.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border">
                <p className="text-muted-foreground text-xs">Inspections</p>
                <p className="font-medium">{inspections.length}</p>
              </div>
            </div>

            {step.description && (
              <div className="p-3 rounded-lg bg-muted/10 border">
                <p className="text-muted-foreground text-xs mb-1">Description</p>
                <p className="text-sm">{step.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onScheduleInspection(step.id)}>
                <ClipboardCheck className="h-3 w-3 mr-1" /> Programmer Inspection
              </Button>
              {onGeneratePV && (
                <Button size="sm" variant="outline" onClick={() => onGeneratePV(step.id)}>
                  <FileText className="h-3 w-3 mr-1" /> Générer PV
                </Button>
              )}
              {onRequestPayment && (
                <Button size="sm" variant="outline" onClick={() => onRequestPayment(step.id)}>
                  <DollarSign className="h-3 w-3 mr-1" /> Demander Paiement
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Tâches ({tasks.length})</h4>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune tâche assignée</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border flex items-center justify-between group hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle className={cn("h-4 w-4", task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground')} />
                      <div>
                        <p className="font-medium text-sm">{task.name}</p>
                        <p className="text-xs text-muted-foreground">{task.assignee || 'Non assigné'}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Ajouter une tâche</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Nom de la tâche"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                />
                <Input
                  placeholder="Assigné à"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                />
              </div>
              <Button size="sm" onClick={handleAddTask} disabled={!newTask.name}>
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </div>
          </TabsContent>

          {/* Resources */}
          <TabsContent value="resources" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Ressources Humaines ({humanResources.length})
              </h4>
              {humanResources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune ressource humaine</p>
              ) : (
                <div className="space-y-2">
                  {humanResources.map((r) => (
                    <div key={r.id} className="p-2 rounded border flex justify-between items-center">
                      <span className="text-sm">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{r.quantity} {r.unit || 'personnes'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Package className="h-4 w-4" /> Matériaux & Équipements ({materialResources.length})
              </h4>
              {materialResources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun matériau</p>
              ) : (
                <div className="space-y-2">
                  {materialResources.map((r) => (
                    <div key={r.id} className="p-2 rounded border flex justify-between items-center">
                      <span className="text-sm">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{r.quantity} {r.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Ajouter une ressource</p>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Nom"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                />
                <select
                  className="rounded border px-2 py-1 text-sm bg-background"
                  value={newResource.type}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'human' || val === 'material' || val === 'equipment') {
                      setNewResource({ ...newResource, type: val });
                    }
                  }}
                >
                  <option value="human">Humain</option>
                  <option value="material">Matériau</option>
                  <option value="equipment">Équipement</option>
                </select>
                <Input
                  type="number"
                  min={1}
                  placeholder="Qté"
                  value={newResource.quantity}
                  onChange={(e) => setNewResource({ ...newResource, quantity: Number(e.target.value) })}
                />
              </div>
              <Button size="sm" onClick={handleAddResource} disabled={!newResource.name}>
                <Plus className="h-3 w-3 mr-1" /> Ajouter
              </Button>
            </div>
          </TabsContent>

          {/* Inspections */}
          <TabsContent value="inspections" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Inspections ({inspections.length})</h4>
              <Button size="sm" onClick={() => onScheduleInspection(step.id)}>
                <Plus className="h-3 w-3 mr-1" /> Programmer
              </Button>
            </div>

            {inspections.length === 0 ? (
              <div className="text-center py-4">
                <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Aucune inspection programmée</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {inspections.map((insp) => (
                  <div key={insp.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(insp.status)}>{insp.status}</Badge>
                          <span className="text-sm font-medium">{insp.inspector}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(insp.date).toLocaleDateString('fr-FR')} • Progression: {insp.progress_at_inspection}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Procès-Verbaux & Documents</h4>
              <div className="grid grid-cols-2 gap-2">
                {onGeneratePV && (
                  <Button size="sm" variant="outline" onClick={() => onGeneratePV(step.id)} className="justify-start">
                    <FileText className="h-3 w-3 mr-2" /> PV Service Fait
                  </Button>
                )}
                <Button size="sm" variant="outline" className="justify-start">
                  <FileText className="h-3 w-3 mr-2" /> PV Main Levée
                </Button>
                <Button size="sm" variant="outline" className="justify-start">
                  <FileText className="h-3 w-3 mr-2" /> Attachement
                </Button>
                <Button size="sm" variant="outline" className="justify-start">
                  <FileText className="h-3 w-3 mr-2" /> Décompte
                </Button>
              </div>
            </div>

            <Separator />

            <div className="p-3 rounded-lg bg-muted/20 border">
              <p className="text-xs text-muted-foreground mb-2">Règles Mauritanie</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Inspection obligatoire avant paiement</li>
                <li>• Retenue de garantie 10% sur chaque décompte</li>
                <li>• PV signé requis pour libération garantie</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StepDetailPanel;
