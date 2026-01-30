/**
 * useProjectCreationHex - Hook Hexagonal pour la Création de Projets
 * Pont intelligent entre l'UI et le service hexagonal
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectCreationService, type ProjectCreationData, type ProjectCreationResult } from '@/application/services/ProjectCreationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectCreationDTO } from '@/dtos/entities/ProjectCreationDTO';

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
  const projectCreationService = new ProjectCreationService(RepositoryFactory.getProjectRepository());

  // Mutation pour créer un projet
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectCreationData): Promise<ProjectCreationResult> => 
      projectCreationService.createProject(data),
    onSuccess: (result) => {
      toast({
        title: "Projet créé avec succès",
        description: `Le projet ${result.project.title} a été créé et est maintenant disponible.`,
        className: 'bg-green-100 border-green-300 text-green-800',
      });
      
      // Invalider les queries liées aux projets
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', result.project.id] });
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
    mutationFn: (workflow: ProjectCreationData) => 
      projectCreationService.validateProjectData(workflow),
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
  const calculateProjectProgress = async (phases: unknown[]): Promise<number> => {
    try {
      const progress = await projectCreationService.calculateProjectProgress(phases);
      return progress;
    } catch (error) {
      console.error('Progress calculation failed:', error);
      return 0;
    }
  };

  // Fonction pour valider une étape du workflow
  const validateWorkflowStep = async (stepData: Partial<ProjectCreationData>): Promise<{ isValid: boolean; errors: string[] }> => {
    try {
      // Créer un objet ProjectCreationData temporaire pour la validation
      const tempData: ProjectCreationData = {
        title: stepData.title || '',
        description: stepData.description || '',
        startDate: stepData.startDate || '',
        endDate: stepData.endDate || '',
        budget: stepData.budget || 0,
        address: stepData.address || '',
        latitude: stepData.latitude || 0,
        longitude: stepData.longitude || 0,
        projectManagerId: stepData.projectManagerId || '',
        clientId: stepData.clientId || '',
        status: stepData.status || 'planned',
        priority: stepData.priority || 'medium',
        estimatedDuration: stepData.estimatedDuration || 0,
        stakeholders: stepData.stakeholders || [],
        delegation: stepData.delegation || {
          projectManager: '',
          technicalManager: '',
          supervisor: '',
          client: ''
        },
        phases: stepData.phases || [],
        materials: stepData.materials || [],
        risks: stepData.risks || [],
        compliance: stepData.compliance || [],
        shapeData: stepData.shapeData || {
          type: '',
          coordinates: [],
          area: 0,
          perimeter: 0
        }
      };
      
      projectCreationService.validateProjectData(tempData);
      return { isValid: true, errors: [] };
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'] };
    }
  };

  // État du workflow
  const getWorkflowStepStatus = (stepData: Partial<ProjectCreationData>, stepNumber: number): boolean => {
    const requiredFields = getRequiredFieldsForStep(stepNumber);
    
    return requiredFields.every(field => {
      const value = stepData[field as keyof ProjectCreationData];
      return value !== undefined && value !== null && value !== '';
    });
  };

  // Fonction utilitaire pour obtenir les champs requis par étape
  const getRequiredFieldsForStep = (stepNumber: number): (keyof ProjectCreationData)[] => {
    switch (stepNumber) {
      case 1: // Informations du projet
        return ['title', 'description', 'budget', 'project_type', 'start_date'];
      case 2: // Parties prenantes
        return ['project_manager_id', 'client_id'];
      case 3: // Localisation
        return ['address'];
      case 4: // Planification
        return []; // Validé séparément via les phases
      case 5: // Risques
        return []; // Validé séparément via les risques
      case 6: // Conformité
        return []; // Validé séparément via la conformité
      case 7: // Validation
        return []; // Étape finale
      default:
        return [];
    }
  };

  // Fonction pour préparer les données du projet
  const prepareProjectData = (formData: Partial<ProjectCreationDTO>, additionalData: {
    stakeholders?: unknown[];
    risks?: unknown[];
    compliance?: unknown[];
    phases?: unknown[];
  }): ProjectCreationDTO => {
    return {
      title: formData.title || '',
      project_reference: formData.project_reference || '',
      description: formData.description || '',
      budget: formData.budget || 0,
      estimated_duration_days: formData.estimated_duration_days || 0,
      currency: formData.currency || 'MRU',
      status: formData.status || 'en cours',
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
      end_date: formData.end_date,
      address: formData.address || '',
      latitude: formData.latitude,
      longitude: formData.longitude,
      area_sqm: formData.area_sqm,
      site_details: formData.site_details,
      payment_mode: formData.payment_mode || 'progressive',
      payment_frequency: formData.payment_frequency || 'monthly',
      initial_advance: formData.initial_advance || 20,
      retention_percentage: formData.retention_percentage || 5,
      advance_percentage: formData.advance_percentage,
      project_manager_id: formData.project_manager_id,
      technical_manager_id: formData.technical_manager_id,
      supervisor_id: formData.supervisor_id,
      client_id: formData.client_id,
      workspace_id: formData.workspace_id,
      project_type: formData.project_type || 'infrastructure',
      sector: formData.sector || '',
      priority: formData.priority || 'medium',
      financing_source: formData.financing_source || '',
      donor_organization: formData.donor_organization,
      market_type: formData.market_type || 'appel_offre_international',
      selection_mode: formData.selection_mode || 'qualite_cout',
      permit_number: formData.permit_number,
      client_name: formData.client_name,
      main_contractor: formData.main_contractor,
      engineering_consultant: formData.engineering_consultant
    };
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
    
    // Données
    creationError: createProjectMutation.error,
    validationError: validateWorkflowMutation.error,
    
    // Query
    progressQuery: calculateProgressQuery
  };
}

// Hook spécialisé pour la gestion des étapes du workflow
export function useProjectWorkflowHex() {
  const { validateWorkflow, isValidating } = useProjectCreationHex();
  
  const validateStep = async (stepNumber: number, stepData: Partial<ProjectCreationData>) => {
    try {
      // Valider directement les données de l'étape
      const tempData: ProjectCreationData = {
        title: stepData.title || '',
        description: stepData.description || '',
        startDate: stepData.startDate || '',
        endDate: stepData.endDate || '',
        budget: stepData.budget || 0,
        address: stepData.address || '',
        latitude: stepData.latitude || 0,
        longitude: stepData.longitude || 0,
        projectManagerId: stepData.projectManagerId || '',
        clientId: stepData.clientId || '',
        status: stepData.status || 'planned',
        priority: stepData.priority || 'medium',
        estimatedDuration: stepData.estimatedDuration || 0,
        stakeholders: stepData.stakeholders || [],
        delegation: stepData.delegation || {
          projectManager: '',
          technicalManager: '',
          supervisor: '',
          client: ''
        },
        phases: stepData.phases || [],
        materials: stepData.materials || [],
        risks: stepData.risks || [],
        compliance: stepData.compliance || [],
        shapeData: stepData.shapeData || {
          type: '',
          coordinates: [],
          area: 0,
          perimeter: 0
        }
      };
      
      // Créer un service temporaire pour la validation
      const projectCreationService = new ProjectCreationService(
        RepositoryFactory.getProjectRepository()
      );
      
      projectCreationService.validateProjectData(tempData);
      return { isValid: true, errors: [] };
    } catch (error) {
      console.error('Step validation failed:', error);
      return { isValid: false, errors: ['Erreur de validation'] };
    }
  };
  
  return {
    validateStep,
    isValidating
  };
}

// Hook pour la gestion de la progression en temps réel
export function useProjectProgressHex() {
  const { calculateProjectProgress } = useProjectCreationHex();
  
  const progressQuery = useQuery({
    queryKey: ['project-progress'],
    queryFn: async () => {
      // Cette fonction sera mise à jour avec les données réelles
      return 0;
    },
    refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
  });
  
  const updateProgress = async (phases: unknown[]) => {
    const progress = await calculateProjectProgress(phases);
    return progress;
  };
  
  return {
    progress: progressQuery.data || 0,
    isLoading: progressQuery.isLoading,
    updateProgress,
    refetch: progressQuery.refetch
  };
}
