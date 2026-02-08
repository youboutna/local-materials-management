/**
 * EnhancedProjectEditForm - Hexagonal Architecture Edit Form
 * Following the 10-step flow:
 * 1. UI Form → formData
 * 2. Hook → Transformer.formToUpdateRequest(formData) → UpdateProjectDTO
 * 3. Service → Entity conversion
 * 4. Repository → Entity validation
 * 5. Adapter → Transformer.toSupabase(entity) → snake_case data
 * 6. Database → UPDATE
 * 7. Adapter → Transformer.fromSupabase(row) → Entity
 * 8. Service → Transformer.toDTO(entity) → ProjectDTO
 * 9. Hook → Update state
 * 10. UI → Render updated data
 */

import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
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
  AlertTriangle,
  CheckCircle,
  Edit2,
  Save,
  FileCheck,
  RotateCcw,
} from "lucide-react";

// Import unified workflow hook
import { useUnifiedProjectWorkflow } from "../../hooks/hexagonal/useUnifiedProjectWorkflow";
import { useProjectMaterialsHex } from "@/hooks/hexagonal";

// Import transformer for UI conversions
import { ProjectWorkflowTransforms } from "@/dtos/transforms/ProjectWorkflowTransforms";

// Import workflow DTOs
import { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { PhaseDTO } from "@/dtos/entities/PhaseDTO";

// Import step components
import ProjectInfoStep from "./steps/ProjectInfoStep";
import StakeholdersTeamStep from "./steps/StakeholdersTeamStep";
import LocationStep from "./steps/LocationStep";
import { RiskAnalysisStep } from './steps/RiskAnalysisStep';
import { ComplianceStep } from './steps/ComplianceStep';
import { EnhancedValidationStep } from './steps/EnhancedValidationStep';
import ConstructionPhaseManager from "./ConstructionPhaseManager";

interface EnhancedProjectEditFormProps {
  initialData?: ProjectWorkflowData;
  onSubmit?: (data: ProjectWorkflowData) => Promise<void>;
  onFormDataChange?: (data: ProjectWorkflowData) => void;
  isSubmitting?: boolean;
}

const EnhancedProjectEditForm: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onFormDataChange,
  isSubmitting: externalIsSubmitting = false,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(1);

  // Unified workflow hook
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
  } = useUnifiedProjectWorkflow('edit', projectId);

  // Materials via hexagonal hook
  const { 
    selectedMaterials, 
    updateMaterials, 
    isLoading: isLoadingMaterials 
  } = useProjectMaterialsHex(projectId);

  // Phases state
  const [phases, setPhases] = useState<PhaseDTO[]>(formData?.phases || []);

  // Combined loading/submitting states
  const combinedIsSubmitting = isSaving || externalIsSubmitting;

  // Step configuration (7 steps)
  const steps = useMemo(() => [
    {
      id: 1,
      title: "Informations du projet",
      icon: Building,
      description: "Données de base du projet",
      color: "bg-blue-500",
      isCompleted: () => !!(formData?.title && formData?.location),
    },
    {
      id: 2,
      title: "Parties prenantes",
      icon: Users,
      description: "Configuration des acteurs",
      color: "bg-green-500",
      isCompleted: () => !!(formData?.delegation && Object.keys(formData.delegation).length > 0),
    },
    {
      id: 3,
      title: "Localisation",
      icon: MapPin,
      description: "Géolocalisation et cartographie",
      color: "bg-cyan-500",
      isCompleted: () => !!(formData?.coordinates?.latitude && formData?.coordinates?.longitude),
    },
    {
      id: 4,
      title: "Planification & Phases",
      icon: Layers,
      description: "Phase → Step → Task",
      color: "bg-indigo-500",
      isCompleted: () => phases.length > 0,
    },
    {
      id: 5,
      title: "Risques",
      icon: AlertTriangle,
      description: "Gestion des risques",
      color: "bg-red-500",
      isCompleted: () => true, // Optional
    },
    {
      id: 6,
      title: "Conformité",
      icon: FileCheck,
      description: "Vérification réglementaire",
      color: "bg-amber-500",
      isCompleted: () => true, // Optional
    },
    {
      id: 7,
      title: "Validation & Clôture",
      icon: CheckCircle,
      description: "Réception définitive",
      color: "bg-teal-500",
      isCompleted: () => formData?.status === "terminé",
    },
  ], [formData, phases]);

  // Step 1: Handle form field updates from UI
  const handleFormUpdate = useCallback((updates: Partial<ProjectEditFormData>) => {
    updateFormData(updates);
    
    // Notify parent if callback provided
    if (onFormDataChange && formData) {
      onFormDataChange({ ...formData, ...updates } as unknown as ProjectWorkflowData);
    }
  }, [updateFormData, formData, onFormDataChange]);

  // Step 2-8: Save current step
  const handleSaveStep = useCallback(async () => {
    if (!formData) return;

    // Validate current step
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      toast({
        title: "Validation échouée",
        description: validation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    // Save via hook (steps 2-8 happen inside)
    const result = await saveProject();
    
    if (result.success) {
      toast({
        title: "Étape sauvegardée",
        description: `L'étape ${currentStep} a été sauvegardée.`,
      });
    }
  }, [formData, validateFormData, saveProject, currentStep, toast]);

  // Save and go to next step
  const handleSaveAndNext = useCallback(async () => {
    await handleSaveStep();
    
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [handleSaveStep, currentStep, steps.length]);

  // Save all and close
  const handleSaveAndClose = useCallback(async () => {
    if (!formData) return;

    // Update phases in form data before final save
    const dataWithPhases = { ...formData, phases };
    updateFormData(dataWithPhases);

    const result = await saveProject();
    
    if (result.success) {
      toast({
        title: "Projet sauvegardé",
        description: "Toutes les modifications ont été enregistrées.",
      });
      
      // Navigate back
      navigate(-1);
    }
  }, [formData, phases, updateFormData, saveProject, toast, navigate]);

  // Adapter to convert ProjectEditFormData updates to ProjectDTO format
  const handleFormUpdateAdapter = useCallback((data: Partial<any>) => {
    // Convert incoming data to ProjectEditFormData format
    handleFormUpdate(data as Partial<ProjectEditFormData>);
  }, [handleFormUpdate]);

  // Render step content
  const renderStepContent = useCallback(() => {
    if (!formData) return null;

    switch (currentStep) {
      case 1:
        return (
          <ProjectInfoStep
            formData={formData as any}
            onUpdate={handleFormUpdateAdapter}
            isEditing={true}
            baseData={{}}
          />
        );
      case 2:
        return (
          <StakeholdersTeamStep
            projectData={formData as any}
            onUpdate={handleFormUpdateAdapter}
            isEditing={true}
          />
        );
      case 3:
        return (
          <LocationStep
            formData={formData as any}
            onUpdate={handleFormUpdateAdapter}
            isEditing={true}
          />
        );
      case 4:
        return (
          <ConstructionPhaseManager 
            phases={phases as unknown as any[]}
            onChange={(updatedPhases) => setPhases(updatedPhases as unknown as PhaseDTO[])}
            projectBudget={formData.budget || 0}
          />
        );
      case 5:
        return (
          <RiskAnalysisStep
            formData={formData as any}
            onUpdate={handleFormUpdateAdapter}
            isEditing={true}
          />
        );
      case 6:
        return (
          <ComplianceStep
            formData={formData as any}
            onUpdate={handleFormUpdateAdapter}
            isEditing={true}
          />
        );
      case 7:
        return (
          <EnhancedValidationStep
            formData={formData}
            onUpdate={handleFormUpdateAdapter}
            isEditing={true}
          />
        );
      default:
        return null;
    }
  }, [formData, currentStep, handleFormUpdate, phases]);

  // Calculate overall progress
  const completedSteps = steps.filter((step) => step.isCompleted()).length;
  const overallProgress = (completedSteps / steps.length) * 100;

  // Loading state
  if (isLoading || isLoadingMaterials) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Une erreur est survenue"}
          </p>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </Card>
      </div>
    );
  }

  // Step 10: Render UI with updated data
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Édition du Projet: {formData?.title || "Nouveau Projet"}
              {isDirty && (
                <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-300">
                  Non sauvegardé
                </Badge>
              )}
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
                    onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                    disabled={currentStep === 1 || combinedIsSubmitting}
                  >
                    Précédent
                  </Button>
                  {isDirty && (
                    <Button
                      variant="ghost"
                      onClick={resetForm}
                      disabled={combinedIsSubmitting}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveStep}
                    disabled={combinedIsSubmitting || !isDirty}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {combinedIsSubmitting ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>

                  {currentStep < steps.length && (
                    <Button 
                      onClick={handleSaveAndNext} 
                      disabled={combinedIsSubmitting}
                    >
                      {combinedIsSubmitting ? "Sauvegarde..." : "Sauvegarder et suivant"}
                    </Button>
                  )}

                  <Button
                    variant="default"
                    onClick={handleSaveAndClose}
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
