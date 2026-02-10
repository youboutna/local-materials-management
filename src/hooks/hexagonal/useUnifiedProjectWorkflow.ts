/**
 * useUnifiedProjectWorkflow - Unified hook for both project creation and editing
 * Uses ProjectWorkflowService as the central service for both workflows
 * Following hexagonal architecture and PROMPTS.md rules
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectWorkflowTransforms } from '@/dtos/transforms/ProjectWorkflowTransforms';

// Import centralized DTOs (following PROMPTS.md Rule #4: No type redefinition)
import { ProjectWorkflowData, StepRelatedDataDTO } from '@/dtos/workflows/ProjectWorkflowDTOs';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';

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

/**
 * Unified hook for both project creation and editing workflows
 */
export function useUnifiedProjectWorkflow(mode: 'creation' | 'edit', projectId?: string) {
  const queryClient = useQueryClient();
  
  // Initialize ProjectWorkflowService
  const workflowService = new ProjectWorkflowService(
    RepositoryFactory.getProjectRepository(),
    RepositoryFactory.getPhaseRepository(),
    RepositoryFactory.getRiskRepository(),
    RepositoryFactory.getProjectStakeholderRepository()
  );

  // Workflow state
  const [workflowState, setWorkflowState] = useState<UnifiedWorkflowState>({
    mode,
    projectId,
    currentStep: 1,
    totalSteps: 9,
    isDirty: false,
    isValid: false,
    isLoading: false
  });

  // Form data state - using centralized ProjectWorkflowData (following PROMPTS.md Rule #4)
  const [formData, setFormData] = useState<ProjectWorkflowData | null>(null);
  const [originalData, setOriginalData] = useState<ProjectWorkflowData | null>(null);

  // Get workflow steps
  const { data: workflowSteps } = useQuery({
    queryKey: ['workflow-steps', mode],
    queryFn: () => mode === 'edit' ? workflowService.getEditWorkflowSteps() : workflowService.getWorkflowSteps(),
    staleTime: 60_000
  });

  // Load existing project data for edit mode
  const { data: loadedData, isLoading: dataLoading, error: dataError } = useQuery({
    queryKey: ['project-workflow-data', projectId],
    queryFn: async () => {
      if (mode === 'edit' && projectId) {
        const context = await workflowService.initializeEditWorkflow(projectId);
        return context;
      }
      return null;
    },
    enabled: mode === 'edit' && !!projectId,
    staleTime: 60_000
  });

  // Initialize form data when data loads
  useEffect(() => {
    if (loadedData && !formData) {
      const transformedData = ProjectWorkflowTransforms.fromDTOToUI(loadedData);
      setFormData(transformedData);
      setOriginalData(transformedData);
    }
  }, [loadedData, formData]);

  // Save workflow step mutation
  const saveStepMutation = useMutation({
    mutationFn: async (stepData: ProjectWorkflowData): Promise<SaveResult> => {
      if (!workflowState.projectId && mode === 'creation') {
        // Creation mode - save new project
        const result = await workflowService.saveStep(workflowState.currentStep, stepData, { mode: 'creation' });
        return result;
      } else if (workflowState.projectId) {
        // Edit mode - update existing project
        const result = await workflowService.saveStep(workflowState.currentStep, stepData, { 
          mode: 'edit', 
          projectId: workflowState.projectId 
        });
        return result;
      }
      throw new Error('Invalid workflow state');
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Étape sauvegardée",
          description: `L'étape ${workflowState.currentStep} a été sauvegardée avec succès.`,
        });
        
        // Update project ID if newly created
        if (result.projectId && !workflowState.projectId) {
          setWorkflowState(prev => ({ ...prev, projectId: result.projectId }));
        }
        
        // Mark as not dirty
        setWorkflowState(prev => ({ ...prev, isDirty: false }));
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['project-workflow-data'] });
      } else {
        toast({
          title: "Erreur de sauvegarde",
          description: result.message || "Une erreur est survenue lors de la sauvegarde.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  });

  // Validate step mutation
  const validateStepMutation = useMutation({
    mutationFn: async (stepData: ProjectWorkflowData) => {
      return await workflowService.validateStep(workflowState.currentStep, stepData, {
        mode,
        projectId: workflowState.projectId
      });
    },
    onError: (error) => {
      console.error('Step validation failed:', error);
    }
  });

  // Update form data
  const updateFormData = useCallback((updates: Partial<ProjectWorkflowData>) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newData = { ...prev, ...updates };
      setWorkflowState(prevState => ({ ...prevState, isDirty: true }));
      return newData;
    });
  }, []);

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (workflowState.currentStep < workflowState.totalSteps) {
      setWorkflowState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [workflowState.currentStep, workflowState.totalSteps]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (workflowState.currentStep > 1) {
      setWorkflowState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [workflowState.currentStep]);

  // Save current step
  const saveCurrentStep = useCallback(async () => {
    if (!formData) {
      toast({
        title: "Erreur",
        description: "Aucune donnée à sauvegarder",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await saveStepMutation.mutateAsync(formData);
      return result;
    } catch (error) {
      console.error('Save failed:', error);
      return { success: false, message: error.message };
    }
  }, [formData, saveStepMutation]);

  // Validate current step
  const validateCurrentStep = useCallback(async () => {
    if (!formData) return { isValid: false, errors: ['No data to validate'] };

    try {
      const validation = await validateStepMutation.mutateAsync(formData);
      setWorkflowState(prev => ({ ...prev, isValid: validation.isValid }));
      return validation;
    } catch (error) {
      console.error('Validation failed:', error);
      return { isValid: false, errors: [error.message] };
    }
  }, [formData, validateStepMutation]);

  // Get current step info
  const currentStepInfo = workflowSteps?.find(step => step.order === workflowState.currentStep);

  // Check if step is completed
  const isStepCompleted = currentStepInfo?.isCompleted || false;

  // Get progress percentage
  const progressPercentage = (workflowState.currentStep / workflowState.totalSteps) * 100;

  return {
    // State
    workflowState,
    formData,
    currentStepInfo,
    isStepCompleted,
    progressPercentage,
    
    // Loading states
    isLoading: dataLoading || saveStepMutation.isPending || validateStepMutation.isPending,
    error: dataError,
    
    // Actions
    updateFormData,
    nextStep,
    previousStep,
    saveCurrentStep,
    validateCurrentStep,
    
    // Data
    workflowSteps,
    loadedData
  };
}
