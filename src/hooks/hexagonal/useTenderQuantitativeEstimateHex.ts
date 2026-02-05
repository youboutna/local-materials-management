import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TenderEstimateService } from '@/application/services/TenderEstimateService';
import { MaterialService } from '@/application/services/MaterialService';
import { TenderEstimateDTO } from '@/dtos/entities/TenderEstimateDTO';
import { EstimateItem, EstimateData } from '@/dtos/transforms/shared';
import { TenderEstimate } from '@/domain/entities/TenderEstimate';
import { toast } from '@/hooks/use-toast';

export const useTenderQuantitativeEstimateHex = (tenderId: string, projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch estimates
  const { data: estimates = [], isLoading: estimatesLoading, error: estimatesError } = useQuery({
    queryKey: ['tender-estimates', tenderId],
    queryFn: async (): Promise<TenderEstimate[]> => {
      const tenderEstimateService = new TenderEstimateService();
      const estimatesData = await tenderEstimateService.getTenderEstimatesByTender(tenderId);
      return estimatesData.map(estimate => ({
        id: estimate.id,
        tenderId: estimate.tender_id,
        projectId: projectId || null,
        estimateType: 'quantitative',
        totalMaterialsCost: estimate.total_amount * 0.6, // Estimation
        totalLaborCost: estimate.total_amount * 0.3, // Estimation
        totalEquipmentCost: estimate.total_amount * 0.1, // Estimation
        subtotal: estimate.total_amount,
        taxRate: 20, // Par défaut
        taxAmount: estimate.total_amount * 0.2,
        totalWithTax: estimate.total_amount * 1.2,
        overheadPercentage: 10, // Par défaut
        overheadAmount: estimate.total_amount * 0.1,
        profitMarginPercentage: 15, // Par défaut
        profitMarginAmount: estimate.total_amount * 0.15,
        finalTotal: estimate.total_amount * 1.45,
        currency: estimate.currency,
        status: estimate.status,
        createdAt: estimate.created_at,
        updatedAt: estimate.updated_at
      }));
    },
    enabled: !!tenderId,
    retry: 3,
    retryDelay: 1000
  });

  // Fetch materials for estimate items
  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async (): Promise<MaterialDTO[]> => {
      const materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
      return await materialService.getAllMaterials();
    },
    retry: 2,
    retryDelay: 1000
  });
  // Fetch estimate items for the first estimate
  const { data: estimateItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['estimate-items', estimates?.[0]?.id],
    queryFn: async (): Promise<EstimateItem[]> => {
      if (!estimates?.[0]?.id) return [];
      
      const tenderEstimateService = new TenderEstimateService();
      // Note: TenderEstimateService n'a pas de méthode pour les items, on utilise une approche simplifiée
      // Dans une implémentation complète, il faudrait ajouter getEstimateItems() au service
      return [];
    },
    enabled: !!estimates?.[0]?.id,
    retry: 3,
    retryDelay: 1000
  });

  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (estimate: Omit<TenderEstimate, 'id'>) => {
      const tenderEstimateService = new TenderEstimateService();
      
      // Convertir TenderEstimate vers CreateTenderEstimateRequestDto
      const createRequest = {
        tender_id: estimate.tender_id,
        submitted_by: 'current_user', // À adapter avec auth
        total_amount: estimate.final_total || 0,
        currency: estimate.currency || 'MRO',
        validity_period: 30,
        notes: 'Created via hexagonal hook'
      };
      
      const result = await tenderEstimateService.createTenderEstimate(createRequest);
      return result; // Le service retourne directement TenderEstimateDTO
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-estimates'] });
      toast({
        title: "Estimate created",
        description: "Your estimate has been created successfully",
      });
    },
    onError: (error: Error | unknown) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create estimate",
        variant: "destructive",
      });
    }
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: EstimateItem & { estimate_id: string }) => {
      const tenderEstimateService = new TenderEstimateService();
      
      // Convertir EstimateItem vers CreateTenderEstimateItemRequestDto
      const createItemRequest = {
        estimate_id: item.estimate_id,
        material_id: item.material_id || undefined,
        item_code: item.material_id || `ITEM_${Date.now()}`,
        description: item.description || 'Material item',
        unit: 'unit', // À adapter selon le matériau
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price, // ✅ Propriété requise
        category: 'materials',
        specifications: JSON.stringify({
          material_id: item.material_id,
          item_type: item.item_type || 'material'
        }),
        item_type: item.item_type || 'material'
      };
      
      const result = await tenderEstimateService.createTenderEstimateItem(createItemRequest);
      return result; // Le service retourne directement TenderEstimateItemDTO
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', estimates?.[0]?.id] });
      toast({
        title: "Succès",
        description: "Article ajouté avec succès",
      });
    },
    onError: (error: Error | unknown) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
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
