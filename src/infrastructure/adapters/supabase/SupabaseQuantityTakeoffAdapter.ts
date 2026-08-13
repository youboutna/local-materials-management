/**
 * Supabase Quantity Takeoff Adapter
 * Implements IQuantityTakeoffRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { QuantityTakeoffWithDetails } from '@/dtos/entities/ProjectDTO';
import { IQuantityTakeoffRepository } from '@/domain/repositories/IQuantityTakeoffRepository';

export class SupabaseQuantityTakeoffAdapter implements IQuantityTakeoffRepository {
  // ============= CRUD Operations =============

  async findByProjectId(projectId: string): Promise<QuantityTakeoffWithDetails[]> {
    const { data, error } = await supabase
      .from('quantity_takeoffs')
      .select(`
        *,
        material:materials(
          id,
          name,
          unit,
          price_per_unit,
          category
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as QuantityTakeoffWithDetails[];
  }

  async create(takeoff: Partial<QuantityTakeoffWithDetails>): Promise<QuantityTakeoffWithDetails> {
    const { data, error } = await supabase
      .from('quantity_takeoffs')
      .insert(takeoff)
      .select(`
        *,
        material:materials(
          id,
          name,
          unit,
          price_per_unit,
          category
        )
      `)
      .single();

    if (error) throw error;
    return data as QuantityTakeoffWithDetails;
  }

  async update(id: string, updates: Partial<QuantityTakeoffWithDetails>): Promise<QuantityTakeoffWithDetails> {
    const { data, error } = await supabase
      .from('quantity_takeoffs')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        material:materials(
          id,
          name,
          unit,
          price_per_unit,
          category
        )
      `)
      .single();

    if (error) throw error;
    return data as QuantityTakeoffWithDetails;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('quantity_takeoffs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============= Specialized Queries =============

  async getTotalQuantityByUnit(projectId: string, unit: string): Promise<number> {
    const { data, error } = await supabase
      .from('quantity_takeoffs')
      .select('quantity')
      .eq('project_id', projectId)
      .eq('unit', unit);

    if (error) throw error;
    
    return (data || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  async getTotalValue(projectId: string): Promise<number> {
    const { data, error } = await supabase
      .from('quantity_takeoffs')
      .select(`
        quantity,
        material:materials(price_per_unit)
      `)
      .eq('project_id', projectId);

    if (error) throw error;
    
    return (data || []).reduce((sum, item) => {
      const materialPrice = item.material?.price_per_unit || 0;
      return sum + (item.quantity * materialPrice);
    }, 0);
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('quantity_takeoffs')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;
  }

  async createMany(takeoffs: any[]): Promise<QuantityTakeoffWithDetails[]> {
    const { data, error } = await supabase
      .from('quantity_takeoffs')
      .insert(takeoffs)
      .select(`
        *,
        material:materials(
          id,
          name,
          unit,
          price_per_unit,
          category
        )
      `);

    if (error) throw error;
    return (data || []) as QuantityTakeoffWithDetails[];
  }
}
