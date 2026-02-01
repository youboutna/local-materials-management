import React, { useState, useEffect, useCallback, useMemo } from "react";
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

// Import hexagonal services
import {
  ProjectFormService,
  ProjectFormDataDTO,
  SaveContextDTO,
} from "../../application/services/ProjectFormService";

// Import hexagonal hooks
import { useProjectWorkflowHex, type ProjectWorkflowData } from "@/hooks/hexagonal";
import { useProjectMaterialsHex } from "@/hooks/hexagonal";

// Import step components
import ProjectInfoStep from "./steps/ProjectInfoStep";
import StakeholdersTeamStep from "./steps/StakeholdersTeamStep";
import LocationStep from "./steps/LocationStep";
import RiskAnalysisStep from "./steps/RiskAnalysisStep";
import ComplianceStep from "./steps/ComplianceStep";
// Import types directly from ConstructionPhaseManager to avoid type conflicts
import { PhaseData, type CustomPhase } from "./ConstructionPhaseManager";
import { PhaseDTO } from "@/dtos/entities";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";

interface EnhancedProjectEditFormProps {
  initialData?: ProjectFormDataDTO;
  onSubmit: (data: ProjectFormDataDTO) => Promise<void>;
  onFormDataChange?: (data: ProjectFormDataDTO) => void;
  isSubmitting?: boolean;
}

// Transformer function to convert any phase data to PhaseData
const transformProjectPhaseToPhaseData = (phases: unknown[]): PhaseData[] => {
  return (phases as Array<Record<string, unknown>>).map(phase => ({
    id: String(phase.id || ''),
    title: String(phase.name || phase.phase_name || 'Untitled Phase'),
    description: String(phase.description || ''),
    startDate: String(phase.startDate || phase.start_date || ''),
    endDate: String(phase.endDate || phase.end_date || ''),
    estimatedDuration: Number(phase.estimatedDuration || phase.estimated_duration_days || 0),
    status: (phase.status as 'not_started' | 'in_progress' | 'completed' | 'delayed') || 'not_started',
    budget: Number(phase.budget || phase.estimated_cost || 0),
    actualCost: Number(phase.actualCost || phase.actual_cost || 0),
    progress: Number(phase.progress || 0),
    materials: (phase.materials as Array<{ materialId: string; quantity: number; name?: string }>) || [],
    humanResources: (phase.humanResources as Array<{ roleId: string; quantity: number; role?: string }>) || [],
    suppliers: (phase.suppliers as Array<{ supplierId: string; name?: string; contact?: string }>) || [],
    location: String(phase.location || ''),
    notes: phase.notes ? String(phase.notes) : undefined
  }));
};

// Transformer function to convert PhaseData to PhaseDTO for ProgressCalculationHexService
const transformPhaseDataToPhaseDTO = (phases: PhaseData[], projectId: string): PhaseDTO[] => {
  return phases.map(phase => ({
    id: phase.id,
    name: phase.title, // Utiliser title pour name
    description: phase.description,
    status: phase.status === 'not_started' ? 'planning' : 
            phase.status === 'in_progress' ? 'active' : 
            phase.status === 'completed' ? 'completed' : 'paused',
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

const EnhancedProjectEditForm: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onFormDataChange,
  isSubmitting: externalIsSubmitting = false,
}) => {
  const { toast } = useToast();
  const { id: projectId } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormDataDTO>(() => {
    if (initialData) return initialData;
    
    // Retourner un objet ProjectFormDataDTO valide selon Règle #4
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
      team_size: 0
    };
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [baseData, setBaseData] = useState<ProjectFormDataDTO>({
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
    team_size: 0
  });
  const [phasesData, setPhasesData] = useState<PhaseData[]>([]);

  // Use hexagonal hook for materials
  const { 
    selectedMaterials, 
    updateMaterials, 
    isLoading: isLoadingMaterials 
  } = useProjectMaterialsHex(projectId);

  // Combine loading states
  const combinedIsSubmitting = isSaving || externalIsSubmitting;

  // Initialize ProjectFormService
  const formService = useMemo(() => new ProjectFormService(), []);

  // Load project data using ProjectService
  const loadProjectData = useCallback(async () => {
    if (
      !projectId ||
      hasLoadedData ||
      (initialData && Object.keys(initialData).length > 0)
    )
      return;

    setIsLoading(true);
    try {
      const { ProjectService } = await import("@/application/services/ProjectService");
      const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

      // Load complete project details with validation
      const projectDetail = await projectService.getProjectWithDetails(projectId);

      if (!projectDetail) {
        console.warn(`Project with ID ${projectId} not found`);
        setPhasesData([]);
        setHasLoadedData(true);
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
        setPhasesData([]);
        setHasLoadedData(true);
        return;
      }

      // Load stakeholders from database
      const { ProjectStakeholderService } = await import(
        "@/application/services/ProjectStakeholderService"
      );
      const stakeholdersData =
        await ProjectStakeholderService.getProjectStakeholders(projectId);

      // Map stakeholders to form format using correct ProjectDTO properties
      const formattedData: ProjectFormDataDTO = {
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
      
      setFormData(formattedData);
      setPhasesData(transformProjectPhaseToPhaseData(projectDetail.plannedPhases || []));
      setHasLoadedData(true);
      
    } catch (error) {
      console.error("Error loading project data:", error);
      toast({
        title: "Erreur",
        description: `Erreur lors du chargement des données du projet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
      // Set safe defaults on error
      setPhasesData([]);
      setHasLoadedData(true);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, hasLoadedData, initialData, toast]);

  // Load related data - now handled by ProjectService above
  const loadRelatedData = useCallback(async () => {
    // Data is now loaded in loadProjectData via ProjectService
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
  const updateFormData = (updates: Partial<ProjectFormDataDTO>) => {
    const updatedData = { ...formData, ...updates };
    setFormData(updatedData);
    if (onFormDataChange) {
      onFormDataChange(updatedData);
    }
  };

  // Save handlers with distinct behavior
  const handleSaveStepOnly = async () => {
    if (!onSubmit) return;

    setIsSaving(true);
    try {
      const context: SaveContextDTO = {
        currentStep,
        saveType: "step_only",
        isDraft: true,
        totalSteps: steps.length,
      };

      const processedData = formService.processFormDataForSave(
        {
          ...formData,
          materials: selectedMaterials,
          phases: phasesData,
        },
        context
      );

      await onSubmit(processedData);

      toast({
        title: "Étape sauvegardée",
        description: "Les données de cette étape ont été sauvegardées.",
      });
    } catch (error) {
      console.error("Error saving step:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde de l'étape.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    if (!onSubmit) return;

    setIsSaving(true);
    try {
      const context: SaveContextDTO = {
        currentStep,
        saveType: "save_and_next",
        isDraft: true,
        totalSteps: steps.length,
      };

      const processedData = formService.processFormDataForSave(
        {
          ...formData,
          materials: selectedMaterials,
          phases: phasesData,
        },
        context
      );

      await onSubmit(processedData);

      // Move to next step if not at the end
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
        toast({
          title: "Étape sauvegardée",
          description: `Passage à l'étape ${currentStep + 1}: ${
            steps[currentStep]?.title
          }`,
        });
      } else {
        toast({
          title: "Toutes les étapes complétées",
          description: "Vous avez terminé toutes les étapes du projet.",
        });
      }
    } catch (error) {
      console.error("Error saving step:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGlobalAndClose = async () => {
    if (!onSubmit) return;

    setIsSaving(true);
    try {
      // Calculer la progression globale avant sauvegarde
      const { ProgressCalculationHexService } = await import(
        "@/application/services/ProgressCalculationHexService"
      );

      const progressService = new ProgressCalculationHexService();
      const calculatedProgress =
        progressService.calculateProjectProgress(
          transformPhaseDataToPhaseDTO(phasesData, projectId || '')
      );

      const context: SaveContextDTO = {
        currentStep,
        saveType: "global_and_close",
        isDraft: false,
        isComplete: true,
        totalSteps: steps.length,
      };

      const processedData = formService.processFormDataForSave(
        {
          ...formData,
          progress: calculatedProgress,
          materials: selectedMaterials,
          phases: phasesData,
        },
        context
      );

      await onSubmit(processedData);

      toast({
        title: "Projet sauvegardé",
        description: "Toutes les modifications ont été sauvegardées.",
      });

      // Navigate back or close form
      window.history.back();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde globale.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Informations du projet
        return (
          <ProjectInfoStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
            baseData={baseData}
          />
        );
      case 2: // Parties prenantes
        return (
          <StakeholdersTeamStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
            baseData={baseData}
          />
        );
      case 3: // Localisation
        return (
          <LocationStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 4: // Planification & Phases (Phase → Step → Task)
        return (
          <ConstructionPhaseManager
            phases={phasesData}
            onChange={setPhasesData}
            projectBudget={formData.budget || 0}
          />
        );
      case 5: // Risques
        return (
          <RiskAnalysisStep
            formData={formData}
            onUpdate={updateFormData}
            isEditing={true}
          />
        );
      case 6: // Conformité
        return (
          <ComplianceStep
            formData={formData}
            onUpdate={updateFormData}
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
                  Statut de réception
                </label>
                <select
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary"
                  value={formData.receptionStatus || ""}
                  onChange={(e) =>
                    updateFormData({ receptionStatus: e.target.value })
                  }
                >
                  <option value="">Sélectionner</option>
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvé</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes de clôture
                </label>
                <textarea
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary min-h-[100px]"
                  placeholder="Notes finales, observations, recommandations..."
                  value={formData.closureNotes || ""}
                  onChange={(e) =>
                    updateFormData({ closureNotes: e.target.value })
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              Étape {currentStep} / {steps.length}
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
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : step.isCompleted()
                      ? "bg-green-50 hover:bg-green-100 border border-green-200"
                      : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                  )}
                  onClick={() => setCurrentStep(step.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        currentStep === step.id
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
            key={currentStep}
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
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1 || combinedIsSubmitting}
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

                  {currentStep < steps.length && (
                    <Button onClick={handleSaveAndNext} disabled={combinedIsSubmitting}>
                      {combinedIsSubmitting ? "Sauvegarde..." : "Sauvegarder et suivant"}
                    </Button>
                  )}

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
