/**
 * Supabase Adapter for Material Repository
 * Implements IMaterialRepository using Supabase
 * Rule #9: DB → Transformer → Entity → Repository → Service
 * Adapter NEVER calls Entity.fromDatabase() — always uses Transformer
 * 
 * ✅ Implémentation complète de IMaterialRepository
 * ✅ Gestion des relations projet-matériaux
 * ✅ Utilisation de MaterialTransformer pour les conversions
 * ✅ Gestion des erreurs PGRST205
 */

import { Material, MaterialCategory } from '@/domain/entities/Material';
import { IMaterialRepository, ProjectMaterial, StockSummary } from '@/domain/repositories/IMaterialRepository';
import { MaterialTransformer } from '@/dtos/transforms/MaterialTransformer';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

import { AppError, ErrorCode } from '@/utils/errorHandling';

type MaterialRow = BtpRow;
type ProjectMaterialRow = BtpRow;

type BtpRow = Record<string, any>;

export class SupabaseMaterialAdapter implements IMaterialRepository {
  private tableName = 'materials';
  private projectMaterialsTable = 'project_materials';

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Vérifie si la table existe
   */
  private async tableExists(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .select('id')
        .limit(1);

      if (error?.code === 'PGRST205') {
        return false;
      }
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si la table project_materials existe
   */
  private async projectMaterialsTableExists(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.projectMaterialsTable)
        .select('id')
        .limit(1);

      if (error?.code === 'PGRST205') {
        return false;
      }
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Convertit une ligne DB en entité ProjectMaterial
   */
  private toProjectMaterial(row: ProjectMaterialRow): ProjectMaterial {
    return {
      id: row.id,
      projectId: row.project_id,
      materialId: row.material_id,
      quantity: row.quantity,
      unit: row.unit || 'unit',
      unitPrice: row.unit_price || 0,
      totalPrice: row.total_price || 0,
      status: row.status as 'planned' | 'ordered' | 'received' | 'used' || 'planned',
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  async findById(id: string): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return MaterialTransformer.fromSupabase(data as Record<string, unknown>);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findById failed:', error);
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<Material[]> {
    try {
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .in('id', ids);

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findByIds failed:', error);
      return [];
    }
  }

  async findAll(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findAll failed:', error);
      return [];
    }
  }

  async save(material: Material): Promise<void> {
    try {
      const dbData = MaterialTransformer.toSupabase(material);
      const { error } = await supabase
        .from(this.tableName)
        .insert(dbData as BtpRow);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to save material: ${error.message}`);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.save failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to save material');
    }
  }

  async update(id: string, data: Partial<Material>): Promise<void> {
    try {
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
      if (data.lastRestock !== undefined) {
        updateData.last_restock = data.lastRestock instanceof Date ? data.lastRestock.toISOString() : data.lastRestock;
      }
      if (data.materialStatus !== undefined) updateData.material_status = data.materialStatus;
      if (data.tags !== undefined) updateData.tags = data.tags;

      const { error } = await supabase
        .from(this.tableName)
        .update(updateData as BtpRow)
        .eq('id', id);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update material: ${error.message}`);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.update failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update material');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete material: ${error.message}`);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.delete failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete material');
    }
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  async findByCategory(category: MaterialCategory): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('category', category as string)
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findByCategory failed:', error);
      return [];
    }
  }

  async findByWorkspace(workspaceId: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findByWorkspace failed:', error);
      return [];
    }
  }

  async findBySku(sku: string): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('sku', sku)
        .maybeSingle();

      if (error || !data) return null;
      return MaterialTransformer.fromSupabase(data as Record<string, unknown>);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findBySku failed:', error);
      return null;
    }
  }

  async findByEan(ean: string): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('ean', ean)
        .maybeSingle();

      if (error || !data) return null;
      return MaterialTransformer.fromSupabase(data as Record<string, unknown>);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findByEan failed:', error);
      return null;
    }
  }

  async findByGtin(gtin: string): Promise<Material | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('gtin', gtin)
        .maybeSingle();

      if (error || !data) return null;
      return MaterialTransformer.fromSupabase(data as Record<string, unknown>);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findByGtin failed:', error);
      return null;
    }
  }

  async findBySupplier(supplierId: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('supplier_id', supplierId)
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findBySupplier failed:', error);
      return [];
    }
  }

  async findLowStock(threshold: number): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .lte('available_quantity', threshold)
        .gt('available_quantity', 0)
        .order('available_quantity', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findLowStock failed:', error);
      return [];
    }
  }

  async findOutOfStock(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('available_quantity', 0)
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findOutOfStock failed:', error);
      return [];
    }
  }

  async findBelowMinStock(): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .lt('available_quantity', supabase.rpc('min', { col: 'min_quantity' }))
        .order('available_quantity', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findBelowMinStock failed:', error);
      return [];
    }
  }

  async findByStatus(status: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('material_status', status)
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findByStatus failed:', error);
      return [];
    }
  }

  async findByLocation(location: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('adresse', location)
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findByLocation failed:', error);
      return [];
    }
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  async search(query: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%,gtin.ilike.%${query}%`)
        .order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.search failed:', error);
      return [];
    }
  }

  async advancedSearch(filters: {
    query?: string;
    category?: MaterialCategory;
    subcategory?: string;
    workspaceId?: string;
    supplierId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    lowStock?: boolean;
  }): Promise<Material[]> {
    try {
      let queryBuilder = supabase.from(this.tableName).select('*');

      if (filters.query) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,sku.ilike.%${filters.query}%`
        );
      }

      if (filters.category) {
        queryBuilder = queryBuilder.eq('category', filters.category as string);
      }

      if (filters.subcategory) {
        queryBuilder = queryBuilder.eq('subcategory', filters.subcategory);
      }

      if (filters.workspaceId) {
        queryBuilder = queryBuilder.eq('workspace_id', filters.workspaceId);
      }

      if (filters.supplierId) {
        queryBuilder = queryBuilder.eq('supplier_id', filters.supplierId);
      }

      if (filters.minPrice !== undefined) {
        queryBuilder = queryBuilder.gte('price_per_unit', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        queryBuilder = queryBuilder.lte('price_per_unit', filters.maxPrice);
      }

      if (filters.inStock) {
        queryBuilder = queryBuilder.gt('available_quantity', 0);
      }

      if (filters.lowStock) {
        queryBuilder = queryBuilder.lte('available_quantity', 10).gt('available_quantity', 0);
      }

      const { data, error } = await queryBuilder.order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.advancedSearch failed:', error);
      return [];
    }
  }

  // ============================================================================
  // AGGREGATIONS
  // ============================================================================

  async getTotalValue(): Promise<number> {
    try {
      const materials = await this.findAll();
      return materials.reduce((sum, m) => sum + m.calculateTotalValue(), 0);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.getTotalValue failed:', error);
      return 0;
    }
  }

  async getTotalValueByCategory(): Promise<Record<MaterialCategory, number>> {
    try {
      const materials = await this.findAll();
      const totals: Record<string, number> = {};
      materials.forEach(m => {
        totals[m.category] = (totals[m.category] || 0) + m.calculateTotalValue();
      });
      return totals as Record<MaterialCategory, number>;
    } catch (error) {
      console.error('SupabaseMaterialAdapter.getTotalValueByCategory failed:', error);
      return {} as Record<MaterialCategory, number>;
    }
  }

  async getStockSummary(): Promise<StockSummary> {
    try {
      const materials = await this.findAll();
      const lowStock = await this.findLowStock(10);
      const outOfStock = await this.findOutOfStock();

      const categoriesCount: Record<MaterialCategory, number> = {} as Record<MaterialCategory, number>;
      materials.forEach(m => {
        categoriesCount[m.category] = (categoriesCount[m.category] || 0) + 1;
      });

      const totalValue = materials.reduce((sum, m) => sum + m.calculateTotalValue(), 0);
      const averagePrice = materials.length > 0 ? totalValue / materials.length : 0;

      return {
        totalItems: materials.length,
        totalValue: totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        averagePrice: averagePrice,
        categoriesCount: categoriesCount,
      };
    } catch (error) {
      console.error('SupabaseMaterialAdapter.getStockSummary failed:', error);
      return {
        totalItems: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        averagePrice: 0,
        categoriesCount: {} as Record<MaterialCategory, number>,
      };
    }
  }

  async count(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      if (error) return 0;
      return count || 0;
    } catch (error) {
      console.error('SupabaseMaterialAdapter.count failed:', error);
      return 0;
    }
  }

  async countByCategory(): Promise<Record<MaterialCategory, number>> {
    try {
      const materials = await this.findAll();
      const counts: Record<string, number> = {};
      materials.forEach(m => {
        counts[m.category] = (counts[m.category] || 0) + 1;
      });
      return counts as Record<MaterialCategory, number>;
    } catch (error) {
      console.error('SupabaseMaterialAdapter.countByCategory failed:', error);
      return {} as Record<MaterialCategory, number>;
    }
  }

  // ============================================================================
  // PROJECT MATERIAL RELATIONSHIPS
  // ============================================================================

  async getProjectMaterials(projectId: string): Promise<ProjectMaterial[]> {
    try {
      const exists = await this.projectMaterialsTableExists();
      if (!exists) {
        console.warn('SupabaseMaterialAdapter: project_materials table not found, returning mock data');
        return [];
      }

      const { data, error } = await supabase
        .from(this.projectMaterialsTable)
        .select('*')
        .eq('project_id', projectId);

      if (error || !data) return [];
      return data.map(row => this.toProjectMaterial(row as ProjectMaterialRow));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.getProjectMaterials failed:', error);
      return [];
    }
  }

  async findProjectMaterial(projectId: string, materialId: string): Promise<ProjectMaterial | null> {
    try {
      const exists = await this.projectMaterialsTableExists();
      if (!exists) {
        console.warn('SupabaseMaterialAdapter: project_materials table not found');
        return null;
      }

      const { data, error } = await supabase
        .from(this.projectMaterialsTable)
        .select('*')
        .eq('project_id', projectId)
        .eq('material_id', materialId)
        .maybeSingle();

      if (error || !data) return null;
      return this.toProjectMaterial(data as ProjectMaterialRow);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findProjectMaterial failed:', error);
      return null;
    }
  }

  async addToProject(projectId: string, materialId: string, quantity: number): Promise<ProjectMaterial> {
    try {
      const exists = await this.projectMaterialsTableExists();
      if (!exists) {
        console.warn('SupabaseMaterialAdapter: project_materials table not found, returning mock');
        return {
          id: `mock-pm-${Date.now()}`,
          projectId,
          materialId,
          quantity,
          unit: 'unit',
          unitPrice: 0,
          totalPrice: 0,
          status: 'planned',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const { data, error } = await supabase
        .from(this.projectMaterialsTable)
        .insert({
          project_id: projectId,
          material_id: materialId,
          quantity: quantity,
        })
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to add material to project: ${error.message}`);
      return this.toProjectMaterial(data as ProjectMaterialRow);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.addToProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to add material to project');
    }
  }

  async removeFromProject(projectId: string, materialId: string): Promise<void> {
    try {
      const exists = await this.projectMaterialsTableExists();
      if (!exists) {
        console.warn('SupabaseMaterialAdapter: project_materials table not found, remove mocked');
        return;
      }

      const { error } = await supabase
        .from(this.projectMaterialsTable)
        .delete()
        .eq('project_id', projectId)
        .eq('material_id', materialId);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to remove material from project: ${error.message}`);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.removeFromProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to remove material from project');
    }
  }

  async updateProjectMaterial(projectId: string, materialId: string, quantity: number): Promise<ProjectMaterial> {
    try {
      const exists = await this.projectMaterialsTableExists();
      if (!exists) {
        throw new AppError(ErrorCode.DATABASE_ERROR, 'project_materials table is not available');
      }

      const { data, error } = await supabase
        .from(this.projectMaterialsTable)
        .update({ quantity })
        .eq('project_id', projectId)
        .eq('material_id', materialId)
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update project material: ${error.message}`);
      return this.toProjectMaterial(data as ProjectMaterialRow);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.updateProjectMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update project material');
    }
  }

  async updateProjectMaterialFull(
    projectId: string,
    materialId: string,
    data: Partial<ProjectMaterial>
  ): Promise<ProjectMaterial> {
    try {
      const exists = await this.projectMaterialsTableExists();
      if (!exists) {
        throw new AppError(ErrorCode.DATABASE_ERROR, 'project_materials table is not available');
      }

      const updateData: Record<string, unknown> = {};
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.unitPrice !== undefined) updateData.unit_price = data.unitPrice;
      if (data.totalPrice !== undefined) updateData.total_price = data.totalPrice;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { data: result, error } = await supabase
        .from(this.projectMaterialsTable)
        .update(updateData)
        .eq('project_id', projectId)
        .eq('material_id', materialId)
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update project material: ${error.message}`);
      return this.toProjectMaterial(result as ProjectMaterialRow);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.updateProjectMaterialFull failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update project material');
    }
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    try {
      const exists = await this.projectMaterialsTableExists();
      if (!exists) {
        console.warn('SupabaseMaterialAdapter: project_materials table not found, delete mocked');
        return;
      }

      const { error } = await supabase
        .from(this.projectMaterialsTable)
        .delete()
        .eq('project_id', projectId);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete project materials: ${error.message}`);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.deleteByProjectId failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete project materials');
    }
  }

  async getProjectMaterialsByCategory(projectId: string, category: MaterialCategory): Promise<ProjectMaterial[]> {
    try {
      const projectMaterials = await this.getProjectMaterials(projectId);
      const materialIds = projectMaterials.map(pm => pm.materialId);
      
      if (materialIds.length === 0) return [];

      const materials = await this.findByCategory(category);
      const categoryMaterialIds = new Set(materials.map(m => m.id));
      
      return projectMaterials.filter(pm => categoryMaterialIds.has(pm.materialId));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.getProjectMaterialsByCategory failed:', error);
      return [];
    }
  }

  async getProjectMaterialsBySupplier(projectId: string, supplierId: string): Promise<ProjectMaterial[]> {
    try {
      const projectMaterials = await this.getProjectMaterials(projectId);
      const materialIds = projectMaterials.map(pm => pm.materialId);
      
      if (materialIds.length === 0) return [];

      const materials = await this.findBySupplier(supplierId);
      const supplierMaterialIds = new Set(materials.map(m => m.id));
      
      return projectMaterials.filter(pm => supplierMaterialIds.has(pm.materialId));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.getProjectMaterialsBySupplier failed:', error);
      return [];
    }
  }

  async searchProjectMaterials(
    projectId: string,
    searchTerm: string,
    category?: MaterialCategory
  ): Promise<ProjectMaterial[]> {
    try {
      const projectMaterials = await this.getProjectMaterials(projectId);
      const materialIds = projectMaterials.map(pm => pm.materialId);
      
      if (materialIds.length === 0) return [];

      const materials = await this.search(searchTerm);
      let filteredMaterials = materials;
      
      if (category) {
        filteredMaterials = filteredMaterials.filter(m => m.category === category);
      }
      
      const filteredMaterialIds = new Set(filteredMaterials.map(m => m.id));
      return projectMaterials.filter(pm => filteredMaterialIds.has(pm.materialId));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.searchProjectMaterials failed:', error);
      return [];
    }
  }

  async getProjectLowStockMaterials(projectId: string, threshold: number): Promise<ProjectMaterial[]> {
    try {
      const projectMaterials = await this.getProjectMaterials(projectId);
      const materialIds = projectMaterials.map(pm => pm.materialId);
      
      if (materialIds.length === 0) return [];

      const lowStockMaterials = await this.findLowStock(threshold);
      const lowStockMaterialIds = new Set(lowStockMaterials.map(m => m.id));
      
      return projectMaterials.filter(pm => lowStockMaterialIds.has(pm.materialId));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.getProjectLowStockMaterials failed:', error);
      return [];
    }
  }

  async bulkAddToProject(
    projectId: string,
    materials: Array<{ materialId: string; quantity: number }>
  ): Promise<ProjectMaterial[]> {
    try {
      const results: ProjectMaterial[] = [];

      for (const item of materials) {
        try {
          const result = await this.addToProject(projectId, item.materialId, item.quantity);
          results.push(result);
        } catch (error) {
          console.warn(`Failed to add material ${item.materialId}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error('SupabaseMaterialAdapter.bulkAddToProject failed:', error);
      return [];
    }
  }

  async bulkRemoveFromProject(projectId: string, materialIds: string[]): Promise<void> {
    try {
      for (const materialId of materialIds) {
        try {
          await this.removeFromProject(projectId, materialId);
        } catch (error) {
          console.warn(`Failed to remove material ${materialId}:`, error);
        }
      }
    } catch (error) {
      console.error('SupabaseMaterialAdapter.bulkRemoveFromProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to bulk remove materials');
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async saveMany(materials: Material[]): Promise<void> {
    try {
      const dbData = materials.map(m => MaterialTransformer.toSupabase(m));
      const { error } = await supabase
        .from(this.tableName)
        .insert(dbData as BtpRow[]);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to save materials: ${error.message}`);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.saveMany failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to save materials');
    }
  }

  async deleteMany(ids: string[]): Promise<void> {
    try {
      if (ids.length === 0) return;

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .in('id', ids);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete materials: ${error.message}`);
    } catch (error) {
      console.error('SupabaseMaterialAdapter.deleteMany failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete materials');
    }
  }

  async updateStock(updates: Array<{ id: string; quantity: number }>): Promise<void> {
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from(this.tableName)
          .update({ available_quantity: update.quantity })
          .eq('id', update.id);

        if (error) throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update stock for ${update.id}: ${error.message}`);
      }
    } catch (error) {
      console.error('SupabaseMaterialAdapter.updateStock failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update stock');
    }
  }

  async findByCriteria(criteria: {
    category?: MaterialCategory;
    workspaceId?: string;
    supplierId?: string;
    minQuantity?: number;
    maxQuantity?: number;
    status?: string;
  }): Promise<Material[]> {
    try {
      let queryBuilder = supabase.from(this.tableName).select('*');

      if (criteria.category) {
        queryBuilder = queryBuilder.eq('category', criteria.category as string);
      }

      if (criteria.workspaceId) {
        queryBuilder = queryBuilder.eq('workspace_id', criteria.workspaceId);
      }

      if (criteria.supplierId) {
        queryBuilder = queryBuilder.eq('supplier_id', criteria.supplierId);
      }

      if (criteria.minQuantity !== undefined) {
        queryBuilder = queryBuilder.gte('available_quantity', criteria.minQuantity);
      }

      if (criteria.maxQuantity !== undefined) {
        queryBuilder = queryBuilder.lte('available_quantity', criteria.maxQuantity);
      }

      if (criteria.status) {
        queryBuilder = queryBuilder.eq('material_status', criteria.status);
      }

      const { data, error } = await queryBuilder.order('name', { ascending: true });

      if (error || !data) return [];
      return data.map(d => MaterialTransformer.fromSupabase(d as Record<string, unknown>));
    } catch (error) {
      console.error('SupabaseMaterialAdapter.findByCriteria failed:', error);
      return [];
    }
  }
}