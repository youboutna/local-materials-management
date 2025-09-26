import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, Users, Building2, Calendar, DollarSign, FileText, 
  Plus, Edit3, Trash2, CheckCircle, Clock, AlertTriangle,
  UserPlus, Settings, Bell, Eye, PlusCircle, Target
} from 'lucide-react';

import ProjectFormWithMap from './ProjectFormWithMap';
import OrganizationalHierarchyManager from '../admin/OrganizationalHierarchyManager';
import MaterialFormSection from '../MaterialFormSection';
import EmployeeSelector from '../selectors/EmployeeSelector';
import SimpleSupplierSelector from '../selectors/SimpleSupplierSelector';

interface TaskResource {
  id?: string;
  type: 'employee' | 'material' | 'equipment';
  resourceId: string;
  resourceName: string;
  quantity?: number;
  estimatedCost?: number;
}

interface PhaseTask {
  id?: string;
  title: string;
  description?: string;
  phase_id: string;
  phase_name: string;
  estimated_duration_days: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  resources: TaskResource[];
  documents_required: string[];
  inspection_required: boolean;
  inspection_scheduled_date?: string;
  payment_milestone: boolean;
  payment_percentage?: number;
  dependencies?: string[];
}

interface EnhancedProjectEditFormProps {
  initialData: any;
  onSubmit: (data: any) => void;
  onSave?: (data: any) => void;
  className?: string;
}

const EnhancedProjectEditFormWithTasks: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onSave,
  className = ""
}) => {
  const [formData, setFormData] = useState(initialData || {});
  const [activeTab, setActiveTab] = useState('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [phaseTasks, setPhaseTasks] = useState<PhaseTask[]>([]);
  const [editingTask, setEditingTask] = useState<PhaseTask | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const updateFormData = useCallback((updates: any) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  const handleAutoSave = useCallback(() => {
    if (hasUnsavedChanges && onSave) {
      onSave(formData);
      setHasUnsavedChanges(false);
      toast({
        title: "Sauvegarde automatique",
        description: "Les modifications ont été sauvegardées.",
      });
    }
  }, [formData, hasUnsavedChanges, onSave]);

  useEffect(() => {
    const interval = setInterval(handleAutoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [handleAutoSave]);

  const createNewTask = () => {
    const newTask: PhaseTask = {
      id: `task_${Date.now()}`,
      title: '',
      description: '',
      phase_id: '',
      phase_name: '',
      estimated_duration_days: 1,
      status: 'pending',
      priority: 'medium',
      resources: [],
      documents_required: [],
      inspection_required: false,
      payment_milestone: false,
      dependencies: []
    };
    setEditingTask(newTask);
    setShowTaskDialog(true);
  };

  const saveTask = (task: PhaseTask) => {
    if (task.id && phaseTasks.find(t => t.id === task.id)) {
      setPhaseTasks(prev => prev.map(t => t.id === task.id ? task : t));
    } else {
      task.id = task.id || `task_${Date.now()}`;
      setPhaseTasks(prev => [...prev, task]);
    }
    setShowTaskDialog(false);
    setEditingTask(null);
    updateFormData({ tasks: [...phaseTasks, task] });
  };

  const deleteTask = (taskId: string) => {
    setPhaseTasks(prev => prev.filter(t => t.id !== taskId));
    updateFormData({ tasks: phaseTasks.filter(t => t.id !== taskId) });
  };

  const addResourceToTask = (taskId: string, resource: TaskResource) => {
    setPhaseTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, resources: [...task.resources, { ...resource, id: `res_${Date.now()}` }] }
        : task
    ));
  };

  const scheduleInspection = (taskId: string, date: string) => {
    setPhaseTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, inspection_required: true, inspection_scheduled_date: date }
        : task
    ));
    
    toast({
      title: "Inspection programmée",
      description: `Inspection programmée pour le ${new Date(date).toLocaleDateString('fr-FR')}`,
    });
  };

  const tabs = [
    { id: 'basic', label: 'Informations de Base', icon: FileText },
    { id: 'phases', label: 'Phases & Tâches', icon: Target },
    { id: 'resources', label: 'Ressources & Matériaux', icon: Building2 },
    { id: 'stakeholders', label: 'Parties Prenantes', icon: Users },
    { id: 'monitoring', label: 'Suivi & Notifications', icon: Bell },
    { id: 'documents', label: 'Documents & Conformité', icon: FileText }
  ];

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header with Save/Preview Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-primary">
                {formData.title || 'Nouveau Projet'}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={formData.status === 'en cours' ? 'default' : 'secondary'}>
                  {formData.status || 'En attente'}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Progression: {formData.progress || 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Non sauvegardé
                </Badge>
              )}
              <Button variant="outline" onClick={handleAutoSave}>
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
              <Button onClick={() => onSubmit(formData)}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Informations de Base</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectFormWithMap
                initialData={formData}
                onSubmit={updateFormData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases & Tasks */}
        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Phases & Tâches du Projet</CardTitle>
                <Button onClick={createNewTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Tâche
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phaseTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          task.status === 'completed' ? 'default' :
                          task.status === 'in_progress' ? 'secondary' :
                          task.status === 'delayed' ? 'destructive' : 'outline'
                        }>
                          {task.status}
                        </Badge>
                        <h4 className="font-semibold">{task.title}</h4>
                        <Badge variant="outline" className={
                          task.priority === 'critical' ? 'border-red-500 text-red-600' :
                          task.priority === 'high' ? 'border-orange-500 text-orange-600' :
                          'border-gray-400'
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskDialog(true);
                          }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTask(task.id!)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Phase:</span> {task.phase_name}
                      </div>
                      <div>
                        <span className="font-medium">Durée:</span> {task.estimated_duration_days} jours
                      </div>
                      <div>
                        <span className="font-medium">Ressources:</span> {task.resources.length}
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {task.inspection_required && (
                        <Badge variant="outline" className="text-blue-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Inspection requise
                        </Badge>
                      )}
                      {task.payment_milestone && (
                        <Badge variant="outline" className="text-green-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Étape de paiement ({task.payment_percentage}%)
                        </Badge>
                      )}
                      {task.documents_required.length > 0 && (
                        <Badge variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          {task.documents_required.length} documents
                        </Badge>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTaskId(task.id!);
                          setShowResourceDialog(true);
                        }}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Ressources
                      </Button>
                      {task.inspection_required && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const date = prompt('Date d\'inspection (YYYY-MM-DD):');
                            if (date) scheduleInspection(task.id!, date);
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Programmer Inspection
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {phaseTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune tâche définie. Commencez par créer votre première tâche.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources & Materials */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Ressources & Matériaux</CardTitle>
            </CardHeader>
            <CardContent>
              <MaterialFormSection
                selectedMaterials={formData.materials || []}
                onChange={(materials) => updateFormData({ materials })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakeholders */}
        <TabsContent value="stakeholders">
          <Card>
            <CardHeader>
              <CardTitle>Parties Prenantes</CardTitle>
            </CardHeader>
            <CardContent>
              <OrganizationalHierarchyManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring & Notifications */}
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Suivi & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Paramètres de Notification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Notifications par Email</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Fréquence" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Quotidienne</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="milestone">Étapes importantes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Alertes de Retard</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seuil d'alerte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 jour</SelectItem>
                          <SelectItem value="3">3 jours</SelectItem>
                          <SelectItem value="7">7 jours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Inspections Programmées</h4>
                  <div className="space-y-2">
                    {phaseTasks
                      .filter(task => task.inspection_required && task.inspection_scheduled_date)
                      .map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{task.title}</span>
                            <div className="text-sm text-muted-foreground">
                              {task.inspection_scheduled_date && 
                                new Date(task.inspection_scheduled_date).toLocaleDateString('fr-FR')
                              }
                            </div>
                          </div>
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            Programmée
                          </Badge>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents & Conformité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Documents Requis par Tâche</h4>
                {phaseTasks.map(task => (
                  task.documents_required.length > 0 && (
                    <div key={task.id} className="border rounded p-3">
                      <h5 className="font-medium mb-2">{task.title}</h5>
                      <div className="space-y-1">
                        {task.documents_required.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{doc}</span>
                            <Badge variant="outline">Requis</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Task Edit Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask?.id ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
            </DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskEditForm
              task={editingTask}
              onSave={saveTask}
              onCancel={() => setShowTaskDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Resource Add Dialog */}
      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une Ressource</DialogTitle>
          </DialogHeader>
          <ResourceAddForm
            onAdd={(resource) => {
              addResourceToTask(selectedTaskId, resource);
              setShowResourceDialog(false);
            }}
            onCancel={() => setShowResourceDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Task Edit Form Component
const TaskEditForm: React.FC<{
  task: PhaseTask;
  onSave: (task: PhaseTask) => void;
  onCancel: () => void;
}> = ({ task, onSave, onCancel }) => {
  const [formData, setFormData] = useState(task);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Titre de la Tâche</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Nom de la tâche"
          />
        </div>
        <div className="space-y-2">
          <Label>Phase</Label>
          <Select
            value={formData.phase_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, phase_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="foundation">Fondation</SelectItem>
              <SelectItem value="structure">Structure</SelectItem>
              <SelectItem value="finishing">Finition</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description détaillée de la tâche"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Durée Estimée (jours)</Label>
          <Input
            type="number"
            value={formData.estimated_duration_days}
            onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_days: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Priorité</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Faible</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Élevée</SelectItem>
              <SelectItem value="critical">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Statut</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminée</SelectItem>
              <SelectItem value="delayed">Retardée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.inspection_required}
            onChange={(e) => setFormData(prev => ({ ...prev, inspection_required: e.target.checked }))}
          />
          <span>Inspection requise</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.payment_milestone}
            onChange={(e) => setFormData(prev => ({ ...prev, payment_milestone: e.target.checked }))}
          />
          <span>Étape de paiement</span>
        </label>
      </div>

      {formData.payment_milestone && (
        <div className="space-y-2">
          <Label>Pourcentage de Paiement (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.payment_percentage || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, payment_percentage: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onSave(formData)}>Sauvegarder</Button>
      </div>
    </div>
  );
};

// Resource Add Form Component
const ResourceAddForm: React.FC<{
  onAdd: (resource: TaskResource) => void;
  onCancel: () => void;
}> = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState<TaskResource>({
    type: 'employee',
    resourceId: '',
    resourceName: '',
    quantity: 1,
    estimatedCost: 0
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type de Ressource</Label>
        <Select
          value={formData.type}
          onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">Employé</SelectItem>
            <SelectItem value="material">Matériau</SelectItem>
            <SelectItem value="equipment">Équipement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Nom de la Ressource</Label>
        <Input
          value={formData.resourceName}
          onChange={(e) => setFormData(prev => ({ ...prev, resourceName: e.target.value }))}
          placeholder="Nom de la ressource"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantité</Label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Coût Estimé</Label>
          <Input
            type="number"
            value={formData.estimatedCost}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onAdd(formData)}>Ajouter</Button>
      </div>
    </div>
  );
};

export default EnhancedProjectEditFormWithTasks;