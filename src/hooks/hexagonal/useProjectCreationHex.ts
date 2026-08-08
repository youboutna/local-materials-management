/**
 * useProjectCreationHex - Hook Hexagonal pour la Création de Projets
 * Pont intelligent entre l'UI et le service hexagonal
 */

import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { ReferentialService } from '@/application/services/ReferentialService';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// Import workflow DTOs
import { ProjectWorkflowData } from '@/dtos/entities/TaskAssignmentDTO';;

// Import entity DTOs
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { CreateProjectDTO, ProjectDTO, ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';

// Types d'erreur locaux pour éviter les dépendances
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
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

export function useProjectCreationHex() {
  const queryClient = useQueryClient();
  const projectCreationService = ProjectWorkflowService.default();

  // Mutation pour créer un projet avec validation référentielle
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectWorkflowData): Promise<SaveResult> => {
      try {
        const referentialService = ReferentialService.getInstance();
        
        if (data.projectData.projectReference) {
          try {
            const referential = await referentialService.getReferential(data.projectData.projectReference as any);
            if (!referential) {
              console.warn(`⚠️ Referential ${data.projectData.projectReference} not found`);
              toast({
                title: "Attention",
                description: `Le référentiel ${data.projectData.projectReference} n'existe pas. Le projet sera créé avec les paramètres par défaut.`,
                variant: "default",
              });
            }
          } catch (error) {
            console.warn('⚠️ Referential validation failed:', error);
            toast({
              title: "Attention", 
              description: `Erreur de validation du référentiel. Le projet sera créé avec les paramètres par défaut.`,
              variant: "default",
            });
          }
        }

        return projectCreationService.saveStep(1, data, projectCreationService.initializeWorkflow('creation'));
      } catch (error) {
        console.error('❌ Project creation error:', error);
        throw error;
      }
    },
    onSuccess: (result: SaveResult & { projectId?: string }) => {
      if (result.success && result.projectId) {
        toast({
          title: "Projet créé avec succès",
          description: `Le projet a été créé et est maintenant disponible.`,
          className: 'bg-green-100 border-green-300 text-green-800',
        });
        
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['project', result.projectId] });
      }
    },
    onError: (error) => {
      console.error('Project creation failed:', error);
      
      let errorMessage = 'Une erreur est survenue lors de la création du projet';
      
      if (error instanceof AppError) {
        switch (error.code) {
          case ErrorCode.VALIDATION_ERROR:
            errorMessage = 'Les données du projet sont invalides.';
            break;
          case ErrorCode.DATABASE_ERROR:
            errorMessage = 'Erreur de base de données.';
            break;
          case ErrorCode.INTERNAL_ERROR:
            errorMessage = 'Erreur interne.';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erreur de création",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Query pour calculer la progression
  const calculateProgressQuery = useQuery({
    queryKey: ['project-progress', 'calculation'],
    queryFn: async () => 0,
    enabled: false
  });

  // Mutation pour valider le workflow
  const validateWorkflowMutation = useMutation({
    mutationFn: ({ stepNumber, data }: { stepNumber: number; data: Partial<ProjectWorkflowData> }) => 
      projectCreationService.validateStep(stepNumber, data),
    onError: (error) => {
      console.error('Workflow validation failed:', error);
      toast({
        title: "Erreur de validation",
        description: "Impossible de valider le workflow du projet",
        variant: "destructive",
      });
    }
  });

  const calculateProjectProgress = async (projectId: string): Promise<number> => {
    try {
      return await projectCreationService.calculateProjectProgress(projectId);
    } catch (error) {
      console.error('Progress calculation failed:', error);
      return 0;
    }
  };

  const validateWorkflowStep = async (stepNumber: number, stepData: Partial<ProjectWorkflowData>): Promise<{ isValid: boolean; errors: string[] }> => {
    try {
      return await projectCreationService.validateStep(stepNumber, stepData);
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'] };
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

  const prepareProjectData = (formData: Partial<CreateProjectDTO>, additionalData: {
    stakeholders?: EmployeeDTO[];
    risks?: RiskDTO[];
    compliance?: DocumentDTO[];
    phases?: PhaseDTO[];
  }): ProjectWorkflowData => {
    const projectDTO: CreateProjectDTO = {
      title: formData.title || '',
      description: formData.description || '',
      location: formData.location || '',
      status: (formData.status as any) || ProjectStatus.EN_ATTENTE,
      budget: formData.budget || 0,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate,
      teamSize: formData.teamSize || 0,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      projectManagerId: formData.projectManagerId,
      clientId: formData.clientId,
      workspaceId: formData.workspaceId,
      createdBy: formData.createdBy,
      projectReference: formData.projectReference,
      methodology: formData.methodology || 'hybrid',
      estimatedDurationDays: formData.estimatedDurationDays
    };

    return {
      projectId: undefined,
      currentStep: 1,
      isDraft: true,
      isComplete: false,
      projectData: projectDTO as unknown as ProjectDTO,
      relatedData: {
        phases: additionalData.phases || [],
        risks: additionalData.risks || [],
        stakeholders: (additionalData.stakeholders ?? []) as unknown as NonNullable<ProjectWorkflowData['relatedData']>['stakeholders'],
        compliance: additionalData.compliance ? {
          regulations: [],
          certifications: [],
          standards: [],
          status: 'pending',
          documents: additionalData.compliance
        } : undefined
      },
      metadata: {
        lastSavedAt: new Date().toISOString(),
        totalSteps: 9,
        completedSteps: 0,
        progressPercentage: 0
      }
    };
  };

  const getProjectData = async (projectId: string): Promise<ProjectWorkflowData | null> => {
    try {
      const project = await (projectCreationService as any).projectRepository.findById(projectId);
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
          totalSteps: 9,
          completedSteps: 0,
          progressPercentage: (project as any).progress || 0
        }
      };
    } catch (error) {
      console.error('Failed to get project data:', error);
      return null;
    }
  };

  const updateProjectData = async (projectId: string, data: Partial<ProjectWorkflowData>): Promise<SaveResult> => {
    try {
      await (projectCreationService as any).projectRepository.update(projectId, data.projectData);
      return { success: true, data: data };
    } catch (error) {
      console.error('Failed to update project data:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  };

  const validateStepData = async (stepNumber: number, data: Partial<ProjectWorkflowData>): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> => {
    try {
      const validation = await projectCreationService.validateStep(stepNumber, data);
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

  const getWorkflowMetadata = () => ({
    workflowType: 'creation',
    totalSteps: 9,
    currentStep: 1,
    isDraft: true,
    isComplete: false,
    lastSavedAt: new Date().toISOString()
  });

  const resetWorkflow = async () => {
    try {
      projectCreationService.initializeWorkflow('creation');
      return { workflowType: 'creation', currentStep: 1, totalSteps: 9 };
    } catch (error) {
      console.error('Failed to reset workflow:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset workflow');
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

  const getChangeHistory = async (projectId: string): Promise<Array<{ field: string; oldValue: unknown; newValue: unknown; timestamp: string }>> => {
    try {
      const project = await (projectCreationService as any).projectRepository.findById(projectId);
      if (!project) return [];
      return [{
        field: 'created_at',
        oldValue: '',
        newValue: (project as any).createdAt || new Date().toISOString(),
        timestamp: new Date().toISOString()
      }];
    } catch (error) {
      console.error('Failed to get change history:', error);
      return [];
    }
  };

  return {
    createProject: createProjectMutation.mutate,
    validateWorkflow: validateWorkflowMutation.mutate,
    isCreating: createProjectMutation.isPending,
    isValidating: validateWorkflowMutation.isPending,
    calculateProjectProgress,
    validateWorkflowStep,
    getWorkflowStepStatus,
    prepareProjectData,
    getProjectData,
    updateProjectData,
    validateStepData,
    getWorkflowMetadata,
    resetWorkflow,
    detectChanges,
    getChangeHistory,
    creationError: createProjectMutation.error,
    validationError: validateWorkflowMutation.error,
    progressQuery: calculateProgressQuery
  };
}

// Hook spécialisé pour la gestion des étapes du workflow
export function useProjectWorkflowHex() {
  const { validateWorkflow, isValidating, validateStepData, getWorkflowStepStatus, getWorkflowMetadata } = useProjectCreationHex();
  
  const validateStep = async (stepNumber: number, stepData: Partial<ProjectWorkflowData>) => {
    try {
      return await validateStepData(stepNumber, stepData);
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'], warnings: [] };
    }
  };
  
  return { validateStep, isValidating, getWorkflowStepStatus, getWorkflowMetadata };
}

// Hook pour la gestion de la progression en temps réel
export function useProjectProgressHex() {
  const { calculateProjectProgress, createProject, isCreating } = useProjectCreationHex();
  
  const progressQuery = useQuery({
    queryKey: ['project-progress'],
    queryFn: async () => 0,
    refetchInterval: 30000
  });
  
  const updateProgress = async (projectId: string) => {
    return await calculateProjectProgress(projectId);
  };
  
  return {
    progress: progressQuery.data || 0,
    isLoading: progressQuery.isLoading || isCreating,
    updateProgress,
    refetch: progressQuery.refetch,
    createProject
  };
}

// Hook spécialisé pour la création de projet avec validation complète
export function useProjectCreationCompleteHex() {
  const { 
    createProject, 
    validateWorkflow, 
    isCreating, 
    isValidating,
    validateStepData,
    getWorkflowStepStatus,
    prepareProjectData,
    calculateProjectProgress,
    getProjectData,
    updateProjectData,
    getWorkflowMetadata,
    resetWorkflow,
    detectChanges,
    getChangeHistory,
    creationError,
    validationError
  } = useProjectCreationHex();

  return {
    createProject,
    validateWorkflow,
    isCreating,
    isValidating,
    validateStepData,
    getWorkflowStepStatus,
    prepareProjectData,
    calculateProjectProgress,
    getProjectData,
    updateProjectData,
    getWorkflowMetadata,
    resetWorkflow,
    detectChanges,
    getChangeHistory,
    creationError,
    validationError
  };
}
