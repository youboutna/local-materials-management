import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { QuantityTakeoffWithDetails } from '@/types/quantityTakeoff';
import { 
  GetQuantityTakeoffsUseCase,
  DeleteQuantityTakeoffUseCase,
  GetTotalQuantityByUnitUseCase,
  GetTotalValueUseCase
} from '@/application/use-cases/quantityTakeoff/QuantityTakeoffUseCases';

export function useQuantityTakeoffsHex(projectId: string) {
  const queryClient = useQueryClient();

  // Singleton instances des use cases
  const getQuantityTakeoffsUseCase = new GetQuantityTakeoffsUseCase();
  const deleteQuantityTakeoffUseCase = new DeleteQuantityTakeoffUseCase();
  const getTotalQuantityByUnitUseCase = new GetTotalQuantityByUnitUseCase();
  const getTotalValueUseCase = new GetTotalValueUseCase();

  // Fetch quantity takeoffs
  const { data: quantityTakeoffs, isLoading } = useQuery({
    queryKey: ['quantity-takeoffs', projectId],
    queryFn: async () => {
      const result = await getQuantityTakeoffsUseCase.execute(projectId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch quantity takeoffs');
      }
      return result.quantityTakeoffs;
    },
    enabled: !!projectId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteQuantityTakeoffUseCase.execute(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete quantity takeoff');
      }
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

  // Helper functions using use cases
  const getTotalQuantityByUnit = (unit: string): number => {
    if (!quantityTakeoffs) return 0;
    return quantityTakeoffs
      ?.filter(qt => qt.material?.unit === unit)
      .reduce((sum, qt) => sum + qt.quantity, 0) || 0;
  };

  const getTotalValue = (): number => {
    if (!quantityTakeoffs) return 0;
    return quantityTakeoffs?.reduce((sum, qt) => {
      const materialPrice = qt.material?.price_per_unit || 0;
      return sum + (qt.quantity * materialPrice);
    }, 0) || 0;
  };

  return {
    quantityTakeoffs,
    isLoading,
    deleteMutation,
    getTotalQuantityByUnit,
    getTotalValue
  };
}
