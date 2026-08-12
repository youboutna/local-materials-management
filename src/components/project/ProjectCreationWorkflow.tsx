import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Building,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CircleDashed,
    Clock,
    FileCheck,
    Layers,
    MapPin,
    Save,
    Target,
    Users,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
// (uuid removed — IDs are generated DB-side via `gen_random_uuid()`)

// Import step components
import GeoZoneEditor from "@/components/gis/GeoZoneEditor";
import type { InterventionZoneDTO } from "@/dtos/entities/InterventionZoneDTO";
import ConstructionPhaseManager from "./ConstructionPhaseManager";
import QuantityTakeoffs from "./QuantityTakeoffs";
import EnhancedComplianceStep from "./steps/EnhancedComplianceStep";
import RiskAnalysisStep from "./steps/RiskAnalysisStep";
import StakeholdersTeamStep from "./steps/StakeholdersTeamStep";

// Import unified workflow hook
import { useUnifiedProjectWorkflow } from "../../hooks/hexagonal/useUnifiedProjectWorkflow";
import { useWorkflowContext } from "@/contexts/ProjectWorkflowContext";

// Import ProjectWorkflowService and RepositoryFactory

// Import workflow DTOs
import { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";

// Import entity DTOs (following PROMPTS.md Rule #4: No type redefinition)
import { ProjectStatus } from '@/dtos/entities/ProjectDTO';
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
  /** Étape courante pilotée par la page (0-indexée) */
  currentStep?: number;
  /** Notifie la page du changement d'étape (0-indexé) */
  onStepChange?: (step: number) => void;
  /** Notifie la page du résultat de validation d'une étape */
  onStepValidation?: (step: number, isValid: boolean) => void;
  /** Soumission en cours pilotée par la page */
  isSubmitting?: boolean;
}

const ProjectCreationWorkflow: React.FC<ProjectCreationWorkflowProps> = ({
  onSubmit,
  selectedMaterials,
  onMaterialsChange,
  initialData,
  mode = "create",
  projectId,
  currentStep: controlledStep,
  onStepChange,
  onStepValidation,
  isSubmitting,
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
    setCurrentStep,
    saveCurrentStep,
    validateCurrentStep,
    workflowSteps
  } = useUnifiedProjectWorkflow(mode === "edit" ? "edit" : "creation", projectId);

  // 🎨 UI Layer - Only UI-specific state (Rule #5)
  // ⚠️ `controlledStep` (prop parent) est 1-indexé (Étape 1..8) alors que l'index
  // interne de rendu est 0-indexé. On convertit à la frontière pour que l'onglet
  // cliqué affiche bien le contenu correspondant.
  const [internalStep, setCurrentStepUi] = useState(
    controlledStep != null ? Math.max(0, controlledStep - 1) : 0
  );
  const currentStep = controlledStep != null ? Math.max(0, controlledStep - 1) : internalStep;

  // Navigation unique : met à jour l'état interne ET remonte au parent (1-indexé)
  const goToStep = useCallback(
    (idx: number) => {
      const next = Math.min(Math.max(0, idx), PROJECT_WORKFLOW_STEPS.length - 1);
      setCurrentStepUi(next);
      onStepChange?.(next + 1);
    },
    [onStepChange]
  );

  // Keep the application layer in sync with UI tab selection (1-indexed in hook).
  useEffect(() => {
    setCurrentStep(currentStep + 1);
  }, [currentStep, setCurrentStep]);


  // ============================================================
  // 🔌 Bridge Application Layer (useUnifiedProjectWorkflow) → WorkflowContext
  // Les étapes (EnhancedComplianceStep, …) consomment useWorkflowContext().
  // On y réplique projectData / relatedData / projectId / step / persistance.
  // ============================================================
  const {
    setProjectData: ctxSetProjectData,
    setRelatedData: ctxSetRelatedData,
    setProjectId: ctxSetProjectId,
    setPersisted: ctxSetPersisted,
    setCurrentStep: ctxSetCurrentStep,
    setMode: ctxSetMode,
  } = useWorkflowContext();

  useEffect(() => {
    ctxSetMode(mode === "edit" ? "edit" : "create");
  }, [mode, ctxSetMode]);

  useEffect(() => {
    const pd = formData?.projectData;
    if (pd) ctxSetProjectData(pd as never);
  }, [formData?.projectData, ctxSetProjectData]);

  useEffect(() => {
    const rd = formData?.relatedData;
    if (rd) ctxSetRelatedData(rd as never);
  }, [formData?.relatedData, ctxSetRelatedData]);

  useEffect(() => {
    const resolvedId = projectId || formData?.projectId || formData?.projectData?.id;
    if (resolvedId) {
      ctxSetProjectId(resolvedId as string);
      ctxSetPersisted(true);
    }
  }, [projectId, formData?.projectId, formData?.projectData?.id, ctxSetProjectId, ctxSetPersisted]);

  useEffect(() => {
    ctxSetCurrentStep(currentStep + 1);
  }, [currentStep, ctxSetCurrentStep]);


  // 🎨 UI Layer - Use unified workflow data (Rule #5: UI Layer Separation)
  const projectData = formData?.projectData;
  const relatedData = formData?.relatedData;

  // 🎨 UI Layer - Use unified workflow validation (Rule #5 compliant)
  const validateStepData = useCallback(async (): Promise<{ isValid: boolean; errors: string[] }> => {
    if (!formData) return { isValid: false, errors: ['No form data available'] };
    const validation = await validateCurrentStep(currentStep + 1);
    onStepValidation?.(currentStep, validation.isValid);
    return { isValid: validation.isValid, errors: validation.errors };
  }, [formData, validateCurrentStep, currentStep, onStepValidation]);

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
  // Toasts are owned by the mutation (useUnifiedProjectWorkflow). We only surface
  // a single "validation" toast here to avoid duplicate notifications.
  const saveAndNextStep = async () => {
    if (!canProceedNext()) {
      toast({
        title: "Étape incomplète",
        description: "Veuillez compléter les champs requis avant de continuer.",
        variant: "destructive",
      });
      return;
    }
    const result = await saveCurrentStep(currentStep + 1);
    if (!result || !result.success) {
      // Mutation already emitted a destructive toast — just stop here.
      return;
    }
    setCurrentStepUi((prev) => Math.min(prev + 1, steps.length - 1));
  };

  // 🎨 UI Layer - Save all workflow data using unified workflow (Rule #5)
  const saveAllData = async (): Promise<boolean> => {
    if (!formData) {
      console.error('No form data available');
      return false;
    }
    const result = await saveCurrentStep(currentStep + 1);
    return !!result?.success;
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
    return step ? step.isCompleted() : false;
  };

  // 🎨 UX — Auto-save indicator
  const lastSavedLabel = useMemo(() => {
    const ts = (workflowState as any)?.lastSavedAt as string | undefined;
    if (!ts) return null;
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return null; }
  }, [workflowState]);

  const validationErrors: string[] = (workflowState as any)?.lastValidationErrors || [];

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
      updateFormData(finalWorkflowData);
      const result = await saveCurrentStep(
        steps.length,
        finalWorkflowData as ProjectWorkflowData,
      );
      
      if (!result || !result.success) {
        throw new Error((result as any)?.errors?.join(', ') || 'Failed to complete project creation');
      }
      
      toast({
        title: "Projet créé avec succès",
        description: "Le projet a été créé et toutes les étapes sont complétées",
      });
      
      // Call the onSubmit prop with the complete workflow data — parent (ProjectCreate/Edit)
      // handles SPA navigation via react-router (no full page reload).
      onSubmit(finalWorkflowData as ProjectWorkflowData);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Erreur de création",
        description: error instanceof Error ? error.message : "Impossible de créer le projet",
        variant: "destructive"
      });
    }
  };

  // ⏳ Mode édition : ne pas monter les étapes avant l'hydratation, sinon les
  // états locaux des étapes (parties prenantes, phases…) s'initialisent à vide.
  if (mode === "edit" && !formData) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="h-1.5 w-full animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <p className="text-xs text-muted-foreground">Chargement du projet…</p>
      </div>
    );
  }

  return (

    <div className="space-y-3">
      {/* Compact progress header + auto-save indicator */}
      <div className="flex items-center gap-3 px-1">
        <Progress value={getStepProgress()} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Étape {currentStep + 1} / {steps.length}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap" aria-live="polite">
          {isLoading ? (
            <>
              <Clock className="h-3 w-3 animate-pulse" />
              Sauvegarde…
            </>
          ) : workflowState?.isDirty ? (
            <>
              <CircleDashed className="h-3 w-3 text-amber-500" />
              Modifications non sauvegardées
            </>
          ) : lastSavedLabel ? (
            <>
              <CheckCircle className="h-3 w-3 text-emerald-600" />
              Sauvegardé · {lastSavedLabel}
            </>
          ) : null}
        </span>
      </div>

      {/* Steps Navigation — badges with completion check */}
      <div className="grid grid-cols-8 gap-1.5">
        {steps.map((step, idx) => {
          const done = step.isCompleted();
          const active = currentStep === idx;
          return (
            <motion.button
              key={step.id}
              onClick={() => setCurrentStepUi(idx)}
              title={`${idx + 1}. ${step.title}${done ? ' ✓' : ''}`}
              aria-label={step.title}
              aria-current={active ? 'step' : undefined}
              className={cn(
                "relative p-2 rounded-md transition-all flex items-center justify-center",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : done
                    ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <step.icon className="h-4 w-4" />
              {done && !active && (
                <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-emerald-600 bg-background rounded-full" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Inline validation errors (mirrored from mutation result) */}
      {validationErrors.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <div className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Corrections requises
          </div>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {validationErrors.slice(0, 4).map((e, i) => (<li key={i}>{e}</li>))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{steps[currentStep]?.title}</CardTitle>
              <p className="text-xs text-muted-foreground truncate">
                {steps[currentStep]?.description}
              </p>
            </div>
            <Badge variant={canProceedNext() ? 'default' : 'secondary'} className="shrink-0">
              {canProceedNext() ? 'Complète' : 'À compléter'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">


          {currentStep === 0 && (
            <ProjectInfoStep
              mode={mode}
              workflowData={formData}
              onStepComplete={(stepData) => {
                // Step 1 manages CRUD adapters; preserve user-entered status/progress
                const merged = {
                  ...formData?.projectData,
                  ...stepData.projectData,
                };
                updateFormData({
                  projectData: {
                    ...merged,
                    status: merged.status ?? ProjectStatus.EN_ATTENTE,
                    progress: merged.progress ?? 0,
                  },
                });
              }}
            />
          )}

        {currentStep === 1 && (
          <StakeholdersTeamStep
            workflowData={formData}
            mode={mode}
            onStepComplete={(stepData) => {
              const stakeholders = stepData.stakeholders || [];
              // Promotion auto du Chef de projet → projectManagerId (validation step 2)
              const pm = stakeholders.find((s: any) =>
                String(s?.position || s?.role || "").toLowerCase().includes("chef de projet")
              );
              updateFormData({
                relatedData: {
                  ...formData?.relatedData,
                  stakeholders: stakeholders as any,
                },
                projectData: {
                  ...(formData?.projectData || {} as any),
                  ...(pm?.employeeId ? { projectManagerId: pm.employeeId } : {}),
                } as any,
              });
            }}
          />
        )}



        {currentStep === 2 && (
          <GeoZoneEditor
            value={
              ((formData?.projectData as unknown as { interventionZones?: InterventionZoneDTO[] })
                ?.interventionZones) ?? []
            }
            onChange={(zones) => {
              const first = zones[0]?.coordinates?.[0];
              updateFormData({
                projectData: {
                  ...(formData?.projectData || {}),
                  interventionZones: zones,
                  ...(first ? { latitude: first.lat, longitude: first.lng } : {}),
                } as any,
              });
              console.info('[ProjectCreationWorkflow] zones updated', zones.length);
            }}
            title="Localisation & zones d'intervention"
            hint="Tracez une ou plusieurs zones (polygone, rectangle, cercle, point). Import GeoJSON supporté."
            defaultCenter={
              formData?.projectData?.latitude && formData?.projectData?.longitude
                ? [formData.projectData.latitude, formData.projectData.longitude]
                : undefined
            }
            height={520}
          />
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
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
            {(formData?.projectId || workflowState?.projectId) ? (
              <QuantityTakeoffs
                projectId={(formData?.projectId || workflowState?.projectId) as string}
              />
            ) : (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  Le calcul métré (simple & avancé) sera disponible après la sauvegarde de l'étape 1.
                </CardContent>
              </Card>
            )}
          </div>
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
               projectId={formData?.projectId || workflowState?.projectId || ''}
               initialStrategyLinks={(formData?.relatedData as any)?.strategyLinks || []}
               initialBudgetLinks={(formData?.relatedData as any)?.budgetLinks || []}
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
          onClick={() => setCurrentStepUi((prev) => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => saveCurrentStep(currentStep + 1)}
            disabled={isLoading || !workflowState?.isDirty}
            title={!workflowState?.isDirty ? 'Aucune modification à sauvegarder' : 'Sauvegarder l\'étape'}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Sauvegarde…' : 'Sauvegarder'}
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading
                ? mode === 'edit' ? 'Mise à jour…' : 'Création en cours…'
                : mode === 'edit' ? 'Finaliser les modifications' : 'Créer le projet'}
            </Button>
          ) : (
            <Button
              onClick={saveAndNextStep}
              disabled={isLoading || !canProceedNext()}
              title={!canProceedNext() ? 'Complétez les champs requis pour continuer' : 'Sauvegarder et passer à l\'étape suivante'}
            >
              {isLoading ? 'Sauvegarde…' : 'Suivant'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProjectCreationWorkflow;
