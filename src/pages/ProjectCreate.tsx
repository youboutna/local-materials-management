// ============================================================
// src/pages/ProjectCreate.tsx
// ============================================================
/**
 * ProjectCreate
 * Page d'entrée pour la création projet.
 * Toute la persistance (project, phases, stakeholders, …) est déléguée à
 * `ProjectWorkflowService` via `ProjectCreationWorkflow` (saveCurrentStep par étape).
 * — Pas de double persistance, pas de mapping snake_case ici.
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
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, CheckCircle, Workflow } from "lucide-react";
import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import type { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { WorkflowProvider } from "@/contexts/ProjectWorkflowContext";

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

// ============================================================
// Types pour le suivi des étapes
// ============================================================
interface StepStatus {
  number: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isValid: boolean;
}

const ProjectCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // Workflow Steps Definition
  // ============================================================
  const workflowSteps = [
    { number: 1, title: 'Informations', required: true },
    { number: 2, title: 'Parties prenantes', required: false },
    { number: 3, title: 'Localisation', required: true },
    { number: 4, title: 'Phases WBS', required: true },
    { number: 5, title: 'Risques', required: false },
    { number: 6, title: 'Conformité', required: false },
    { number: 7, title: 'Stratégie', required: false },
    { number: 8, title: 'Validation', required: true }
  ];

  // ============================================================
  // Handlers
  // ============================================================
  
  /**
   * Handle step change from workflow
   */
  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step);
    // Mettre à jour les étapes complétées
    if (step > 1 && !completedSteps.includes(step - 1)) {
      setCompletedSteps(prev => [...prev, step - 1]);
    }
  }, [completedSteps]);

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
      const requiredSteps = workflowSteps.filter(s => s.required).map(s => s.number);
      const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));
      
      if (missingSteps.length > 0) {
        toast({
          title: t("common.warning") || "Attention",
          description: `Les étapes ${missingSteps.join(', ')} sont requises`,
          variant: "destructive",
        });
        setCurrentStep(missingSteps[0]);
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
        return;
      }

      // Soumettre le projet
      toast({
        title: t("project_create.toast.created") || "Projet créé",
        description: data.projectData?.title || "",
      });

      const id = data.projectId || data.projectData?.id;
      
      if (id) {
        toast({
          title: "Succès",
          description: `Projet "${data.projectData?.title}" créé avec succès`,
        });
        navigate(`/projects/${id}`);
      } else {
        navigate("/projects");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
      toast({
        title: t("common.error") || "Erreur",
        description: err instanceof Error ? err.message : "Erreur lors de la création",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [completedSteps, stepValidation, workflowSteps, navigate, t]);

  // ============================================================
  // Render
  // ============================================================
  
  // Calcul de la progression
  const progress = Math.round((completedSteps.length / workflowSteps.length) * 100);

  return (
    <AppLayout
      pageTitle={t("project_create.title")}
      pageDescription="Créez un nouveau projet en suivant les étapes du workflow"
      actions={
        <div className="flex items-center gap-3">
          {/* Progression */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Workflow className="h-3 w-3 mr-1" />
              Étape {currentStep}/{workflowSteps.length}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {progress}%
            </Badge>
          </div>
          
          <Button variant="ghost" asChild>
            <Link to="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("project_create.back_to_projects")}
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
            {workflowSteps.map((step) => (
              <div
                key={step.number}
                className={`flex items-center gap-1 cursor-pointer transition-colors ${
                  currentStep === step.number ? 'text-primary font-medium' :
                  completedSteps.includes(step.number) ? 'text-green-600' :
                  'text-muted-foreground'
                }`}
                onClick={() => setCurrentStep(step.number)}
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
        {currentStep === workflowSteps.length && !isSubmitting && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Validation finale</AlertTitle>
            <AlertDescription className="text-yellow-700">
              {completedSteps.length < workflowSteps.filter(s => s.required).length ? (
                `Veuillez compléter toutes les étapes requises avant de valider le projet.`
              ) : (
                `Toutes les étapes sont complètes. Vous pouvez maintenant créer le projet.`
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Workflow */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
          <ProjectCreationWorkflow
            mode="create"
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onStepValidation={handleStepValidation}
            onSubmit={handleFormSubmit}
            selectedMaterials={selectedMaterials}
            onMaterialsChange={setSelectedMaterials}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Navigation Help */}
        <div className="mt-4 text-sm text-muted-foreground text-center">
          <p>
            {currentStep < workflowSteps.length ? (
              `Étape ${currentStep} sur ${workflowSteps.length} - ${workflowSteps.find(s => s.number === currentStep)?.title}`
            ) : (
              `Toutes les étapes sont complètes - Prêt à créer le projet`
            )}
          </p>
        </div>
      </motion.div>
    </AppLayout>
  );
};

/**
 * Page exportée : le WorkflowProvider enveloppe l'écran de création afin que
 * toutes les étapes partagent le même contexte (mode="create" →
 * canManageSubObjects = false jusqu'à la persistance du projet).
 */
const ProjectCreatePage = () => (
  <WorkflowProvider mode="create">
    <ProjectCreate />
  </WorkflowProvider>
);

export default ProjectCreatePage;
