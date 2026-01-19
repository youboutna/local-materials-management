import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ExecuteDataLoadingUseCase } from '@/application/use-cases/loadData/LoadDataUseCases';
import { LoadDataResult } from '@/domain/repositories/ILoadDataRepository';

interface UseLoadDataButtonHexResult {
  loadDataMutation: ReturnType<typeof useMutation<LoadDataResult, Error, void>>;
  isLoading: boolean;
}

export function useLoadDataButtonHex(): UseLoadDataButtonHexResult {
  const queryClient = useQueryClient();

  // Singleton instance du use case
  const executeDataLoadingUseCase = new ExecuteDataLoadingUseCase();

  const loadDataMutation = useMutation({
    mutationFn: async (): Promise<LoadDataResult> => {
      const result = await executeDataLoadingUseCase.execute();
      if (!result.success) {
        throw new Error(result.message || 'Failed to load data');
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Succès',
          description: result.message,
        });
      } else {
        toast({
          title: 'Erreur',
          description: result.message,
          variant: 'destructive'
        });
      }
      
      // Invalidate queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive'
      });
    }
  });

  return {
    loadDataMutation,
    isLoading: loadDataMutation.isPending
  };
}
