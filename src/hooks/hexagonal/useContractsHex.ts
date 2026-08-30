/**
 * Hooks hexagonaux — contrats d'attribution (btp.contracts).
 * L'UI ne touche jamais Supabase : tout passe par ContractService.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getContractService } from '@/application/services/ContractService';
import type { ContractQueryFilters } from '@/domain/repositories/IContractRepository';
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

export const useContractsHex = (filters: ContractQueryFilters = {}) =>
  useQuery<ContractRecordDTO[]>({
    queryKey: ['contracts', 'list', filters],
    queryFn: () => getContractService().listAll(filters),
    staleTime: 30 * 1000,
  });

export const useContractHex = (id?: string) =>
  useQuery<ContractRecordDTO | null>({
    queryKey: ['contracts', 'detail', id],
    queryFn: () => getContractService().getById(id as string),
    enabled: !!id,
  });

export const useContractStatusMutation = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<ContractRecordDTO, Error, { id: string; status: string }>({
    mutationFn: ({ id, status }) => getContractService().changeStatus(id, status),
  });

  return {
    changeStatus: async (id: string, status: string) => {
      const result = await mutation.mutateAsync({ id, status });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      return result;
    },
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
