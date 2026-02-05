/**
 * useProjectCreationHex - Hook Hexagonal pour la Création de Projets
 * Pont intelligent entre l'UI et le service hexagonal
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectWorkflowService, type ProjectCreationWorkflowData, type WorkflowResult } from '@/application/services/ProjectWorkflowService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
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

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO, CreateProjectDTO, ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { TaskDTO } from '@/dtos/entities/TaskDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';

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
  const projectCreationService = new ProjectWorkflowService(
    RepositoryFactory.getProjectRepository(),
    RepositoryFactory.getPhaseRepository(),
    RepositoryFactory.getRiskRepository(),
    RepositoryFactory.getStakeholderRepository()
  );

  // Mutation pour créer un projet
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectWorkflowData): Promise<SaveResult> => 
      projectCreationService.saveStep(1, data, projectCreationService.initializeWorkflow('creation')),
    onSuccess: (result) => {
      if (result.success && result.projectId) {
        toast({
          title: "Projet créé avec succès",
          description: `Le projet a été créé et est maintenant disponible.`,
          className: 'bg-green-100 border-green-300 text-green-800',
        });
        
        // Invalider les queries liées aux projets
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
            errorMessage = 'Les données du projet sont invalides. Veuillez vérifier tous les champs obligatoires.';
            break;
          case ErrorCode.DATABASE_ERROR:
            errorMessage = 'Erreur de base de données. Veuillez réessayer plus tard.';
            break;
          case ErrorCode.INTERNAL_ERROR:
            errorMessage = 'Erreur interne du serveur. Veuillez contacter l\'administrateur.';
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
    queryFn: async () => {
      // Cette fonction sera appelée avec les phases du projet
      return 0; // Sera mis à jour dynamiquement
    },
    enabled: false // Désactivé par défaut, sera activé quand nécessaire
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

  // Fonction pour calculer la progression d'un projet
  const calculateProjectProgress = async (projectId: string): Promise<number> => {
    try {
      const progress = await projectCreationService.calculateProjectProgress(projectId);
      return progress;
    } catch (error) {
      console.error('Progress calculation failed:', error);
      return 0;
    }
  };

  // Fonction pour valider une étape du workflow
  const validateWorkflowStep = async (stepNumber: number, stepData: Partial<ProjectWorkflowData>): Promise<{ isValid: boolean; errors: string[] }> => {
    try {
      const validation = await projectCreationService.validateStep(stepNumber, stepData);
      return validation;
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'] };
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
        return ['relatedData']; // Optionnel
      case 5: // Risques
        return ['relatedData'];
      case 6: // Garanties bancaires
        return []; // Optionnel
      case 7: // Assurances
        return []; // Optionnel
      case 8: // Documents
        return []; // Optionnel
      case 9: // Révision finale
        return []; // Validation finale
      default:
        return [];
    }
  };

  // Fonction pour préparer les données du projet
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
      status: formData.status || 'enAttente',
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
      projectData: projectDTO as ProjectDTO,
      relatedData: {
        phases: additionalData.phases || [],
        risks: additionalData.risks || [],
        stakeholders: additionalData.stakeholders || [],
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

  // Fonction pour obtenir les données du projet
  const getProjectData = async (projectId: string): Promise<ProjectWorkflowData | null> => {
    try {
      const project = await (projectCreationService as any).projectService.getProjectById(projectId);
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
          totalSteps: 9,
          completedSteps: Math.floor((project.progress || 0) / 11.11), // Approximate
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
      await (projectCreationService as any).projectService.updateProject(projectId, data.projectData as ProjectDTO);
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Failed to update project data:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  };

  // Fonction pour valider les données d'une étape
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

  // Fonction pour obtenir les métadonnées du workflow
  const getWorkflowMetadata = () => {
    return {
      workflowType: 'creation',
      totalSteps: 9,
      currentStep: 1,
      isDraft: true,
      isComplete: false,
      lastSavedAt: new Date().toISOString()
    };
  };

  // Fonction pour réinitialiser le workflow
  const resetWorkflow = async (): Promise<{ workflowType: string; currentStep: number; totalSteps: number }> => {
    try {
      const context = projectCreationService.initializeWorkflow('creation');
      return {
        workflowType: 'creation',
        currentStep: 1,
        totalSteps: 9
      };
    } catch (error) {
      console.error('Failed to reset workflow:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset workflow');
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

  // Fonction pour obtenir l'historique des modifications
  const getChangeHistory = async (projectId: string): Promise<Array<{ field: string; oldValue: unknown; newValue: unknown; timestamp: string }>> => {
    try {
      // Simulate change history - in real implementation this would come from audit logs
      const project = await (projectCreationService as any).projectService.getProjectById(projectId);
      if (!project) return [];
      
      // Return mock change history for now
      return [
        {
          field: 'created_at',
          oldValue: '',
          newValue: (project as any).createdAt || new Date().toISOString(),
          timestamp: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Failed to get change history:', error);
      return [];
    }
  };

  return {
    // Mutations
    createProject: createProjectMutation.mutate,
    validateWorkflow: validateWorkflowMutation.mutate,
    
    // États
    isCreating: createProjectMutation.isPending,
    isValidating: validateWorkflowMutation.isPending,
    
    // Utilitaires
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
    
    // Données
    creationError: createProjectMutation.error,
    validationError: validateWorkflowMutation.error,
    
    // Query
    progressQuery: calculateProgressQuery
  };
}

// Hook spécialisé pour la gestion des étapes du workflow
export function useProjectWorkflowHex() {
  const { validateWorkflow, isValidating, validateStepData, getWorkflowStepStatus, getWorkflowMetadata } = useProjectCreationHex();
  
  const validateStep = async (stepNumber: number, stepData: Partial<ProjectWorkflowData>) => {
    try {
      const validation = await validateStepData(stepNumber, stepData);
      return validation;
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'], warnings: [] };
    }
  };
  
  return {
    validateStep,
    isValidating,
    getWorkflowStepStatus,
    getWorkflowMetadata
  };
}

// Hook pour la gestion de la progression en temps réel
export function useProjectProgressHex() {
  const { calculateProjectProgress, createProject, isCreating } = useProjectCreationHex();
  
  const progressQuery = useQuery({
    queryKey: ['project-progress'],
    queryFn: async () => {
      // Cette fonction sera mise à jour avec les données réelles
      return 0;
    },
    refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
  });
  
  const updateProgress = async (projectId: string) => {
    const progress = await calculateProjectProgress(projectId);
    return progress;
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
    getWorkflowMetadata,
    resetWorkflow,
    prepareProjectData,
    detectChanges,
    getChangeHistory
  } = useProjectCreationHex();
  
  // Fonction pour créer un projet avec validation complète
  const createProjectWithValidation = async (data: ProjectWorkflowData) => {
    try {
      // Valider toutes les étapes
      for (let step = 1; step <= 9; step++) {
        const validation = await validateStepData(step, data);
        if (!validation.isValid) {
          throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed for step ${step}: ${validation.errors.join(', ')}`);
        }
      }
      
      // Créer le projet
      const result = await new Promise<SaveResult>((resolve, reject) => {
        createProject(data, {
          onSuccess: resolve,
          onError: reject
        });
      });
      
      return result;
    } catch (error) {
      console.error('Project creation with validation failed:', error);
      throw error;
    }
  };
  
  return {
    createProject: createProjectWithValidation,
    validateWorkflow,
    validateStepData,
    getWorkflowStepStatus,
    getWorkflowMetadata,
    resetWorkflow,
    prepareProjectData,
    detectChanges,
    getChangeHistory,
    
    // États
    isCreating,
    isValidating,
    
    // Erreurs
    creationError: undefined, // Will be set by createProjectWithValidation
    validationError: undefined
  };
}
