import { supabase } from "@/integrations/supabase/client";

export interface EmployeeDTO {
  id: string;
  full_name: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  is_active?: boolean | null;
}

/**
 * Service for managing employees with DTO pattern
 * Provides abstraction layer over Supabase
 */
export class EmployeeService {
  /**
   * Get all active employees
   */
  static async getAllEmployees(searchTerm?: string): Promise<EmployeeDTO[]> {
    let query = supabase
      .from('employees')
      .select('id, full_name, position, email, phone, department, is_active')
      .eq('is_active', true);

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.order('full_name');
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string): Promise<EmployeeDTO | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, position, email, phone, department, is_active')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Search employees by name or position
   */
  static async searchEmployees(searchTerm: string): Promise<EmployeeDTO[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, position, email, phone, department, is_active')
      .eq('is_active', true)
      .or(`full_name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`)
      .order('full_name')
      .limit(20);
    
    if (error) throw error;
    return data || [];
  }
}
