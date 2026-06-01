import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Layers,
  MapPin,
  Save,
  Target,
  Users,
} from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';

// Import step components
import InteractiveMapGIS from "../materials/InteractiveMapGIS";
import ConstructionPhaseManager from "./ConstructionPhaseManager";
import EnhancedComplianceStep from "./steps/EnhancedComplianceStep";
import ResourcesMaterialsStep from "./steps/ResourcesMaterialsStep";
import RiskAnalysisStep from "./steps/RiskAnalysisStep";
import StakeholdersTeamStep from "./steps/StakeholdersTeamStep";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Import unified workflow hook
import { useUnifiedProjectWorkflow } from "../../hooks/hexagonal/useUnifiedProjectWorkflow";

// Import ProjectWorkflowService and RepositoryFactory
import { ProjectWorkflowService } from "@/application/services/ProjectWorkflowService";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";

// Import workflow DTOs
import { ProjectWorkflowData, StepRelatedDataDTO } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { PhaseWorkflowDTO } from "@/dtos/workflows/PhaseWorkflowDTO";

// Import entity DTOs (following PROMPTS.md Rule #4: No type redefinition)
import { ProjectDTO, ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { ComplianceItemDTO } from '@/dtos/entities/ComplianceDTO';
import { MaterialDTO, MaterialCategory, MaterialStatus, MaterialUnit } from "@/dtos/entities/MaterialDTO";
import { RiskDTO } from "@/dtos/entities/RiskDTO";
import { EmployeeDTO } from "@/dtos/entities/EmployeeDTO";
import { PhaseDTO, PhaseType, PhaseStatus, PhasePriority } from "@/dtos/entities/PhaseDTO";
import { LocationDTO } from "@/dtos/shared";
import { generatePhaseTypeFromReferentialPhase, generateDynamicPhaseType } from '@/utils/phaseTypeGenerator';
import ProjectInfoStep from "./steps/ProjectInfoStep";
import StrategicLinkageStep from "./steps/StrategicLinkageStep";

// Référentiel central des étapes (PROMPTS.md Rule #3 + ARCHITECTURE_REFERENTIELS)
import {
  PROJECT_WORKFLOW_STEPS,
  type WorkflowStepIcon,
} from "@/config/referentials/projects/project-workflow-steps.referential";

const STEP_ICON_MAP: Record<WorkflowStepIcon, React.ComponentType<{ className?: string }>> = {
  building: Building,
  users: Users,
  "map-pin": MapPin,
  layers: Layers,
  "alert-triangle": AlertTriangle,
  "file-check": FileCheck,
  target: Target,
  "check-circle": CheckCircle,
};

interface ProjectCreationWorkflowProps {
  onSubmit: (data: ProjectWorkflowData) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (
    materials: Array<{ materialId: string; quantity: number }>
  ) => void;
  initialData?: ProjectWorkflowData;
  mode?: "create" | "edit";
  projectId?: string;
}

const ProjectCreationWorkflow: React.FC<ProjectCreationWorkflowProps> = ({
  onSubmit,
  selectedMaterials,
  onMaterialsChange,
  initialData,
  mode = "create",
  projectId,
}) => {

  // ⚡ Application Layer - Use unified workflow hook for all state management (Rule #5)
  const {
    workflowState,
    formData,
    currentStepInfo,
    isStepCompleted,
    progressPercentage,
    isLoading,
    error,
    updateFormData,
    nextStep,
    previousStep,
    saveCurrentStep,
    validateCurrentStep,
    workflowSteps
  } = useUnifiedProjectWorkflow(mode === "edit" ? "edit" : "creation", projectId);

  // 🎨 UI Layer - Only UI-specific state (Rule #5)
  const [currentStep, setCurrentStep] = useState(0);

  // 🎨 UI Layer - Use unified workflow data (Rule #5: UI Layer Separation)
  const projectData = formData?.projectData;
  const relatedData = formData?.relatedData;

  // 🎨 UI Layer - Use unified workflow validation (Rule #5 compliant)
  const validateStepData = useCallback(async (): Promise<{ isValid: boolean; errors: string[] }> => {
    if (!formData) return { isValid: false, errors: ['No form data available'] };
    const validation = await validateCurrentStep();
    return { isValid: validation.isValid, errors: validation.errors };
  }, [formData, validateCurrentStep]);

  // ✅ Steps from centralized referential (ARCHITECTURE_REFERENTIELS)
  // — labels/validation/icones centralisés ; pas de hardcoding UI.
  const steps = useMemo(
    () =>
      PROJECT_WORKFLOW_STEPS.map((cfg) => ({
        id: cfg.id,
        title: cfg.title,
        description: cfg.description,
        color: cfg.color,
        icon: STEP_ICON_MAP[cfg.icon],
        isCompleted: () => cfg.validate(formData ?? null),
      })),
    [formData]
  );


  // 🎨 UI Layer - Save and proceed to next step using unified workflow (Rule #5)
  const saveAndNextStep = async () => {
    // Validate current step before proceeding
    if (!canProceedNext()) {
      console.warn('Veuillez compléter l\'étape actuelle avant de continuer');
      return; // 🚫 Do not proceed if validation fails
    }

    // Attempt to save current step using unified workflow
    const result = await saveCurrentStep();
    if (!result || !result.success) {
      console.error('Échec de la sauvegarde, passage à l\'étape suivante annulé');
      return; // 🚫 Do not proceed if save fails
    }

    // Only proceed if save was successful
    nextStep();
  };

  // 🎨 UI Layer - Save all workflow data using unified workflow (Rule #5)
  const saveAllData = async (): Promise<boolean> => {
    if (!formData) {
      console.error('No form data available');
      return false;
    }

    // Use the unified workflow hook's save functionality (Rule #5: UI Layer Separation)
    const result = await saveCurrentStep();
    if (!result || !result.success) {
      // Type-safe error handling for SaveResult interface
      let errorMessage = 'Failed to save workflow data';
      
      if (result && 'errors' in result && Array.isArray((result as any).errors) && (result as any).errors.length > 0) {
        errorMessage = (result as any).errors.join(', ');
      }
      else if (result && 'message' in result && typeof (result as any).message === 'string') {
        errorMessage = (result as any).message;
      }
      
      console.error('Erreur lors de la sauvegarde complète:', errorMessage);
      return false; // ❌ Failed
    }

    console.log('Toutes les données du workflow sauvegardées');
    return true; // ✅ Success
  };

  const getStepProgress = (): number => {
    if (!projectData) return 0;
    const completedCount = steps.filter((step) =>
      step.isCompleted()
    ).length;
    return (completedCount / steps.length) * 100;
  };

  const canProceedNext = (): boolean => {
    const step = steps[currentStep];
    // ✅ Use project data for validation (consistent with step validation)
    return step ? step.isCompleted() : false;
  };

  const handleSubmit = async () => {
    try {
      if (!formData) {
        throw new Error('No form data available');
      }

      // Use the unified workflow hook for final submission (Rule #5: UI Layer Separation)
      // Update form data with completion status
      const finalWorkflowData: Partial<ProjectWorkflowData> = {
        ...formData,
        currentStep: steps.length,
        isComplete: true,
        isDraft: false,
        metadata: {
          ...formData.metadata,
          totalSteps: steps.length,
          completedSteps: steps.length,
          progressPercentage: 100,
          lastSavedAt: new Date().toISOString()
        }
      };
      
      // Submit through the unified workflow system
      await updateFormData(finalWorkflowData);
      const result = await saveCurrentStep();
      
      if (!result || !result.success) {
        throw new Error((result as any)?.errors?.join(', ') || 'Failed to complete project creation');
      }
      
      toast({
        title: "Projet créé avec succès",
        description: "Le projet a été créé et toutes les étapes sont complétées",
      });
      
      // Call the onSubmit prop with the complete workflow data
      onSubmit(finalWorkflowData as ProjectWorkflowData);
      
      // Redirect to project detail if projectId exists
      if (formData.projectId) {
        window.location.href = `/projects/${formData.projectId}`;
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Erreur de création",
        description: error instanceof Error ? error.message : "Impossible de créer le projet",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Compact progress header */}
      <div className="flex items-center gap-3 px-1">
        <Progress value={getStepProgress()} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Étape {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Steps Navigation */}
      <div className="grid grid-cols-8 gap-1.5">
        {steps.map((step, idx) => (
          <motion.button
            key={step.id}
            onClick={() => setCurrentStep(idx)}
            title={step.title}
            aria-label={step.title}
            className={cn(
              "p-2 rounded-md transition-all flex items-center justify-center",
              currentStep === idx
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <step.icon className="h-4 w-4" />
          </motion.button>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">{steps[currentStep]?.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {steps[currentStep]?.description}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {currentStep === 0 && (
            <ProjectInfoStep
              mode="create"
              workflowData={formData}
              onStepComplete={(stepData) => {
                // Step 1 manages CRUD service adapters and initiates status/progress
                updateFormData({ 
                  projectData: {
                    ...formData?.projectData,
                    ...stepData.projectData,
                    status: ProjectStatus.EN_ATTENTE,
                    progress: 0
                  }
                });
              }}
            />
          )}

        {currentStep === 1 && (
          <StakeholdersTeamStep
            workflowData={formData}
            onStepComplete={(stepData) => {
              updateFormData({ 
                relatedData: {
                  ...formData?.relatedData,
                  stakeholders: stepData.stakeholders
                }
              });
            }}
          />
        )}

        {currentStep === 2 && (
          <InteractiveMapGIS
            value={{
              coordinates: formData?.projectData?.latitude && formData?.projectData?.longitude 
                ? { lat: formData?.projectData.latitude, lng: formData?.projectData.longitude }
                : undefined
            }}
            onChange={(data) => {
              if (data.coordinates) {
                updateFormData({
                  projectData: {
                    ...(formData?.projectData || {}),
                    id: formData?.projectData?.id || uuidv4(), // Ensure we always have an ID
                    createdAt: formData?.projectData?.createdAt || new Date().toISOString(), // Default now
                    updatedAt: formData?.projectData?.updatedAt || new Date().toISOString(), // Default now
                    title: formData?.projectData?.title || '', // Default empty string
                    description: formData?.projectData?.description || '', // Default empty string
                    status: formData?.projectData?.status || ProjectStatus.DRAFT, // Default status
                    progress: formData?.projectData?.progress || 0, // Default progress
                    location: formData?.projectData?.location || '', // Default empty string
                    startDate: formData?.projectData?.startDate || new Date().toISOString().split('T')[0], // Default today
                    budget: formData?.projectData?.budget || 0, // Default budget
                    currency: formData?.projectData?.currency || 'MRO', // Default currency
                    teamSize: formData?.projectData?.teamSize || 0, // Default team size
                    latitude: data.coordinates.lat,
                    longitude: data.coordinates.lng
                  }
                });
              }
            }}
          />
        )}

        {currentStep === 3 && (
          <ConstructionPhaseManager
            projectId={formData?.projectId || ''}
            workflowData={formData ?? null}
            phases={formData?.relatedData?.phases || []}
            onStepComplete={(stepData) => {
              updateFormData({
                relatedData: {
                  ...formData?.relatedData,
                  phases: stepData.phases
                }
              });
            }}
          />
        )}

           {currentStep === 4 && (
             <RiskAnalysisStep
               workflowData={formData}
               onStepComplete={(stepData) => {
                 updateFormData({ 
                   relatedData: {
                     ...formData?.relatedData,
                     risks: stepData.risks
                   }
                 });
               }}
             />
           )}

           {currentStep === 5 && (
             <EnhancedComplianceStep
               workflowData={formData}
               onStepComplete={(stepData) => {
                 updateFormData({ 
                   relatedData: {
                     ...formData?.relatedData,
                     compliance: stepData.compliance
                   }
                 });
               }}
             />
           )}

           {currentStep === 6 && (
             <StrategicLinkageStep
               projectId={formData?.projectId || ''}
               onStrategyLinksChange={(links) => {
                 updateFormData({
                   relatedData: {
                     ...formData?.relatedData,
                     strategyLinks: links as any
                   }
                 });
               }}
               onBudgetLinksChange={(links) => {
                 updateFormData({
                   relatedData: {
                     ...formData?.relatedData,
                     budgetLinks: links as any
                   }
                 });
               }}
             />
           )}

          {currentStep === 7 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Résumé du Projet</h3>
              <Card>
                <CardContent className="pt-6 space-y-2">
                  <p><strong>Titre:</strong> {formData?.projectData?.title}</p>
                  <p><strong>Budget:</strong> ${formData?.projectData?.budget || 0}</p>
                  <p><strong>Dates:</strong> {formData?.projectData?.startDate || 'Non défini'} à {formData?.projectData?.endDate || 'Non défini'}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={previousStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => saveCurrentStep()}>
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading ? 'Création en cours...' : 'Créer le Projet'}
            </Button>
          ) : (
            <Button onClick={saveAndNextStep}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationWorkflow;
