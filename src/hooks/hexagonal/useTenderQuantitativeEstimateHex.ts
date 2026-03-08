import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TenderEstimateService } from '@/application/services/TenderEstimateService';
import { MaterialService } from '@/application/services/MaterialService';
import { TenderEstimateDTO } from '@/dtos/entities/TenderEstimateDTO';
import { EstimateItem } from '@/dtos/transforms/shared';
import { toast } from '@/hooks/use-toast';

export type { EstimateItem } from '@/dtos/transforms/shared';

export const useTenderQuantitativeEstimateHex = (tenderId: string, projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch estimates
  const { data: estimates = [], isLoading: estimatesLoading, error: estimatesError } = useQuery({
    queryKey: ['tender-estimates', tenderId],
    queryFn: async (): Promise<TenderEstimateDTO[]> => {
      const tenderEstimateService = new TenderEstimateService();
      return await tenderEstimateService.getTenderEstimatesByTender(tenderId);
    },
    enabled: !!tenderId,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch materials
  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
      return await materialService.getAllMaterials();
    },
    retry: 2,
    retryDelay: 1000
  });

  // Fetch estimate items
  const { data: estimateItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['estimate-items', estimates?.[0]?.id],
    queryFn: async (): Promise<EstimateItem[]> => {
      if (!estimates?.[0]?.id) return [];
      return [];
    },
    enabled: !!estimates?.[0]?.id,
    retry: 3,
    retryDelay: 1000
  });

  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (estimate: any) => {
      const tenderEstimateService = new TenderEstimateService();
      
      const createRequest = {
        tender_id: estimate.tenderId || tenderId,
        submitted_by: 'current_user',
        total_amount: estimate.finalTotal || 0,
        currency: estimate.currency || 'MRO',
        validity_period: 30,
        notes: 'Created via hexagonal hook'
      };
      
      return await tenderEstimateService.createTenderEstimate(createRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-estimates'] });
      toast({ title: "Estimate created", description: "Your estimate has been created successfully" });
    },
    onError: (error: Error | unknown) => {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to create estimate", variant: "destructive" });
    }
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: EstimateItem & { estimate_id: string }) => {
      const tenderEstimateService = new TenderEstimateService();
      
      const createItemRequest = {
        estimate_id: item.estimate_id,
        material_id: item.material_id || undefined,
        item_code: item.material_id || `ITEM_${Date.now()}`,
        description: item.description || 'Material item',
        unit: 'unit',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        category: 'materials',
        specifications: JSON.stringify({ material_id: item.material_id, item_type: item.item_type || 'material' }),
        item_type: item.item_type || 'material'
      };
      
      return await tenderEstimateService.createTenderEstimateItem(createItemRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', estimates?.[0]?.id] });
      toast({ title: "Succès", description: "Article ajouté avec succès" });
    },
    onError: (error: Error | unknown) => {
      toast({ title: "Erreur", description: error instanceof Error ? error.message : "Failed to add item", variant: "destructive" });
    }
  });

  return {
    estimates,
    estimateItems,
    materials,
    isLoading: estimatesLoading || itemsLoading || materialsLoading,
    error: estimatesError,
    createEstimateMutation,
    addItemMutation,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-estimates', tenderId] });
      queryClient.invalidateQueries({ queryKey: ['estimate-items', estimates?.[0]?.id] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  };
};
