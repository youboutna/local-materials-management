/**
 * Supabase Adapter for Material Repository
 * Implements IMaterialRepository using Supabase
 * Rule #9: DB → Transformer → Entity → Repository → Service
 * Adapter NEVER calls Entity.fromDatabase() — always uses Transformer
 */
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { Material, MaterialCategory } from '@/domain/entities/Material';
import { MaterialTransformer } from '@/dtos/transforms/MaterialTransformer';
import { Database } from '@/integrations/supabase/types';

type MaterialRow = Database['public']['Tables']['materials']['Row'];

interface ProjectMaterialData {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  material: Material | null;
}

export class SupabaseMaterialAdapter implements IMaterialRepository {
  async findById(id: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return MaterialTransformer.fromSupabase(data as Record<string, unknown>);
  }

  async findAll(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
  }

  async save(material: Material): Promise<void> {
    const dbData = MaterialTransformer.toSupabase(material);
    const { error } = await supabase.from('materials').insert(dbData as Database['public']['Tables']['materials']['Insert']);
    if (error) throw new Error(`Failed to save material: ${error.message}`);
  }

  async update(id: string, data: Partial<Material>): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.minQuantity !== undefined) updateData.min_quantity = data.minQuantity;
    if (data.pricePerUnit !== undefined) updateData.price_per_unit = data.pricePerUnit;
    if (data.availableQuantity !== undefined) updateData.available_quantity = data.availableQuantity;
    if (data.workspaceId !== undefined) updateData.workspace_id = data.workspaceId;
    if (data.originLocation !== undefined) updateData.origin_location = data.originLocation;
    if (data.adresse !== undefined) updateData.adresse = data.adresse;
    if (data.forme !== undefined) updateData.forme = data.forme;
    if (data.localisation !== undefined) updateData.localisation = data.localisation;
    if (data.coordinatesLatitude !== undefined) updateData.coordinates_latitude = data.coordinatesLatitude;
    if (data.coordinatesLongitude !== undefined) updateData.coordinates_longitude = data.coordinatesLongitude;
    if (data.gtin !== undefined) updateData.gtin = data.gtin;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.ean !== undefined) updateData.ean = data.ean;
    if (data.asin !== undefined) updateData.asin = data.asin;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.multilangLabels !== undefined) updateData.multilang_labels = data.multilangLabels;
    if (data.supplier !== undefined) updateData.supplier = data.supplier;
    if (data.timeline !== undefined) updateData.timeline = data.timeline;
    if (data.lastRestock !== undefined) updateData.last_restock = data.lastRestock instanceof Date ? data.lastRestock.toISOString() : data.lastRestock;
    if (data.materialStatus !== undefined) updateData.material_status = data.materialStatus;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const { error } = await supabase
      .from('materials')
      .update(updateData as Database['public']['Tables']['materials']['Update'])
      .eq('id', id);

    if (error) throw new Error(`Failed to update material: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete material: ${error.message}`);
  }

  async findByCategory(category: MaterialCategory): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('category', category as string)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
  }

  async findByWorkspace(workspaceId: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
  }

  async findBySku(sku: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error || !data) return null;
    return MaterialTransformer.fromSupabase(data as Record<string, unknown>);
  }

  async findByEan(ean: string): Promise<Material | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('ean', ean)
      .single();

    if (error || !data) return null;
    return MaterialTransformer.fromSupabase(data as Record<string, unknown>);
  }

  async search(query: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
  }

  async findLowStock(threshold: number): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .lte('available_quantity', threshold)
      .gt('available_quantity', 0)
      .order('available_quantity', { ascending: true });

    if (error || !data) return [];
    return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
  }

  async findOutOfStock(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('available_quantity', 0)
      .order('name', { ascending: true });

    if (error || !data) return [];
    return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
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
      outOfStockCount: outOfStock.length,
    };
  }

  async getProjectMaterials(projectId: string): Promise<ProjectMaterialData[]> {
    const { data, error } = await supabase
      .from('project_materials')
      .select('*, materials(*)')
      .eq('project_id', projectId);

    if (error) throw error;
    return (data || []).map((pm: Record<string, unknown>) => ({
      id: pm.id as string,
      projectId: pm.project_id as string,
      materialId: pm.material_id as string,
      quantity: pm.quantity as number,
      material: pm.materials ? MaterialTransformer.fromSupabase(pm.materials as Record<string, unknown>) : null,
    }));
  }

  async addMaterialToProject(projectId: string, materialId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('project_materials')
      .insert({ project_id: projectId, material_id: materialId, quantity });
    if (error) throw error;
  }

  async removeMaterialFromProject(projectId: string, materialId: string): Promise<void> {
    const { error } = await supabase
      .from('project_materials')
      .delete()
      .eq('project_id', projectId)
      .eq('material_id', materialId);
    if (error) throw error;
  }

  async updateProjectMaterialQuantity(projectId: string, materialId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('project_materials')
      .update({ quantity })
      .eq('project_id', projectId)
      .eq('material_id', materialId);
    if (error) throw error;
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('project_materials')
      .delete()
      .eq('project_id', projectId);
    if (error) throw error;
  }
}
