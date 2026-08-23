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
        estimateId: '',
        materialId: material.id,
        itemCode: material.name || '',
        description: material.description || '',
        unit: material.unit || '',
        quantity: 0,
        unitPrice: material.pricePerUnit || 0,
        totalPrice: 0,
        category: material.category || '',
        specifications: '',
        itemType: 'material',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
        estimateId: item.estimate_id,
        materialId: item.material_id || undefined,
        itemCode: item.material_id || '',
        description: item.description || '',
        unit: 'unit',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        category: item.item_type || 'material',
        specifications: '',
        itemType: item.item_type || 'material',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
