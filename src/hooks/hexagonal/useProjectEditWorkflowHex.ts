/**
 * useProjectEditWorkflowHex - Hook Hexagonal pour l'Édition de Projets
 * Pont intelligent entre l'UI et le service hexagonal d'édition
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { useState, useCallback, useMemo } from 'react';

// Import workflow DTOs
import { 
  ProjectWorkflowData,
  ValidationResult,
  SaveResult,
  WorkflowState,
  StepProgressDTO
} from '@/dtos/workflows/ProjectWorkflowDTOs';

// Import entity DTOs
import { ProjectDTO, ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';

import { ProgressCalculationHexService } from '@/application/services/ProgressCalculationHexService';
import { ProjectWorkflowService, type WorkflowResult } from '@/application/services/ProjectWorkflowService';

// Types d'erreur locaux
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_FOUND = 'NOT_FOUND'
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function useProjectEditWorkflowHex(projectId?: string) {
  const queryClient = useQueryClient();
  const projectWorkflowService = new ProjectWorkflowService(
    RepositoryFactory.getProjectRepository(),
    RepositoryFactory.getPhaseRepository(),
    RepositoryFactory.getRiskRepository(),
    RepositoryFactory.getProjectStakeholderRepository()
  );

  // Query pour initialiser le workflow d'édition
  const initializeWorkflowQuery = useQuery({
    queryKey: ['edit-workflow', projectId],
    queryFn: async (): Promise<WorkflowState | null> => {
      if (!projectId) return null;
      return await projectWorkflowService.initializeEditWorkflow(projectId);
    },
    enabled: !!projectId
  });

  // Mutation pour sauvegarder une étape
  const saveStepMutation = useMutation({
    mutationFn: ({ stepNumber, data, context }: { 
      stepNumber: number; 
      data: ProjectWorkflowData; 
      context: any 
    }): Promise<SaveResult & { projectId?: string }> => 
      projectWorkflowService.saveStep(stepNumber, data, context),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Étape sauvegardée",
          description: `L'étape a été sauvegardée avec succès.`,
          className: 'bg-green-100 border-green-300 text-green-800',
        });
        
        if (result.projectId) {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['project', result.projectId] });
          queryClient.invalidateQueries({ queryKey: ['edit-workflow', result.projectId] });
        }
      }
    },
    onError: (error) => {
      console.error('Edit step save failed:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: "destructive",
      });
    }
  });

  // Mutation pour valider une étape
  const validateStepMutation = useMutation({
    mutationFn: ({ stepNumber, data }: { 
      stepNumber: number; 
      data: Partial<ProjectWorkflowData>; 
    }) => 
      projectWorkflowService.validateStep(stepNumber, data),
    onError: (error) => {
      console.error('Step validation failed:', error);
      toast({
        title: "Erreur de validation",
        description: "Impossible de valider les données de l'étape",
        variant: "destructive",
      });
    }
  });

  // Mutation pour mettre à jour la progression
  const updateProgressMutation = useMutation({
    mutationFn: async ({ projectId, progress }: { projectId: string; progress: number }) => {
      await (projectWorkflowService as any).projectRepository.updateProgress(projectId, progress);
      return { success: true, projectId };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Progression mise à jour",
          description: "La progression du projet a été mise à jour avec succès.",
          className: 'bg-blue-100 border-blue-300 text-blue-800',
        });
        
        if (result.projectId) {
          queryClient.invalidateQueries({ queryKey: ['project', result.projectId] });
        }
      }
    },
    onError: (error) => {
      console.error('Progress update failed:', error);
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour la progression du projet",
        variant: "destructive",
      });
    }
  });

  // Mutation pour finaliser le workflow
  const completeWorkflowMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const result = await projectWorkflowService.completeWorkflow({ projectId });
      return result as { success: boolean; projectId?: string };
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Workflow terminé",
          description: "Toutes les modifications ont été sauvegardées.",
          className: 'bg-green-100 border-green-300 text-green-800',
        });
        
        if (result.projectId) {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['project', result.projectId] });
          queryClient.invalidateQueries({ queryKey: ['edit-workflow', result.projectId] });
        }
      }
    },
    onError: (error) => {
      console.error('Workflow completion failed:', error);
      toast({
        title: "Erreur de finalisation",
        description: "Impossible de finaliser le workflow d'édition",
        variant: "destructive",
      });
    }
  });

  // Fonction pour calculer la progression d'un projet
  const calculateProjectProgress = async (projectId: string): Promise<number> => {
    try {
      return await projectWorkflowService.calculateProjectProgress(projectId);
    } catch (error) {
      console.error('Progress calculation failed:', error);
      return 0;
    }
  };

  // Fonction pour valider une étape du workflow
  const validateWorkflowStep = async (stepNumber: number, stepData: Partial<ProjectWorkflowData>): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> => {
    try {
      const validation = await projectWorkflowService.validateStep(stepNumber, stepData);
      return {
        isValid: validation.isValid,
        errors: validation.errors || [],
        warnings: validation.warnings || []
      };
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'], warnings: [] };
    }
  };

  const getWorkflowStepStatus = (stepData: Partial<ProjectWorkflowData>, stepNumber: number): boolean => {
    const requiredFields = getRequiredFieldsForStep(stepNumber);
    return requiredFields.every(field => {
      const value = stepData[field as keyof ProjectWorkflowData];
      return value !== undefined && value !== null && value !== '';
    });
  };

  const getRequiredFieldsForStep = (stepNumber: number): (keyof ProjectWorkflowData)[] => {
    switch (stepNumber) {
      case 1: return ['projectData'];
      case 2: return ['relatedData'];
      case 3: return ['relatedData'];
      case 5: return ['relatedData'];
      default: return [];
    }
  };

  const detectChanges = (originalData: ProjectWorkflowData, currentData: Partial<ProjectWorkflowData>): string[] => {
    const changes: string[] = [];
    for (const key in currentData) {
      if (key in originalData && (originalData as any)[key] !== (currentData as any)[key]) {
        changes.push(key);
      }
    }
    return changes;
  };

  const getProjectData = async (pid: string): Promise<ProjectWorkflowData | null> => {
    try {
      const project = await (projectWorkflowService as any).projectRepository.findById(pid);
      if (!project) return null;
      
      return {
        projectId: project.id,
        currentStep: 1,
        isDraft: false,
        isComplete: (project as any).progress === 100,
        projectData: project as unknown as ProjectDTO,
        relatedData: {},
        metadata: {
          lastSavedAt: new Date().toISOString(),
          totalSteps: 10,
          completedSteps: Math.floor(((project as any).progress || 0) / 10),
          progressPercentage: (project as any).progress || 0
        }
      };
    } catch (error) {
      console.error('Failed to get project data:', error);
      return null;
    }
  };

  const updateProjectData = async (pid: string, data: Partial<ProjectWorkflowData>): Promise<SaveResult> => {
    try {
      await (projectWorkflowService as any).projectRepository.update(pid, data.projectData);
      return { success: true, data: data };
    } catch (error) {
      console.error('Failed to update project data:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  };

  const getChangeHistory = async (pid: string): Promise<Array<{ field: string; oldValue: unknown; newValue: unknown; timestamp: string }>> => {
    try {
      const project = await (projectWorkflowService as any).projectRepository.findById(pid);
      if (!project) return [];
      return [{
        field: 'last_updated',
        oldValue: (project as any).updatedAt || '',
        newValue: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }];
    } catch (error) {
      console.error('Failed to get change history:', error);
      return [];
    }
  };

  const validateStepData = async (stepNumber: number, data: Partial<ProjectWorkflowData>): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> => {
    try {
      const validation = await projectWorkflowService.validateStep(stepNumber, data);
      return {
        isValid: validation.isValid,
        errors: validation.errors || [],
        warnings: validation.warnings || []
      };
    } catch (error) {
      console.error('Failed to validate step data:', error);
      return { isValid: false, errors: ['Validation failed'], warnings: [] };
    }
  };

  const getWorkflowMetadata = (context?: any) => {
    if (!context) return null;
    return {
      projectId: context.projectId || projectId,
      currentStep: context.currentStep || 1,
      totalSteps: context.totalSteps || 10,
      isDraft: context.isDraft || false,
      isComplete: context.isComplete || false,
      lastSavedAt: context.lastSavedAt,
      modifiedFields: context.modifiedFields
    };
  };

  const resetWorkflow = async (pid: string) => {
    try {
      const context = await projectWorkflowService.initializeEditWorkflow(pid);
      return context;
    } catch (error) {
      console.error('Failed to reset workflow:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset workflow');
    }
  };

  const [formData, setFormData] = useState<ProjectDTO>({
    id: '',
    title: '',
    description: '',
    location: '',
    status: ProjectStatus.EN_ATTENTE,
    budget: 0,
    startDate: '',
    endDate: '',
    teamSize: 0,
    progress: 0,
    currency: 'MRU',
    createdAt: '',
    updatedAt: ''
  });
  
  const [phases, setPhases] = useState<PhaseDTO[]>([]);
  
  const updateFormData = useCallback((updates: Partial<ProjectDTO>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const progressService = useMemo(() => new ProgressCalculationHexService(), []);

  return {
    saveStep: saveStepMutation.mutate,
    validateStep: validateStepMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    completeWorkflow: completeWorkflowMutation.mutate,
    isSaving: saveStepMutation.isPending,
    isValidating: validateStepMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,
    isCompleting: completeWorkflowMutation.isPending,
    workflowContext: initializeWorkflowQuery.data,
    isLoadingContext: initializeWorkflowQuery.isLoading,
    calculateProjectProgress,
    validateWorkflowStep,
    getWorkflowStepStatus,
    detectChanges,
    getProjectData,
    updateProjectData,
    validateStepData,
    getWorkflowMetadata,
    resetWorkflow,
    getChangeHistory,
    formData,
    phases,
    updateFormData,
    setPhases,
    progressService,
    saveError: saveStepMutation.error,
    validationError: validateStepMutation.error,
    progressError: updateProgressMutation.error,
    completionError: completeWorkflowMutation.error,
    refetchContext: initializeWorkflowQuery.refetch,
  };
}

// Hook spécialisé pour la gestion des étapes du workflow d'édition
export function useProjectEditWorkflowStepsHex(projectId?: string) {
  const { validateStep, isValidating, workflowContext } = useProjectEditWorkflowHex(projectId);
  
  const validateStepWithWarnings = async (stepNumber: number, stepData: Partial<ProjectWorkflowData>) => {
    if (!workflowContext) {
      return { isValid: false, errors: ['Workflow non initialisé'], warnings: [] as string[] };
    }
    
    try {
      const validation = await validateStep({ stepNumber, data: stepData } as any);
      return validation || { isValid: true, errors: [] as string[], warnings: [] as string[] };
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'], warnings: [] as string[] };
    }
  };
  
  return {
    validateStep: validateStepWithWarnings,
    isValidating,
    workflowContext
  };
}

// Hook pour la gestion de la progression en temps réel
export function useProjectEditProgressHex(projectId?: string) {
  const { calculateProjectProgress, updateProgress, isUpdatingProgress } = useProjectEditWorkflowHex(projectId);
  
  const progressQuery = useQuery({
    queryKey: ['project-edit-progress', projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      return await calculateProjectProgress(projectId);
    },
    refetchInterval: 30000
  });
  
  const updateProjectProgress = async (progress: number) => {
    if (!projectId) return;
    return await updateProgress({ projectId, progress });
  };
  
  return {
    progress: progressQuery.data || 0,
    isLoading: progressQuery.isLoading || isUpdatingProgress,
    updateProgress: updateProjectProgress,
    refetch: progressQuery.refetch
  };
}
