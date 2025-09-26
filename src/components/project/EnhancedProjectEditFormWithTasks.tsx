import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProjectService } from '@/services/ProjectService';
import { ProjectRepository } from '@/services/ProjectRepository';
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
  const [formData, setFormData] = useState(() => {
    console.log('🔄 Initializing formData with:', initialData);
    return initialData || {};
  });
  const [originalFormData, setOriginalFormData] = useState(() => {
    console.log('🔄 Initializing originalFormData with:', initialData);
    return initialData || {};
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isStatusSavingRef = useRef(false);
  const lastStatusRef = useRef<string | null>(null);

  // Dialog states
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  // Initialize ProjectService
  const projectService = useMemo(() => new ProjectService(), []);
  const projectRepository = useMemo(() => new ProjectRepository(), []);

  // Update form data when initialData changes (from parent)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('🔄 Updating formData from initialData:', initialData);
      const processedData = {
        ...initialData,
        // Safe date formatting for initialData
        startDate: formatDateForInput(initialData.startDate || initialData.start_date),
        endDate: formatDateForInput(initialData.endDate || initialData.end_date),
        start_date: formatDateForInput(initialData.startDate || initialData.start_date),
        end_date: formatDateForInput(initialData.endDate || initialData.end_date),
        // Map status if needed
        status: initialData.status ? mapStatusFromDB(initialData.status) : 'planning'
      };
      setFormData(processedData);
      setOriginalFormData(processedData);
    }
  }, [initialData]);

  // Debug: Test basic database connection
  useEffect(() => {
    const testDatabaseConnection = async () => {
      try {
        console.log('🔍 Testing database connection...');
        const { data, error } = await supabase.from('projects').select('id, title').limit(1);
        if (error) {
          console.error('❌ Database connection error:', error);
        } else {
          console.log('✅ Database connection OK, sample project:', data?.[0]);
        }
      } catch (err) {
        console.error('❌ Database test failed:', err);
      }
    };
    testDatabaseConnection();
  }, []);

  // Safe date formatting function
  const formatDateForInput = (dateString: any) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Date formatting error:', error);
      return '';
    }
  };

  // Status mapping functions
  const mapStatusFromDB = (dbStatus: string) => {
    const statusMap: Record<string, string> = {
      'en attente': 'planning',
      'en cours': 'active', 
      'suspendu': 'on_hold',
      'terminé': 'completed',
      'annulé': 'cancelled'
    };
    return statusMap[dbStatus] || 'planning';
  };

  const mapStatusToDB = (formStatus: string) => {
    const statusMap: Record<string, string> = {
      'planning': 'en attente',
      'active': 'en cours',
      'on_hold': 'suspendu', 
      'completed': 'terminé',
      'cancelled': 'annulé'
    };
    return statusMap[formStatus] || 'en attente';
  };

  // Load project data from database (merge into existing formData, do not wipe)
  const loadProjectData = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      console.log('🔍 Loading project data for ID:', projectId);
      const projectDetail = await projectService.getProjectDetail(projectId);
      console.log('✅ Project detail loaded:', projectDetail);
      
      if (projectDetail) {
        // Map the project detail data to form format with safe date handling
        const formattedData = {
          ...projectDetail,
          // Safe date formatting
          startDate: formatDateForInput(projectDetail.startDate),
          endDate: formatDateForInput(projectDetail.endDate),
          start_date: formatDateForInput(projectDetail.startDate), // Legacy field
          end_date: formatDateForInput(projectDetail.endDate), // Legacy field
          // Ensure location is properly formatted
          location: typeof projectDetail.location === 'object' && projectDetail.location ? 
            (projectDetail.location as any)?.address || JSON.stringify(projectDetail.location) : 
            projectDetail.location || '',
          // Map status from database format to form format
          status: mapStatusFromDB(projectDetail.status || 'en attente'),
          // Ensure budget is a number
          budget: typeof projectDetail.budget === 'number' ? projectDetail.budget : Number(projectDetail.budget) || 0
        };
        
        console.log('✅ Formatted project data:', formattedData);
        setFormData((prev: any) => ({ ...prev, ...formattedData }));
        setOriginalFormData((prev: any) => ({ ...prev, ...formattedData }));
        onFormDataChange?.(formattedData);
      } else {
        console.warn('⚠️ No project detail found for ID:', projectId);
      }
    } catch (error) {
      console.error('❌ Error loading project data:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les données du projet: ${(error as any)?.message || 'Erreur inconnue'}`,
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
      console.log('🔍 Loading related data for project ID:', projectId);
      
      const [stakeholdersData, phasesData] = await Promise.all([
        ProjectStakeholderService.getProjectStakeholders(projectId).catch(err => {
          console.error('❌ Error loading stakeholders:', err);
          return [];
        }),
        PhaseService.loadProjectPhases(projectId).catch(err => {
          console.error('❌ Error loading phases:', err);
          return [];
        })
      ]);

      console.log('✅ Stakeholders loaded:', stakeholdersData);
      console.log('✅ Phases loaded:', phasesData);

      const mappedStakeholders = (() => {
        const managers: any[] = [];
        const team: any[] = [];
        const suppliers: any[] = [];
        
        (stakeholdersData || []).forEach((s: any) => {
          if (s.stakeholder_entity_type === 'employee') {
            const employeeData = {
              id: s.stakeholder_id,
              name: s.employee?.full_name || 'Manager',
              role: s.stakeholder_type,
              department: s.employee?.department,
              position: s.employee?.position,
              email: s.employee?.email,
              phone: s.employee?.phone
            };
            
            if ((s.stakeholder_type || '').includes('manager')) {
              managers.push(employeeData);
            } else {
              team.push(employeeData);
            }
          } else if (s.stakeholder_entity_type === 'supplier') {
            suppliers.push({
              id: s.stakeholder_id,
              name: s.supplier?.name || 'Fournisseur',
              type: s.stakeholder_type || 'Fournisseur',
              role_description: s.role_description,
              is_primary: s.is_primary,
              contact: s.supplier?.contact_person,
              email: s.supplier?.email,
              phone: s.supplier?.phone
            });
          }
        });
        
        return { managers, team, suppliers };
      })();

      // Format phases data with all related information using safe date formatting
      const formattedPhases = phasesData.map((phase: any) => ({
        ...phase,
        // Use safe date formatting
        startDate: formatDateForInput(phase.startDate),
        endDate: formatDateForInput(phase.endDate),
        // Ensure all arrays exist
        materials: phase.materials || [],
        humanResources: phase.humanResources || [],
        suppliers: phase.suppliers || []
      }));

      console.log('✅ Mapped stakeholders:', mappedStakeholders);
      console.log('✅ Formatted phases:', formattedPhases);

      setFormData((prev: any) => ({
        ...prev,
        stakeholders: mappedStakeholders,
        phases: formattedPhases
      }));
      
    } catch (err) {
      console.error('❌ Error loading related data:', err);
      toast({
        title: "Erreur",
        description: `Impossible de charger les données liées au projet: ${(err as any)?.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
    }
  }, [projectId, toast]);

  // Load data on mount and when projectId changes
  useEffect(() => {
    if (!projectId) return;
    
    console.log('🔍 useEffect triggered with projectId:', projectId, 'initialData:', !!initialData);
    
    if (!initialData || Object.keys(initialData).length === 0) {
      // Load project core + related in parallel if no initial data provided
      console.log('📥 Loading fresh data from database...');
      Promise.all([loadProjectData(), loadRelatedData()]);
    } else {
      // Use provided initial data but still load related data
      console.log('📋 Using provided initial data, loading related data...');
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
          // Only include dates if they have valid values
          ...(formData.startDate && { startDate: formData.startDate }),
          ...(formData.endDate && { endDate: formData.endDate }),
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

  // Handle status change with re-entrancy guard and dedupe
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!projectId) return;
    // Ignore if unchanged or a save is in progress
    if (newStatus === formData.status || isStatusSavingRef.current) return;

    isStatusSavingRef.current = true;
    try {
      setIsSaving(true);
      const dbStatus = mapStatusToDB(newStatus);
      await projectRepository.update(projectId, { status: dbStatus });
      // Update local state without flagging unsaved changes
      setFormData(prev => ({ ...prev, status: newStatus }));
      lastStatusRef.current = newStatus;
      toast({
        title: "Statut mis à jour",
        description: `Le statut du projet a été changé vers: ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erreur",
        description: (error as any)?.message || "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      isStatusSavingRef.current = false;
    }
  }, [projectId, formData.status, projectRepository, toast]);

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
                    <SelectContent className="z-[60] bg-background shadow-lg">
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
                Gérez les membres de l'équipe et leurs rôles spécifiques
              </p>
            </div>

            {/* Internal Team Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <UserCheck className="h-5 w-5" />
                  Équipe Interne ({((formData.stakeholders?.managers || []).length + (formData.stakeholders?.team || []).length)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {/* Managers */}
                  {(formData.stakeholders?.managers || []).map((manager: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-green-300">
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {manager.name?.charAt(0) || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-green-800">{manager.name}</p>
                          <p className="text-sm text-green-600">{manager.role || 'Manager'}</p>
                          {manager.department && (
                            <p className="text-xs text-green-500">{manager.department}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        Chef de Projet
                      </Badge>
                    </div>
                  ))}
                  
                  {/* Team Members */}
                  {(formData.stakeholders?.team || []).map((member: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-green-300">
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {member.name?.charAt(0) || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-green-800">{member.name}</p>
                          <p className="text-sm text-green-600">{member.position || member.role || 'Membre d\'équipe'}</p>
                          {member.department && (
                            <p className="text-xs text-green-500">{member.department}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.email && (
                          <Button variant="ghost" size="sm" className="p-1">
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                        {member.phone && (
                          <Button variant="ghost" size="sm" className="p-1">
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(formData.stakeholders?.managers || []).length === 0 && (formData.stakeholders?.team || []).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun membre d'équipe interne configuré</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* External Stakeholders Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Building2 className="h-5 w-5" />
                  Contractants Externes ({(formData.stakeholders?.suppliers || []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {(formData.stakeholders?.suppliers || []).map((supplier: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="border-2 border-orange-300">
                          <AvatarFallback className="bg-orange-100 text-orange-700">
                            {supplier.name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-orange-800">{supplier.name}</p>
                          <p className="text-sm text-orange-600">{supplier.type || 'Fournisseur'}</p>
                          {supplier.role_description && (
                            <p className="text-xs text-orange-500">{supplier.role_description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {supplier.is_primary && (
                          <Badge variant="default" className="bg-orange-600">
                            Principal
                          </Badge>
                        )}
                        {supplier.contact && (
                          <Button variant="ghost" size="sm" className="p-1">
                            <User className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(formData.stakeholders?.suppliers || []).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun contractant externe configuré</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'phases':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Phases du Projet</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Structure des phases et chronologie du projet
              </p>
            </div>
            
            {/* Display existing phases */}
            <div className="space-y-4">
              {(formData.phases || []).length > 0 ? (
                formData.phases.map((phase: any, index: number) => (
                  <Card key={phase.id || index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{phase.title}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{phase.description}</p>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Date de début</Label>
                            <p className="text-sm font-medium">{phase.startDate || 'Non définie'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Date de fin</Label>
                            <p className="text-sm font-medium">{phase.endDate || 'Non définie'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Budget</Label>
                            <p className="text-sm font-medium">{phase.budget ? `${phase.budget.toLocaleString()} €` : 'Non défini'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Statut</Label>
                            <Badge variant={
                              phase.status === 'completed' ? 'default' :
                              phase.status === 'in_progress' ? 'secondary' :
                              phase.status === 'delayed' ? 'destructive' : 'outline'
                            }>
                              {phase.status === 'completed' ? 'Terminé' :
                               phase.status === 'in_progress' ? 'En cours' :
                               phase.status === 'delayed' ? 'Retard' : 'Non commencé'}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs text-muted-foreground">Progression</Label>
                            <span className="text-xs text-muted-foreground">{phase.progress || 0}%</span>
                          </div>
                          <Progress value={phase.progress || 0} className="h-2" />
                        </div>
                        
                        {/* Resources summary */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Matériaux</p>
                            <p className="text-sm font-medium">{(phase.materials || []).length}</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Ressources</p>
                            <p className="text-sm font-medium">{(phase.humanResources || []).length}</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded">
                            <p className="text-xs text-muted-foreground">Fournisseurs</p>
                            <p className="text-sm font-medium">{(phase.suppliers || []).length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPhaseId(phase.id)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Détails & CRUD
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune phase configurée pour ce projet</p>
                    <p className="text-sm mt-1">Les phases seront créées lors de la planification détaillée</p>
                  </div>
                </Card>
              )}
            </div>
            
            {/* Phase Details Dialog */}
            {selectedPhaseId && (
              <Dialog open={!!selectedPhaseId} onOpenChange={() => setSelectedPhaseId(null)}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Gestion de la Phase: {formData.phases?.find((p: any) => p.id === selectedPhaseId)?.title}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Tabs for different aspects of phase management */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="p-4">
                        <h4 className="font-medium mb-2 text-sm">Matériaux</h4>
                        <PhaseMaterials
                          phaseId={selectedPhaseId}
                          projectId={projectId || ''}
                        />
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium mb-2 text-sm">Tâches & Inspections</h4>
                        <PhaseTasks
                          phaseId={selectedPhaseId}
                          projectId={projectId || ''}
                        />
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium mb-2 text-sm">Paiements</h4>
                        <PhasePayments
                          phaseId={selectedPhaseId}
                          projectId={projectId || ''}
                        />
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium mb-2 text-sm">Documents</h4>
                        <PhaseDocuments
                          phaseId={selectedPhaseId}
                          projectId={projectId || ''}
                        />
                      </Card>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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