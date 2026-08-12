/**
 * useUnifiedProjectWorkflow - Unified hook for both project creation and editing
 */

import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { ProjectWorkflowData } from '@/dtos/workflows/ProjectWorkflowDTOs';

export interface UnifiedWorkflowState {
  mode: 'creation' | 'edit';
  projectId?: string;
  currentStep: number;
  totalSteps: number;
  isDirty: boolean;
  isValid: boolean;
  isLoading: boolean;
  error?: string;
  lastSavedAt?: string;
  lastValidationErrors?: string[];
  /** Numéros d'étapes déjà complétées (1-indexé) */
  completedSteps: number[];
}

export interface SaveResult {
  success: boolean;
  message?: string;
  errors?: string[];
  warnings?: string[];
  projectId?: string;
}

/**
 * Skeleton de travail (mode création) — garantit que `formData` n'est jamais
 * null côté UI : sans lui, chaque `updateFormData` était ignoré et aucune
 * donnée saisie n'atteignait le service (bug de persistance étapes 1→8).
 */
export function createEmptyProjectWorkflowData(): ProjectWorkflowData {
  return {
    currentStep: 1,
    isDraft: true,
    isComplete: false,
    projectData: {
      title: '',
      description: '',
      location: '',
      budget: 0,
      progress: 0,
      teamSize: 1,
    } as ProjectWorkflowData['projectData'],
    relatedData: {
      phases: [],
      milestones: [],
      dqeLines: [],
      risks: [],
      materials: [],
      stakeholders: [],
      tasks: [],
      inspections: [],
      strategyLinks: [],
      budgetLinks: [],
    },
    metadata: {
      lastSavedAt: '',
      totalSteps: 8,
      completedSteps: 0,
      progressPercentage: 0,
    },
  };
}

export function useUnifiedProjectWorkflow(
  mode: 'creation' | 'edit',
  projectId?: string,
  initialData?: ProjectWorkflowData
) {
  const queryClient = useQueryClient();
  
  const workflowService = ProjectWorkflowService.default();

  const [workflowState, setWorkflowState] = useState<UnifiedWorkflowState>({
    mode,
    projectId,
    currentStep: 1,
    totalSteps: 8,
    isDirty: false,
    isValid: false,
    isLoading: false,
    lastSavedAt: undefined,
    lastValidationErrors: [],
    completedSteps: []
  });

  const [formData, setFormData] = useState<ProjectWorkflowData | null>(() =>
    mode === 'creation' ? (initialData ?? createEmptyProjectWorkflowData()) : (initialData ?? null)
  );
  const [originalData, setOriginalData] = useState<ProjectWorkflowData | null>(null);


  const { data: workflowSteps } = useQuery({
    queryKey: ['workflow-steps', mode],
    queryFn: () => mode === 'edit' ? workflowService.getEditWorkflowSteps() : workflowService.getWorkflowSteps(),
    staleTime: 60_000
  });

  const { data: loadedData, isLoading: dataLoading, error: dataError, refetch: refetchProjectData } = useQuery({
    queryKey: ['project-workflow-data', projectId],
    queryFn: async () => {
      if (mode === 'edit' && projectId) {
        return await workflowService.initializeEditWorkflow(projectId);
      }
      return null;
    },
    enabled: mode === 'edit' && !!projectId,
    staleTime: 60_000
  });

  useEffect(() => {
    if (loadedData && !formData) {
      // Direct assignment - no transformation needed
      setFormData(loadedData as unknown as ProjectWorkflowData);
      setOriginalData(loadedData as unknown as ProjectWorkflowData);
    }
  }, [loadedData, formData]);

  const saveStepMutation = useMutation({
    mutationFn: async (args: { data: ProjectWorkflowData; stepNumber: number }): Promise<SaveResult> => {
      const { data, stepNumber } = args;
      const ctx = workflowState.projectId
        ? { mode: 'edit' as const, projectId: workflowState.projectId }
        : { mode: 'creation' as const };
      return await workflowService.saveStep(stepNumber, data, ctx);
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        toast({ title: "Étape sauvegardée", description: `Étape ${variables.stepNumber} enregistrée.` });
        const now = new Date().toISOString();
        if (result.projectId && !workflowState.projectId) {
          setWorkflowState(prev => ({ ...prev, projectId: result.projectId, isDirty: false, lastSavedAt: now, lastValidationErrors: [] }));
        } else {
          setWorkflowState(prev => ({ ...prev, isDirty: false, lastSavedAt: now, lastValidationErrors: [] }));
        }
        // Also mirror the freshly-created projectId into formData so downstream
        // steps (e.g. StrategicLinkageStep) receive a real project reference.
        if (result.projectId) {
          const newProjectId = result.projectId;
          setFormData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              projectId: newProjectId,
              projectData: prev.projectData
                ? { ...prev.projectData, id: newProjectId }
                : prev.projectData,
            } as typeof prev;
          });
        }
        queryClient.invalidateQueries({ queryKey: ['project-workflow-data'] });
      } else {
        const errs = result.errors && result.errors.length > 0 ? result.errors : [result.message || "Une erreur est survenue."];
        setWorkflowState(prev => ({ ...prev, lastValidationErrors: errs }));
        toast({ title: "Erreur de sauvegarde", description: errs.join(', '), variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      const msg = error.message || "Une erreur est survenue.";
      setWorkflowState(prev => ({ ...prev, lastValidationErrors: [msg] }));
      toast({ title: "Erreur de sauvegarde", description: msg, variant: "destructive" });
    }
  });

  const validateStepMutation = useMutation({
    mutationFn: async (args: { data: ProjectWorkflowData; stepNumber: number }) => {
      return await workflowService.validateStep(args.stepNumber, args.data);
    },
    onError: (error: Error) => {
      console.error('Step validation failed:', error);
    }
  });

  const updateFormData = useCallback((updates: Partial<ProjectWorkflowData>) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newData = { ...prev, ...updates };
      setWorkflowState(prevState => ({ ...prevState, isDirty: true }));
      return newData;
    });
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setWorkflowState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    if (workflowState.currentStep < workflowState.totalSteps) {
      setWorkflowState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [workflowState.currentStep, workflowState.totalSteps]);

  const previousStep = useCallback(() => {
    if (workflowState.currentStep > 1) {
      setWorkflowState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [workflowState.currentStep]);

  const saveCurrentStep = useCallback(async (
    stepNumber?: number,
    dataOverride?: ProjectWorkflowData,
  ) => {
    const dataToSave = dataOverride ?? formData;
    if (!dataToSave) {
      toast({ title: "Erreur", description: "Aucune donnée à sauvegarder", variant: "destructive" });
      return { success: false, message: 'No data' } as SaveResult;
    }
    try {
      const step = stepNumber ?? workflowState.currentStep;
      const result = await saveStepMutation.mutateAsync({ data: dataToSave, stepNumber: step });
      if (result?.success) {
        setWorkflowState(prev => ({
          ...prev,
          completedSteps: prev.completedSteps.includes(step)
            ? prev.completedSteps
            : [...prev.completedSteps, step].sort((a, b) => a - b),
        }));
      }
      return result;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errMsg };
    }
  }, [formData, saveStepMutation, workflowState.currentStep]);

  const validateCurrentStep = useCallback(async (stepNumber?: number) => {
    if (!formData) return { isValid: false, errors: ['No data to validate'] };
    try {
      const validation = await validateStepMutation.mutateAsync({
        data: formData,
        stepNumber: stepNumber ?? workflowState.currentStep,
      });
      setWorkflowState(prev => ({ ...prev, isValid: validation.isValid }));
      return validation;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      return { isValid: false, errors: [errMsg] };
    }
  }, [formData, validateStepMutation, workflowState.currentStep]);

  const currentStepInfo = workflowSteps?.find(step => step.order === workflowState.currentStep);
  const isStepCompleted = currentStepInfo?.isCompleted || false;
  const progressPercentage = (workflowState.currentStep / workflowState.totalSteps) * 100;

  return {
    workflowState,
    formData,
    currentStepInfo,
    isStepCompleted,
    progressPercentage,
    isLoading: dataLoading || saveStepMutation.isPending || validateStepMutation.isPending,
    error: dataError instanceof Error ? dataError.message : (dataError ? String(dataError) : null),
    /** Recharge les données projet depuis la base (round-trip DB -> UI) */
    loadProjectData: async () => {
      const result = await refetchProjectData();
      if (result.data) {
        setFormData(result.data as unknown as ProjectWorkflowData);
        setOriginalData(result.data as unknown as ProjectWorkflowData);
      }
      return result.data as unknown as ProjectWorkflowData | null;
    },
    updateFormData,
    nextStep,
    previousStep,
    setCurrentStep,
    saveCurrentStep,
    validateCurrentStep,
    workflowSteps,
    loadedData
  };
}
