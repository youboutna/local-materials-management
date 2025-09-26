import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProjectService } from '@/services/ProjectService';
import { ProjectStakeholderService } from '@/services/ProjectStakeholderService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Building, Users, UserCheck, Layers, MapPin, Package, 
  Clock, DollarSign, CheckCircle, Target, Edit2, Save,
  AlertTriangle, FileCheck
} from 'lucide-react';

// Import existing components and factorized steps
import EmployeeSelector from '@/components/selectors/EmployeeSelector';
import SimpleSupplierSelector from '@/components/selectors/SimpleSupplierSelector';
import LocationSelector from '@/components/location/LocationSelector';
import MaterialFormSection from '@/components/MaterialFormSection';
import EnhancedWorkflowPhaseManager from './EnhancedWorkflowPhaseManager';

// Import factorized steps
import StakeholdersStep from './steps/StakeholdersStep';
import TeamContractorsStep from './steps/TeamContractorsStep';
import ResourcesMaterialsStep from './steps/ResourcesMaterialsStep';
import RiskAnalysisStep from './steps/RiskAnalysisStep';
import ComplianceStep from './steps/ComplianceStep';

interface EnhancedProjectEditFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onFormDataChange?: (data: any) => void;
}

const EnhancedProjectEditForm: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onFormDataChange
}) => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => initialData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Array<{ materialId: string; quantity: number }>>([]);

  // Initialize ProjectService
  const projectService = useMemo(() => new ProjectService(), []);

  // Helper function for date formatting
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

  // Status mapping
  const mapStatusFromDB = (status: string) => {
    const mapping = {
      'en attente': 'planning',
      'en cours': 'en cours', 
      'suspendu': 'suspendu',
      'terminé': 'terminé',
      'annulé': 'annulé'
    } as const;
    return mapping[status as keyof typeof mapping] || 'planning';
  };

  // Load project data from database if no initialData
  const loadProjectData = useCallback(async () => {
    if (!projectId || (initialData && Object.keys(initialData).length > 0)) return;
    
    setIsLoading(true);
    try {
      const projectData = await projectService.getProjectDetail(projectId);
      if (projectData) {
        const processedData = {
          title: projectData.title,
          description: projectData.description,
          location: projectData.location,
          status: mapStatusFromDB(projectData.status || 'planning'),
          budget: projectData.budget,
          startDate: formatDateForInput(projectData.startDate),
          endDate: formatDateForInput(projectData.endDate),
          start_date: formatDateForInput(projectData.startDate),
          end_date: formatDateForInput(projectData.endDate),
          team_size: projectData.teamSize || 1,
          financing_source: projectData.financingSource || '',
          market_type: projectData.marketType || '',
          selection_mode: projectData.selectionMode || '',
          project_responsable_id: projectData.projectResponsableId || '',
          main_contractor: projectData.mainContractor || '',
          engineering_consultant: (projectData as any).engineeringConsultant || '',
          project_reference: projectData.projectReference || '',
          allows_initial_payment: projectData.allowsInitialPayment || false,
          initial_payment_percentage: projectData.initialPaymentPercentage || 0,
          current_phase: projectData.currentPhase || '',
          current_stage: projectData.currentStage || '',
          // Location data
          facilitiesLocation: projectData.coordinates ? {
            center: {
              lat: projectData.coordinates.latitude,
              lng: projectData.coordinates.longitude
            },
            polygon: (projectData as any).localisation || [],
            warehouseShape: (projectData as any).localisation || [],
            address: (projectData as any).adresse,
            shapeType: (projectData as any).forme
          } : undefined
        };
        setFormData(processedData);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des données du projet',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, initialData, projectService, toast]);

  // Load related data (stakeholders, phases, etc.)
  const loadRelatedData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      // Load stakeholders
      const stakeholders = await ProjectStakeholderService.getProjectStakeholders(projectId);
      
      // Load phases
      const { data: phasesData } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date');
      
      // Process phases for form
      const phases = phasesData?.map(phase => ({
        id: phase.id,
        title: phase.phase_name,
        description: phase.description || '',
        startDate: formatDateForInput(phase.start_date),
        endDate: formatDateForInput(phase.end_date),
        status: phase.status,
        budget: phase.estimated_cost || 0,
        progress: phase.progress || 0
      })) || [];

      // Load materials
      const { data: materialsData } = await supabase
        .from('project_materials')
        .select('material_id, quantity')
        .eq('project_id', projectId);
      
      const materials = materialsData?.map(item => ({
        materialId: item.material_id,
        quantity: item.quantity
      })) || [];
      
      setFormData(prev => ({
        ...prev,
        stakeholders: stakeholders || [],
        phases: phases,
        materials: materials
      }));
      
      setSelectedMaterials(materials);
      
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  }, [projectId]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const processedData = {
        ...initialData,
        startDate: formatDateForInput(initialData.startDate || initialData.start_date),
        endDate: formatDateForInput(initialData.endDate || initialData.end_date),
        start_date: formatDateForInput(initialData.startDate || initialData.start_date),
        end_date: formatDateForInput(initialData.endDate || initialData.end_date),
        status: initialData.status ? mapStatusFromDB(initialData.status) : 'planning'
      };
      setFormData(processedData);
      
      // Extract materials if provided
      if (initialData.materials) {
        setSelectedMaterials(initialData.materials);
      }
    } else {
      loadProjectData();
    }
  }, [initialData, loadProjectData]);

  // Load related data on mount
  useEffect(() => {
    loadRelatedData();
  }, [loadRelatedData]);

  // Update form data helper
  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
    if (onFormDataChange) {
      onFormDataChange({ ...formData, ...updates });
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    updateFormData({ status: newStatus });
  };

  // Save step data
  const handleSaveStep = async () => {
    if (!onSubmit) return;
    
    setIsSaving(true);
    try {
      await onSubmit({
        ...formData,
        materials: selectedMaterials
      });
      toast({
        title: 'Étape sauvegardée',
        description: 'Les données ont été sauvegardées avec succès.',
      });
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Step configuration - similar to ProjectCreationWorkflow with additional steps
  const steps = [
    {
      id: 1,
      title: 'Informations Générales',
      icon: Building,
      description: 'Données de base du projet (titre, description, budget)',
      color: 'bg-blue-500',
      isCompleted: () => !!(formData.title && formData.description && formData.budget)
    },
    {
      id: 2,
      title: 'Parties Prenantes',
      icon: Users,
      description: 'Configuration des acteurs et responsabilités',
      color: 'bg-green-500',
      isCompleted: () => !!(formData.stakeholders?.length > 0 || formData.project_responsable_id)
    },
    {
      id: 3,
      title: 'Équipe & Contractants',
      icon: UserCheck,
      description: 'Assignment des ressources humaines et fournisseurs',
      color: 'bg-orange-500',
      isCompleted: () => !!(formData.main_contractor || formData.engineering_consultant)
    },
    {
      id: 4,
      title: 'Phases & Planification',
      icon: Layers,
      description: 'Structure des phases et chronologie',
      color: 'bg-indigo-500',
      isCompleted: () => !!(formData.phases?.length > 0)
    },
    {
      id: 5,
      title: 'Géolocalisation & Cartographie',
      icon: MapPin,
      description: 'Localisation précise et délimitation des zones',
      color: 'bg-cyan-500',
      isCompleted: () => !!(formData.facilitiesLocation?.center || formData.location)
    },
    {
      id: 6,
      title: 'Ressources & Matériaux',
      icon: Package,
      description: 'Sélection des matériaux et organisation',
      color: 'bg-purple-500',
      isCompleted: () => !!(selectedMaterials?.length > 0)
    },
    {
      id: 7,
      title: 'Analyse des Risques',
      icon: AlertTriangle,
      description: 'Analyse et mitigation des risques projet',
      color: 'bg-red-500',
      isCompleted: () => !!(formData.risks?.length > 0)
    },
    {
      id: 8,
      title: 'Conformités & Validation',
      icon: FileCheck,
      description: 'Respect des normes et validation finale',
      color: 'bg-teal-500',
      isCompleted: () => !!(formData.compliance?.length > 0)
    }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                Informations Générales du Projet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Titre du projet *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Nom du projet de construction"
                      required
                      value={formData.title || ''}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Référence du projet</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="REF-2025-001"
                      value={formData.project_reference || ''}
                      onChange={(e) => updateFormData({ project_reference: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description détaillée *</label>
                  <textarea 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                    placeholder="Description complète du projet, objectifs et spécifications techniques"
                    required
                    value={formData.description || ''}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget total *</label>
                    <input 
                      type="number" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="1000000"
                      required
                      value={formData.budget || ''}
                      onChange={(e) => updateFormData({ budget: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Statut</label>
                    <select 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      value={formData.status || 'planning'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value="planning">Planification</option>
                      <option value="pending">En attente</option>
                      <option value="en cours">En cours</option>
                      <option value="suspendu">Suspendu</option>
                      <option value="terminé">Terminé</option>
                      <option value="annulé">Annulé</option>
                    </select>
                  </div>
                </div>

                {/* Chronologie Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Chronologie du Projet
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date de début prévue</label>
                      <input 
                        type="date" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.start_date || ''}
                        onChange={(e) => updateFormData({ start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date de fin prévue</label>
                      <input 
                        type="date" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.end_date || ''}
                        onChange={(e) => updateFormData({ end_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Durée estimée (jours)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="365"
                        readOnly
                        value={formData.start_date && formData.end_date ? 
                          Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 
                          ''
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Paramètres de paiement Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Paramètres de Paiement
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Source de financement</label>
                      <input 
                        type="text" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Banque, fonds propres, etc."
                        value={formData.financing_source || ''}
                        onChange={(e) => updateFormData({ financing_source: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Type de marché</label>
                      <select 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.market_type || ''}
                        onChange={(e) => updateFormData({ market_type: e.target.value })}
                      >
                        <option value="">Sélectionner le type</option>
                        <option value="public">Public</option>
                        <option value="privé">Privé</option>
                        <option value="mixte">Mixte</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allows_initial_payment"
                        checked={formData.allows_initial_payment || false}
                        onChange={(e) => updateFormData({ allows_initial_payment: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="allows_initial_payment" className="text-sm font-medium">
                        Autoriser paiement initial
                      </label>
                    </div>
                    
                    {formData.allows_initial_payment && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Pourcentage paiement initial (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={formData.initial_payment_percentage || 0}
                          onChange={(e) => updateFormData({ initial_payment_percentage: parseFloat(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <StakeholdersStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-orange-500" />
                Équipe & Contractants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Entrepreneur principal</label>
                  <SimpleSupplierSelector
                    value={formData.main_contractor || ''}
                    onChange={(supplierId) => updateFormData({ main_contractor: supplierId })}
                    placeholder="Sélectionner l'entrepreneur principal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ingénieur conseil</label>
                  <SimpleSupplierSelector
                    value={formData.engineering_consultant || ''}
                    onChange={(supplierId) => updateFormData({ engineering_consultant: supplierId })}
                    placeholder="Sélectionner l'ingénieur conseil"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Phases & Planification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedWorkflowPhaseManager
                projectId={projectId || ''}
              />
              
              {/* Phase Management Information */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Gestion des phases:</strong> Les phases sont gérées directement depuis la base de données. 
                  Utilisez le gestionnaire de phases ci-dessus pour créer, modifier et organiser les phases du projet.
                </p>
                {formData.phases && formData.phases.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-blue-600">
                      Phases actuelles: {formData.phases.length} phase(s) détectée(s)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-500" />
                Géolocalisation & Cartographie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LocationSelector
                value={formData.facilitiesLocation?.center ? {
                  latitude: formData.facilitiesLocation.center.lat,
                  longitude: formData.facilitiesLocation.center.lng,
                  address: formData.facilitiesLocation.address
                } : undefined}
                onChange={(locationData) => updateFormData({ 
                  facilitiesLocation: {
                    ...formData.facilitiesLocation,
                    center: {
                      lat: locationData.latitude || 0,
                      lng: locationData.longitude || 0
                    },
                    address: locationData.address
                  }
                })}
              />
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <ResourcesMaterialsStep
            selectedMaterials={selectedMaterials}
            onMaterialsChange={setSelectedMaterials}
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );

      case 7:
        return (
          <RiskAnalysisStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );

      case 8:
        return (
          <ComplianceStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-serif text-primary">
              Édition de Projet - Modèle de Création
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {steps.filter(s => s.isCompleted()).length}/{steps.length} étapes
            </Badge>
          </div>
          <Progress value={(steps.filter(s => s.isCompleted()).length / steps.length) * 100} className="h-2" />
        </CardHeader>
      </Card>

      {/* Workflow Steps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = step.isCompleted();
          const isActive = currentStep === step.id;
          
          return (
            <motion.div
              key={step.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 border",
                  isActive ? 'ring-2 ring-primary shadow-lg border-primary' : 'hover:shadow-md border-transparent',
                  isCompleted ? 'border-green-500/30 bg-green-50' : ''
                )}
                onClick={() => setCurrentStep(step.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={cn(
                      "p-3 rounded-full relative text-white",
                      step.color,
                      isActive && "shadow-lg",
                      isCompleted && !isActive && "bg-green-100 text-green-600"
                    )}>
                      <Icon className="h-4 w-4" />
                      {isCompleted && (
                        <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white rounded-full" />
                      )}
                    </div>
                    <h3 className="font-medium text-xs">{step.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Step Content */}
        <div className="flex-1">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </div>

        {/* Step Navigation */}
        <div className="lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Précédent
                </Button>
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                  disabled={currentStep === steps.length}
                >
                  Suivant
                </Button>
              </div>
              
              <Button
                onClick={handleSaveStep}
                disabled={isSaving}
                className="w-full"
                variant="default"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProjectEditForm;