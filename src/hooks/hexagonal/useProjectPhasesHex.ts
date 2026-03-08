/**
 * Hexagonal Hook: useProjectPhasesHex
 * Provides project phases management via RepositoryFactory
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { toast } from 'sonner';

export interface ProjectPhase {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number | null;
  phase_type?: string | null;
  construction_phase?: string | null;
  custom_phase_data?: Record<string, unknown>;
}

export interface PhaseFormData {
  project_id: string;
  phase_name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_duration?: number;
  estimated_cost?: number;
  status?: string;
  progress?: number;
  phase_type?: string;
  construction_phase?: string;
  custom_phase_data?: Record<string, unknown>;
}

export function useProjectPhasesHex(projectId?: string) {
  const queryClient = useQueryClient();

  const {
    data: phases = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['project-phases-hex', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      const phaseRepo = RepositoryFactory.getPhaseRepository();
      const data = await phaseRepo.findByProjectId(projectId!);
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.phase_name || p.name || '',
        description: p.description || null,
        start_date: p.start_date || p.startDate || null,
        end_date: p.end_date || p.endDate || null,
        progress: p.progress || null,
        phase_type: p.phase_type || null,
        construction_phase: p.construction_phase || null,
        custom_phase_data: p.custom_phase_data || undefined,
      }));
    },
    enabled: !!projectId,
    staleTime: 30_000,
  });

  const createPhasesMutation = useMutation({
    mutationFn: async (phasesData: PhaseFormData[]) => {
      const phaseRepo = RepositoryFactory.getPhaseRepository();
      // Create phases one by one since createMany doesn't exist
      const results: any[] = [];
      for (const phaseData of phasesData) {
        const result = await phaseRepo.create(phaseData as any);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-phases-hex', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      toast.success('Phases créées avec succès');
    },
    onError: (error) => {
      console.error('Error creating phases:', error);
      toast.error('Impossible de créer les phases');
    },
  });

  return {
    phases,
    isLoading,
    error,
    refetch,
    createPhases: createPhasesMutation.mutateAsync,
    isCreating: createPhasesMutation.isPending,
  };
}

export default useProjectPhasesHex;