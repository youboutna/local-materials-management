/**
 * Hooks hexagonaux — contrats d'attribution (btp.contracts + btp.contract_lines).
 * L'UI ne touche jamais Supabase : tout passe par ContractService.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getContractService } from '@/application/services/ContractService';
import type { ContractQueryFilters } from '@/domain/repositories/IContractRepository';
import type {
  ContractRecordDTO,
  CreateContractRecordDTO,
  UpdateContractRecordDTO,
} from '@/dtos/entities/ContractRecordDTO';
import type {
  ContractLineDTO,
  CreateContractLineDTO,
  UpdateContractLineDTO,
} from '@/dtos/entities/ContractLineDTO';

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

export const useTenderContractsHex = (tenderId?: string) =>
  useQuery<ContractRecordDTO[]>({
    queryKey: ['contracts', 'tender', tenderId],
    queryFn: () => getContractService().listByTender(tenderId as string),
    enabled: !!tenderId,
    staleTime: 30 * 1000,
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

export const useContractLinesHex = (contractId?: string) =>
  useQuery<ContractLineDTO[]>({
    queryKey: ['contracts', 'lines', contractId],
    queryFn: () => getContractService().listLines(contractId as string),
    enabled: !!contractId,
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

type CreateContractInput = Omit<CreateContractRecordDTO, 'contractNumber'> & { contractNumber?: string };

/** CRUD complet du contrat (création manuelle, édition, suppression, contrat signé). */
export const useContractMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['contracts'] });

  const createMutation = useMutation<ContractRecordDTO, Error, CreateContractInput>({
    mutationFn: (input) => getContractService().createManual(input),
  });
  const updateMutation = useMutation<ContractRecordDTO, Error, { id: string; patch: UpdateContractRecordDTO }>({
    mutationFn: ({ id, patch }) => getContractService().update(id, patch),
  });
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id) => getContractService().remove(id),
  });
  const signMutation = useMutation<
    ContractRecordDTO,
    Error,
    { id: string; documentId?: string | null; url?: string | null }
  >({
    mutationFn: ({ id, documentId, url }) =>
      getContractService().attachSignedDocument(id, { documentId, url }),
  });

  return {
    createContract: async (input: CreateContractInput) => {
      const result = await createMutation.mutateAsync(input);
      invalidate();
      return result;
    },
    updateContract: async (id: string, patch: UpdateContractRecordDTO) => {
      const result = await updateMutation.mutateAsync({ id, patch });
      invalidate();
      return result;
    },
    deleteContract: async (id: string) => {
      await deleteMutation.mutateAsync(id);
      invalidate();
    },
    attachSignedDocument: async (id: string, payload: { documentId?: string | null; url?: string | null }) => {
      const result = await signMutation.mutateAsync({ id, ...payload });
      invalidate();
      return result;
    },
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      signMutation.isPending,
    error:
      createMutation.error || updateMutation.error || deleteMutation.error || signMutation.error,
  };
};

/** CRUD des lignes contractuelles (prix figés). */
export const useContractLineMutations = (contractId?: string) => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['contracts', 'lines', contractId] });
    queryClient.invalidateQueries({ queryKey: ['contracts', 'detail', contractId] });
  };

  const addMutation = useMutation<ContractLineDTO, Error, CreateContractLineDTO>({
    mutationFn: (line) => getContractService().addLine(line),
  });
  const updateMutation = useMutation<ContractLineDTO, Error, { lineId: string; patch: UpdateContractLineDTO }>({
    mutationFn: ({ lineId, patch }) =>
      getContractService().updateLine(contractId as string, lineId, patch),
  });
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (lineId) => getContractService().deleteLine(contractId as string, lineId),
  });
  const importMutation = useMutation<ContractLineDTO[], Error, { estimateId: string; vatRate?: number }>({
    mutationFn: ({ estimateId, vatRate }) =>
      getContractService().importLinesFromEstimate(contractId as string, estimateId, { vatRate }),
  });

  return {
    addLine: async (line: CreateContractLineDTO) => {
      const result = await addMutation.mutateAsync(line);
      invalidate();
      return result;
    },
    updateLine: async (lineId: string, patch: UpdateContractLineDTO) => {
      const result = await updateMutation.mutateAsync({ lineId, patch });
      invalidate();
      return result;
    },
    deleteLine: async (lineId: string) => {
      await deleteMutation.mutateAsync(lineId);
      invalidate();
    },
    importFromEstimate: async (estimateId: string, vatRate?: number) => {
      const result = await importMutation.mutateAsync({ estimateId, vatRate });
      invalidate();
      return result;
    },
    isPending:
      addMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      importMutation.isPending,
    error: addMutation.error || updateMutation.error || deleteMutation.error || importMutation.error,
  };
};
