/**
 * useQuantityTakeoffSync — triggers TakeoffToBoqService.syncProject from UI
 * (e.g. a "Générer le DQE" button on the métré screen).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getTakeoffToBoqService } from '@/application/services/TakeoffToBoqService';
import { toast } from '@/hooks/use-toast';

export function useQuantityTakeoffSync(projectId: string) {
  const queryClient = useQueryClient();
  const service = getTakeoffToBoqService();

  return useMutation({
    mutationFn: () => service.syncProject(projectId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['boq-lines'] });
      queryClient.invalidateQueries({ queryKey: ['phase-materials-hex'] });
      toast({
        title: 'DQE généré',
        description: `${result.boqLinesCreated} ligne(s) DQE créée(s), ${result.resourcesUpserted} ressource(s) de phase synchronisée(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: `Synchronisation du métré impossible: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
