/**
 * Hexagonal hooks for Bank Guarantees CRUD
 * Centralizes all bank guarantee operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BankGuaranteeFormData {
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  bank_name: string;
  guarantee_amount: number;
  guarantee_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  supporting_documents?: string[];
  notes?: string;
}

export interface BankGuaranteeRow {
  id: string;
  project_id: string;
  contractor_id: string;
  contractor_name?: string;
  bank_name: string;
  guarantee_amount: number;
  guarantee_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  supporting_documents?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
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
      return (data || []).map(g => ({
        ...g,
        contractor_name: (g as any).contractor_name || 'N/A'
      }));
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
          project_id: data.project_id,
          contractor_id: data.contractor_id,
          bank_name: data.bank_name,
          guarantee_amount: data.guarantee_amount,
          guarantee_type: data.guarantee_type,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date,
          status: data.status
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
          project_id: data.project_id,
          contractor_id: data.contractor_id,
          bank_name: data.bank_name,
          guarantee_amount: data.guarantee_amount,
          guarantee_type: data.guarantee_type,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date,
          status: data.status,
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
