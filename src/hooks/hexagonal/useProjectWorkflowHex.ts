/**
 * Hook: useProjectWorkflowHex
 * Hook hexagonal pour la gestion des workflows de projet avec sauvegarde partielle
 * Supporte ProjectCreationWorkflow et EnhancedProjectEditForm
 * 
 * Flow: UI Form → Hook → Transformer → Service → Repository → Adapter → Database
 */

import { createProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { ProjectWorkflowTransforms } from '@/dtos/transforms/ProjectWorkflowTransforms';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Import workflow DTOs
import {
    ProjectWorkflowData,
    ValidationResult,
    WorkflowMetricsDTO
} from '@/dtos/workflows/ProjectWorkflowDTOs';

// Import entity DTOs
import { CreateProjectDTO, ProjectDTO, UpdateProjectDTO } from '@/dtos/entities/ProjectDTO';
import { getWorkflowService } from '@/application/services/WorkflowService';

// Workflow save result type
interface WorkflowSaveResult {
  success: boolean;
  projectId: string;
  stepNumber: number;
  data: ProjectWorkflowData;
}

// Fonctions utilitaires pour le calcul de progression
export function determineCurrentStep(formData: ProjectDTO): number {
  if (!formData.title || !formData.description) return 1;
  if (!formData.location) return 3;
  if (!formData.status) return 7;
  return 1;
}

export function calculateCompletedSteps(formData: Record<string, unknown>, phasesData: unknown[]): number {
  let completed = 0;
  
  if (formData.title && formData.description) completed++;
  if (formData.stakeholders && Array.isArray(formData.stakeholders) && formData.stakeholders.length > 0) completed++;
  if (formData.address) completed++;
  if (phasesData && Array.isArray(phasesData) && phasesData.length > 0) completed++;
  if (formData.risks && Array.isArray(formData.risks) && formData.risks.length > 0) completed++;
  if (formData.compliance && Array.isArray(formData.compliance) && formData.compliance.length > 0) completed++;
  if (formData.reception_status) completed++;
  
  return completed;
}

export function calculateProgressPercentage(formData: Record<string, unknown>, phasesData: unknown[]): number {
  const totalSteps = 7;
  const completedSteps = calculateCompletedSteps(formData, phasesData);
  return Math.round((completedSteps / totalSteps) * 100);
}

export function useProjectWorkflowHex(projectId?: string) {
  const queryClient = useQueryClient();
  
  // Create service instance with repositories
  const getWorkflowService = () => {
    return createProjectWorkflowService();
  };

  // =================== STEP 1: UI Form → CreateDTO (via Transformer) ===================
  
  /**
   * Transform form data to CreateProjectDTO
   * Flow: UI Form → Transformer.formToCreateRequest → CreateProjectDTO
   */
  const prepareCreateRequest = (formData: Record<string, unknown>): CreateProjectDTO => {
    return ProjectWorkflowTransforms.formToCreateRequest(formData);
  };

  /**
   * Transform form data to UpdateProjectDTO
   * Flow: UI Form → Transformer.formToUpdateRequest → UpdateProjectDTO
   */
  const prepareUpdateRequest = (formData: Record<string, unknown>): UpdateProjectDTO => {
    return ProjectWorkflowTransforms.formToUpdateRequest(formData);
  };

  // =================== STEP 2-8: Service Operations (via Transformer) ===================
  
  /**
   * Save workflow step - Complete hexagonal flow
   * Flow: 
   * 1. Hook receives formData
   * 2. Transformer.formToCreateRequest → CreateProjectDTO
   * 3. Service receives DTO and validates
   * 4. Repository saves via Adapter
   * 5. Adapter uses Transformer.toSupabase → snake_case
   * 6. Database INSERT/UPDATE
   * 7. Adapter uses Transformer.fromSupabase → Entity
   * 8. Service uses Transformer.toDTO → ProjectDTO
   * 9. Hook updates state
   * 10. UI renders updated data
   */
  const saveStepWithTransformer = async (data: ProjectWorkflowData): Promise<WorkflowSaveResult> => {
    const workflowService = getWorkflowService();
    
    // Transform workflow data to service format
    const serviceData = {
      project: {
        id: data.projectId,
        title: data.projectData.title,
        description: data.projectData.description,
        location: data.projectData.location,
        budget: data.projectData.budget,
        start_date: data.projectData.startDate,
        end_date: data.projectData.endDate,
        status: data.projectData.status
      },
      currentStep: data.currentStep,
      status: data.isDraft ? 'draft' : 'in_progress',
      mode: data.projectId ? 'edit' : 'create',
      metadata: data.metadata
    };

    // Call service to save workflow data
    const result = await workflowService.saveWorkflowData(serviceData as any);
    
    // Transform result back to ProjectWorkflowData
    return {
      success: true,
      projectId: (result as any).projectId || data.projectId || '',
      stepNumber: data.currentStep,
      data: {
        ...data,
        projectId: (result as any).projectId || data.projectId,
        metadata: {
          ...data.metadata,
          lastSavedAt: new Date().toISOString()
        }
      }
    };
  };

  /**
   * Complete workflow - Finalize project creation
   */
  const completeWorkflowWithTransformer = async (data: ProjectWorkflowData): Promise<WorkflowSaveResult> => {
    const workflowService = getWorkflowService();
    
    const serviceData = {
      project: {
        id: data.projectId,
        title: data.projectData.title,
        description: data.projectData.description,
        location: data.projectData.location,
        budget: data.projectData.budget,
        start_date: data.projectData.startDate,
        end_date: data.projectData.endDate,
        status: 'en cours'
      },
      currentStep: 7,
      status: 'completed',
      completedSteps: [1, 2, 3, 4, 5, 6, 7],
      mode: 'complete'
    };

    const result = await workflowService.completeWorkflow(serviceData as any);
    
    return {
      success: true,
      projectId: data.projectId || '',
      stepNumber: 7,
      data: {
        ...data,
        isComplete: true,
        isDraft: false,
        metadata: {
          ...data.metadata,
          completedSteps: 7,
          progressPercentage: 100
        }
      }
    };
  };

  // =================== React Query Mutations ===================

  const saveStepMutation = useMutation({
    mutationFn: saveStepWithTransformer,
    onSuccess: (result) => {
      const stepName = getStepName(result.stepNumber);
      
      toast({
        title: 'Étape sauvegardée',
        description: `L'étape "${stepName}" a été sauvegardée avec succès.`,
        className: 'bg-blue-100 border-blue-300 text-blue-800',
      });

      queryClient.invalidateQueries({ queryKey: ['project-workflow', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', result.projectId] });
    },

    onError: (error: unknown) => {
      toast({
        title: 'Erreur lors de la sauvegarde',
        description: error instanceof Error ? error.message : 'Une erreur est survenue.',
        variant: 'destructive',
      });
    }
  });

  const completeWorkflowMutation = useMutation({
    mutationFn: completeWorkflowWithTransformer,
    onSuccess: (result) => {
      toast({
        title: 'Projet finalisé',
        description: 'Le projet a été finalisé avec succès.',
        className: 'bg-green-100 border-green-300 text-green-800',
      });

      queryClient.invalidateQueries({ queryKey: ['project-workflow', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', result.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },

    onError: (error: unknown) => {
      toast({
        title: 'Erreur lors de la finalisation',
        description: error instanceof Error ? error.message : 'Une erreur est survenue.',
        variant: 'destructive',
      });
    }
  });

  // =================== Public API ===================

  const saveStep = (data: ProjectWorkflowData) => {
    return saveStepMutation.mutateAsync(data);
  };

  const completeWorkflow = (data: ProjectWorkflowData) => {
    return completeWorkflowMutation.mutateAsync(data);
  };

  const getStepName = (stepNumber: number): string => {
    const steps = [
      'Informations Générales',
      'Parties Prenantes',
      'Localisation',
      'Planification & Phases',
      'Analyse des Risques',
      'Conformité',
      'Validation & Clôture'
    ];
    return steps[stepNumber - 1] || `Étape ${stepNumber}`;
  };

  const canAccessStep = (currentStep: number, targetStep: number): boolean => {
    return targetStep <= currentStep + 1;
  };

  const getNextStep = (currentStep: number): number | null => {
    return currentStep < 7 ? currentStep + 1 : null;
  };

  const getPreviousStep = (currentStep: number): number | null => {
    return currentStep > 1 ? currentStep - 1 : null;
  };

  const getWorkflowProgress = (data: ProjectWorkflowData): number => {
    return data.metadata?.progressPercentage || 0;
  };

  const isStepCompleted = (stepNumber: number, data: ProjectWorkflowData): boolean => {
    return (data.metadata?.completedSteps || 0) >= stepNumber;
  };

  const canProceedToNext = (currentStep: number, data: ProjectWorkflowData): boolean => {
    return isStepCompleted(currentStep, data) && getNextStep(currentStep) !== null;
  };

  const isWorkflowComplete = (data: ProjectWorkflowData): boolean => {
    return data.isComplete || (data.metadata?.progressPercentage || 0) >= 100;
  };

  const isDraft = (data: ProjectWorkflowData): boolean => {
    return data.isDraft;
  };

  const validateCurrentStep = (data: ProjectWorkflowData): ValidationResult => {
    const errors: string[] = [];
    
    if (data.currentStep === 1) {
      if (!data.projectData.title) {
        errors.push('Le titre du projet est requis');
      }
      if (!data.projectData.description) {
        errors.push('La description du projet est requise');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const calculateDatesFromDuration = (durationDays: number, startDate?: string): { startDate: string; endDate: string } => {
    const start = new Date(startDate || new Date());
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  };

  const getStepProgress = (steps: Array<{ isCompleted: () => boolean }>, formData: Record<string, unknown>): number => {
    const completedCount = steps.filter((step) => step.isCompleted()).length;
    return (completedCount / steps.length) * 100;
  };

  // =================== Transform helpers for UI ===================
  
  /**
   * Transform ProjectWorkflowData to UI state
   */
  const toUIState = (data: ProjectWorkflowData): Record<string, unknown> => {
    const entity = ProjectWorkflowTransforms.fromDTO(data);
    return ProjectWorkflowTransforms.toUI(entity);
  };

  /**
   * Get workflow metrics
   */
  const getWorkflowMetrics = (data: ProjectWorkflowData): WorkflowMetricsDTO => {
    const entity = ProjectWorkflowTransforms.fromDTO(data);
    return ProjectWorkflowTransforms.toWorkflowMetrics(entity);
  };

  return {
    // Data
    workflowData: null,
    isLoading: false,
    error: null,

    // Mutations
    saveStep,
    completeWorkflow,

    // States
    isSaving: saveStepMutation.isPending || completeWorkflowMutation.isPending,
    isCompleting: completeWorkflowMutation.isPending,

    // Errors
    saveError: saveStepMutation.error,
    completeError: completeWorkflowMutation.error,

    // Transformer methods (exposed for UI layer)
    prepareCreateRequest,
    prepareUpdateRequest,
    toUIState,
    getWorkflowMetrics,

    // Utilities
    getStepName,
    canAccessStep,
    getNextStep,
    getPreviousStep,
    getWorkflowProgress,
    isStepCompleted,
    canProceedToNext,
    isWorkflowComplete,
    isDraft,
    validateCurrentStep,
    calculateDatesFromDuration,
    getStepProgress,
  };
}
