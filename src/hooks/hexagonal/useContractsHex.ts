/**
 * Hooks hexagonaux — contrats d'attribution (btp.contracts).
 * L'UI ne touche jamais Supabase : tout passe par ContractService.
 */
import { useQuery } from '@tanstack/react-query';
import { getContractService } from '@/application/services/ContractService';
import type { ContractRecordDTO } from '@/dtos/entities/ContractRecordDTO';

export const useSupplierContractsHex = (supplierId?: string) =>
  useQuery<ContractRecordDTO[]>({
    queryKey: ['contracts', 'supplier', supplierId],
    queryFn: () => getContractService().listBySupplier(supplierId as string),
    enabled: !!supplierId,
    staleTime: 60 * 1000,
  });

export const useProjectContractsHex = (projectId?: string) =>
  useQuery<ContractRecordDTO[]>({
    queryKey: ['contracts', 'project', projectId],
    queryFn: () => getContractService().listByProject(projectId as string),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });
