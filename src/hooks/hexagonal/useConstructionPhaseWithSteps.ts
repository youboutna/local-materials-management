/**
 * Hook for managing construction phases with steps from referential
 * Uses hexagonal architecture with proper service delegation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConstructionPhaseService } from '@/application/services/ConstructionPhaseService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ConstructionPhase } from '@/domain/entities/ConstructionPhase';
import { PhaseDTO, PhaseStepDTO, PhaseTaskDTO } from '@/types/phase-dto';
import { ReferentialType } from '@/config/referentials';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Types for hook interface
interface UseConstructionPhaseWithStepsProps {
  projectId: string;
  referentialCode?: ReferentialType;
}

interface UseConstructionPhaseWithStepsReturn {
  // Queries
  phases: ConstructionPhase[];
  isLoading: boolean;
  error: Error | null;
  
  // Mutations
  createPhasesFromReferential: (referentialCode: ReferentialType) => Promise<ConstructionPhase[]>;
  updateStepProgress: (phaseId: string, stepUpdates: Array<{ stepId: string; progress: number; status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' }>) => Promise<ConstructionPhase>;
  createPhase: (phaseData: Partial<PhaseDTO>) => Promise<ConstructionPhase>;
  updatePhase: (phaseId: string, phaseData: Partial<PhaseDTO>) => Promise<ConstructionPhase>;
  deletePhase: (phaseId: string) => Promise<void>;
  
  // Helper functions
  getPhaseById: (phaseId: string) => ConstructionPhase | undefined;
  getPhaseSteps: (phaseId: string) => PhaseStepDTO[];
  getStepTasks: (phaseId: string, stepId: string) => PhaseTaskDTO[];
  calculatePhaseProgress: (phaseId: string) => number;
  refreshPhases: () => void;
}

// Query keys
const PHASES_QUERY_KEY = ['construction-phases'];
const PHASE_QUERY_KEY = (phaseId: string) => ['construction-phase', phaseId];

export function useConstructionPhaseWithSteps({ 
  projectId, 
  referentialCode 
}: UseConstructionPhaseWithStepsProps): UseConstructionPhaseWithStepsReturn {
  const queryClient = useQueryClient();
  
  // Initialize service
  const phaseService = new ConstructionPhaseService(
    RepositoryFactory.getConstructionPhaseRepository()
  );

  // Query for phases
  const {
    data: phases = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: PHASES_QUERY_KEY,
    queryFn: async (): Promise<ConstructionPhase[]> => {
      try {
        return await phaseService.getPhasesByProject(projectId);
      } catch (error) {
        console.error('Failed to fetch phases:', error);
        throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch construction phases');
      }
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for creating phases from referential
  const createPhasesFromReferentialMutation = useMutation({
    mutationFn: async (refCode: ReferentialType): Promise<ConstructionPhase[]> => {
      try {
        const createdPhases = await phaseService.createPhasesFromReferential(projectId, refCode);
        
        // Invalidate cache to refresh phases list
        queryClient.invalidateQueries({ queryKey: PHASES_QUERY_KEY });
        
        return createdPhases;
      } catch (error) {
        console.error('Failed to create phases from referential:', error);
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create phases from referential');
      }
    },
    onSuccess: (createdPhases) => {
      console.log(`Successfully created ${createdPhases.length} phases from referential`);
    },
    onError: (error: Error) => {
      console.error('Error creating phases from referential:', error);
    }
  });

  // Mutation for updating step progress
  const updateStepProgressMutation = useMutation({
    mutationFn: async ({ phaseId, stepUpdates }: {
      phaseId: string;
      stepUpdates: Array<{ stepId: string; progress: number; status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' }>;
    }): Promise<ConstructionPhase> => {
      try {
        const updatedPhase = await phaseService.updatePhaseStepsProgress(phaseId, stepUpdates);
        
        // Invalidate cache to refresh phases list
        queryClient.invalidateQueries({ queryKey: PHASES_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: PHASE_QUERY_KEY(phaseId) });
        
        return updatedPhase;
      } catch (error) {
        console.error('Failed to update step progress:', error);
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update step progress');
      }
    },
    onSuccess: (updatedPhase) => {
      console.log(`Successfully updated progress for phase ${updatedPhase.name}`);
    },
    onError: (error: Error) => {
      console.error('Error updating step progress:', error);
    }
  });

  // Mutation for creating a phase
  const createPhaseMutation = useMutation({
    mutationFn: async (phaseData: Partial<PhaseDTO>): Promise<ConstructionPhase> => {
      try {
        const phaseDTO: PhaseDTO = {
          id: `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          project_id: projectId,
          phase_name: phaseData.phase_name || 'New Phase',
          construction_phase: phaseData.construction_phase,
          construction_stage: phaseData.construction_stage,
          description: phaseData.description || '',
          status: 'pending',
          progress: 0,
          estimated_cost: phaseData.estimated_cost,
          actual_cost: 0,
          estimated_duration_days: phaseData.estimated_duration_days || 30,
          actual_duration_days: 0,
          start_date: phaseData.start_date,
          end_date: phaseData.end_date,
          order_index: phaseData.order_index || 0,
          dependencies: phaseData.dependencies || [],
          steps: phaseData.steps || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const createdPhase = await phaseService.createConstructionPhase(phaseDTO, projectId);
        
        // Invalidate cache to refresh phases list
        queryClient.invalidateQueries({ queryKey: PHASES_QUERY_KEY });
        
        return createdPhase;
      } catch (error) {
        console.error('Failed to create phase:', error);
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create construction phase');
      }
    },
    onSuccess: (createdPhase) => {
      console.log(`Successfully created phase: ${createdPhase.name}`);
    },
    onError: (error: Error) => {
      console.error('Error creating phase:', error);
    }
  });

  // Mutation for updating a phase
  const updatePhaseMutation = useMutation({
    mutationFn: async ({ phaseId, phaseData }: {
      phaseId: string;
      phaseData: Partial<PhaseDTO>;
    }): Promise<ConstructionPhase> => {
      try {
        const updatedPhase = await phaseService.updatePhase(phaseId, phaseData);
        
        // Invalidate cache to refresh phases list
        queryClient.invalidateQueries({ queryKey: PHASES_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: PHASE_QUERY_KEY(phaseId) });
        
        return updatedPhase;
      } catch (error) {
        console.error('Failed to update phase:', error);
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update construction phase');
      }
    },
    onSuccess: (updatedPhase) => {
      console.log(`Successfully updated phase: ${updatedPhase.name}`);
    },
    onError: (error: Error) => {
      console.error('Error updating phase:', error);
    }
  });

  // Mutation for deleting a phase
  const deletePhaseMutation = useMutation({
    mutationFn: async (phaseId: string): Promise<void> => {
      try {
        await phaseService.deletePhase(phaseId);
        
        // Invalidate cache to refresh phases list
        queryClient.invalidateQueries({ queryKey: PHASES_QUERY_KEY });
      } catch (error) {
        console.error('Failed to delete phase:', error);
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete construction phase');
      }
    },
    onSuccess: () => {
      console.log('Successfully deleted phase');
    },
    onError: (error: Error) => {
      console.error('Error deleting phase:', error);
    }
  });

  // Helper functions
  const getPhaseById = (phaseId: string): ConstructionPhase | undefined => {
    return phases.find(phase => phase.id === phaseId);
  };

  const getPhaseSteps = (phaseId: string): PhaseStepDTO[] => {
    const phase = getPhaseById(phaseId);
    return phase?.steps || [];
  };

  const getStepTasks = (phaseId: string, stepId: string): PhaseTaskDTO[] => {
    const steps = getPhaseSteps(phaseId);
    const step = steps.find(s => s.id === stepId);
    return step?.tasks || [];
  };

  const calculatePhaseProgress = (phaseId: string): number => {
    const phase = getPhaseById(phaseId);
    return phase?.progress || 0;
  };

  const refreshPhases = () => {
    refetch();
  };

  // Return hook interface
  return {
    // Queries
    phases,
    isLoading,
    error,
    
    // Mutations
    createPhasesFromReferential: createPhasesFromReferentialMutation.mutateAsync,
    updateStepProgress: updateStepProgressMutation.mutateAsync,
    createPhase: createPhaseMutation.mutateAsync,
    updatePhase: updatePhaseMutation.mutateAsync,
    deletePhase: deletePhaseMutation.mutateAsync,
    
    // Helper functions
    getPhaseById,
    getPhaseSteps,
    getStepTasks,
    calculatePhaseProgress,
    refreshPhases
  };
}

// Export types for external use
export type { UseConstructionPhaseWithStepsProps, UseConstructionPhaseWithStepsReturn };
