/**
 * useProjectScaffoldHex — complète un projet depuis les référentiels
 * (statuts de phases, DQE socle, ressources, tâches).
 *
 * UI → Hook → Service → Repository (aucun accès Supabase ici).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProjectScaffoldService } from '@/application/services/project/ProjectScaffoldService';
import { invalidateAllTaskQueries } from '@/hooks/hexagonal/taskQueryKeys';
import { toast } from '@/hooks/use-toast';

export function useProjectScaffoldHex(projectId?: string) {
  const queryClient = useQueryClient();
  const enabled = !!projectId;

  const planQuery = useQuery({
    queryKey: ['project-scaffold-plan', projectId],
    queryFn: () => getProjectScaffoldService().getPlan(projectId!),
    enabled,
    staleTime: 30_000,
  });

  const scaffoldMutation = useMutation({
    mutationFn: () => getProjectScaffoldService().scaffold(projectId!),
    onSuccess: (result) => {
      invalidateAllTaskQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ['project-scaffold-plan', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] });
      queryClient.invalidateQueries({ queryKey: ['boq'] });
      toast({
        title: 'Projet complété depuis les référentiels',
        description: `${result.boqLinesCreated} ligne(s) DQE, ${result.resourcesCreated} ressource(s), ${result.tasksCreated} tâche(s), ${result.phasesStatusUpdated} statut(s) de phase mis à jour.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Complétion impossible',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    },
  });

  return {
    plan: planQuery.data,
    isLoadingPlan: enabled && planQuery.isLoading,
    scaffoldProject: () => scaffoldMutation.mutateAsync(),
    isScaffolding: scaffoldMutation.isPending,
  };
}
