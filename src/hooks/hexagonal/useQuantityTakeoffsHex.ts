import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { QuantityTakeoffService, QuantityTakeoffWithDetails, getQuantityTakeoffService} from '@/application/services/QuantityTakeoffService';

export function useQuantityTakeoffsHex(projectId: string) {
  const queryClient = useQueryClient();

  // Quantity takeoff service instance (uses default repos from constructor)
  const quantityTakeoffService = getQuantityTakeoffService();

  // Fetch quantity takeoffs
  const { data: quantityTakeoffs, isLoading } = useQuery({
    queryKey: ['quantity-takeoffs', projectId],
    queryFn: async () => {
      const result = await quantityTakeoffService.getQuantityTakeoffsByProject(projectId);
      return result;
    },
    enabled: !!projectId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await quantityTakeoffService.deleteQuantityTakeoff(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs', projectId] });
      toast({
        title: "Métré supprimé",
        description: "Le métré a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error deleting quantity takeoff:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le métré.",
        variant: "destructive",
      });
    },
  });

  // Update mutation (inline edit quantity / unit_price)
  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity, unit_price }: { id: string; quantity?: number; unit_price?: number }) => {
      await quantityTakeoffService.updateQuantityTakeoff(id, {
        ...(quantity !== undefined ? { quantity } : {}),
        ...(unit_price !== undefined ? { unit_price } : {}),
        // service uses project_id to locate the existing takeoff
        ...( { project_id: projectId } as unknown as { project_id: string }),
      } as never);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs', projectId] });
      toast({ title: 'Métré mis à jour', description: 'La ligne a été enregistrée.' });
    },
    onError: (error) => {
      console.error('Error updating quantity takeoff:', error);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la ligne.', variant: 'destructive' });
    },
  });

  // Helper functions using local data (synchronous)
  const getTotalQuantityByUnit = (unit: string): number => {
    if (!quantityTakeoffs) return 0;
    return quantityTakeoffs
      .filter(qt => qt.material?.unit === unit)
      .reduce((sum, qt) => sum + qt.quantity, 0) || 0;
  };

  const getTotalValue = (): number => {
    if (!quantityTakeoffs) return 0;
    return quantityTakeoffs?.reduce((sum, qt) => {
      const pu = (qt as { unit_price?: number }).unit_price ?? qt.material?.price_per_unit ?? 0;
      return sum + (qt.quantity * pu);
    }, 0) || 0;
  };

  // Service-based helper functions
  const getTotalQuantityByUnitFromService = async (unit: string): Promise<number> => {
    try {
      return await quantityTakeoffService.getTotalQuantityByUnit(projectId, unit);
    } catch (error) {
      console.error('Error getting total quantity by unit:', error);
      return 0;
    }
  };

  const getTotalValueFromService = async (): Promise<number> => {
    try {
      return await quantityTakeoffService.getTotalValue(projectId);
    } catch (error) {
      console.error('Error getting total value:', error);
      return 0;
    }
  };

  return {
    quantityTakeoffs,
    isLoading,
    deleteMutation,
    updateMutation,
    getTotalQuantityByUnit,
    getTotalValue,
    getTotalQuantityByUnitFromService,
    getTotalValueFromService
  };
}