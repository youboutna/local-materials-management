import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TenderEstimateService } from '@/application/services/TenderEstimateService';
import { MaterialService } from '@/application/services/MaterialService';
import { TenderEstimateDTO } from '@/dtos/entities/TenderEstimateDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { toast } from '@/hooks/use-toast';

export interface EstimateItem {
  id?: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string | null;
  item_type: string | null;
}

export interface TenderEstimate {
  id?: string;
  tender_id: string;
  project_id?: string | null;
  estimate_type: string;
  total_materials_cost: number | null;
  total_labor_cost: number | null;
  total_equipment_cost: number | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total_with_tax: number | null;
  overhead_percentage: number | null;
  overhead_amount: number | null;
  profit_margin_percentage: number | null;
  profit_margin_amount: number | null;
  final_total: number | null;
  currency: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

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
        tender_id: estimate.tender_id,
        project_id: projectId || null,
        estimate_type: 'quantitative',
        total_materials_cost: estimate.total_amount * 0.6, // Estimation
        total_labor_cost: estimate.total_amount * 0.3, // Estimation
        total_equipment_cost: estimate.total_amount * 0.1, // Estimation
        subtotal: estimate.total_amount,
        tax_rate: 20, // Par défaut
        tax_amount: estimate.total_amount * 0.2,
        total_with_tax: estimate.total_amount * 1.2,
        overhead_percentage: 10, // Par défaut
        overhead_amount: estimate.total_amount * 0.1,
        profit_margin_percentage: 15, // Par défaut
        profit_margin_amount: estimate.total_amount * 0.15,
        final_total: estimate.total_amount * 1.45,
        currency: estimate.currency,
        status: estimate.status,
        created_at: estimate.created_at,
        updated_at: estimate.updated_at
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
