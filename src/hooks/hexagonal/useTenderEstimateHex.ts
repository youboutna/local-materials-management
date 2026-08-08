/**
 * Hexagonal hooks for Tender Quantitative Estimate
 */

import { MaterialService, getMaterialService} from '@/application/services/MaterialService';
import { TenderEstimateService } from '@/application/services/TenderEstimateService';
import { TenderEstimateDTO, TenderEstimateItemDTO } from '@/dtos/entities/TenderEstimateDTO';
import { EstimateItem } from '@/dtos/transforms/shared';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Hooks
export function useTenderEstimatesHex(tenderId: string) {
  const tenderEstimateService = new TenderEstimateService();

  return useQuery({
    queryKey: ['tender-estimates', tenderId],
    queryFn: async (): Promise<TenderEstimateDTO[]> => {
      return await tenderEstimateService.getTenderEstimatesByTender(tenderId);
    },
  });
}

export type { EstimateItem } from '@/dtos/transforms/shared';

export function useEstimateItemsHex(estimateId: string | null) {
  const tenderEstimateService = new TenderEstimateService();

  return useQuery({
    queryKey: ['estimate-items', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      return await tenderEstimateService.getTenderEstimatesByTender(estimateId);
    },
    enabled: !!estimateId
  });
}

export function useMaterialsForEstimateHex() {
  const materialService = getMaterialService();

  return useQuery({
    queryKey: ['materials'],
    queryFn: async (): Promise<TenderEstimateItemDTO[]> => {
      const materials = await materialService.getAllMaterials();
      return materials.map(material => ({
        id: material.id,
        estimate_id: '',
        material_id: material.id,
        item_code: material.name || '',
        description: material.description || '',
        unit: material.unit || '',
        quantity: 0,
        unit_price: material.pricePerUnit || 0,
        total_price: 0,
        category: material.category || '',
        specifications: '',
        item_type: 'material',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    }
  });
}

export function useParsedInvoicesHex(tenderId: string) {
  return useQuery({
    queryKey: ['parsed-invoices', tenderId],
    queryFn: async () => {
      const { InvoiceService } = await import('@/application/services/InvoiceService');
      const { RepositoryFactory } = await import( '@/infrastructure/RepositoryFactory');
      
      const invoiceRepository = RepositoryFactory.getParsedInvoiceRepository();
      const invoiceService = new InvoiceService(invoiceRepository);
      
      return await invoiceService.getParsedInvoices('all');
    }
  });
}

export function useAddEstimateItemHex(estimateId: string | null) {
  const queryClient = useQueryClient();
  const tenderEstimateService = new TenderEstimateService();

  return useMutation({
    mutationFn: async (item: EstimateItem & { estimate_id: string }) => {
      const tenderEstimateItem: TenderEstimateItemDTO = {
        id: '',
        estimate_id: item.estimate_id,
        material_id: item.material_id || undefined,
        item_code: item.material_id || '',
        description: item.description || '',
        unit: 'unit',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        category: item.item_type || 'material',
        specifications: '',
        item_type: item.item_type || 'material',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return await tenderEstimateService.createTenderEstimateItem(tenderEstimateItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', estimateId] });
    }
  });
}

export function useCreateInvoiceHex(tenderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Placeholder - invoice creation from estimate not yet implemented
      console.warn('createInvoiceFromEstimate not yet implemented');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parsed-invoices', tenderId] });
    }
  });
}
