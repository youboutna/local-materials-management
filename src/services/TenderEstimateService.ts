import { supabase } from "@/integrations/supabase/client";

export interface TenderEstimateDTO {
  id: string;
  tender_id: string;
  project_id?: string | null;
  estimate_type: string;
  total_materials_cost?: number | null;
  total_labor_cost?: number | null;
  total_equipment_cost?: number | null;
  subtotal?: number | null;
  tax_rate?: number | null;
  tax_amount?: number | null;
  total_with_tax?: number | null;
  overhead_percentage?: number | null;
  overhead_amount?: number | null;
  profit_margin_percentage?: number | null;
  profit_margin_amount?: number | null;
  final_total?: number | null;
  currency?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
  submitted_by?: string | null;
}

export interface TenderEstimateItemDTO {
  id: string;
  estimate_id: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string | null;
  item_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenderEstimateCreateDTO {
  tender_id: string;
  project_id?: string;
  estimate_type: string;
  total_materials_cost?: number;
  total_labor_cost?: number;
  total_equipment_cost?: number;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_with_tax?: number;
  overhead_percentage?: number;
  overhead_amount?: number;
  profit_margin_percentage?: number;
  profit_margin_amount?: number;
  final_total?: number;
  currency?: string;
  status?: string;
}

export interface TenderEstimateItemCreateDTO {
  estimate_id: string;
  material_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string;
  item_type?: string;
}

/**
 * Service for managing tender estimates (DQE - Devis Quantitatif et Estimatif)
 * Provides abstraction layer over Supabase with RLS security
 * Only the creator and admins can access the estimates for confidentiality
 */
export class TenderEstimateService {
  /**
   * Create a new tender estimate
   * Only the creator will have access via RLS
   */
  static async createEstimate(estimate: TenderEstimateCreateDTO): Promise<TenderEstimateDTO> {
    const { data, error } = await supabase
      .from('tender_estimates')
      .insert(estimate)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderEstimateDTO;
  }

  /**
   * Get estimates by tender ID
   * RLS will filter to show only user's own estimates + admin can see all
   */
  static async getEstimatesByTenderId(tenderId: string): Promise<TenderEstimateDTO[]> {
    const { data, error } = await supabase
      .from('tender_estimates')
      .select('*')
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderEstimateDTO[];
  }

  /**
   * Get estimate by ID
   * RLS will check if user is the creator or admin
   */
  static async getEstimateById(id: string): Promise<TenderEstimateDTO | null> {
    const { data, error } = await supabase
      .from('tender_estimates')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as TenderEstimateDTO | null;
  }

  /**
   * Update estimate
   * RLS will check if user is the creator or admin
   */
  static async updateEstimate(id: string, updates: Partial<TenderEstimateCreateDTO>): Promise<TenderEstimateDTO> {
    const { data, error } = await supabase
      .from('tender_estimates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderEstimateDTO;
  }

  /**
   * Delete estimate
   * RLS will check if user is the creator or admin
   */
  static async deleteEstimate(id: string): Promise<void> {
    const { error } = await supabase
      .from('tender_estimates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Create estimate item
   */
  static async createEstimateItem(item: TenderEstimateItemCreateDTO): Promise<TenderEstimateItemDTO> {
    const { data, error } = await supabase
      .from('tender_estimate_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderEstimateItemDTO;
  }

  /**
   * Get estimate items by estimate ID
   */
  static async getEstimateItems(estimateId: string): Promise<TenderEstimateItemDTO[]> {
    const { data, error } = await supabase
      .from('tender_estimate_items')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: false});
    
    if (error) throw error;
    return (data || []) as TenderEstimateItemDTO[];
  }

  /**
   * Update estimate item
   */
  static async updateEstimateItem(id: string, updates: Partial<TenderEstimateItemCreateDTO>): Promise<TenderEstimateItemDTO> {
    const { data, error } = await supabase
      .from('tender_estimate_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderEstimateItemDTO;
  }

  /**
   * Delete estimate item
   */
  static async deleteEstimateItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('tender_estimate_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Get user's own estimates (for current authenticated user)
   */
  static async getMyEstimates(): Promise<TenderEstimateDTO[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tender_estimates')
      .select('*')
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderEstimateDTO[];
  }
}
