import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import PhaseMaterials from './PhaseMaterials';
import PhaseTasks from './PhaseTasks';
import PhasePayments from './PhasePayments';
import PhaseDocuments from './PhaseDocuments';

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

  // Sync form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Load phases from initialData if they exist
      if (initialData.phases && Array.isArray(initialData.phases)) {
        const transformedPhases = initialData.phases.map((phase: any, index: number) => ({
          id: phase.id || `phase_${index}`,
          title: phase.title || phase.phase_name || '',
          description: phase.description || '',
          order: phase.order || index + 1,
          status: phase.status || 'pending',
          startDate: phase.startDate || phase.start_date || '',
          endDate: phase.endDate || phase.end_date || '',
          steps: [] // Initialize empty, will be populated from database
        }));
        setProjectPhases(transformedPhases);
      }
    }
  }, [initialData]);

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
                  <Badge variant={formData.status === 'InProgress' ? 'default' : 'secondary'}>
                    {formData.status === 'InProgress' ? 'En cours' :
                     formData.status === 'Completed' ? 'Terminé' :
                     formData.status === 'OnHold' ? 'En pause' :
                     formData.status === 'Cancelled' ? 'Annulé' :
                     formData.status === 'Planning' ? 'En planification' : 'En attente'}
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
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-blue-500" />
                          Informations Générales du Projet
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Project Basic Info */}
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="title" className="text-base font-medium">
                                Titre du Projet *
                              </Label>
                              <Input
                                id="title"
                                value={formData.title || ''}
                                onChange={(e) => updateFormData({ title: e.target.value })}
                                placeholder="Entrez le titre du projet"
                                className="mt-2"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="description" className="text-base font-medium">
                                Description
                              </Label>
                              <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => updateFormData({ description: e.target.value })}
                                placeholder="Description détaillée du projet"
                                rows={4}
                                className="mt-2"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="status" className="text-base font-medium">
                                    Statut
                                  </Label>
                                  <Select 
                                    value={formData.status || 'Planning'} 
                                    onValueChange={(value) => updateFormData({ status: value })}
                                  >
                                    <SelectTrigger className="mt-2">
                                      <SelectValue placeholder="Sélectionner un statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Planning">En planification</SelectItem>
                                      <SelectItem value="InProgress">En cours</SelectItem>
                                      <SelectItem value="OnHold">En pause</SelectItem>
                                      <SelectItem value="Completed">Terminé</SelectItem>
                                      <SelectItem value="Cancelled">Annulé</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                              <div>
                                <Label htmlFor="priority" className="text-base font-medium">
                                  Priorité
                                </Label>
                                <Select 
                                  value={formData.priority || 'medium'} 
                                  onValueChange={(value) => updateFormData({ priority: value })}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Sélectionner une priorité" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Faible</SelectItem>
                                    <SelectItem value="medium">Moyenne</SelectItem>
                                    <SelectItem value="high">Élevée</SelectItem>
                                    <SelectItem value="critical">Critique</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          {/* Project Details */}
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="start_date" className="text-base font-medium">
                                  Date de début
                                </Label>
                                <Input
                                  id="start_date"
                                  type="date"
                                  value={formData.start_date || ''}
                                  onChange={(e) => updateFormData({ start_date: e.target.value })}
                                  className="mt-2"
                                />
                              </div>

                              <div>
                                <Label htmlFor="end_date" className="text-base font-medium">
                                  Date de fin
                                </Label>
                                <Input
                                  id="end_date"
                                  type="date"
                                  value={formData.end_date || ''}
                                  onChange={(e) => updateFormData({ end_date: e.target.value })}
                                  className="mt-2"
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="budget" className="text-base font-medium">
                                Budget (MRU)
                              </Label>
                              <Input
                                id="budget"
                                type="number"
                                value={formData.budget || ''}
                                onChange={(e) => updateFormData({ budget: e.target.value })}
                                placeholder="Montant du budget"
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="location" className="text-base font-medium">
                                Localisation
                              </Label>
                              <Input
                                id="location"
                                value={formData.location || ''}
                                onChange={(e) => updateFormData({ location: e.target.value })}
                                placeholder="Adresse ou zone du projet"
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="client" className="text-base font-medium">
                                Client
                              </Label>
                              <Input
                                id="client"
                                value={formData.client || ''}
                                onChange={(e) => updateFormData({ client: e.target.value })}
                                placeholder="Nom du client"
                                className="mt-2"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Progress & Status */}
                        <Card className="p-4 bg-muted/50">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-base font-medium">Progression du Projet</Label>
                            <Badge variant={formData.status === 'InProgress' ? 'default' : 'secondary'}>
                              {formData.progress || 0}%
                            </Badge>
                          </div>
                          <Progress value={formData.progress || 0} className="h-3" />
                          
                          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                            <div className="text-center">
                              <div className="text-muted-foreground">Phases</div>
                              <div className="font-semibold">{projectPhases.length}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">Étapes complétées</div>
                              <div className="font-semibold">
                                {projectPhases.reduce((acc, phase) => 
                                  acc + phase.steps.filter(step => step.status === 'completed').length, 0
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground">Total étapes</div>
                              <div className="font-semibold">
                                {projectPhases.reduce((acc, phase) => acc + phase.steps.length, 0)}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Phases - Enhanced with CRUD management */}
                {activeTab === 'phases' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-500" />
                            Phases de Construction ({formData.phases?.length || 0})
                          </CardTitle>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const newPhase = {
                                id: `phase_${Date.now()}`,
                                title: `Phase ${(formData.phases?.length || 0) + 1}`,
                                description: '',
                                startDate: '',
                                endDate: '',
                                status: 'not_started',
                                budget: 0,
                                progress: 0
                              };
                              updateFormData({
                                phases: [...(formData.phases || []), newPhase]
                              });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter Phase
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {formData.phases && formData.phases.length > 0 ? (
                          <div className="space-y-4">
                            {formData.phases.map((phase, index) => (
                              <Card key={phase.id || index} className="border-l-4 border-l-indigo-500">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Input 
                                          value={phase.title || `Phase ${index + 1}`}
                                          onChange={(e) => {
                                            const updatedPhases = [...(formData.phases || [])];
                                            updatedPhases[index] = { ...phase, title: e.target.value };
                                            updateFormData({ phases: updatedPhases });
                                          }}
                                          className="font-medium border-none p-0 h-auto text-base focus-visible:ring-0"
                                        />
                                        <Badge variant={
                                          phase.status === 'completed' ? 'default' : 
                                          phase.status === 'in_progress' ? 'secondary' : 
                                          phase.status === 'delayed' ? 'destructive' : 'outline'
                                        }>
                                          {phase.status === 'completed' ? 'Terminé' :
                                           phase.status === 'in_progress' ? 'En cours' :
                                           phase.status === 'delayed' ? 'Retardé' : 'Non commencé'}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">{phase.description || 'Aucune description'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button variant="outline" size="sm">
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Détails & CRUD
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                          <DialogHeader>
                                            <DialogTitle>Gestion Détaillée - {phase.title}</DialogTitle>
                                          </DialogHeader>
                                          
                                          {phase.id && initialData?.id && (
                                            <div className="grid grid-cols-3 gap-6">
                                              {/* Materials Management */}
                                              <Card>
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-sm flex items-center gap-2">
                                                    <Package className="h-4 w-4" />
                                                    Matériaux
                                                  </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3">
                                                  <PhaseMaterials 
                                                    phaseId={phase.id} 
                                                    projectId={initialData.id} 
                                                  />
                                                </CardContent>
                                              </Card>
                                              
                                              {/* Tasks Management */}
                                              <Card>
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-sm flex items-center gap-2">
                                                    <Target className="h-4 w-4" />
                                                    Tâches & Inspections
                                                  </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3">
                                                  <PhaseTasks 
                                                    phaseId={phase.id} 
                                                    projectId={initialData.id} 
                                                  />
                                                </CardContent>
                                              </Card>
                                              
                                              {/* Payments Management */}
                                              <Card>
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-sm flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4" />
                                                    Jalons de Paiement
                                                  </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3">
                                                  <PhasePayments 
                                                    phaseId={phase.id} 
                                                    projectId={initialData.id} 
                                                  />
                                                </CardContent>
                                              </Card>
                                              
                                              {/* Documents Management */}
                                              <Card>
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-sm flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    Documents Requis
                                                  </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-3">
                                                  <PhaseDocuments 
                                                    phaseId={phase.id} 
                                                    projectId={initialData.id} 
                                                  />
                                                </CardContent>
                                              </Card>
                                              
                                              {/* Phase Info & Notifications */}
                                              <Card className="col-span-2">
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-sm flex items-center gap-2">
                                                    <Settings className="h-4 w-4" />
                                                    Informations & Notifications
                                                  </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                  <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                      <Label>Titre de la phase</Label>
                                                      <Input 
                                                        value={phase.title} 
                                                        onChange={(e) => {
                                                          const updatedPhases = [...(formData.phases || [])];
                                                          updatedPhases[index] = { ...phase, title: e.target.value };
                                                          updateFormData({ phases: updatedPhases });
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Statut</Label>
                                                      <Select 
                                                        value={phase.status} 
                                                        onValueChange={(value) => {
                                                          const updatedPhases = [...(formData.phases || [])];
                                                          updatedPhases[index] = { ...phase, status: value };
                                                          updateFormData({ phases: updatedPhases });
                                                        }}
                                                      >
                                                        <SelectTrigger>
                                                          <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          <SelectItem value="not_started">Non commencé</SelectItem>
                                                          <SelectItem value="in_progress">En cours</SelectItem>
                                                          <SelectItem value="completed">Terminé</SelectItem>
                                                          <SelectItem value="delayed">Retardé</SelectItem>
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                  </div>

                                                  <div>
                                                    <Label>Description</Label>
                                                    <Textarea 
                                                      value={phase.description} 
                                                      onChange={(e) => {
                                                        const updatedPhases = [...(formData.phases || [])];
                                                        updatedPhases[index] = { ...phase, description: e.target.value };
                                                        updateFormData({ phases: updatedPhases });
                                                      }}
                                                    />
                                                  </div>

                                                  <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                      <Label>Date de début</Label>
                                                      <Input 
                                                        type="date" 
                                                        value={phase.startDate} 
                                                        onChange={(e) => {
                                                          const updatedPhases = [...(formData.phases || [])];
                                                          updatedPhases[index] = { ...phase, startDate: e.target.value };
                                                          updateFormData({ phases: updatedPhases });
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Date de fin</Label>
                                                      <Input 
                                                        type="date" 
                                                        value={phase.endDate} 
                                                        onChange={(e) => {
                                                          const updatedPhases = [...(formData.phases || [])];
                                                          updatedPhases[index] = { ...phase, endDate: e.target.value };
                                                          updateFormData({ phases: updatedPhases });
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label>Budget (MRU)</Label>
                                                      <Input 
                                                        type="number" 
                                                        value={phase.budget} 
                                                        onChange={(e) => {
                                                          const updatedPhases = [...(formData.phases || [])];
                                                          updatedPhases[index] = { ...phase, budget: parseFloat(e.target.value) || 0 };
                                                          updateFormData({ phases: updatedPhases });
                                                        }}
                                                      />
                                                    </div>
                                                  </div>

                                                  <div className="p-4 border rounded-lg">
                                                    <h4 className="font-medium mb-3">Paramètres de Notification</h4>
                                                    <div className="space-y-3">
                                                      <div className="flex items-center justify-between">
                                                        <Label>Notifications d'avancement</Label>
                                                        <Checkbox />
                                                      </div>
                                                      <div className="flex items-center justify-between">
                                                        <Label>Alertes de retard</Label>
                                                        <Checkbox />
                                                      </div>
                                                      <div className="flex items-center justify-between">
                                                        <Label>Rappels de tâches</Label>
                                                        <Checkbox />
                                                      </div>
                                                    </div>
                                                  </div>

                                                  <div className="p-4 border rounded-lg">
                                                    <h4 className="font-medium mb-2">Auto-sauvegarde</h4>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                      Les modifications sont automatiquement sauvegardées
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                      <span className="text-sm text-green-600">Sauvegarde active</span>
                                                    </div>
                                                  </div>
                                                </CardContent>
                                              </Card>
                                            </div>
                                          )}
                                        </DialogContent>
                                      </Dialog>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          const updatedPhases = formData.phases?.filter((_, i) => i !== index) || [];
                                          updateFormData({ phases: updatedPhases });
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Dates</p>
                                      <p>{phase.startDate || 'Non définie'} → {phase.endDate || 'Non définie'}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Budget</p>
                                      <p>{phase.budget?.toLocaleString() || '0'} MRU</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Progression</p>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-muted rounded-full h-2">
                                          <div 
                                            className="bg-primary h-2 rounded-full" 
                                            style={{ width: `${phase.progress || 0}%` }}
                                          />
                                        </div>
                                        <span className="text-xs">{phase.progress || 0}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <h3 className="font-medium mb-2">Aucune phase définie</h3>
                            <p className="text-sm mb-4">Commencez par ajouter des phases pour structurer votre projet</p>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                const newPhase = {
                                  id: `phase_${Date.now()}`,
                                  title: 'Phase 1',
                                  description: '',
                                  startDate: '',
                                  endDate: '',
                                  status: 'not_started',
                                  budget: 0,
                                  progress: 0
                                };
                                updateFormData({ phases: [newPhase] });
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter la première phase
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                                                 <SelectValue />
                                               </SelectTrigger>
                                               <SelectContent>
                                                 <SelectItem value="pending">En attente</SelectItem>
                                                 <SelectItem value="in_progress">En cours</SelectItem>
                                                 <SelectItem value="completed">Terminée</SelectItem>
                                               </SelectContent>
                                             </Select>
                                           </div>
                                         </div>
                                         <div>
                                           <Label>Description</Label>
                                           <Textarea
                                             value={phase.description || ''}
                                             onChange={(e) => {
                                               setProjectPhases(prev => prev.map(p => 
                                                 p.id === phase.id ? { ...p, description: e.target.value } : p
                                               ));
                                               setHasUnsavedChanges(true);
                                             }}
                                             placeholder="Description de la phase..."
                                             rows={3}
                                           />
                                         </div>
                                         <div className="grid grid-cols-2 gap-4">
                                           <div>
                                             <Label>Date de début</Label>
                                             <Input
                                               type="date"
                                               value={phase.startDate || ''}
                                               onChange={(e) => {
                                                 setProjectPhases(prev => prev.map(p => 
                                                   p.id === phase.id ? { ...p, startDate: e.target.value } : p
                                                 ));
                                                 setHasUnsavedChanges(true);
                                               }}
                                             />
                                           </div>
                                           <div>
                                             <Label>Date de fin</Label>
                                             <Input
                                               type="date"
                                               value={phase.endDate || ''}
                                               onChange={(e) => {
                                                 setProjectPhases(prev => prev.map(p => 
                                                   p.id === phase.id ? { ...p, endDate: e.target.value } : p
                                                 ));
                                                 setHasUnsavedChanges(true);
                                               }}
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     </DialogContent>
                                   </Dialog>
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => createNewStep(phase.id)}
                                   >
                                     <Plus className="h-3 w-3 mr-1" />
                                     Nouvelle Étape
                                   </Button>
                                 </div>
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

                                   {/* Step Management Section */}
                                   <div className="bg-card rounded-lg border p-6 space-y-6">
                                     <div className="flex items-center justify-between">
                                       <div>
                                         <Input
                                           value={step.title}
                                           onChange={(e) => updateStep(phase.id, step.id, { title: e.target.value })}
                                           placeholder="Nom de l'étape"
                                           className="font-medium text-lg border-none shadow-none p-0 h-auto"
                                         />
                                         <Textarea
                                           value={step.description || ''}
                                           onChange={(e) => updateStep(phase.id, step.id, { description: e.target.value })}
                                           placeholder="Description de l'étape..."
                                           className="mt-2 min-h-0 resize-none border-none shadow-none p-0"
                                           rows={2}
                                         />
                                       </div>
                                       <Select
                                         value={step.status}
                                         onValueChange={(value) => updateStep(phase.id, step.id, { status: value as any })}
                                       >
                                         <SelectTrigger className="w-32">
                                           <SelectValue />
                                         </SelectTrigger>
                                         <SelectContent>
                                           <SelectItem value="pending">En attente</SelectItem>
                                           <SelectItem value="in_progress">En cours</SelectItem>
                                           <SelectItem value="completed">Terminé</SelectItem>
                                           <SelectItem value="delayed">Retardé</SelectItem>
                                         </SelectContent>
                                       </Select>
                                     </div>

                                     {/* Materials & Resource Management */}
                                     <Card>
                                       <CardHeader className="pb-3">
                                         <CardTitle className="flex items-center gap-2 text-base">
                                           <Package className="h-4 w-4 text-purple-500" />
                                           Gestion des Matériaux & Ressources
                                         </CardTitle>
                                       </CardHeader>
                                       <CardContent className="space-y-4">
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                           {step.materials.map((material) => (
                                             <div key={material.id} className="p-3 bg-muted rounded-lg">
                                               <div className="flex items-center justify-between mb-2">
                                                 <span className="font-medium text-sm">{material.resourceName}</span>
                                                 <Button
                                                   size="sm"
                                                   variant="ghost"
                                                   onClick={() => {
                                                     updateStep(phase.id, step.id, {
                                                       materials: step.materials.filter(m => m.id !== material.id)
                                                     });
                                                   }}
                                                 >
                                                   <Trash2 className="h-3 w-3" />
                                                 </Button>
                                               </div>
                                               <div className="text-xs text-muted-foreground space-y-1">
                                                 <div>Quantité: {material.quantity}</div>
                                                 <div>Type: {material.type}</div>
                                                 {material.estimatedCost && (
                                                   <div>Coût estimé: {material.estimatedCost} MRU</div>
                                                 )}
                                               </div>
                                             </div>
                                           ))}
                                           
                                           <Dialog>
                                             <DialogTrigger asChild>
                                               <Button variant="outline" className="p-6 border-dashed">
                                                 <div className="text-center">
                                                   <Plus className="h-6 w-6 mx-auto mb-2" />
                                                   <div className="text-sm">Ajouter Matériau</div>
                                                 </div>
                                               </Button>
                                             </DialogTrigger>
                                             <DialogContent>
                                               <DialogHeader>
                                                 <DialogTitle>Nouveau Matériau</DialogTitle>
                                               </DialogHeader>
                                               <div className="space-y-4">
                                                 <div>
                                                   <Label>Nom du matériau</Label>
                                                   <Input id="materialName" placeholder="Ex: Ciment, Acier, etc." />
                                                 </div>
                                                 <div className="grid grid-cols-2 gap-4">
                                                   <div>
                                                     <Label>Quantité</Label>
                                                     <Input id="materialQuantity" type="number" placeholder="0" />
                                                   </div>
                                                   <div>
                                                     <Label>Coût estimé (MRU)</Label>
                                                     <Input id="materialCost" type="number" placeholder="0" />
                                                   </div>
                                                 </div>
                                                 <Button
                                                   onClick={() => {
                                                     const name = (document.getElementById('materialName') as HTMLInputElement)?.value;
                                                     const quantity = (document.getElementById('materialQuantity') as HTMLInputElement)?.value;
                                                     const cost = (document.getElementById('materialCost') as HTMLInputElement)?.value;
                                                     
                                                     if (name && quantity) {
                                                       addMaterialToStep(phase.id, step.id, {
                                                         type: 'material',
                                                         resourceId: `mat_${Date.now()}`,
                                                         resourceName: name,
                                                         quantity: parseInt(quantity),
                                                         estimatedCost: cost ? parseFloat(cost) : undefined
                                                       });
                                                     }
                                                   }}
                                                   className="w-full"
                                                 >
                                                   Ajouter
                                                 </Button>
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                         </div>
                                       </CardContent>
                                     </Card>

                                     {/* Task Creation with Inspection Scheduling */}
                                     <Card>
                                       <CardHeader className="pb-3">
                                         <CardTitle className="flex items-center gap-2 text-base">
                                           <Target className="h-4 w-4 text-blue-500" />
                                           Création de Tâches & Programmation d'Inspections
                                         </CardTitle>
                                       </CardHeader>
                                       <CardContent className="space-y-4">
                                         <div className="space-y-3">
                                           {step.tasks.map((task) => (
                                             <div key={task.id} className="p-4 bg-muted rounded-lg">
                                               <div className="flex items-center justify-between mb-2">
                                                 <h5 className="font-medium">{task.title}</h5>
                                                 <div className="flex items-center gap-2">
                                                   <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                                                     {task.priority}
                                                   </Badge>
                                                   <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                                                     {task.status}
                                                   </Badge>
                                                 </div>
                                               </div>
                                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                 <div>
                                                   <span className="text-muted-foreground">Durée: </span>
                                                   {task.estimated_duration_days} jours
                                                 </div>
                                                 <div>
                                                   <span className="text-muted-foreground">Inspection: </span>
                                                   {task.inspection_required ? 'Requise' : 'Non requise'}
                                                 </div>
                                                 <div>
                                                   <span className="text-muted-foreground">Paiement: </span>
                                                   {task.payment_milestone ? `${task.payment_percentage}%` : 'Aucun'}
                                                 </div>
                                               </div>
                                             </div>
                                           ))}
                                           
                                           <Dialog>
                                             <DialogTrigger asChild>
                                               <Button variant="outline" className="w-full border-dashed">
                                                 <Plus className="h-4 w-4 mr-2" />
                                                 Nouvelle Tâche
                                               </Button>
                                             </DialogTrigger>
                                             <DialogContent className="max-w-2xl">
                                               <DialogHeader>
                                                 <DialogTitle>Créer une Nouvelle Tâche</DialogTitle>
                                               </DialogHeader>
                                               <div className="space-y-4">
                                                 <div>
                                                   <Label>Titre de la tâche</Label>
                                                   <Input id="taskTitle" placeholder="Ex: Installation des fondations" />
                                                 </div>
                                                 <div>
                                                   <Label>Description</Label>
                                                   <Textarea id="taskDescription" placeholder="Description détaillée..." />
                                                 </div>
                                                 <div className="grid grid-cols-2 gap-4">
                                                   <div>
                                                     <Label>Durée estimée (jours)</Label>
                                                     <Input id="taskDuration" type="number" defaultValue="1" />
                                                   </div>
                                                   <div>
                                                     <Label>Priorité</Label>
                                                     <Select defaultValue="medium">
                                                       <SelectTrigger id="taskPriority">
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
                                                 </div>
                                                 <div className="flex items-center space-x-4">
                                                   <div className="flex items-center space-x-2">
                                                     <Checkbox id="inspectionRequired" />
                                                     <Label htmlFor="inspectionRequired">Inspection requise</Label>
                                                   </div>
                                                   <div className="flex items-center space-x-2">
                                                     <Checkbox id="paymentMilestone" />
                                                     <Label htmlFor="paymentMilestone">Jalon de paiement</Label>
                                                   </div>
                                                 </div>
                                                 <Button
                                                   onClick={() => {
                                                     const title = (document.getElementById('taskTitle') as HTMLInputElement)?.value;
                                                     const description = (document.getElementById('taskDescription') as HTMLTextAreaElement)?.value;
                                                     const duration = (document.getElementById('taskDuration') as HTMLInputElement)?.value;
                                                     const inspectionRequired = (document.getElementById('inspectionRequired') as HTMLInputElement)?.checked;
                                                     const paymentMilestone = (document.getElementById('paymentMilestone') as HTMLInputElement)?.checked;
                                                     
                                                     if (title) {
                                                       const newTask: PhaseTask = {
                                                         id: `task_${Date.now()}`,
                                                         title,
                                                         description,
                                                         phase_id: phase.id,
                                                         phase_name: phase.title,
                                                         step_id: step.id,
                                                         estimated_duration_days: parseInt(duration) || 1,
                                                         status: 'pending',
                                                         priority: 'medium',
                                                         resources: [],
                                                         documents_required: [],
                                                         inspection_required: inspectionRequired,
                                                         payment_milestone: paymentMilestone
                                                       };
                                                       updateStep(phase.id, step.id, {
                                                         tasks: [...step.tasks, newTask]
                                                       });
                                                     }
                                                   }}
                                                   className="w-full"
                                                 >
                                                   Créer la Tâche
                                                 </Button>
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                         </div>
                                       </CardContent>
                                     </Card>

                                     {/* Payment Milestone Tracking */}
                                     <Card>
                                       <CardHeader className="pb-3">
                                         <CardTitle className="flex items-center gap-2 text-base">
                                           <DollarSign className="h-4 w-4 text-green-500" />
                                           Suivi des Jalons de Paiement
                                         </CardTitle>
                                       </CardHeader>
                                       <CardContent className="space-y-4">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                           {step.payments.map((payment) => (
                                             <div key={payment.id} className="p-3 bg-muted rounded-lg">
                                               <div className="flex items-center justify-between mb-2">
                                                 <span className="font-medium">{payment.percentage}%</span>
                                                 <Badge variant={payment.status === 'paid' ? 'default' : 'outline'}>
                                                   {payment.status}
                                                 </Badge>
                                               </div>
                                               <div className="text-sm text-muted-foreground">
                                                 Montant: {payment.amount} MRU
                                                 {payment.dueDate && (
                                                   <div>Échéance: {new Date(payment.dueDate).toLocaleDateString('fr-FR')}</div>
                                                 )}
                                               </div>
                                             </div>
                                           ))}
                                           
                                           <Dialog>
                                             <DialogTrigger asChild>
                                               <Button variant="outline" className="p-6 border-dashed">
                                                 <div className="text-center">
                                                   <Plus className="h-6 w-6 mx-auto mb-2" />
                                                   <div className="text-sm">Nouveau Jalon</div>
                                                 </div>
                                               </Button>
                                             </DialogTrigger>
                                             <DialogContent>
                                               <DialogHeader>
                                                 <DialogTitle>Nouveau Jalon de Paiement</DialogTitle>
                                               </DialogHeader>
                                               <div className="space-y-4">
                                                 <div className="grid grid-cols-2 gap-4">
                                                   <div>
                                                     <Label>Pourcentage (%)</Label>
                                                     <Input id="paymentPercentage" type="number" placeholder="0" />
                                                   </div>
                                                   <div>
                                                     <Label>Montant (MRU)</Label>
                                                     <Input id="paymentAmount" type="number" placeholder="0" />
                                                   </div>
                                                 </div>
                                                 <div>
                                                   <Label>Date d'échéance</Label>
                                                   <Input id="paymentDueDate" type="date" />
                                                 </div>
                                                 <Button
                                                   onClick={() => {
                                                     const percentage = (document.getElementById('paymentPercentage') as HTMLInputElement)?.value;
                                                     const amount = (document.getElementById('paymentAmount') as HTMLInputElement)?.value;
                                                     const dueDate = (document.getElementById('paymentDueDate') as HTMLInputElement)?.value;
                                                     
                                                     if (percentage && amount) {
                                                       addPaymentMilestone(phase.id, step.id, {
                                                         percentage: parseFloat(percentage),
                                                         amount: parseFloat(amount),
                                                         status: 'pending',
                                                         dueDate
                                                       });
                                                     }
                                                   }}
                                                   className="w-full"
                                                 >
                                                   Ajouter le Jalon
                                                 </Button>
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                         </div>
                                       </CardContent>
                                     </Card>

                                     {/* Document Requirements */}
                                     <Card>
                                       <CardHeader className="pb-3">
                                         <CardTitle className="flex items-center gap-2 text-base">
                                           <Upload className="h-4 w-4 text-orange-500" />
                                           Documents Requis & Gestion
                                         </CardTitle>
                                       </CardHeader>
                                       <CardContent className="space-y-4">
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                           {step.documents.map((doc) => (
                                             <div key={doc.id} className="p-3 bg-muted rounded-lg">
                                               <div className="flex items-center justify-between mb-2">
                                                 <span className="font-medium text-sm">{doc.title}</span>
                                                 <Badge variant={doc.status === 'validated' ? 'default' : 'outline'}>
                                                   {doc.status}
                                                 </Badge>
                                               </div>
                                               <div className="text-xs text-muted-foreground space-y-1">
                                                 <div>Type: {doc.type === 'required' ? 'Obligatoire' : 'Optionnel'}</div>
                                                 {doc.deadline && (
                                                   <div>Échéance: {new Date(doc.deadline).toLocaleDateString('fr-FR')}</div>
                                                 )}
                                               </div>
                                             </div>
                                           ))}
                                           
                                           <Dialog>
                                             <DialogTrigger asChild>
                                               <Button variant="outline" className="p-6 border-dashed">
                                                 <div className="text-center">
                                                   <Plus className="h-6 w-6 mx-auto mb-2" />
                                                   <div className="text-sm">Nouveau Document</div>
                                                 </div>
                                               </Button>
                                             </DialogTrigger>
                                             <DialogContent>
                                               <DialogHeader>
                                                 <DialogTitle>Nouveau Document Requis</DialogTitle>
                                               </DialogHeader>
                                               <div className="space-y-4">
                                                 <div>
                                                   <Label>Titre du document</Label>
                                                   <Input id="docTitle" placeholder="Ex: Certificat de conformité" />
                                                 </div>
                                                 <div>
                                                   <Label>Type</Label>
                                                   <Select defaultValue="required">
                                                     <SelectTrigger id="docType">
                                                       <SelectValue />
                                                     </SelectTrigger>
                                                     <SelectContent>
                                                       <SelectItem value="required">Obligatoire</SelectItem>
                                                       <SelectItem value="optional">Optionnel</SelectItem>
                                                     </SelectContent>
                                                   </Select>
                                                 </div>
                                                 <div>
                                                   <Label>Date limite</Label>
                                                   <Input id="docDeadline" type="date" />
                                                 </div>
                                                 <Button
                                                   onClick={() => {
                                                     const title = (document.getElementById('docTitle') as HTMLInputElement)?.value;
                                                     const type = (document.querySelector('#docType [data-state="checked"]') as HTMLElement)?.textContent?.toLowerCase() === 'obligatoire' ? 'required' : 'optional';
                                                     const deadline = (document.getElementById('docDeadline') as HTMLInputElement)?.value;
                                                     
                                                     if (title) {
                                                       updateStep(phase.id, step.id, {
                                                         documents: [...step.documents, {
                                                           id: `doc_${Date.now()}`,
                                                           title,
                                                           type,
                                                           status: 'pending',
                                                           deadline
                                                         }]
                                                       });
                                                     }
                                                   }}
                                                   className="w-full"
                                                 >
                                                   Ajouter le Document
                                                 </Button>
                                               </div>
                                             </DialogContent>
                                           </Dialog>
                                         </div>
                                       </CardContent>
                                     </Card>

                                     {/* Notification Settings */}
                                     <Card>
                                       <CardHeader className="pb-3">
                                         <CardTitle className="flex items-center gap-2 text-base">
                                           <Bell className="h-4 w-4 text-blue-500" />
                                           Paramètres de Notification
                                         </CardTitle>
                                       </CardHeader>
                                       <CardContent>
                                         <div className="space-y-4">
                                           {step.notifications.map((notif, index) => (
                                             <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                               <div>
                                                 <div className="font-medium capitalize">{notif.type}</div>
                                                 <div className="text-sm text-muted-foreground">
                                                   Fréquence: {notif.frequency}
                                                 </div>
                                               </div>
                                               <div className="flex items-center gap-3">
                                                 <Select
                                                   value={notif.frequency}
                                                   onValueChange={(value) => {
                                                     updateStep(phase.id, step.id, {
                                                       notifications: step.notifications.map((n, i) =>
                                                         i === index ? { ...n, frequency: value as any } : n
                                                       )
                                                     });
                                                   }}
                                                 >
                                                   <SelectTrigger className="w-24">
                                                     <SelectValue />
                                                   </SelectTrigger>
                                                   <SelectContent>
                                                     <SelectItem value="daily">Quotidien</SelectItem>
                                                     <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                                     <SelectItem value="milestone">Jalons</SelectItem>
                                                   </SelectContent>
                                                 </Select>
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
                                             </div>
                                           ))}
                                         </div>
                                       </CardContent>
                                     </Card>
                                   </div>
                                </div>
                              ))}
                            </div>
                           </motion.div>
                           ))
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

                {/* Stakeholders - Distinguish Internal vs External like create form */}
                {activeTab === 'stakeholders' && (
                  <div className="space-y-6">
                    {/* Internal Team (Équipe Interne) */}
                    <Card className="border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          Équipe Interne
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Project Manager */}
                        <div className="space-y-3 mb-4">
                          <Label className="text-sm font-medium">Chef de Projet</Label>
                          {formData.delegation?.projectManager ? (
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  PM
                                </div>
                                <div>
                                  <p className="font-medium">Chef de Projet</p>
                                  <p className="text-sm text-muted-foreground">ID: {formData.delegation.projectManager}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Edit3 className="h-4 w-4 mr-2" />
                                      Modifier
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Modifier le Chef de Projet</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <EmployeeSelector
                                        value={formData.delegation.projectManager}
                                        onChange={(employeeId) => 
                                          updateFormData({ 
                                            delegation: { ...formData.delegation, projectManager: employeeId }
                                          })
                                        }
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => updateFormData({ 
                                    delegation: { ...formData.delegation, projectManager: '' }
                                  })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full border-dashed">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Assigner un Chef de Projet
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Sélectionner un Chef de Projet</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <EmployeeSelector
                                    value=""
                                    onChange={(employeeId) => 
                                      updateFormData({ 
                                        delegation: { ...formData.delegation, projectManager: employeeId }
                                      })
                                    }
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>

                        {/* Other Team Members */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Autres Membres</Label>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter Membre
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ajouter un Membre d'Équipe</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Rôle</Label>
                                    <Select>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner le rôle" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="technicalManager">Responsable Technique</SelectItem>
                                        <SelectItem value="supervisor">Superviseur</SelectItem>
                                        <SelectItem value="client">Client</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <EmployeeSelector
                                    value=""
                                    onChange={() => {}}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          {Object.entries(formData.delegation || {})
                            .filter(([key, value]) => key !== 'projectManager' && value)
                            .map(([role, employeeId]) => (
                              <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {role.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium">{role === 'technicalManager' ? 'Responsable Technique' : role === 'supervisor' ? 'Superviseur' : 'Client'}</p>
                                    <p className="text-sm text-muted-foreground">ID: {employeeId}</p>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => updateFormData({ 
                                    delegation: { ...formData.delegation, [role]: '' }
                                  })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                          {(!formData.delegation || Object.entries(formData.delegation)
                            .filter(([key, value]) => key !== 'projectManager' && value).length === 0) && (
                            <div className="text-center py-4 text-muted-foreground">
                              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Aucun autre membre d'équipe</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* External Stakeholders (Parties Prenantes Externes) */}
                    <Card className="border-orange-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building className="h-4 w-4 text-orange-600" />
                          Parties Prenantes Externes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Fournisseurs & Contractants</Label>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter Fournisseur
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <SimpleSupplierSelector
                                    value={null}
                                    onChange={(supplierId) => {
                                      if (supplierId) {
                                        const currentStakeholders = formData.stakeholders || [];
                                        updateFormData({
                                          stakeholders: [...currentStakeholders, {
                                            id: `stakeholder_${Date.now()}`,
                                            name: 'Nouveau Fournisseur',
                                            type: 'supplier',
                                            stakeholder_entity_type: 'supplier',
                                            stakeholder_id: supplierId
                                          }]
                                        });
                                      }
                                    }}
                                    allowCustom={true}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          {formData.stakeholders && formData.stakeholders.filter(s => s.stakeholder_entity_type === 'supplier').length > 0 ? (
                            <div className="space-y-2">
                              {formData.stakeholders.filter(s => s.stakeholder_entity_type === 'supplier').map((stakeholder, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                      S
                                    </div>
                                    <div>
                                      <p className="font-medium">{stakeholder.name || 'Fournisseur'}</p>
                                      <p className="text-sm text-muted-foreground">Type: {stakeholder.type || 'Fournisseur'}</p>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      const updatedStakeholders = formData.stakeholders?.filter((_, i) => i !== index) || [];
                                      updateFormData({ stakeholders: updatedStakeholders });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Aucun fournisseur externe ajouté</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                          <div className="space-y-3">
                            {(formData.suppliers || []).map((supplier) => (
                              <div key={supplier.id} className="bg-muted p-3 rounded flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {supplier.name?.charAt(0) || 'S'}
                                  </div>
                                  <div>
                                    <div className="font-medium">{supplier.name}</div>
                                    <div className="text-sm text-muted-foreground">{supplier.category || 'Fournisseur'}</div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    updateFormData({
                                      suppliers: (formData.suppliers || []).filter(s => s.id !== supplier.id)
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            
                            {!(formData.suppliers || []).length && (
                              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Aucun fournisseur assigné</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
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