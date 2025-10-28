import { supabase } from "@/integrations/supabase/client";

export interface SupplierDTO {
  id: string;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
}

/**
 * Service for managing suppliers with DTO pattern
 * Provides abstraction layer over Supabase
 */
export class SupplierService {
  /**
   * Get all suppliers
   */
  static async getAllSuppliers(): Promise<SupplierDTO[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, contact_person, email, phone')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(id: string): Promise<SupplierDTO | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, contact_person, email, phone')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Search suppliers by name
   */
  static async searchSuppliers(searchTerm: string): Promise<SupplierDTO[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, contact_person, email, phone')
      .ilike('name', `%${searchTerm}%`)
      .order('name')
      .limit(20);
    
    if (error) throw error;
    return data || [];
  }
}
