import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, Users, Building2, Calendar, DollarSign, FileText, 
  Plus, Edit3, Trash2, CheckCircle, Clock, AlertTriangle,
  UserPlus, Settings, Bell, Eye, PlusCircle, Target, Building,
  UserCheck, Shield, Layers, Menu, Save, ArrowLeft, ArrowRight,
  Package, Wrench, Calendar as CalendarIcon, Upload
} from 'lucide-react';

import ProjectFormWithMap from './ProjectFormWithMap';
import OrganizationalHierarchyManager from '../admin/OrganizationalHierarchyManager';
import MaterialFormSection from '../MaterialFormSection';
import EmployeeSelector from '../selectors/EmployeeSelector';
import SimpleSupplierSelector from '../selectors/SimpleSupplierSelector';
import UserSelector from '../selectors/UserSelector';

interface TaskResource {
  id?: string;
  type: 'employee' | 'material' | 'equipment';
  resourceId: string;
  resourceName: string;
  quantity?: number;
  estimatedCost?: number;
}

interface TaskDocument {
  id?: string;
  title: string;
  type: 'required' | 'optional';
  status: 'pending' | 'uploaded' | 'validated';
  deadline?: string;
  fileUrl?: string;
}

interface PhaseStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  materials: TaskResource[];
  tasks: PhaseTask[];
  documents: TaskDocument[];
  inspections: {
    id?: string;
    type: string;
    scheduledDate?: string;
    status: 'pending' | 'scheduled' | 'completed';
    inspector?: string;
  }[];
  payments: {
    id?: string;
    percentage: number;
    amount: number;
    status: 'pending' | 'approved' | 'paid';
    dueDate?: string;
  }[];
  notifications: {
    type: 'email' | 'sms' | 'app';
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'milestone';
  }[];
}

interface ProjectPhase {
  id: string;
  title: string;
  description?: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  startDate?: string;
  endDate?: string;
  steps: PhaseStep[];
}

interface PhaseTask {
  id?: string;
  title: string;
  description?: string;
  phase_id: string;
  phase_name: string;
  step_id?: string;
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
  const [activePhaseId, setActivePhaseId] = useState<string>('');
  const [activeStepId, setActiveStepId] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([]);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('fr'); // fr, ar, en

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

  // Workflow steps matching create workflow
  const workflowSteps = [
    {
      id: 'basic',
      title: 'Informations Générales',
      icon: Building,
      description: 'Données de base du projet',
      color: 'bg-blue-500'
    },
    {
      id: 'stakeholders',
      title: 'Parties Prenantes',
      icon: Users,
      description: 'Configuration des acteurs',
      color: 'bg-green-500'
    },
    {
      id: 'team',
      title: 'Équipe & Contractants',
      icon: UserCheck,
      description: 'Ressources humaines',
      color: 'bg-orange-500'
    },
    {
      id: 'phases',
      title: 'Phases & Planification',
      icon: Layers,
      description: 'Structure et chronologie',
      color: 'bg-indigo-500'
    },
    {
      id: 'geolocation',
      title: 'Géolocalisation',
      icon: MapPin,
      description: 'Localisation précise',
      color: 'bg-cyan-500'
    },
    {
      id: 'resources',
      title: 'Ressources & Matériaux',
      icon: Shield,
      description: 'Matériaux et équipements',
      color: 'bg-purple-500'
    },
    {
      id: 'risks',
      title: 'Gestion des Risques',
      icon: AlertTriangle,
      description: 'Analyse des risques',
      color: 'bg-red-500'
    },
    {
      id: 'compliance',
      title: 'Conformités',
      icon: FileText,
      description: 'Validation finale',
      color: 'bg-teal-500'
    }
  ];

  const createNewPhase = () => {
    const newPhase: ProjectPhase = {
      id: `phase_${Date.now()}`,
      title: '',
      description: '',
      order: projectPhases.length + 1,
      status: 'pending',
      steps: []
    };
    setProjectPhases(prev => [...prev, newPhase]);
    setActivePhaseId(newPhase.id);
  };

  const createNewStep = (phaseId: string) => {
    const phase = projectPhases.find(p => p.id === phaseId);
    if (!phase) return;

    const newStep: PhaseStep = {
      id: `step_${Date.now()}`,
      title: '',
      description: '',
      order: phase.steps.length + 1,
      status: 'pending',
      materials: [],
      tasks: [],
      documents: [],
      inspections: [],
      payments: [],
      notifications: [
        { type: 'email', enabled: true, frequency: 'milestone' },
        { type: 'app', enabled: true, frequency: 'daily' }
      ]
    };

    setProjectPhases(prev => prev.map(p => 
      p.id === phaseId 
        ? { ...p, steps: [...p.steps, newStep] }
        : p
    ));
    setActiveStepId(newStep.id);
    setShowStepDialog(true);
  };

  const updateStep = (phaseId: string, stepId: string, updates: Partial<PhaseStep>) => {
    setProjectPhases(prev => prev.map(phase => 
      phase.id === phaseId 
        ? {
            ...phase,
            steps: phase.steps.map(step =>
              step.id === stepId ? { ...step, ...updates } : step
            )
          }
        : phase
    ));
    setHasUnsavedChanges(true);
  };

  const addMaterialToStep = (phaseId: string, stepId: string, material: TaskResource) => {
    updateStep(phaseId, stepId, {
      materials: [
        ...projectPhases.find(p => p.id === phaseId)?.steps.find(s => s.id === stepId)?.materials || [],
        { ...material, id: `mat_${Date.now()}` }
      ]
    });
  };

  const scheduleInspectionForStep = (phaseId: string, stepId: string, inspection: any) => {
    const currentStep = projectPhases.find(p => p.id === phaseId)?.steps.find(s => s.id === stepId);
    if (!currentStep) return;

    updateStep(phaseId, stepId, {
      inspections: [...currentStep.inspections, { ...inspection, id: `insp_${Date.now()}` }]
    });

    toast({
      title: "Inspection programmée",
      description: `Inspection ${inspection.type} programmée`,
    });
  };

  const addPaymentMilestone = (phaseId: string, stepId: string, payment: any) => {
    const currentStep = projectPhases.find(p => p.id === phaseId)?.steps.find(s => s.id === stepId);
    if (!currentStep) return;

    updateStep(phaseId, stepId, {
      payments: [...currentStep.payments, { ...payment, id: `pay_${Date.now()}` }]
    });
  };

  const isRTL = currentLanguage === 'ar';

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'} ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex">
        {/* Sidebar for Steps Navigation */}
        <motion.div
          initial={false}
          animate={{ width: sidebarCollapsed ? '60px' : '320px' }}
          className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-full bg-card border-r border-border z-40 overflow-hidden`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h2 className="font-semibold text-lg">Étapes du Projet</h2>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Steps Navigation */}
          <div className="p-2 space-y-2">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeTab === step.id;
              
              return (
                <motion.div
                  key={step.id}
                  whileHover={{ scale: sidebarCollapsed ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full ${sidebarCollapsed ? 'px-3' : 'justify-start'} ${
                      isActive ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => setActiveTab(step.id)}
                  >
                    <div className={`p-2 rounded ${step.color} text-white mr-2`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="font-medium">{step.title}</div>
                        <div className="text-xs opacity-70">{step.description}</div>
                      </div>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          {!sidebarCollapsed && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-xs text-muted-foreground mb-2">
                Progression globale: {Math.round((projectPhases.filter(p => p.status === 'completed').length / Math.max(projectPhases.length, 1)) * 100)}%
              </div>
              <Progress 
                value={(projectPhases.filter(p => p.status === 'completed').length / Math.max(projectPhases.length, 1)) * 100} 
                className="h-2"
              />
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <div className={`flex-1 ${isRTL ? 'mr-80' : 'ml-80'} ${sidebarCollapsed ? (isRTL ? 'mr-16' : 'ml-16') : ''} transition-all duration-300`}>
          {/* Header */}
          <div className="sticky top-0 z-30 bg-background border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {formData.title || 'Édition du Projet'}
                </h1>
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
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarde auto
                </Button>
                <Button onClick={() => onSubmit(formData)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Basic Information */}
                {activeTab === 'basic' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-blue-500" />
                        Informations Générales du Projet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProjectFormWithMap
                        initialData={formData}
                        onSubmit={updateFormData}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Phases & Detailed Step Management */}
                {activeTab === 'phases' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-500" />
                            Phases & Planification Détaillée
                          </CardTitle>
                          <Button onClick={createNewPhase}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle Phase
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {projectPhases.map((phase) => (
                          <motion.div
                            key={phase.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-lg p-4 mb-4"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Badge variant={phase.status === 'completed' ? 'default' : 'outline'}>
                                  Phase {phase.order}
                                </Badge>
                                <h3 className="font-semibold text-lg">
                                  {phase.title || `Phase ${phase.order}`}
                                </h3>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => createNewStep(phase.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Nouvelle Étape
                              </Button>
                            </div>

                            {/* Phase Steps */}
                            <div className="space-y-4 ml-4">
                              {phase.steps.map((step) => (
                                <div key={step.id} className="border-l-2 border-primary/20 pl-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium">
                                      {step.title || `Étape ${step.order}`}
                                    </h4>
                                    <Badge variant={step.status === 'completed' ? 'default' : 'outline'}>
                                      {step.status}
                                    </Badge>
                                  </div>

                                  {/* Step Details Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    {/* Materials Management */}
                                    <Card className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Package className="h-4 w-4 text-purple-500" />
                                        <span className="font-medium text-sm">Matériaux</span>
                                      </div>
                                      <div className="space-y-2">
                                        {step.materials.map((material) => (
                                          <div key={material.id} className="text-xs bg-muted p-2 rounded">
                                            {material.resourceName} (Qty: {material.quantity})
                                          </div>
                                        ))}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full text-xs"
                                          onClick={() => {
                                            const materialName = prompt('Nom du matériau:');
                                            const quantity = prompt('Quantité:');
                                            if (materialName && quantity) {
                                              addMaterialToStep(phase.id, step.id, {
                                                type: 'material',
                                                resourceId: `mat_${Date.now()}`,
                                                resourceName: materialName,
                                                quantity: parseInt(quantity)
                                              });
                                            }
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Ajouter
                                        </Button>
                                      </div>
                                    </Card>

                                    {/* Task Management */}
                                    <Card className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Target className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium text-sm">Tâches</span>
                                      </div>
                                      <div className="space-y-2">
                                        {step.tasks.map((task) => (
                                          <div key={task.id} className="text-xs bg-muted p-2 rounded">
                                            {task.title}
                                          </div>
                                        ))}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full text-xs"
                                          onClick={() => {
                                            const taskTitle = prompt('Titre de la tâche:');
                                            if (taskTitle) {
                                              const newTask: PhaseTask = {
                                                id: `task_${Date.now()}`,
                                                title: taskTitle,
                                                phase_id: phase.id,
                                                phase_name: phase.title,
                                                step_id: step.id,
                                                estimated_duration_days: 1,
                                                status: 'pending',
                                                priority: 'medium',
                                                resources: [],
                                                documents_required: [],
                                                inspection_required: false,
                                                payment_milestone: false
                                              };
                                              updateStep(phase.id, step.id, {
                                                tasks: [...step.tasks, newTask]
                                              });
                                            }
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Ajouter
                                        </Button>
                                      </div>
                                    </Card>

                                    {/* Inspections */}
                                    <Card className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="font-medium text-sm">Inspections</span>
                                      </div>
                                      <div className="space-y-2">
                                        {step.inspections.map((inspection) => (
                                          <div key={inspection.id} className="text-xs bg-muted p-2 rounded">
                                            {inspection.type}
                                            {inspection.scheduledDate && (
                                              <div className="text-muted-foreground">
                                                {new Date(inspection.scheduledDate).toLocaleDateString('fr-FR')}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full text-xs"
                                          onClick={() => {
                                            const type = prompt('Type d\'inspection:');
                                            const date = prompt('Date (YYYY-MM-DD):');
                                            if (type) {
                                              scheduleInspectionForStep(phase.id, step.id, {
                                                type,
                                                scheduledDate: date,
                                                status: 'scheduled'
                                              });
                                            }
                                          }}
                                        >
                                          <CalendarIcon className="h-3 w-3 mr-1" />
                                          Programmer
                                        </Button>
                                      </div>
                                    </Card>

                                    {/* Payments */}
                                    <Card className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="h-4 w-4 text-green-500" />
                                        <span className="font-medium text-sm">Paiements</span>
                                      </div>
                                      <div className="space-y-2">
                                        {step.payments.map((payment) => (
                                          <div key={payment.id} className="text-xs bg-muted p-2 rounded">
                                            {payment.percentage}% - {payment.amount} MRU
                                          </div>
                                        ))}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full text-xs"
                                          onClick={() => {
                                            const percentage = prompt('Pourcentage (%):');
                                            const amount = prompt('Montant (MRU):');
                                            if (percentage && amount) {
                                              addPaymentMilestone(phase.id, step.id, {
                                                percentage: parseFloat(percentage),
                                                amount: parseFloat(amount),
                                                status: 'pending'
                                              });
                                            }
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Ajouter
                                        </Button>
                                      </div>
                                    </Card>
                                  </div>

                                  {/* Documents & Notifications */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <Card className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Upload className="h-4 w-4 text-orange-500" />
                                        <span className="font-medium text-sm">Documents requis</span>
                                      </div>
                                      <div className="space-y-2">
                                        {step.documents.map((doc) => (
                                          <div key={doc.id} className="text-xs bg-muted p-2 rounded flex items-center justify-between">
                                            <span>{doc.title}</span>
                                            <Badge variant={doc.status === 'validated' ? 'default' : 'outline'} className="text-xs">
                                              {doc.status}
                                            </Badge>
                                          </div>
                                        ))}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="w-full text-xs"
                                          onClick={() => {
                                            const title = prompt('Titre du document:');
                                            const type = confirm('Document obligatoire ?') ? 'required' : 'optional';
                                            if (title) {
                                              updateStep(phase.id, step.id, {
                                                documents: [...step.documents, {
                                                  id: `doc_${Date.now()}`,
                                                  title,
                                                  type,
                                                  status: 'pending'
                                                }]
                                              });
                                            }
                                          }}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Ajouter
                                        </Button>
                                      </div>
                                    </Card>

                                    <Card className="p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Bell className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium text-sm">Notifications</span>
                                      </div>
                                      <div className="space-y-2">
                                        {step.notifications.map((notif, index) => (
                                          <div key={index} className="flex items-center justify-between text-xs">
                                            <span>{notif.type}</span>
                                            <Checkbox
                                              checked={notif.enabled}
                                              onCheckedChange={(checked) => {
                                                updateStep(phase.id, step.id, {
                                                  notifications: step.notifications.map((n, i) =>
                                                    i === index ? { ...n, enabled: !!checked } : n
                                                  )
                                                });
                                              }}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </Card>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ))}

                        {projectPhases.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune phase définie. Commencez par créer votre première phase.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Resources & Materials */}
                {activeTab === 'resources' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-500" />
                        Ressources & Matériaux
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MaterialFormSection
                        selectedMaterials={formData.materials || []}
                        onChange={(materials) => updateFormData({ materials })}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Stakeholders */}
                {activeTab === 'stakeholders' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-500" />
                        Parties Prenantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-base font-medium mb-3 block">Équipe du Projet</Label>
                            <EmployeeSelector
                              value={formData.projectManager || ''}
                              onChange={(value) => updateFormData({ projectManager: value })}
                              placeholder="Sélectionner le chef de projet"
                            />
                          </div>
                          <div>
                            <Label className="text-base font-medium mb-3 block">Fournisseurs</Label>
                            <SimpleSupplierSelector
                              value={formData.mainSupplier || ''}
                              onChange={(value) => updateFormData({ mainSupplier: value })}
                              placeholder="Sélectionner le fournisseur principal"
                            />
                          </div>
                        </div>
                        <OrganizationalHierarchyManager />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Team & Contractors */}
                {activeTab === 'team' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-orange-500" />
                        Équipe & Contractants
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-base font-medium mb-3 block">Chef de Projet</Label>
                            <UserSelector
                              value={formData.projectManager || ''}
                              onChange={(value) => updateFormData({ projectManager: value })}
                              placeholder="Assigner un chef de projet"
                            />
                          </div>
                          <div>
                            <Label className="text-base font-medium mb-3 block">Responsable Technique</Label>
                            <EmployeeSelector
                              value={formData.technicalManager || ''}
                              onChange={(value) => updateFormData({ technicalManager: value })}
                              placeholder="Assigner un responsable technique"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-base font-medium mb-3 block">Superviseur</Label>
                            <EmployeeSelector
                              value={formData.supervisor || ''}
                              onChange={(value) => updateFormData({ supervisor: value })}
                              placeholder="Assigner un superviseur"
                            />
                          </div>
                          <div>
                            <Label className="text-base font-medium mb-3 block">Client</Label>
                            <Input
                              value={formData.client || ''}
                              onChange={(e) => updateFormData({ client: e.target.value })}
                              placeholder="Nom du client"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Geolocation */}
                {activeTab === 'geolocation' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-cyan-500" />
                        Géolocalisation & Cartographie
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Adresse du Projet</Label>
                            <Input
                              value={formData.location || ''}
                              onChange={(e) => updateFormData({ location: e.target.value })}
                              placeholder="Adresse complète du projet"
                            />
                          </div>
                          <div>
                            <Label>Référence Parcellaire</Label>
                            <Input
                              value={formData.parcelReference || ''}
                              onChange={(e) => updateFormData({ parcelReference: e.target.value })}
                              placeholder="Référence de la parcelle"
                            />
                          </div>
                        </div>
                        <div className="h-96 border rounded-lg">
                          <div className="h-full flex items-center justify-center text-muted-foreground">
                            Carte interactive (à implémenter)
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Management */}
                {activeTab === 'risks' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Gestion des Risques
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button onClick={() => {
                          const risk = prompt('Description du risque:');
                          if (risk) {
                            updateFormData({
                              risks: [...(formData.risks || []), {
                                id: Date.now(),
                                description: risk,
                                severity: 'medium',
                                mitigation: '',
                                status: 'identified'
                              }]
                            });
                          }
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter un Risque
                        </Button>

                        <div className="space-y-2">
                          {(formData.risks || []).map((risk: any) => (
                            <div key={risk.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{risk.description}</span>
                                <Badge variant={risk.severity === 'high' ? 'destructive' : 'outline'}>
                                  {risk.severity}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Compliance */}
                {activeTab === 'compliance' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-teal-500" />
                        Conformités & Validation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <Label className="text-base font-medium mb-3 block">Documents de Conformité</Label>
                          <div className="space-y-2">
                            {['Permis de construire', 'Étude d\'impact', 'Validation technique'].map((doc) => (
                              <div key={doc} className="flex items-center space-x-2">
                                <Checkbox />
                                <span>{doc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Notes de Validation</Label>
                          <Textarea
                            value={formData.validationNotes || ''}
                            onChange={(e) => updateFormData({ validationNotes: e.target.value })}
                            placeholder="Notes et commentaires de validation..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Navigation Footer */}
            <div className="fixed bottom-4 right-4 flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = workflowSteps.findIndex(step => step.id === activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(workflowSteps[currentIndex - 1].id);
                  }
                }}
                disabled={workflowSteps.findIndex(step => step.id === activeTab) === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              <Button
                onClick={() => {
                  const currentIndex = workflowSteps.findIndex(step => step.id === activeTab);
                  if (currentIndex < workflowSteps.length - 1) {
                    setActiveTab(workflowSteps[currentIndex + 1].id);
                  }
                }}
                disabled={workflowSteps.findIndex(step => step.id === activeTab) === workflowSteps.length - 1}
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Step Configuration Dialog */}
        <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Configuration Détaillée de l'Étape</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Titre de l'Étape</Label>
                  <Input placeholder="Nom de l'étape" />
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea placeholder="Description de l'étape..." />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EnhancedProjectEditFormWithTasks;