// ============================================================
// src/pages/ProjectEdit.tsx
// ============================================================
/**
 * ProjectEdit
 * Édition projet — même workflow référentiel que la création (mode="edit").
 * Le pré-remplissage des 8 étapes est géré par `useUnifiedProjectWorkflow('edit', id)`.
 * 
 * Workflow Steps:
 * 1. Project Info - Informations générales
 * 2. Stakeholders - Parties prenantes
 * 3. Location - Localisation
 * 4. Phases - Planification WBS
 * 5. Risks - Risques
 * 6. Compliance - Conformité
 * 7. Strategy - Liens stratégiques
 * 8. Review - Validation
 */

import ProjectCreationWorkflow from "@/components/project/ProjectCreationWorkflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, CheckCircle, Workflow, RefreshCw } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { useUnifiedProjectWorkflow } from "@/hooks/hexagonal/useUnifiedProjectWorkflow";

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

// ============================================================
// Workflow Steps Definition
// ============================================================
const WORKFLOW_STEPS = [
  { number: 1, title: 'Informations', required: true },
  { number: 2, title: 'Parties prenantes', required: false },
  { number: 3, title: 'Localisation', required: true },
  { number: 4, title: 'Phases WBS', required: true },
  { number: 5, title: 'Risques', required: false },
  { number: 6, title: 'Conformité', required: false },
  { number: 7, title: 'Stratégie', required: false },
  { number: 8, title: 'Validation', required: true }
];

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ============================================================
  // Unified Workflow Hook
  // ============================================================
  const {
    workflowState,
    formData,
    currentStepInfo,
    isStepCompleted,
    progressPercentage,
    isLoading,
    error: workflowError,
    updateFormData,
    nextStep,
    previousStep,
    setCurrentStep: setWorkflowStep,
    saveCurrentStep,
    validateCurrentStep,
    workflowSteps,
    loadProjectData
  } = useUnifiedProjectWorkflow('edit', id);

  // ============================================================
  // Effets
  // ============================================================
  
  // Mettre à jour l'état local quand les données sont chargées
  useEffect(() => {
    if (formData) {
      // Récupérer les étapes complétées depuis le workflow
      const completed = workflowState?.completedSteps || [];
      setCompletedSteps(completed);
      
      // Mettre à jour la progression
      if (workflowState?.currentStep) {
        setCurrentStep(workflowState.currentStep);
      }
    }
  }, [formData, workflowState]);

  // Gérer les erreurs du workflow
  useEffect(() => {
    if (workflowError) {
      setLoadError(workflowError);
      toast({
        title: "Erreur de chargement",
        description: workflowError,
        variant: "destructive"
      });
    }
  }, [workflowError]);

  // ============================================================
  // Handlers
  // ============================================================
  
  /**
   * Handle step change from workflow
   */
  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    setWorkflowStep(step);
    
    // Mettre à jour les étapes complétées
    if (step > 1 && !completedSteps.includes(step - 1)) {
      setCompletedSteps(prev => [...prev, step - 1]);
    }
  }, [completedSteps, setWorkflowStep]);

  /**
   * Handle step validation result
   */
  const handleStepValidation = useCallback((step: number, isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [step]: isValid }));
  }, []);

  /**
   * Handle form submission (step 8 - Review)
   */
  const handleFormSubmit = useCallback(async (data: ProjectWorkflowData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Vérifier que toutes les étapes requises sont complétées
      const requiredSteps = WORKFLOW_STEPS.filter(s => s.required).map(s => s.number);
      const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));
      
      if (missingSteps.length > 0) {
        toast({
          title: t("common.warning") || "Attention",
          description: `Les étapes ${missingSteps.join(', ')} sont requises`,
          variant: "destructive",
        });
        setCurrentStep(missingSteps[0]);
        setWorkflowStep(missingSteps[0]);
        return;
      }

      // Vérifier que toutes les étapes sont valides
      const invalidSteps = Object.entries(stepValidation)
        .filter(([_, isValid]) => !isValid)
        .map(([step]) => Number(step));
      
      if (invalidSteps.length > 0) {
        toast({
          title: t("common.warning") || "Attention",
          description: `Les étapes ${invalidSteps.join(', ')} ont des erreurs`,
          variant: "destructive",
        });
        setCurrentStep(invalidSteps[0]);
        setWorkflowStep(invalidSteps[0]);
        return;
      }

      // Sauvegarder la dernière étape avant soumission
      const saveResult = await saveCurrentStep(8);
      if (!saveResult?.success) {
        throw new Error(saveResult?.errors?.join(', ') || 'Erreur lors de la sauvegarde');
      }

      // Soumettre le projet
      toast({
        title: t("projects.edit.success") || "Projet mis à jour",
        description: data.projectData?.title || "",
      });

      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
      toast({
        title: t("common.error") || "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [completedSteps, stepValidation, saveCurrentStep, id, navigate, t, setWorkflowStep]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    if (id) {
      await loadProjectData();
      toast({
        title: "Rafraîchi",
        description: "Les données du projet ont été mises à jour",
      });
    }
  }, [id, loadProjectData]);

  // ============================================================
  // États de chargement
  // ============================================================
  
  if (isLoading) {
    return (
      <AppLayout
        pageTitle={t("projects.edit.title") || "Édition projet"}
        actions={
          <Button variant="ghost" asChild disabled>
            <Link to={`/projects/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("project_create.back_to_projects") || "Retour"}
            </Link>
          </Button>
        }
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement du projet...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!id) {
    return (
      <AppLayout pageTitle={t("projects.edit.title") || "Édition projet"}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>Identifiant projet manquant.</AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  if (loadError || !formData) {
    return (
      <AppLayout
        pageTitle={t("projects.edit.title") || "Édition projet"}
        actions={
          <Button variant="ghost" asChild>
            <Link to={`/projects/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("project_create.back_to_projects") || "Retour"}
            </Link>
          </Button>
        }
      >
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>
              {loadError || "Impossible de charger les données du projet."}
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ============================================================
  // Calcul de la progression
  // ============================================================
  const progress = Math.round((completedSteps.length / WORKFLOW_STEPS.length) * 100);
  const isComplete = completedSteps.length === WORKFLOW_STEPS.length;

  // ============================================================
  // Render
  // ============================================================
  return (
    <AppLayout
      pageTitle={t("projects.edit.title") || "Édition projet"}
      pageDescription={`Modification du projet "${formData?.projectData?.title || ''}"`}
      actions={
        <div className="flex items-center gap-3">
          {/* Progression */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Workflow className="h-3 w-3 mr-1" />
              Étape {currentStep}/{WORKFLOW_STEPS.length}
            </Badge>
            <Badge variant={isComplete ? "default" : "secondary"} className="text-sm">
              {progress}%
            </Badge>
            {isComplete && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complet
              </Badge>
            )}
          </div>
          
          <Button variant="ghost" asChild>
            <Link to={`/projects/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("project_create.back_to_projects") || "Retour"}
            </Link>
          </Button>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Workflow Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression du workflow</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.number}
                className={`flex items-center gap-1 cursor-pointer transition-colors ${
                  currentStep === step.number ? 'text-primary font-medium' :
                  completedSteps.includes(step.number) ? 'text-green-600' :
                  'text-muted-foreground'
                }`}
                onClick={() => {
                  setCurrentStep(step.number);
                  setWorkflowStep(step.number);
                }}
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full border border-current text-xs">
                  {completedSteps.includes(step.number) ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    step.number
                  )}
                </span>
                <span className="hidden sm:inline">{step.title}</span>
                {step.required && (
                  <span className="text-red-500 text-[10px]">*</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Warning: Missing steps */}
        {currentStep === WORKFLOW_STEPS.length && !isSubmitting && !isComplete && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Validation finale</AlertTitle>
            <AlertDescription className="text-yellow-700">
              {completedSteps.length < WORKFLOW_STEPS.filter(s => s.required).length ? (
                `Veuillez compléter toutes les étapes requises avant de valider le projet.`
              ) : (
                `Toutes les étapes sont complètes. Vous pouvez maintenant mettre à jour le projet.`
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Success: All steps complete */}
        {isComplete && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Projet complet</AlertTitle>
            <AlertDescription className="text-green-700">
              Toutes les étapes sont complétées. Vous pouvez maintenant mettre à jour le projet.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Workflow */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <ProjectCreationWorkflow
            mode="edit"
            projectId={id}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onStepValidation={handleStepValidation}
            onSubmit={handleFormSubmit}
            selectedMaterials={selectedMaterials}
            onMaterialsChange={setSelectedMaterials}
            isSubmitting={isSubmitting}
            initialData={formData}
          />
        </div>

        {/* Navigation Help */}
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>
            {currentStep < WORKFLOW_STEPS.length ? (
              `Étape ${currentStep} sur ${WORKFLOW_STEPS.length} - ${WORKFLOW_STEPS.find(s => s.number === currentStep)?.title}`
            ) : (
              isComplete ? 'Toutes les étapes sont complètes - Prêt à mettre à jour le projet' :
              'Étape de validation - Veuillez compléter toutes les étapes requises'
            )}
          </p>
          {formData?.projectData?.updatedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Dernière mise à jour: {new Date(formData.projectData.updatedAt).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default ProjectEdit;