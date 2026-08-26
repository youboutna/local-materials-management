/**
 * usePhaseTaskGenerationHex — génération des tâches d'une phase depuis le
 * bordereau (DQE / métré / devis accepté).
 *
 * UI → Hook → Service → Repository → Adapter (aucun accès Supabase ici).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPhaseTaskGenerationService } from '@/application/services/phase/PhaseTaskGenerationService';
import { invalidateAllTaskQueries } from '@/hooks/hexagonal/taskQueryKeys';
import { toast } from '@/hooks/use-toast';

export function usePhaseTaskGenerationHex(projectId?: string, phaseId?: string) {
  const queryClient = useQueryClient();
  const enabled = !!projectId && !!phaseId;

  const planQuery = useQuery({
    queryKey: ['phase-task-generation-plan', projectId, phaseId],
    queryFn: () => getPhaseTaskGenerationService().getPlan(projectId!, phaseId!),
    enabled,
    staleTime: 30_000,
  });

  const generateMutation = useMutation({
    mutationFn: () => getPhaseTaskGenerationService().generate(projectId!, phaseId!),
    onSuccess: (result) => {
      invalidateAllTaskQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-hex', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-task-generation-plan', projectId, phaseId] });
      queryClient.invalidateQueries({ queryKey: ['phase-aggregate', projectId, phaseId] });
      toast({
        title: 'Tâches générées depuis le bordereau',
        description: `${result.created} tâche(s) créée(s), ${result.skipped} ligne(s) déjà rattachée(s).`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Génération impossible',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  return {
    plan: planQuery.data ?? {
      projectId: projectId ?? '',
      phaseId: phaseId ?? '',
      totalLines: 0,
      linkedLines: 0,
      pendingLines: 0,
      linkedToBoq: false,
    },
    isLoadingPlan: enabled && planQuery.isLoading,
    generateTasks: () => generateMutation.mutateAsync(),
    isGenerating: generateMutation.isPending,
  };
}
