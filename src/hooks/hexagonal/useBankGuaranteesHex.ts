/**
 * Hexagonal hooks for Bank Guarantees CRUD
 * Centralizes all bank guarantee operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BankGuaranteeFormData {
  projectId: string; // ✅ CAMELCASE: Instead of project_id
  contractorId: string; // ✅ CAMELCASE: Instead of contractor_id
  bankName: string; // ✅ CAMELCASE: Instead of bank_name
  guaranteeAmount: number; // ✅ CAMELCASE: Instead of guarantee_amount
  guaranteeType: string; // ✅ CAMELCASE: Instead of guarantee_type
  issueDate: string; // ✅ CAMELCASE: Instead of issue_date
  expiryDate: string; // ✅ CAMELCASE: Instead of expiry_date
  status: string;
  phaseId?: string; // ✅ CAMELCASE: Instead of phase_id
  
  // Legacy snake_case for backward compatibility
  project_id?: string; // Legacy snake_case for backward compatibility
  contractor_id?: string; // Legacy snake_case for backward compatibility
  bank_name?: string; // Legacy snake_case for backward compatibility
  guarantee_amount?: number; // Legacy snake_case for backward compatibility
  guarantee_type?: string; // Legacy snake_case for backward compatibility
  issue_date?: string; // Legacy snake_case for backward compatibility
  expiry_date?: string; // Legacy snake_case for backward compatibility
  phase_id?: string; // Legacy snake_case for backward compatibility
}

export interface BankGuaranteeRow {
  id: string;
  projectId: string; // ✅ CAMELCASE: Instead of project_id
  contractorId: string; // ✅ CAMELCASE: Instead of contractor_id
  bankName: string; // ✅ CAMELCASE: Instead of bank_name
  guaranteeAmount: number; // ✅ CAMELCASE: Instead of guarantee_amount
  guaranteeType: string; // ✅ CAMELCASE: Instead of guarantee_type
  issueDate: string; // ✅ CAMELCASE: Instead of issue_date
  expiryDate: string; // ✅ CAMELCASE: Instead of expiry_date
  status: string;
  phaseId?: string; // ✅ CAMELCASE: Instead of phase_id
  createdAt?: string; // ✅ CAMELCASE: Instead of created_at
  updatedAt?: string; // ✅ CAMELCASE: Instead of updated_at
  releasedAt?: string; // ✅ CAMELCASE: Instead of released_at
  
  // Legacy snake_case for backward compatibility
  project_id?: string; // Legacy snake_case for backward compatibility
  contractor_id?: string; // Legacy snake_case for backward compatibility
  bank_name?: string; // Legacy snake_case for backward compatibility
  guarantee_amount?: number; // Legacy snake_case for backward compatibility
  guarantee_type?: string; // Legacy snake_case for backward compatibility
  issue_date?: string; // Legacy snake_case for backward compatibility
  expiry_date?: string; // Legacy snake_case for backward compatibility
  phase_id?: string; // Legacy snake_case for backward compatibility
  created_at?: string; // Legacy snake_case for backward compatibility
  updated_at?: string; // Legacy snake_case for backward compatibility
  released_at?: string; // Legacy snake_case for backward compatibility
}

// Hook: Fetch all bank guarantees
export function useBankGuaranteesList() {
  return useQuery({
    queryKey: ['bank-guarantees-list'],
    queryFn: async (): Promise<BankGuaranteeRow[]> => {
      const { data, error } = await supabase
        .from('bank_guarantees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // ✅ TRANSFORM: Map snake_case database fields to camelCase
      return (data || []).map(item => ({
        id: item.id,
        projectId: item.project_id, // ✅ CAMELCASE: From project_id
        contractorId: item.contractor_id, // ✅ CAMELCASE: From contractor_id
        bankName: item.bank_name, // ✅ CAMELCASE: From bank_name
        guaranteeAmount: item.guarantee_amount, // ✅ CAMELCASE: From guarantee_amount
        guaranteeType: item.guarantee_type, // ✅ CAMELCASE: From guarantee_type
        issueDate: item.issue_date, // ✅ CAMELCASE: From issue_date
        expiryDate: item.expiry_date, // ✅ CAMELCASE: From expiry_date
        status: item.status,
        phaseId: item.phase_id, // ✅ CAMELCASE: From phase_id
        createdAt: item.created_at, // ✅ CAMELCASE: From created_at
        updatedAt: item.updated_at, // ✅ CAMELCASE: From updated_at
        releasedAt: item.released_at, // ✅ CAMELCASE: From released_at
        
        // Legacy snake_case for backward compatibility
        project_id: item.project_id,
        contractor_id: item.contractor_id,
        bank_name: item.bank_name,
        guarantee_amount: item.guarantee_amount,
        guarantee_type: item.guarantee_type,
        issue_date: item.issue_date,
        expiry_date: item.expiry_date,
        status: item.status,
        phase_id: item.phase_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        released_at: item.released_at,
      })) as BankGuaranteeRow[];
    }
  });
}

// Hook: Create bank guarantee
export function useCreateBankGuarantee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BankGuaranteeFormData) => {
      const { error } = await supabase
        .from('bank_guarantees')
        .insert({
          // ✅ TRANSFORM: camelCase to snake_case for database
          project_id: data.projectId || data.project_id, // ✅ PRIORITY: camelCase first
          contractor_id: data.contractorId || data.contractor_id, // ✅ PRIORITY: camelCase first
          bank_name: data.bankName || data.bank_name, // ✅ PRIORITY: camelCase first
          guarantee_amount: data.guaranteeAmount || data.guarantee_amount, // ✅ PRIORITY: camelCase first
          guarantee_type: data.guaranteeType || data.guarantee_type, // ✅ PRIORITY: camelCase first
          issue_date: data.issueDate || data.issue_date, // ✅ PRIORITY: camelCase first
          expiry_date: data.expiryDate || data.expiry_date, // ✅ PRIORITY: camelCase first
          status: data.status || 'active',
          phase_id: data.phaseId || data.phase_id // ✅ PRIORITY: camelCase first
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-guarantees-list'] });
    }
  });
}

// Hook: Update bank guarantee
export function useUpdateBankGuarantee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BankGuaranteeFormData }) => {
      const { error } = await supabase
        .from('bank_guarantees')
        .update({
          // ✅ TRANSFORM: camelCase to snake_case for database
          project_id: data.projectId || data.project_id, // ✅ PRIORITY: camelCase first
          contractor_id: data.contractorId || data.contractor_id, // ✅ PRIORITY: camelCase first
          bank_name: data.bankName || data.bank_name, // ✅ PRIORITY: camelCase first
          guarantee_amount: data.guaranteeAmount || data.guarantee_amount, // ✅ PRIORITY: camelCase first
          guarantee_type: data.guaranteeType || data.guarantee_type, // ✅ PRIORITY: camelCase first
          issue_date: data.issueDate || data.issue_date, // ✅ PRIORITY: camelCase first
          expiry_date: data.expiryDate || data.expiry_date, // ✅ PRIORITY: camelCase first
          status: data.status,
          phase_id: data.phaseId || data.phase_id, // ✅ PRIORITY: camelCase first
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-guarantees-list'] });
    }
  });
}

// Hook: Delete bank guarantee
export function useDeleteBankGuarantee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_guarantees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-guarantees-list'] });
    }
  });
}
