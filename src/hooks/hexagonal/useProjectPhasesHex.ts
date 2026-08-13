/**
 * Hexagonal Hook: useProjectPhasesHex
 * Provides project phases management via RepositoryFactory
 */
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ProjectPhase {
  id: string;
  name: string;
  phaseName?: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number | null;
  status?: string | null;
  estimatedCost?: number | null;
  weight?: number | null;
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
        name: p.phaseName || p.phase_name || p.name || '',
        phaseName: p.phaseName || p.phase_name || p.name || '',
        description: p.description || null,
        startDate: p.startDate || p.start_date || null,
        endDate: p.endDate || p.end_date || null,
        start_date: p.startDate || p.start_date || null,
        end_date: p.endDate || p.end_date || null,
        progress: p.progress ?? 0,
        status: p.status || null,
        estimatedCost: p.estimatedCost ?? p.estimated_cost ?? null,
        weight: p.weight ?? null,
        phase_type: p.phaseType || p.phase_type || null,
        construction_phase: p.constructionPhase || p.construction_phase || null,
        custom_phase_data: p.customPhaseData || p.custom_phase_data || undefined,
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