/**
 * Hexagonal hooks for Bank Guarantees CRUD
 * Uses RepositoryFactory instead of direct Supabase calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface BankGuaranteeFormData {
  projectId: string;
  contractorId: string;
  bankName: string;
  guaranteeAmount: number;
  guaranteeType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  phaseId?: string;
  notes?: string;
}

export interface BankGuaranteeRow {
  id: string;
  projectId: string;
  contractorId: string;
  bankName: string;
  guaranteeAmount: number;
  guaranteeType: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  phaseId?: string;
  createdAt?: string;
  updatedAt?: string;
  releasedAt?: string;
  notes?: string;
  supportingDocuments?: string[];
  // Legacy snake_case for backward compatibility
  project_id?: string;
  contractor_id?: string;
  bank_name?: string;
  guarantee_amount?: number;
  guarantee_type?: string;
  issue_date?: string;
  expiry_date?: string;
  phase_id?: string;
  created_at?: string;
  updated_at?: string;
  released_at?: string;
}

function mapRowToCamelCase(item: any): BankGuaranteeRow {
  return {
    id: item.id,
    projectId: item.project_id,
    contractorId: item.contractor_id,
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

export function useBankGuaranteesList() {
  return useQuery({
    queryKey: ['bank-guarantees-list'],
    queryFn: async (): Promise<BankGuaranteeRow[]> => {
      const repo = RepositoryFactory.getBankGuaranteeRepository();
      const data = await repo.findAll();
      return (data || []).map(mapRowToCamelCase);
    }
  });
}

export function useCreateBankGuarantee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BankGuaranteeFormData) => {
      const repo = RepositoryFactory.getBankGuaranteeRepository();
      await repo.create({
        project_id: data.projectId,
        contractor_id: data.contractorId,
        bank_name: data.bankName,
        guarantee_amount: data.guaranteeAmount,
        guarantee_type: data.guaranteeType,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate,
        status: data.status || 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-guarantees-list'] });
    }
  });
}

export function useUpdateBankGuarantee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BankGuaranteeFormData }) => {
      const repo = RepositoryFactory.getBankGuaranteeRepository();
      await repo.update(id, {
        project_id: data.projectId,
        contractor_id: data.contractorId,
        bank_name: data.bankName,
        guarantee_amount: data.guaranteeAmount,
        guarantee_type: data.guaranteeType,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-guarantees-list'] });
    }
  });
}

export function useDeleteBankGuarantee() {
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