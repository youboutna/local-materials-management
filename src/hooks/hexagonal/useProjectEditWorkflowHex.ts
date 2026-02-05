/**
 * useProjectEditWorkflowHex - Hook Hexagonal pour l'Édition de Projets
 * Pont intelligent entre l'UI et le service hexagonal d'édition
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { useState, useCallback, useMemo } from 'react';

// Import workflow DTOs (following "similitude des voisins le plus proche")
import { 
  ProjectWorkflowData,
  StepRelatedDataDTO,
  WorkflowMetadataDTO,
  ValidationResult,
  SaveResult,
  SaveContextDTO,
  WorkflowStep,
  WorkflowTransition,
  WorkflowState,
  ProjectCreationWorkflowDTO,
  ProjectValidationDTO,
  StepProgressDTO
} from '@/dtos/workflows/ProjectWorkflowDTOs';
import { PhaseWorkflowDTO } from '@/dtos/workflows/PhaseWorkflowDTO';

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO, ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { TaskDTO } from '@/dtos/entities/TaskDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { StakeholderDTO } from '@/dtos/entities/StakeholderDTO';

import { PhaseDTO, ProgressCalculationHexService } from '@/application/services/ProgressCalculationHexService';
import { ProjectWorkflowService, type EditWorkflowContext, type EditWorkflowResult } from '@/application/services/ProjectWorkflowService';

// Types locaux pour compatibilité
type ProjectEditWorkflowData = ProjectWorkflowData;

// Types d'erreur locaux pour éviter les dépendances
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
    RepositoryFactory.getStakeholderRepository()
  );

  // Query pour initialiser le workflow d'édition
  const initializeWorkflowQuery = useQuery({
    queryKey: ['edit-workflow', projectId],
    queryFn: async (): Promise<EditWorkflowContext | null> => {
      if (!projectId) return null;
      return await projectWorkflowService.initializeEditWorkflow(projectId);
    },
    enabled: !!projectId
  });

  // Mutation pour sauvegarder une étape
  const saveStepMutation = useMutation({
    mutationFn: ({ stepNumber, data, context }: { 
      stepNumber: number; 
      data: Partial<ProjectWorkflowData>; 
      context: EditWorkflowContext 
    }): Promise<SaveResult> => 
      projectWorkflowService.saveStep(stepNumber, data, context),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Étape sauvegardée",
          description: `L'étape ${result.stepCompleted} a été sauvegardée avec succès.`,
          className: 'bg-green-100 border-green-300 text-green-800',
        });
        
        // Invalider les queries liées au projet
        if (result.projectId) {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['project', result.projectId] });
          queryClient.invalidateQueries({ queryKey: ['edit-workflow', result.projectId] });
        }
      }
    },
    onError: (error) => {
      console.error('Edit step save failed:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la sauvegarde';
      
      if (error instanceof AppError) {
        switch (error.code) {
          case ErrorCode.VALIDATION_ERROR:
            errorMessage = 'Les données sont invalides. Veuillez vérifier tous les champs obligatoires.';
            break;
          case ErrorCode.DATABASE_ERROR:
            errorMessage = 'Erreur de base de données. Veuillez réessayer plus tard.';
            break;
          case ErrorCode.NOT_FOUND:
            errorMessage = 'Projet non trouvé.';
            break;
          case ErrorCode.INTERNAL_ERROR:
            errorMessage = 'Erreur interne du serveur. Veuillez contacter l\'administrateur.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erreur de sauvegarde",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Mutation pour valider une étape
  const validateStepMutation = useMutation({
    mutationFn: ({ stepNumber, data, context }: { 
      stepNumber: number; 
      data: Partial<ProjectWorkflowData>; 
      context: EditWorkflowContext 
    }) => 
      projectWorkflowService.validateStep(stepNumber, data, context),
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
    mutationFn: ({ projectId, progress }: { projectId: string; progress: number }) =>
      projectWorkflowService.updateProjectProgress(projectId, progress),
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
    mutationFn: (projectId: string) =>
      projectWorkflowService.completeEditWorkflow(projectId),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Workflow terminé",
          description: "Toutes les modifications ont été sauvegardées et le projet est maintenant à jour.",
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

  // Query pour obtenir les analytics du projet
  const projectAnalyticsQuery = useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      return await projectWorkflowService.getProjectAnalytics(projectId);
    },
    enabled: !!projectId
  });

  // Fonction pour calculer la progression d'un projet
  const calculateProjectProgress = async (projectId: string): Promise<number> => {
    try {
      const progress = await projectWorkflowService.calculateProjectProgress(projectId);
      return progress;
    } catch (error) {
      console.error('Progress calculation failed:', error);
      return 0;
    }
  };

  // Fonction pour valider une étape du workflow
  const validateWorkflowStep = async (stepNumber: number, stepData: Partial<ProjectWorkflowData>, context: EditWorkflowContext): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> => {
    try {
      const validation = await projectWorkflowService.validateStep(stepNumber, stepData, context);
      return validation;
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'], warnings: [] };
    }
  };

  // État du workflow
  const getWorkflowStepStatus = (stepData: Partial<ProjectWorkflowData>, stepNumber: number): boolean => {
    const requiredFields = getRequiredFieldsForStep(stepNumber);
    
    return requiredFields.every(field => {
      const value = stepData[field as keyof ProjectWorkflowData];
      return value !== undefined && value !== null && value !== '';
    });
  };

  // Fonction utilitaire pour obtenir les champs requis par étape
  const getRequiredFieldsForStep = (stepNumber: number): (keyof ProjectWorkflowData)[] => {
    switch (stepNumber) {
      case 1: // Informations du projet
        return ['projectData'];
      case 2: // Parties prenantes
        return ['relatedData'];
      case 3: // Phases
        return ['relatedData'];
      case 4: // Matériaux
        return []; // Optionnel
      case 5: // Risques
        return ['relatedData'];
      case 6: // Garanties bancaires
        return []; // Optionnel
      case 7: // Assurances
        return []; // Optionnel
      case 8: // Documents
        return []; // Optionnel
      case 9: // Suivi de progression
        return []; // Optionnel
      case 10: // Finalisation
        return []; // Validation finale
      default:
        return [];
    }
  };

  // Fonction pour détecter les changements
  const detectChanges = (originalData: ProjectWorkflowData, currentData: Partial<ProjectWorkflowData>): string[] => {
    const changes: string[] = [];
    
    for (const key in currentData) {
      if (key in originalData && originalData[key as keyof ProjectWorkflowData] !== currentData[key]) {
        changes.push(key);
      }
    }
    
    return changes;
  };

  // Fonction pour obtenir les données du projet
  const getProjectData = async (projectId: string): Promise<ProjectWorkflowData | null> => {
    try {
      const project = await (projectWorkflowService as any).projectService.getProjectById(projectId);
      if (!project) return null;
      
      // Map project to workflow data format using transformers
      const workflowData = {
        projectId: project.id,
        currentStep: 1,
        isDraft: false,
        isComplete: project.progress === 100,
        projectData: project as ProjectDTO,
        relatedData: {
          phases: project.phases || [],
          risks: project.risks || [],
          materials: project.materials || [],
          stakeholders: project.stakeholders || [],
          tasks: project.tasks || [],
          inspections: project.inspections || []
        },
        metadata: {
          lastSavedAt: project.updatedAt || new Date().toISOString(),
          totalSteps: 10,
          completedSteps: Math.floor((project.progress || 0) / 10), // Approximate
          progressPercentage: project.progress || 0
        }
      };
      return workflowData as ProjectWorkflowData;
    } catch (error) {
      console.error('Failed to get project data:', error);
      return null;
    }
  };

  // Fonction pour mettre à jour les données du projet
  const updateProjectData = async (projectId: string, data: Partial<ProjectWorkflowData>): Promise<SaveResult> => {
    try {
      // Update project using unified ProjectService
      await (projectWorkflowService as { projectService: { updateProject: (id: string, data: ProjectDTO) => Promise<void> } }).projectService.updateProject(projectId, data.projectData as ProjectDTO);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Failed to update project data:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  };

  // Fonction pour obtenir l'historique des modifications
  const getChangeHistory = async (projectId: string): Promise<Array<{ field: string; oldValue: unknown; newValue: unknown; timestamp: string }>> => {
    try {
      // Simulate change history - in real implementation this would come from audit logs
      const project = await (projectWorkflowService as { projectService: { getProjectById: (id: string) => Promise<ProjectDTO | null> } }).projectService.getProjectById(projectId);
      if (!project) return [];
      
      // Return mock change history for now
      return [
        {
          field: 'last_updated',
          oldValue: (project as { updatedAt?: string }).updatedAt || '',
          newValue: new Date().toISOString(),
          timestamp: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Failed to get change history:', error);
      return [];
    }
  };

  // Fonction pour valider les données d'une étape
  const validateStepData = async (stepNumber: number, data: Partial<ProjectWorkflowData>): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> => {
    try {
      const validation = await projectWorkflowService.validateStep(stepNumber, data, {
        projectId: '',
        currentStep: stepNumber,
        totalSteps: 10,
        isDraft: true,
        isComplete: false
      });
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

  // Fonction pour obtenir les métadonnées du workflow
  const getWorkflowMetadata = (context?: EditWorkflowContext) => {
    if (!context) return null;
    
    return {
      projectId: context.projectId,
      currentStep: context.currentStep,
      totalSteps: context.totalSteps,
      isDraft: context.isDraft,
      isComplete: context.isComplete,
      lastSavedAt: context.lastSavedAt,
      modifiedFields: context.modifiedFields
    };
  };

  // Fonction pour réinitialiser le workflow
  const resetWorkflow = async (projectId: string): Promise<EditWorkflowContext> => {
    try {
      const context = await projectWorkflowService.initializeEditWorkflow(projectId);
      return context;
    } catch (error) {
      console.error('Failed to reset workflow:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset workflow');
    }
  };

  const [formData, setFormData] = useState<ProjectDTO>({
    title: '',
    description: '',
    location: '',
    status: 'enAttente',
    budget: 0,
    startDate: '',
    endDate: '',
    teamSize: 0,
    progress: 0
  });
  
  const [phases, setPhases] = useState<PhaseDTO[]>([]);
  
  const updateFormData = useCallback((updates: Partial<ProjectDTO>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const progressService = useMemo(() => new ProgressCalculationHexService(), []);

  return {
    // Mutations
    saveStep: saveStepMutation.mutate,
    validateStep: validateStepMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    completeWorkflow: completeWorkflowMutation.mutate,
    
    // États
    isSaving: saveStepMutation.isPending,
    isValidating: validateStepMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,
    isCompleting: completeWorkflowMutation.isPending,
    
    // Queries
    workflowContext: initializeWorkflowQuery.data,
    projectAnalytics: projectAnalyticsQuery.data,
    isLoadingContext: initializeWorkflowQuery.isLoading,
    isLoadingAnalytics: projectAnalyticsQuery.isLoading,
    
    // Utilitaires
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
    
    // Form state management
    formData,
    phases,
    updateFormData,
    setPhases,
    
    // Services
    progressService,
    
    // Erreurs
    saveError: saveStepMutation.error,
    validationError: validateStepMutation.error,
    progressError: updateProgressMutation.error,
    completionError: completeWorkflowMutation.error,
    
    // Refetch
    refetchContext: initializeWorkflowQuery.refetch,
    refetchAnalytics: projectAnalyticsQuery.refetch
  };
}

// Hook spécialisé pour la gestion des étapes du workflow d'édition
export function useProjectEditWorkflowStepsHex(projectId?: string) {
  const { validateStep, isValidating, workflowContext } = useProjectEditWorkflowHex(projectId);
  
  const validateStepWithWarnings = async (stepNumber: number, stepData: Partial<ProjectWorkflowData>) => {
    if (!workflowContext) {
      return { isValid: false, errors: ['Workflow non initialisé'], warnings: [] };
    }
    
    try {
      const validation = await validateStep({ stepNumber, data: stepData, context: workflowContext });
      return validation;
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'], warnings: [] };
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
    refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
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
