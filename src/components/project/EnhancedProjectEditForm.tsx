import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";
import {
  Building,
  Users,
  Layers,
  MapPin,
  Clock,
  CheckCircle,
  Edit2,
  Save,
  AlertTriangle,
  FileCheck,
} from "lucide-react";


// Import hexagonal hooks
import { useProjectEditWorkflowHex } from "../../hooks/hexagonal/useProjectEditWorkflowHex";
import { usePaymentWorkflowHex } from "@/hooks/hexagonal";
import { useProjectMaterialsHex } from "@/hooks/hexagonal";
import { MaterialService } from "@/application/services/MaterialService";

// Import workflow DTOs
import { ProjectWorkflowData, StepRelatedDataDTO } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { PhaseWorkflowDTO } from "@/dtos/workflows/PhaseWorkflowDTO";

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO, ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { MaterialDTO, MaterialCategory, MaterialStatus, MaterialUnit } from '@/dtos/entities/MaterialDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { StakeholderDTO } from '@/dtos/entities/StakeholderDTO';

// Import step components

import ProjectInfoStep from "./steps/ProjectInfoStep";

import StakeholdersTeamStep from "./steps/StakeholdersTeamStep";

import LocationStep from "./steps/LocationStep";

import RiskAnalysisStep from "./steps/RiskAnalysisStep";

import ComplianceStep from "./steps/ComplianceStep";

import { PhaseDTO } from "@/dtos/entities";

import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";

import ConstructionPhaseManager from "./ConstructionPhaseManager";
import { SaveContextDTO } from "@/dtos/workflows/ProjectWorkflowDTOs";



interface EnhancedProjectEditFormProps {
  initialData?: ProjectWorkflowData;
  onSubmit: (data: ProjectWorkflowData) => Promise<void>;
  onFormDataChange?: (data: ProjectWorkflowData) => void;
  isSubmitting?: boolean;
}

// Unified FormServiceDTO for compatibility
type UnifiedFormServiceDTO = ProjectWorkflowData & {
  receptionStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  closureNotes?: string;
};

// Temporary PhaseData interface until ConstructionPhaseManager is fixed
type PhaseData = PhaseDTO & {
  materials: Array<{ materialId: string; quantity: number; name?: string }>;
  humanResources: Array<{ roleId: string; quantity: number; role?: string }>;
};

// Transformer function to convert any phase data to PhaseData
const transformProjectPhaseToPhaseData = (phases: PhaseDTO[]): PhaseData[] => {
  return phases.map(phase => ({
    ...phase,
    materials: [],
    humanResources: []
  }));
};

// Transformer function to convert PhaseData to PhaseDTO for ProgressCalculationHexService
const transformPhaseDataToPhaseDTO = (phases: PhaseData[], projectId: string): PhaseDTO[] => {
  return phases.map(phase => ({
    id: phase.id,
    name: phase.title, // Utiliser title pour name
    description: phase.description,
    status: phase.status === 'not_started' ? 'pending' : 
            phase.status === 'in_progress' ? 'in_progress' : 
            phase.status === 'completed' ? 'completed' : 'cancelled',
    phase_name: phase.title, // Utiliser title pour phase_name
    projectId: projectId || '',
    startDate: phase.startDate,
    endDate: phase.endDate,
    progress: phase.progress,
    budget: phase.budget,
    actualCost: phase.actualCost,
    steps: [], // Empty steps for now - ProgressCalculationHexService mainly needs basic phase info
    resources: {
      employees: [],
      contractors: [],
      totalRequired: 0,
      totalAssigned: 0,
      skills: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

// Transformer function to convert SelectedMaterial to MaterialDTO using hook
const transformSelectedMaterialsToFormData = async (selectedMaterials: Array<{materialId: string; quantity: number}>): Promise<MaterialDTO[]> => {
  // For now, return basic structure - will be enhanced when materials are loaded
  return selectedMaterials.map(selected => ({
    id: selected.materialId,
    name: `Material ${selected.materialId}`,
    description: '',
    type: 'raw_material',
    category: MaterialCategory.RAW_MATERIAL,
    status: MaterialStatus.AVAILABLE,
    unit: MaterialUnit.PIECES,
    quantity: selected.quantity,
    pricePerUnit: 0,
    totalValue: 0,
    supplierId: '',
    supplierName: '',
    supplierCode: '',
    weight: 0,
    dimensions: undefined,
    location: '',
    storageLocation: '',
    warehouseId: '',
    aisle: '',
    shelf: '',
    bin: '',
    quality: 'standard',
    specifications: {},
    technicalSpecs: {},
    projectId: '',
    phaseId: '',
    taskId: '',
    documents: [],
    images: [],
    certifications: [],
    reorderLevel: 0,
    reorderAt: 0,
    expiryDate: '',
    tags: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

// Transformer function to convert MaterialDTO to SelectedMaterial
const transformFormDataToSelectedMaterials = (materials: MaterialDTO[]): Array<{materialId: string; quantity: number}> => {
  return materials.map(material => ({
    materialId: material.id || '',
    quantity: material.quantity,
  }));
};

const EnhancedProjectEditForm: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onFormDataChange,
  isSubmitting: externalIsSubmitting = false,
}) => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string }>();
  
  const {
    formData,
    phases: phasesData,
    updateFormData,
    setPhases,
    loadProjectData,
    saveStep,
    validateStep,
    updateProgress,
    completeWorkflow,
    isSaving: isSavingFromHook,
    isValidating,
    isUpdatingProgress,
    isCompleting,
    workflowContext,
    projectAnalytics,
    isLoadingContext,
    isLoadingAnalytics,
    calculateProjectProgress,
    validateWorkflowStep,
    getWorkflowStepStatus,
    detectChanges,
    getProjectData,
    updateProjectData,
    validateStepData,
    getWorkflowMetadata,
    resetWorkflow,
    getChangeHistory,
    saveError,
    validationError,
    progressError,
    completionError,
    refetchContext,
    refetchAnalytics,
    formService,
    progressService
  } = useProjectEditWorkflowHex(projectId);

  // Use hexagonal hook for materials
  const { 
    selectedMaterials, 
    updateMaterials, 
    isLoading: isLoadingMaterials 
  } = useProjectMaterialsHex(projectId);

  // Combine loading states
  const combinedIsSubmitting = isSavingFromHook || externalIsSubmitting || isCompleting;

  // Step configuration aligned with workflow spec (7 steps)
  const steps = [
    {
      id: 1,
      title: "Informations du projet",
      icon: Building,
      description: "Données de base du projet",
      color: "bg-blue-500",
      isCompleted: () => formService.validateStep(1, formData),
    },
    {
      id: 2,
      title: "Parties prenantes",
      icon: Users,
      description: "Configuration des acteurs",
      color: "bg-green-500",
      isCompleted: () => formService.validateStep(2, formData),
    },
    {
      id: 3,
      title: "Localisation",
      icon: MapPin,
      description: "Géolocalisation et cartographie",
      color: "bg-cyan-500",
      isCompleted: () => formService.validateStep(3, formData),
    },
    {
      id: 4,
      title: "Planification/Execution & Phases",
      icon: Layers,
      description:
        "Phase → Step → Task (documents, ressources, inspections, garanties, paiements)",
      color: "bg-indigo-500",
      isCompleted: () => formService.validateStep(4, formData),
    },
    {
      id: 5,
      title: "Risques",
      icon: AlertTriangle,
      description: "Gestion des risques globaux et des phases",
      color: "bg-red-500",
      isCompleted: () => formService.validateStep(5, formData),
    },
    {
      id: 6,
      title: "Conformité",
      icon: FileCheck,
      description: "Vérification réglementaire et normes",
      color: "bg-amber-500",
      isCompleted: () => formService.validateStep(6, formData),
    },
    {
      id: 7,
      title: "Validation & Clôture",
      icon: CheckCircle,
      description: "Réception définitive, solde, clôture",
      color: "bg-teal-500",
      isCompleted: () => formService.validateStep(7, formData),
    },
  ];

  // Load project data using ProjectWorkflowService
  const loadProjectData = useCallback(async () => {
    if (
      !projectId ||
      workflowContext ||
      (initialData && Object.keys(initialData).length > 0)
    )
      return;

    try {
      const projectDetail = await formService.getProjectWithDetails(projectId);

      if (!projectDetail) {
        console.warn(`Project with ID ${projectId} not found`);
        setPhases([]);
        return;
      }

      // Validate projectDetail structure before accessing properties
      if (!projectDetail.id || !projectDetail.title) {
        console.error('Invalid project data structure:', projectDetail);
        toast({
          title: "Erreur de données",
          description: "Les données du projet sont incomplètes ou corrompues",
          variant: "destructive",
        });
        setPhases([]);
        return;
      }

      // Format the data for the form
      const formattedData = {
        title: projectDetail.title || '',
        description: projectDetail.description || '',
        location: projectDetail.location || '',
        status: 'draft',
        budget: projectDetail.budget || 0,
        start_date: projectDetail.startDate || '',
        end_date: projectDetail.endDate || '',
        project_manager_id: projectDetail.projectResponsableId || '',
        client_id: projectDetail.mainContractor || '',
        progress: projectDetail.progress || 0,
        team_size: projectDetail.teamSize || 0
      };
      
      console.log('Project data loaded successfully:', {
        projectId: projectDetail.id,
        title: projectDetail.title,
        managerId: projectDetail.projectResponsableId,
        contractor: projectDetail.mainContractor
      });
      
      updateFormData(formattedData);
      setPhases(transformProjectPhaseToPhaseData(projectDetail.plannedPhases || []));
    } catch (error) {
      console.error("Error loading project data:", error);
      toast({
        title: "Erreur",
        description: `Erreur lors du chargement des données du projet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
      setPhases([]);
    }
  }, [projectId, workflowContext, initialData, toast, formService, updateFormData, setPhases]);

  // Load related data - now handled by ProjectWorkflowService above
  const loadRelatedData = useCallback(async () => {
    // Data is now loaded in loadProjectData via ProjectWorkflowService
    return;
  }, []);

  // Load base data for dropdowns
  const loadBaseData = useCallback(async () => {
    try {
      const data = await formService.loadBaseData();
      // setBaseData(data);
    } catch (error) {
      console.error("Error loading base data:", error);
    }
  }, [formService]);

  // Update form data helper
  const updateFormDataHelper = (updates: Partial<ProjectDTO>) => {
    updateFormData(updates);
    if (onFormDataChange) {
      onFormDataChange({ ...formData, ...updates });
    }
  };

  // Add error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Save handlers with distinct behavior
  const handleSaveStepOnly = async () => {
    try {
      const validationErrors = formService.validateFormData(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      
      if (!onSubmit) return;

      const context: SaveContextDTO = {
        currentStep: 1,
        saveType: "step_only",
        isDraft: true,
        totalSteps: steps.length,
      };

      const processedData = formService.processFormDataForSave(
        {
          ...formData,
          materials: await transformSelectedMaterialsToFormData(selectedMaterials),
          phases: phasesData
        },
        context
      );

      await onSubmit(processedData as unknown as FormServiceDTO);

      toast({
        title: "Étape sauvegardée",
        description: "Les données de cette étape ont été sauvegardées.",
      });
      setErrors({}); // Clear errors on success
    } catch (error) {
      console.error("Error saving step:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde de l'étape.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAndNext = async () => {
    try {
      const validationErrors = formService.validateFormData(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      
      if (!onSubmit) return;

      const context: SaveContextDTO = {
        currentStep: 1,
        saveType: "save_and_next",
        isDraft: true,
        totalSteps: steps.length,
      };

      const processedData = formService.processFormDataForSave(
        {
          ...formData,
          materials: await transformSelectedMaterialsToFormData(selectedMaterials),
          phases: phasesData
        },
        context
      );

      await onSubmit(processedData as unknown as FormServiceDTO);

      // Move to next step if not at the end
      if (1 < steps.length) {
        // setCurrentStep(currentStep + 1);
        toast({
          title: "Étape sauvegardée",
          description: `Passage à l'étape ${2}: ${steps[1]?.title}`,
        });
      } else {
        toast({
          title: "Toutes les étapes complétées",
          description: "Vous avez terminé toutes les étapes du projet.",
        });
      }
      setErrors({}); // Clear errors on success
    } catch (error) {
      console.error("Error saving step:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleSaveGlobalAndClose = async () => {
    try {
      const validationErrors = formService.validateFormData(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
      
      // Calculer la progression globale avant sauvegarde
      const calculatedProgress = progressService.calculateProjectProgress(
        phasesData
      );

      const context: SaveContextDTO = {
        currentStep: 1,
        saveType: "global_and_close",
        isDraft: false,
        isComplete: true,
        totalSteps: steps.length,
      };

      const processedData = formService.processFormDataForSave(
        {
          ...formData,
          progress: calculatedProgress,
          materials: await transformSelectedMaterialsToFormData(selectedMaterials),
          phases: phasesData
        },
        context
      );

      await onSubmit(processedData as unknown as FormServiceDTO);

      toast({
        title: "Projet sauvegardé",
        description: "Toutes les modifications ont été sauvegardées.",
      });

      // Navigate back or close form
      window.history.back();
      setErrors({}); // Clear errors on success
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde globale.",
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    switch (1) {
      case 1: // Informations du projet
        return (
          <ProjectInfoStep
            formData={formData}
            onUpdate={updateFormDataHelper}
            isEditing={true}
            baseData={{}}
          />
        );
      case 2: // Parties prenantes
        return (
          <StakeholdersTeamStep
            projectData={formData}
            onUpdate={updateFormDataHelper}
            isEditing={true}
          />
        );
      case 3: // Localisation
        return (
          <LocationStep
            formData={formData}
            onUpdate={updateFormDataHelper}
            isEditing={true}
          />
        );
      case 4: // Planification & Phases (Phase → Step → Task)
        return (
          <ConstructionPhaseManager 
            phases={phasesData}
            onChange={(updatedPhases: PhaseDTO[]) => setPhases(updatedPhases)}
            projectBudget={formData.budget || 0}
          />
        );
      case 5: // Risques
        return (
          <RiskAnalysisStep
            formData={formData}
            onUpdate={updateFormDataHelper}
            isEditing={true}
          />
        );
      case 6: // Conformité
        return (
          <ComplianceStep
            formData={formData}
            onUpdate={updateFormDataHelper}
            isEditing={true}
          />
        );
      case 7: // Validation & Clôture
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-teal-500" />
                Validation et Conformité Finale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut de Réception
                </label>
                <select
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
                  value={formData.receptionStatus || ""}
                  onChange={(e) =>
                    updateFormDataHelper({ receptionStatus: e.target.value as 'pending' | 'in_progress' | 'completed' | 'cancelled' })
                  }
                >
                  <option value="">Sélectionner</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes de Clôture
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="Notes finales, observations, recommandations..."
                  value={formData.closureNotes || ""}
                  onChange={(e) =>
                    updateFormDataHelper({ closureNotes: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // Calculate overall progress
  const completedSteps = steps.filter((step) => step.isCompleted()).length;
  const overallProgress = (completedSteps / steps.length) * 100;

  if (isLoadingContext || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const [formData, setFormData] = useState<ProjectWorkflowDTO>(() => {
    if (initialData) return initialData as ProjectWorkflowDTO;
    
    return {
      title: '',
      description: '',
      location: '',
      status: 'draft',
      budget: 0,
      start_date: '',
      end_date: '',
      project_manager_id: '',
      client_id: '',
      progress: 0,
      team_size: 0,
      receptionStatus: 'pending',
      closureNotes: ''
    };
  });

  const updateFormData = (updates: Partial<ProjectDTO>) => {
    const updatedData = { ...formData, ...updates };
    setFormData(updatedData);
    if (onFormDataChange) {
      onFormDataChange(updatedData);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Édition du Projet: {formData.title || "Nouveau Projet"}
            </span>
            <Badge variant="outline" className="px-3 py-1">
              Étape 1 / {steps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progression globale</span>
              <span className="font-semibold">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              {completedSteps} étapes complétées sur {steps.length}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Steps */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step) => (
                <motion.div
                  key={step.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all duration-200",
                    1 === step.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : step.isCompleted()
                      ? "bg-green-50 hover:bg-green-100 border border-green-200"
                      : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                  )}
                  onClick={() => {}}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        1 === step.id
                          ? "bg-primary-foreground text-primary"
                          : step.isCompleted()
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      )}
                    >
                      {step.isCompleted() ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {step.title}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {step.description}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={1}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>

          {/* Action Buttons */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {}}
                    disabled={combinedIsSubmitting}
                  >
                    Précédent
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveStepOnly}
                    disabled={combinedIsSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {combinedIsSubmitting ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>

                  <Button onClick={handleSaveAndNext} disabled={combinedIsSubmitting}>
                    {combinedIsSubmitting ? "Sauvegarde..." : "Sauvegarder et suivant"}
                  </Button>

                  <Button
                    variant="default"
                    onClick={handleSaveGlobalAndClose}
                    disabled={combinedIsSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {combinedIsSubmitting ? "Sauvegarde..." : "Sauvegarder et fermer"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProjectEditForm;
