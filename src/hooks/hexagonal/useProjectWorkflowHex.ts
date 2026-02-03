/**
 * Hook: useProjectWorkflowHex
 * Hook hexagonal pour la gestion des workflows de projet avec sauvegarde partielle
 * Supporte ProjectCreationWorkflow et EnhancedProjectEditForm
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ProjectWorkflowService } from '@/application/services/ProjectWorkflowService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  ProjectWorkflowData,
  WorkflowStateDTO,
  WorkflowValidationDTO,
  WorkflowSaveContextDTO,
  WorkflowTransitionDTO,
  WorkflowAuditLogDTO,
  WorkflowMetricsDTO,
  WorkflowTemplateDTO,
  WorkflowSessionDTO,
  ProjectCreationWorkflowDTO,
  ProjectBasicInfoDTO,
  ProjectStakeholdersDTO,
  ProjectLocationDTO,
  ProjectPlanningDTO,
  ProjectRisksDTO,
  ProjectComplianceDTO,
 ProjectValidationDTO,
  StepProgressDTO,
  ValidationResult,
  SaveResult
} from '@/dtos/transforms/ProjectWorkflowDTOs';
import { StakeholderDTO } from '@/dtos/transforms/ProjectCreationWorkflowDTO';
import { MaterialDTO as MaterialEntityDTO } from '@/dtos/entities/MaterialDTO';

// ✅ Rule #4: Use centralized DTOs, no custom interfaces in hooks
// Using StepRelatedDataDTO from ProjectWorkflowDTOs for consistency

export interface WorkflowSaveResult {
  success: boolean;
  projectId?: string;
  stepNumber: number;
  data?: ProjectWorkflowData;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Import the ProjectFormDataDTO from the transforms
import { ProjectFormDataDTO } from '@/dtos/transforms/ProjectWorkflowDTOs';

// Fonctions utilitaires pour le calcul de progression
export function determineCurrentStep(formData: ProjectFormDataDTO): number {
  // Logique pour déterminer l'étape actuelle basée sur les données du projet
  if (!formData.title || !formData.description) return 1;
  if (!formData.location) return 3;
  if (!formData.status) return 7;
  return 1;
}

export function calculateCompletedSteps(formData: Record<string, unknown>, phasesData: unknown[]): number {
  let completed = 0;
  
  // Étape 1: Informations générales
  if (formData.title && formData.description) completed++;
  
  // Étape 2: Parties prenantes
  if (formData.stakeholders && Array.isArray(formData.stakeholders) && formData.stakeholders.length > 0) completed++;
  
  // Étape 3: Localisation
  if (formData.address) completed++;
  
  // Étape 4: Phases
  if (phasesData && Array.isArray(phasesData) && phasesData.length > 0) completed++;
  
  // Étape 5: Risques
  if (formData.risks && Array.isArray(formData.risks) && formData.risks.length > 0) completed++;
  
  // Étape 6: Conformité
  if (formData.compliance && Array.isArray(formData.compliance) && formData.compliance.length > 0) completed++;
  
  // Étape 7: Validation
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
  
  // Mock du service pour l'instant (à remplacer avec le vrai service)
  const mockSaveStep = async (data: ProjectWorkflowData): Promise<WorkflowSaveResult> => {
    // Simulation de sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      projectId: data.projectId || 'mock-project-id',
      stepNumber: data.currentStep,
      data
    };
  };

  const mockCompleteWorkflow = async (data: ProjectWorkflowData): Promise<WorkflowSaveResult> => {
    // Simulation de finalisation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      projectId: data.projectId || 'mock-project-id',
      stepNumber: 7,
      data: {
        ...data,
        isComplete: true,
        isDraft: false
      }
    };
  };

  // Mutation pour sauvegarder une étape
  const saveStepMutation = useMutation({
    mutationFn: mockSaveStep,
    onSuccess: (result) => {
      const stepName = getStepName(result.stepNumber);
      
      toast({
        title: 'Étape sauvegardée',
        description: `L'étape "${stepName}" a été sauvegardée avec succès.`,
        className: 'bg-blue-100 border-blue-300 text-blue-800',
      });

      // Invalider les queries
      queryClient.invalidateQueries({ queryKey: ['project-workflow', projectId] });
    },

    onError: (error: unknown) => {
      toast({
        title: 'Erreur lors de la sauvegarde',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde de l\'étape.',
        variant: 'destructive',
      });
    }
  });

  // Mutation pour finaliser le workflow
  const completeWorkflowMutation = useMutation({
    mutationFn: mockCompleteWorkflow,
    onSuccess: (result) => {
      toast({
        title: 'Projet finalisé',
        description: 'Le projet a été finalisé avec succès et est maintenant complet.',
        className: 'bg-green-100 border-green-300 text-green-800',
      });

      // Invalider les queries
      queryClient.invalidateQueries({ queryKey: ['project-workflow', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId || result.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },

    onError: (error: unknown) => {
      toast({
        title: 'Erreur lors de la finalisation',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de la finalisation du projet.',
        variant: 'destructive',
      });
    }
  });

  // Fonctions utilitaires
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
    // On peut accéder aux étapes précédentes et à l'étape suivante
    return targetStep <= currentStep + 1;
  };

  const getNextStep = (currentStep: number): number | null => {
    return currentStep < 7 ? currentStep + 1 : null;
  };

  const getPreviousStep = (currentStep: number): number | null => {
    return currentStep > 1 ? currentStep - 1 : null;
  };

  const getWorkflowProgress = (): number => {
    return 0; // À implémenter avec les données réelles
  };

  const isStepCompleted = (stepNumber: number): boolean => {
    // Logique de base pour vérifier si une étape est complétée
    return false; // À implémenter avec les données réelles
  };

  const canProceedToNext = (currentStep: number): boolean => {
    return isStepCompleted(currentStep) && getNextStep(currentStep) !== null;
  };

  const isWorkflowComplete = (): boolean => {
    return false; // À implémenter avec les données réelles
  };

  const isDraft = (): boolean => {
    return true; // À implémenter avec les données réelles
  };

  const validateCurrentStep = (data: ProjectWorkflowData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (data.currentStep === 1) {
      if (!data.projectData.title || data.projectData.title === '') {
        errors.push('Le titre du projet est requis');
      }
      if (!data.projectData.description || data.projectData.description === '') {
        errors.push('La description du projet est requise');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Fonctions utilitaires pour la logique métier (selon PROMPTS.md)
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

  return {
    // Données
    workflowData: null,
    isLoading: false,
    error: null,

    // Mutations
    saveStep,
    completeWorkflow,

    // États des mutations
    isSaving: saveStepMutation.isPending || completeWorkflowMutation.isPending,
    isCompleting: completeWorkflowMutation.isPending,

    // Erreurs des mutations
    saveError: saveStepMutation.error,
    completeError: completeWorkflowMutation.error,

    // Utilitaires
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
