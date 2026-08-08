/**
 * Hexagonal hooks for Bank Guarantees CRUD
 * Uses RepositoryFactory instead of direct Supabase calls
 */

import { BankGuaranteeStatus, BankGuaranteeType } from '@/dtos/entities/BankGuaranteeDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BankGuaranteeRow } from '@/dtos/entities/BankGuaranteeDTO';
export interface BankGuaranteeFormData {
  projectId: string;
  contractorId: string;
  contractorName: string;
  bankName: string;
  guaranteeAmount: number;
  guaranteeType: BankGuaranteeType;
  issueDate: string;
  expiryDate: string;
  status: BankGuaranteeStatus;
  phaseId?: string;
  supportingDocuments: string[];
  notes?: string;
}

function mapRowToCamelCase(item: any): BankGuaranteeRow {
  return {
    id: item.id,
    projectId: item.project_id,
    contractorId: item.contractor_id,
    contractorName: item.contractor_name || '',
    bankName: item.bank_name,
    guaranteeAmount: item.guarantee_amount,
    guaranteeType: item.guarantee_type,
    issueDate: item.issue_date,
    expiryDate: item.expiry_date,
    status: item.status,
    phaseId: item.phase_id || undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    releasedAt: item.released_at || undefined,
    // Legacy
    project_id: item.project_id,
    contractor_id: item.contractor_id,
    contractor_name: item.contractor_name,
    bank_name: item.bank_name,
    guarantee_amount: item.guarantee_amount,
    guarantee_type: item.guarantee_type,
    issue_date: item.issue_date,
    expiry_date: item.expiry_date,
    phase_id: item.phase_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    released_at: item.released_at,
  };
}

export function useBankGuaranteesListHex() {
  return useQuery({
    queryKey: ['bank-guarantees-list'],
    queryFn: async (): Promise<BankGuaranteeRow[]> => {
      const repo = RepositoryFactory.getBankGuaranteeRepository();
      const data = await repo.findAll();
      return (data || []).map(mapRowToCamelCase);
    }
  });
}

export function useCreateBankGuaranteeHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BankGuaranteeFormData) => {
      const repo = RepositoryFactory.getBankGuaranteeRepository();
      await repo.create({
        projectId: data.projectId,
        issuingBank: data.bankName,
        guaranteeAmount: data.guaranteeAmount,
        guaranteeType: data.guaranteeType,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        status: data.status || 'active',
        guaranteeNumber: `BG-${Date.now()}`,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-guarantees-list'] });
    }
  });
}

export function useUpdateBankGuaranteeHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BankGuaranteeFormData }) => {
      const repo = RepositoryFactory.getBankGuaranteeRepository();
      await repo.update(id, {
        issuing_bank: data.bankName,
        guarantee_amount: data.guaranteeAmount,
        guarantee_type: data.guaranteeType,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate,
        status: data.status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-guarantees-list'] });
    }
  });
}

export function useDeleteBankGuaranteeHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const repo = RepositoryFactory.getBankGuaranteeRepository();
      await repo.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-guarantees-list'] });
    }
  });
}