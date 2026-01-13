/**
 * Hexagonal hooks for Payment CRUD operations
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Payment {
  id: string;
  project_id: string;
  contractor_id?: string | null;
  contractor_name: string;
  contractor_contact: string;
  amount: number;
  payment_date: string;
  progress_at_payment: number;
  transaction_id: string;
  payment_method: string;
  inspection_id?: string | null;
  phase_id?: string | null;
  supporting_documents?: string[];
  receipt_url?: string;
  invoice_url?: string;
  bank_name?: string | null;
  account_number?: string | null;
  check_number?: string | null;
  mobile_number?: string | null;
  mobile_operator?: string | null;
  receiver_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentFormData {
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  contractor_contact: string;
  amount: number;
  payment_date: string;
  progress_at_payment: number;
  transaction_id: string;
  payment_method: string;
  inspection_id: string;
  phase_id: string;
  bank_name: string;
  account_number: string;
  check_number: string;
  mobile_number: string;
  mobile_operator: string;
  receiver_name: string;
  supporting_documents: string[];
  notes: string;
  purchase_order_url?: string;
  quote_url?: string;
  invoice_url?: string;
}

// Hook: Payment CRUD with real-time updates
export function usePaymentCrud() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        contractor_id: item.contractor_id || undefined,
        inspection_id: item.inspection_id || undefined,
        phase_id: item.phase_id || undefined,
        bank_name: item.bank_name || undefined,
        account_number: item.account_number || undefined,
        check_number: item.check_number || undefined,
        mobile_number: item.mobile_number || undefined,
        mobile_operator: item.mobile_operator || undefined,
        receiver_name: item.receiver_name || undefined,
      }));
      
      setPayments(transformedData as Payment[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    
    // Real-time listener
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => fetchPayments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const validatePayment = async (projectId: string, contractorId: string): Promise<boolean> => {
    try {
      const { data: paymentBlocks, error } = await supabase
        .from('payment_blocks')
        .select('*')
        .eq('project_id', projectId)
        .eq('contractor_id', contractorId)
        .is('resolved_at', null);

      if (error) {
        console.error('Error checking payment blocks:', error);
        return true;
      }

      return !(paymentBlocks && paymentBlocks.length > 0);
    } catch (error) {
      console.error('Error validating payment:', error);
      return true;
    }
  };

  const createPayment = async (formData: PaymentFormData) => {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        project_id: formData.project_id,
        contractor_id: formData.contractor_id || null,
        contractor_name: formData.contractor_name,
        contractor_contact: formData.contractor_contact,
        amount: formData.amount,
        payment_date: formData.payment_date,
        progress_at_payment: formData.progress_at_payment,
        transaction_id: formData.transaction_id,
        payment_method: formData.payment_method,
        inspection_id: formData.inspection_id || null,
        phase_id: formData.phase_id || null,
        bank_name: formData.bank_name || null,
        account_number: formData.account_number || null,
        check_number: formData.check_number || null,
        mobile_number: formData.mobile_number || null,
        mobile_operator: formData.mobile_operator || null,
        receiver_name: formData.receiver_name || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updatePayment = async (paymentId: string, formData: Partial<PaymentFormData>) => {
    const { error } = await supabase
      .from('payments')
      .update({
        contractor_name: formData.contractor_name,
        contractor_contact: formData.contractor_contact,
        amount: formData.amount,
        payment_date: formData.payment_date,
        progress_at_payment: formData.progress_at_payment,
        transaction_id: formData.transaction_id,
        payment_method: formData.payment_method,
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        check_number: formData.check_number,
        mobile_number: formData.mobile_number,
        mobile_operator: formData.mobile_operator,
        receiver_name: formData.receiver_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (error) throw error;
  };

  const deletePayment = async (paymentId: string) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;
  };

  return {
    payments,
    loading,
    fetchPayments,
    validatePayment,
    createPayment,
    updatePayment,
    deletePayment
  };
}
