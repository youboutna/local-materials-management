/**
 * Hexagonal hooks for Phase Payments management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PhasePaymentFormData {
  amount: string;
  payment_method: string;
  payment_date: string;
  progress_at_payment: string;
  contractor_name: string;
  contractor_contact: string;
  transaction_id: string;
  supplier_id: string;
}

// Hook: Fetch phase payments
export function usePhasePayments(phaseId: string) {
  return useQuery({
    queryKey: ['phase-payments', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('phase_id', phaseId)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!phaseId
  });
}

// Hook: Add payment to phase
export function useAddPhasePayment(phaseId: string, projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: PhasePaymentFormData) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          amount: parseFloat(paymentData.amount),
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date,
          progress_at_payment: parseInt(paymentData.progress_at_payment) || 0,
          contractor_name: paymentData.contractor_name,
          contractor_contact: paymentData.contractor_contact,
          transaction_id: paymentData.transaction_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
    }
  });
}

// Hook: Delete phase payment
export function useDeletePhasePayment(phaseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-payments', phaseId] });
    }
  });
}

// Hook: Fetch supplier info for auto-fill
export function useSupplierInfo(supplierId: string | null) {
  return useQuery({
    queryKey: ['supplier-info', supplierId],
    queryFn: async () => {
      if (!supplierId) return null;
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('name, contact_person, phone, email')
        .eq('id', supplierId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId
  });
}
