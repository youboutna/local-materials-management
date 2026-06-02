/**
 * useUnifiedProjectWorkflow - Unified hook for both project creation and editing
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
}

export interface SaveResult {
  success: boolean;
  message?: string;
  errors?: string[];
  warnings?: string[];
  projectId?: string;
}

export function useUnifiedProjectWorkflow(mode: 'creation' | 'edit', projectId?: string) {
  const queryClient = useQueryClient();
  
  const workflowService = new ProjectWorkflowService(
    RepositoryFactory.getProjectRepository(),
    RepositoryFactory.getPhaseRepository(),
    RepositoryFactory.getRiskRepository(),
    RepositoryFactory.getProjectStakeholderRepository()
  );

  const [workflowState, setWorkflowState] = useState<UnifiedWorkflowState>({
    mode,
    projectId,
    currentStep: 1,
    totalSteps: 8,
    isDirty: false,
    isValid: false,
    isLoading: false
  });

  const [formData, setFormData] = useState<ProjectWorkflowData | null>(null);
  const [originalData, setOriginalData] = useState<ProjectWorkflowData | null>(null);

  const { data: workflowSteps } = useQuery({
    queryKey: ['workflow-steps', mode],
    queryFn: () => mode === 'edit' ? workflowService.getEditWorkflowSteps() : workflowService.getWorkflowSteps(),
    staleTime: 60_000
  });

  const { data: loadedData, isLoading: dataLoading, error: dataError } = useQuery({
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
        toast({ title: "Étape sauvegardée", description: `L'étape ${variables.stepNumber} a été sauvegardée avec succès.` });
        if (result.projectId && !workflowState.projectId) {
          setWorkflowState(prev => ({ ...prev, projectId: result.projectId }));
        }
        setWorkflowState(prev => ({ ...prev, isDirty: false }));
        queryClient.invalidateQueries({ queryKey: ['project-workflow-data'] });
      } else {
        const msg = result.errors?.join(', ') || result.message || "Une erreur est survenue.";
        toast({ title: "Erreur de sauvegarde", description: msg, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de sauvegarde", description: error.message || "Une erreur est survenue.", variant: "destructive" });
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

  const saveCurrentStep = useCallback(async (stepNumber?: number) => {
    if (!formData) {
      toast({ title: "Erreur", description: "Aucune donnée à sauvegarder", variant: "destructive" });
      return { success: false, message: 'No data' } as SaveResult;
    }
    try {
      return await saveStepMutation.mutateAsync({
        data: formData,
        stepNumber: stepNumber ?? workflowState.currentStep,
      });
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
    error: dataError,
    updateFormData,
    nextStep,
    previousStep,
    saveCurrentStep,
    validateCurrentStep,
    workflowSteps,
    loadedData
  };
}
