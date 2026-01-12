// Supabase Adapter for Material Repository
import { supabase } from '@/integrations/supabase/client';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { Material, MaterialCategory } from '@/domain/entities/Material';

export class SupabaseMaterialAdapter implements IMaterialRepository {
  private mapToEntity(data: any): Material {
    return new Material(
      data.id,
      data.name,
      data.description || '',
      (data.category || 'other') as MaterialCategory,
      data.unit || 'unit',
      data.price_per_unit || 0,
      data.available_quantity || 0,
      data.sku || null,
      data.ean || null,
      data.gtin || null,
      data.asin || null,
      data.image || null,
      data.coordinates_latitude && data.coordinates_longitude
        ? { latitude: data.coordinates_latitude, longitude: data.coordinates_longitude }
        : null,
      data.workspace_id || null,
      data.created_at,
      data.updated_at
    );
  }

  async findById(id: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(material: Material): Promise<void> {
    const { error } = await supabase
      .from('materials')
      .insert({
        id: material.id,
        name: material.name,
        description: material.description,
        category: material.category,
        unit: material.unit,
        price_per_unit: material.pricePerUnit,
        available_quantity: material.availableQuantity,
        sku: material.sku,
        ean: material.ean,
        gtin: material.gtin,
        asin: material.asin,
        image: material.image,
        coordinates_latitude: material.coordinates?.latitude,
        coordinates_longitude: material.coordinates?.longitude,
        workspace_id: material.workspaceId
      });

    if (error) throw new Error(`Failed to save material: ${error.message}`);
  }

  async update(id: string, data: Partial<Material>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.pricePerUnit !== undefined) updateData.price_per_unit = data.pricePerUnit;
    if (data.availableQuantity !== undefined) updateData.available_quantity = data.availableQuantity;

    const { error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`Failed to update material: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete material: ${error.message}`);
  }

  async findByCategory(category: MaterialCategory): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByWorkspace(workspaceId: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findBySku(sku: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findByEan(ean: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('ean', ean)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async search(query: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findLowStock(threshold: number): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .lte('available_quantity', threshold)
      .gt('available_quantity', 0)
      .order('available_quantity', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findOutOfStock(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('available_quantity', 0)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async getTotalValue(): Promise<number> {
    const materials = await this.findAll();
    return materials.reduce((sum, m) => sum + m.calculateTotalValue(), 0);
  }

  async getTotalValueByCategory(): Promise<Record<MaterialCategory, number>> {
    const materials = await this.findAll();
    const totals: Record<string, number> = {};
    
    materials.forEach(m => {
      totals[m.category] = (totals[m.category] || 0) + m.calculateTotalValue();
    });

    return totals as Record<MaterialCategory, number>;
  }

  async getStockSummary(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const materials = await this.findAll();
    const lowStock = await this.findLowStock(10);
    const outOfStock = await this.findOutOfStock();

    return {
      totalItems: materials.length,
      totalValue: materials.reduce((sum, m) => sum + m.calculateTotalValue(), 0),
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length
    };
  }
}
