/**
 * Hexagonal Hook: useProjectPhasesHex
 * Provides project phases management via RepositoryFactory
 */
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PhaseFormData } from '@/dtos/entities/PhaseDTO';
import { ProjectPhase } from '@/dtos/entities/PhaseDTO';
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
      const results: any[] = [];
      for (const phaseData of phasesData) {
        const resolvedProjectId = phaseData.project_id || projectId;
        if (!resolvedProjectId) {
          throw new Error('project_id manquant : impossible de créer la phase');
        }
        // Map snake_case form payload → camelCase entity expected by the adapter/transformer
        const entityPayload: Record<string, unknown> = {
          projectId: resolvedProjectId,
          phaseName: phaseData.phase_name,
          name: phaseData.phase_name,
          description: phaseData.description,
          startDate: phaseData.start_date,
          endDate: phaseData.end_date,
          estimatedDuration: phaseData.estimated_duration,
          estimatedCost: phaseData.estimated_cost,
          status: phaseData.status || 'pending',
          progress: phaseData.progress ?? 0,
          phaseType: phaseData.phase_type,
          constructionPhase: phaseData.construction_phase,
          customPhaseData: phaseData.custom_phase_data,
        };
        const result = await phaseRepo.create(entityPayload as any);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-phases-hex', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      toast.success('Phases créées avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating phases:', error);
      toast.error(error?.message || 'Impossible de créer les phases');
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