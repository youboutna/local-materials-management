import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ProjectService } from '@/services/ProjectService';
import { ProjectStakeholderService } from '@/services/ProjectStakeholderService';
import { PhaseService, PhaseData } from '@/services/phaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Building, Users, Calendar, MapPin, AlertTriangle, FileText, Package,
  Plus, Edit2, Trash2, Save, Settings, Clock, DollarSign, Upload,
  User, Phone, Mail, Building2, UserCheck, Layers, Target, Shield,
  FileCheck, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, 
  Loader2, Check
} from 'lucide-react';

// Import existing components
import LocationSelector from '@/components/location/LocationSelector';
import WarehouseShapeTracer from '@/components/materials/WarehouseShapeTracer';
import MaterialLocationMap from '@/components/materials/MaterialLocationMap';
import UserSelector from '@/components/selectors/UserSelector';
import EmployeeSelector from '@/components/selectors/EmployeeSelector';
import SimpleSupplierSelector from '@/components/selectors/SimpleSupplierSelector';
import PhaseMaterials from './PhaseMaterials';
import PhaseTasks from './PhaseTasks';
import PhasePayments from './PhasePayments';
import PhaseDocuments from './PhaseDocuments';

interface EnhancedProjectEditFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onFormDataChange?: (data: any) => void;
}

const EnhancedProjectEditFormWithTasks: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onFormDataChange
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || {});
  const [originalFormData, setOriginalFormData] = useState(initialData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dialog states
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  // Initialize ProjectService
  const projectService = useMemo(() => new ProjectService(), []);

  // Load project data from database (merge into existing formData, do not wipe)
  const loadProjectData = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const projectDetail = await projectService.getProjectDetail(projectId);
      if (projectDetail) {
        setFormData((prev: any) => ({ ...prev, ...projectDetail }));
        setOriginalFormData((prev: any) => ({ ...prev, ...projectDetail }));
        onFormDataChange?.(projectDetail);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du projet.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, projectService, onFormDataChange, toast]);

  // Load stakeholders and phases from database and merge into form
  const loadRelatedData = useCallback(async () => {
    if (!projectId) return;
    try {
      const [stakeholdersData, phasesData] = await Promise.all([
        ProjectStakeholderService.getProjectStakeholders(projectId),
        PhaseService.loadProjectPhases(projectId)
      ]);

      const mappedStakeholders = (() => {
        const managers: any[] = [];
        const team: any[] = [];
        const suppliers: any[] = [];
        (stakeholdersData || []).forEach((s: any) => {
          if (s.stakeholder_entity_type === 'employee') {
            if ((s.stakeholder_type || '').includes('manager')) managers.push({ id: s.stakeholder_id, name: s.employee?.full_name || 'Manager' });
            else team.push({ id: s.stakeholder_id, name: s.employee?.full_name || 'Employé', department: s.employee?.department });
          } else if (s.stakeholder_entity_type === 'supplier') {
            suppliers.push({ id: s.stakeholder_id, name: s.supplier?.name || 'Fournisseur', type: 'Fournisseur' });
          }
        });
        return { managers, team, suppliers };
      })();

      setFormData((prev: any) => ({
        ...prev,
        stakeholders: mappedStakeholders,
        phases: phasesData as PhaseData[]
      }));
    } catch (err) {
      console.error('Error loading related data:', err);
    }
  }, [projectId]);

  // Load data on mount and when projectId changes
  useEffect(() => {
    if (!projectId) return;
    if (!initialData) {
      // Load project core + related in parallel
      Promise.all([loadProjectData(), loadRelatedData()]);
    } else {
      setFormData((prev: any) => ({ ...prev, ...initialData }));
      setOriginalFormData((prev: any) => ({ ...prev, ...initialData }));
      loadRelatedData();
    }
  }, [projectId, initialData, loadProjectData, loadRelatedData]);

  // Define workflow steps
  const steps = [
    {
      id: 'basic',
      title: 'Informations Générales',
      icon: Building,
      description: 'Données de base du projet'
    },
    {
      id: 'stakeholders',
      title: 'Parties Prenantes',
      icon: Users,
      description: 'Configuration des acteurs'
    },
    {
      id: 'team',
      title: 'Équipe & Contractants',
      icon: UserCheck,
      description: 'Ressources humaines'
    },
    {
      id: 'phases',
      title: 'Phases & Planification',
      icon: Layers,
      description: 'Structure des phases'
    },
    {
      id: 'geolocation',
      title: 'Géolocalisation',
      icon: MapPin,
      description: 'Localisation précise'
    },
    {
      id: 'resources',
      title: 'Ressources & Matériaux',
      icon: Shield,
      description: 'Matériaux et organisation'
    },
    {
      id: 'risks',
      title: 'Gestion des Risques',
      icon: AlertTriangle,
      description: 'Analyse des risques'
    },
    {
      id: 'compliance',
      title: 'Conformités',
      icon: FileCheck,
      description: 'Validation finale'
    }
  ];

  const updateFormData = useCallback((newData: any) => {
    const updatedData = { ...formData, ...newData };
    setFormData(updatedData);
    setHasUnsavedChanges(true);
    onFormDataChange?.(updatedData);
  }, [formData, onFormDataChange]);

  // Auto-save and manual save per-step
  const getCurrentStepId = useCallback(() => steps[currentStep - 1]?.id as string | undefined, [steps, currentStep]);

  const saveByStep = useCallback(async () => {
    if (!projectId) return;
    const stepId = getCurrentStepId();
    if (!stepId) return;

    switch (stepId) {
      case 'basic': {
        const partial: any = {
          title: formData.title,
          description: formData.description,
          budget: typeof formData.budget === 'number' ? formData.budget : Number(formData.budget) || 0,
          startDate: formData.startDate,
          endDate: formData.endDate,
          location: typeof formData.location === 'string' ? formData.location : (formData.location?.address || '')
        };
        await projectService.updateProject(projectId, partial);
        setOriginalFormData((prev: any) => ({ ...prev, ...partial }));
        break;
      }
      case 'stakeholders':
      case 'team': {
        const s = formData.stakeholders || { managers: [], team: [], suppliers: [] };
        const suppliers = (s.suppliers || []).map((sup: any) => ({ id: sup.id, type: sup.type, role_description: sup.role_description, is_primary: sup.is_primary }));
        const delegation: Record<string, string> = {};
        if (s.managers && s.managers[0]?.id) delegation.projectManager = s.managers[0].id;
        (s.team || []).forEach((m: any, idx: number) => { if (m?.id) delegation[`team_member_${idx + 1}`] = m.id; });
        await ProjectStakeholderService.updateProjectStakeholders(projectId, suppliers, delegation);
        break;
      }
      case 'phases': {
        const phases: PhaseData[] = formData.phases || [];
        if (phases.length > 0) await PhaseService.saveProjectPhases(projectId, phases);
        break;
      }
      default: {
        // For other steps, do nothing special
        break;
      }
    }
  }, [projectId, getCurrentStepId, formData, projectService]);

  // Auto-save on step change
  const autoSaveStep = useCallback(async () => {
    if (!projectId || !hasUnsavedChanges) return;
    try {
      await saveByStep();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [projectId, hasUnsavedChanges, saveByStep]);

  const handleSaveStep = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      await saveByStep();
      setHasUnsavedChanges(false);

      toast({
        title: "Étape sauvegardée",
        description: `Les données de l'étape ${currentStep} ont été sauvegardées.`,
      });

      // Mark step as completed
      const currentStepId = steps[currentStep - 1]?.id;
      if (currentStepId && !completedSteps.includes(currentStepId)) {
        setCompletedSteps([...completedSteps, currentStepId]);
      }
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: "Erreur",
        description: (error as any)?.message || "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle status change: update then go to parent (project detail)
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!projectId) return;
    try {
      setIsSaving(true);
      await projectService.updateProject(projectId, { ...formData, status: newStatus });
      toast({
        title: "Statut mis à jour",
        description: `Le statut du projet a été changé vers: ${newStatus}`,
      });
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: (error as any)?.message || "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [projectId, projectService, formData, toast, navigate]);

  // Handle step navigation with auto-save
  const handleStepChange = useCallback(async (newStep: number) => {
    if (hasUnsavedChanges) {
      await autoSaveStep();
    }
    setCurrentStep(newStep);
  }, [hasUnsavedChanges, autoSaveStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveStep();
  };

  const addStakeholder = (type: 'manager' | 'team' | 'supplier', stakeholder: any) => {
    const currentStakeholders = formData.stakeholders || { managers: [], team: [], suppliers: [] };
    updateFormData({
      stakeholders: {
        ...currentStakeholders,
        [type === 'manager' ? 'managers' : type === 'team' ? 'team' : 'suppliers']: [
          ...currentStakeholders[type === 'manager' ? 'managers' : type === 'team' ? 'team' : 'suppliers'],
          stakeholder
        ]
      }
    });
  };

  const removeStakeholder = (type: 'manager' | 'team' | 'supplier', index: number) => {
    const currentStakeholders = formData.stakeholders || { managers: [], team: [], suppliers: [] };
    const typeKey = type === 'manager' ? 'managers' : type === 'team' ? 'team' : 'suppliers';
    const updated = [...currentStakeholders[typeKey]];
    updated.splice(index, 1);
    updateFormData({
      stakeholders: {
        ...currentStakeholders,
        [typeKey]: updated
      }
    });
  };

  const renderStepContent = () => {
    const stepId = steps[currentStep - 1]?.id;

    switch (stepId) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Nom du Projet *</Label>
                  <Input
                    id="title"
                    value={formData.title || ''}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Nom du projet"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    placeholder="Description du projet"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status || ''}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planification</SelectItem>
                      <SelectItem value="active">En cours</SelectItem>
                      <SelectItem value="on_hold">En attente</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="budget">Budget (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget ?? ''}
                    onChange={(e) => updateFormData({ budget: Number(e.target.value) || 0 })}
                    placeholder="Budget total"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Date de Début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => updateFormData({ startDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Date de Fin Prévue</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => updateFormData({ endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'stakeholders':
        return (
          <div className="space-y-6">
            {/* Internal Stakeholders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Parties Prenantes Internes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Project Managers */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Chefs de Projet</Label>
                      <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajouter un Chef de Projet</DialogTitle>
                          </DialogHeader>
                          <EmployeeSelector
                            value=""
                            onChange={(employeeId) => {
                              addStakeholder('manager', { id: employeeId, name: 'Manager', role: 'Project Manager' });
                              setIsManagerDialogOpen(false);
                            }}
                            placeholder="Sélectionner un employé"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-3">
                      {(formData.stakeholders?.managers || []).map((manager: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{manager.name?.charAt(0) || 'M'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{manager.name}</p>
                              <p className="text-sm text-muted-foreground">{manager.role}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStakeholder('manager', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Équipe Interne</Label>
                      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajouter un Membre d'Équipe</DialogTitle>
                          </DialogHeader>
                          <EmployeeSelector
                            value=""
                            onChange={(employeeId) => {
                              addStakeholder('team', { id: employeeId as string, name: 'Team Member', department: 'Department' });
                              setIsTeamDialogOpen(false);
                            }}
                            placeholder="Sélectionner un employé"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-3">
                      {(formData.stakeholders?.team || []).map((member: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{member.name?.charAt(0) || 'T'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.department}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStakeholder('team', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* External Stakeholders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Parties Prenantes Externes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">Fournisseurs / Contractants</Label>
                    <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                        </DialogHeader>
                        <SimpleSupplierSelector
                          value=""
                          onChange={(supplierId) => {
                            addStakeholder('supplier', { id: supplierId, name: 'Supplier', type: 'Fournisseur' });
                            setIsSupplierDialogOpen(false);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="grid gap-3">
                    {(formData.stakeholders?.suppliers || []).map((supplier: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{supplier.name?.charAt(0) || 'S'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.type}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStakeholder('supplier', index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Équipe de Projet</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Gérez les membres de l'équipe et leurs rôles
              </p>
              {/* Team management content */}
            </div>
          </div>
        );

      case 'phases':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Phases du Projet</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Structure des phases et chronologie
              </p>
              {/* Phases management content */}
            </div>
          </div>
        );

      case 'geolocation':
        return (
          <div className="space-y-6">
            <LocationSelector
              value={formData.location || {}}
              onChange={(location) => updateFormData({ location })}
            />
            <WarehouseShapeTracer
              value={formData.shapes || []}
              onChange={(shapes) => updateFormData({ shapes })}
            />
            {formData.selectedMaterial && (
              <MaterialLocationMap
                material={formData.selectedMaterial}
              />
            )}
          </div>
        );

      case 'resources':
        return (
          <div className="space-y-6">
            <PhaseMaterials
              phaseId={selectedPhaseId || 'default'}
              projectId={formData.id || 'default'}
            />
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Analyse des Risques</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Identification et mitigation des risques projet
              </p>
              {/* Risk management content */}
            </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Conformité Réglementaire</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Respect des normes et validation finale
              </p>
              {/* Compliance content */}
            </div>
          </div>
        );

      default:
        return <div>Étape non trouvée</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                Modifier le projet
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Étape {currentStep} sur {steps.length}: {steps[currentStep - 1]?.title}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                {Math.round(((currentStep) / steps.length) * 100)}% complété
              </Badge>
              <Button 
                variant="outline" 
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Retour</span>
              </Button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 mb-4 sm:mb-6">
            <div 
              className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Responsive Layout */}
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          {/* Sidebar Navigation - Responsive */}
          <div className="xl:w-80 flex-shrink-0">
            {/* Mobile: Horizontal scroll, Desktop: Vertical */}
            <Card className="p-3 sm:p-4 xl:sticky xl:top-6">
              <nav className="xl:space-y-2">
                <div className="flex xl:flex-col gap-2 xl:gap-0 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0">
                  {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = currentStep === stepNumber;
                    const isCompleted = stepNumber < currentStep;
                    
                    return (
                      <button
                        key={step.id}
                        onClick={() => handleStepChange(stepNumber)}
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left transition-all flex-shrink-0 xl:w-full",
                          "min-w-[200px] xl:min-w-0",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : isCompleted
                            ? "bg-muted text-foreground hover:bg-muted/80"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium flex-shrink-0",
                          isActive 
                            ? "bg-primary-foreground text-primary" 
                            : isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted-foreground/20"
                        )}>
                          {isCompleted ? (
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            stepNumber
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm truncate">{step.title}</div>
                          <div className="text-xs opacity-75 truncate hidden sm:block">{step.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </Card>
          </div>

          {/* Main Content - Flexible */}
          <div className="flex-1 min-w-0">
            <Card className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="min-h-[400px]">
                  {renderStepContent()}
                </div>
                
                {/* Step Navigation - Always visible at bottom */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t bg-background sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="flex items-center gap-2 order-2 sm:order-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Précédent</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleStepChange(Math.min(steps.length, currentStep + 1))}
                      disabled={currentStep === steps.length}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <span className="hidden sm:inline">Suivant</span>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/projects')}
                      className="flex-1 sm:flex-none"
                      size="sm"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveStep}
                      disabled={isSaving}
                      className="flex items-center gap-2 flex-1 sm:flex-none"
                      size="sm"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProjectEditFormWithTasks;