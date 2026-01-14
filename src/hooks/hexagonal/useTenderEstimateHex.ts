/**
 * Hexagonal hooks for Tender Quantitative Estimate
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface TenderEstimate {
  id?: string;
  tender_id: string;
  project_id?: string | null;
  estimate_type: string;
  total_materials_cost: number | null;
  total_labor_cost: number | null;
  total_equipment_cost: number | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total_with_tax: number | null;
  overhead_percentage: number | null;
  overhead_amount: number | null;
  profit_margin_percentage: number | null;
  profit_margin_amount: number | null;
  final_total: number | null;
  currency: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface EstimateItem {
  id?: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string | null;
  item_type: string | null;
}

// Hooks
export function useTenderEstimatesHex(tenderId: string) {
  return useQuery({
    queryKey: ['tender-estimates', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });
}

export function useEstimateItemsHex(estimateId: string | null) {
  return useQuery({
    queryKey: ['estimate-items', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];

      const { data, error } = await supabase
        .from('tender_estimate_items')
        .select(`
          *,
          material:materials(name, unit)
        `)
        .eq('estimate_id', estimateId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!estimateId
  });
}

export function useMaterialsForEstimateHex() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, price_per_unit, unit')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });
}

export function useParsedInvoicesHex(tenderId: string) {
  return useQuery({
    queryKey: ['parsed-invoices', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });
}

export function useCreateTenderEstimateHex(tenderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (estimate: Omit<TenderEstimate, 'id'>) => {
      const { data, error } = await supabase
        .from('tender_estimates')
        .insert([estimate])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-estimates', tenderId] });
    }
  });
}

export function useAddEstimateItemHex(estimateId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: EstimateItem & { estimate_id: string }) => {
      const { data, error } = await supabase
        .from('tender_estimate_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('parsed_invoices')
        .insert([{
          tender_id: tenderId,
          file_name: 'Nouvelle facture',
          parsing_status: 'manual',
          total_amount: 0,
          invoice_date: new Date().toISOString().split('T')[0],
          items: [],
          parsed_data: {
            manual_creation: true,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parsed-invoices', tenderId] });
    }
  });
}
