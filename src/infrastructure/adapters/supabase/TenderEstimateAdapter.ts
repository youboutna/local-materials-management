/**
 * Tender Estimate Supabase Adapter
 * Implements ITenderEstimateRepository using Supabase
 */

import { TenderEstimate, TenderEstimateItem } from '@/domain/entities/TenderEstimate';
import { ITenderEstimateRepository } from '@/domain/repositories/ITenderEstimateRepository';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { TenderEstimateFinancialData, TenderEstimateCostBreakdown } from '@/dtos/transforms/shared';

export class TenderEstimateAdapter implements ITenderEstimateRepository {
  /**
   * Create a new tender estimate
   */
  async create(estimate: Omit<TenderEstimate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenderEstimate> {
    try {
      const { data, error } = await supabase
        .from('tender_estimates')
        .insert({
          tender_id: estimate.tenderId,
          project_id: estimate.projectId,
          // `title` est la colonne réelle (non nulle) la plus proche de estimateType.
          title: estimate.estimateType || 'Estimation',
          total_materials: estimate.totalMaterialsCost,
          total_labor: estimate.totalLaborCost,
          total_equipment: estimate.totalEquipmentCost,
          subtotal: estimate.subtotal,
          tax_rate: estimate.taxRate,
          tax_amount: estimate.taxAmount,
          overhead_percentage: estimate.overheadPercentage,
          overhead_amount: estimate.overheadAmount,
          profit_percentage: estimate.profitMarginPercentage,
          profit_amount: estimate.profitMarginAmount,
          total_amount: estimate.finalTotal,
          status: estimate.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('TenderEstimateAdapter.create failed:', error);
      throw error;
    }
  }

  /**
   * Get estimate by ID
   */
  async findById(id: string): Promise<TenderEstimate | null> {
    try {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('TenderEstimateAdapter.findById failed:', error);
      throw error;
    }
  }

  /**
   * Get estimates by tender ID
   */
  async findByTenderId(tenderId: string): Promise<TenderEstimate[]> {
    try {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TenderEstimateAdapter.findByTenderId failed:', error);
      throw error;
    }
  }

  /**
   * Get estimates by project ID
   */
  async findByProjectId(projectId: string): Promise<TenderEstimate[]> {
    try {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TenderEstimateAdapter.findByProjectId failed:', error);
      throw error;
    }
  }

  /**
   * Get estimates by submitted user
   */
  async findBySubmittedBy(userId: string): Promise<TenderEstimate[]> {
    try {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('*')
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TenderEstimateAdapter.findBySubmittedBy failed:', error);
      throw error;
    }
  }

  /**
   * Get all estimates
   */
  async findAll(): Promise<TenderEstimate[]> {
    try {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TenderEstimateAdapter.findAll failed:', error);
      throw error;
    }
  }

  /**
   * Update an estimate
   */
  async update(id: string, updates: Partial<TenderEstimate>): Promise<TenderEstimate> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Map entity fields to database fields (colonnes réelles de tender_estimates)
      if (updates.tenderId) updateData.tender_id = updates.tenderId;
      if (updates.projectId) updateData.project_id = updates.projectId;
      if (updates.estimateType) updateData.title = updates.estimateType;
      if (updates.totalMaterialsCost !== undefined) updateData.total_materials = updates.totalMaterialsCost;
      if (updates.totalLaborCost !== undefined) updateData.total_labor = updates.totalLaborCost;
      if (updates.totalEquipmentCost !== undefined) updateData.total_equipment = updates.totalEquipmentCost;
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal;
      if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate;
      if (updates.taxAmount !== undefined) updateData.tax_amount = updates.taxAmount;
      if (updates.overheadPercentage !== undefined) updateData.overhead_percentage = updates.overheadPercentage;
      if (updates.overheadAmount !== undefined) updateData.overhead_amount = updates.overheadAmount;
      if (updates.profitMarginPercentage !== undefined) updateData.profit_percentage = updates.profitMarginPercentage;
      if (updates.profitMarginAmount !== undefined) updateData.profit_amount = updates.profitMarginAmount;
      if (updates.finalTotal !== undefined) updateData.total_amount = updates.finalTotal;
      if (updates.status) updateData.status = updates.status;

      // Champs sans équivalent en base (calculés côté application) : ne pas persister.
      delete updateData.tenderId; delete updateData.projectId; delete updateData.estimateType;
      delete updateData.totalMaterialsCost; delete updateData.totalLaborCost; delete updateData.totalEquipmentCost;
      delete updateData.taxRate; delete updateData.taxAmount; delete updateData.totalWithTax;
      delete updateData.discountRate; delete updateData.discountAmount;
      delete updateData.overheadPercentage; delete updateData.overheadAmount;
      delete updateData.profitMarginPercentage; delete updateData.profitMarginAmount;
      delete updateData.finalTotal; delete updateData.currency; delete updateData.createdAt; delete updateData.updatedAt;
      delete updateData.items; delete updateData.submittedBy; delete updateData.subtotal === undefined ? '' : '';

      const { data, error } = await supabase
        .from('tender_estimates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('TenderEstimateAdapter.update failed:', error);
      throw error;
    }
  }

  /**
   * Delete an estimate
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tender_estimates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('TenderEstimateAdapter.delete failed:', error);
      throw error;
    }
  }

  /**
   * Create estimate item
   */
  async createItem(item: Omit<TenderEstimateItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenderEstimateItem> {
    try {
      const anyItem = item as any;
      const { data, error } = await supabase
        .from('tender_estimate_items')
        .insert({
          estimate_id: item.estimateId,
          material_id: item.materialId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          description: item.description,
          item_type: item.itemType,
          // Structural (v10)
          item_code: anyItem.itemCode ?? null,
          unit: anyItem.unit ?? null,
          category: anyItem.category ?? null,
          specifications: anyItem.specifications ?? null,
          // Resource anchoring (v10)
          resource_kind: anyItem.resourceKind ?? anyItem.resource_kind ?? null,
          employee_qualification_id: anyItem.employeeQualificationId ?? anyItem.employee_qualification_id ?? null,
          supplier_id: anyItem.supplierId ?? anyItem.supplier_id ?? null,
          supplier_contract_ref: anyItem.supplierContractRef ?? anyItem.supplier_contract_ref ?? null,
          estimated_hours: anyItem.estimatedHours ?? anyItem.estimated_hours ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapItemRowToEntity(data);
    } catch (error) {
      console.error('TenderEstimateAdapter.createItem failed:', error);
      throw error;
    }
  }

  /**
   * Get estimate items by estimate ID
   */
  async findItemsByEstimateId(estimateId: string): Promise<TenderEstimateItem[]> {
    try {
      const { data, error } = await supabase
        .from('tender_estimate_items')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(row => this.mapItemRowToEntity(row));
    } catch (error) {
      console.error('TenderEstimateAdapter.findItemsByEstimateId failed:', error);
      throw error;
    }
  }

  /**
   * Update estimate item
   */
  async updateItem(id: string, updates: Partial<TenderEstimateItem>): Promise<TenderEstimateItem> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Map entity fields to database fields
      if (updates.estimateId) updateData.estimate_id = updates.estimateId;
      if (updates.materialId) updateData.material_id = updates.materialId;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
      if (updates.totalPrice !== undefined) updateData.total_price = updates.totalPrice;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.itemType) updateData.item_type = updates.itemType;
      const u = updates as any;
      if (u.itemCode !== undefined) updateData.item_code = u.itemCode;
      if (u.unit !== undefined) updateData.unit = u.unit;
      if (u.category !== undefined) updateData.category = u.category;
      if (u.specifications !== undefined) updateData.specifications = u.specifications;
      if (u.resourceKind !== undefined || u.resource_kind !== undefined) updateData.resource_kind = u.resourceKind ?? u.resource_kind;
      if (u.employeeQualificationId !== undefined || u.employee_qualification_id !== undefined) updateData.employee_qualification_id = u.employeeQualificationId ?? u.employee_qualification_id;
      if (u.supplierId !== undefined || u.supplier_id !== undefined) updateData.supplier_id = u.supplierId ?? u.supplier_id;
      if (u.supplierContractRef !== undefined || u.supplier_contract_ref !== undefined) updateData.supplier_contract_ref = u.supplierContractRef ?? u.supplier_contract_ref;
      if (u.estimatedHours !== undefined || u.estimated_hours !== undefined) updateData.estimated_hours = u.estimatedHours ?? u.estimated_hours;

      // Strip camelCase fields not persisted directly to avoid unknown-column errors
      delete updateData.estimateId; delete updateData.materialId; delete updateData.unitPrice;
      delete updateData.totalPrice; delete updateData.itemType; delete updateData.itemCode;
      delete updateData.resourceKind; delete updateData.employeeQualificationId;
      delete updateData.supplierId; delete updateData.supplierContractRef; delete updateData.estimatedHours;

      const { data, error } = await supabase
        .from('tender_estimate_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapItemRowToEntity(data);
    } catch (error) {
      console.error('TenderEstimateAdapter.updateItem failed:', error);
      throw error;
    }
  }

  /**
   * Delete estimate item
   */
  async deleteItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tender_estimate_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('TenderEstimateAdapter.deleteItem failed:', error);
      throw error;
    }
  }

  /**
   * Get estimate statistics
   */
  async getEstimateStats(tenderId: string): Promise<{
    totalEstimates: number;
    totalAmount: number;
    averageAmount: number;
    byStatus: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('total_amount, status')
        .eq('tender_id', tenderId);

      if (error) throw error;

      const stats = {
        totalEstimates: data.length,
        totalAmount: data.reduce((sum, item) => sum + (item.total_amount || 0), 0),
        averageAmount: data.length > 0 ? data.reduce((sum, item) => sum + (item.total_amount || 0), 0) / data.length : 0,
        byStatus: data.reduce((acc, item) => {
          const key = item.status || 'draft';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('TenderEstimateAdapter.getEstimateStats failed:', error);
      throw error;
    }
  }

  /**
   * Map database row to TenderEstimate entity
   */
  private mapRowToEntity(row: any): TenderEstimate {
    return new TenderEstimate(
      row.id,
      row.tender_id,
      row.status || 'draft',
      'MRU',
      row.title || 'standard',
      row.created_at,
      row.updated_at,
      {
        projectId: row.project_id,
        submittedBy: row.submitted_by,
        subtotal: row.subtotal || 0,
        taxAmount: row.tax_amount || 0,
        taxRate: row.tax_rate || 0,
        totalWithTax: row.total_amount || 0,
        finalTotal: row.total_amount || 0,
        totalMaterialsCost: row.total_materials || 0,
        totalLaborCost: row.total_labor || 0,
        totalEquipmentCost: row.total_equipment || 0,
        overheadPercentage: row.overhead_percentage || 0,
        overheadAmount: row.overhead_amount || 0,
        profitMarginPercentage: row.profit_percentage || 0,
        profitMarginAmount: row.profit_amount || 0,
        items: [] // Items loaded separately
      }
    );
  }

  /**
   * Map database row to TenderEstimateItem entity (with resource anchoring)
   */
  private mapItemRowToEntity(row: any): TenderEstimateItem {
    const itemCode = row.item_code || row.material_id || row.id;
    const description = row.description || itemCode || 'Item';
    const unit = row.unit || 'u';
    const quantity = Number(row.quantity) || 1;
    const unitPrice = Number(row.unit_price) || 0;
    // Constructor validates totalPrice === quantity * unitPrice — normalize.
    const totalPrice = Number((quantity * unitPrice).toFixed(2));

    const entity = new TenderEstimateItem(
      row.id,
      row.estimate_id,
      itemCode,
      description,
      unit,
      quantity || 1,
      unitPrice || 0.01,
      (quantity || 1) * (unitPrice || 0.01),
      row.category ?? undefined,
      row.specifications ?? undefined,
      row.material_id,
      row.item_type,
    );
    // Stash resource anchoring fields (schema-less passthrough).
    (entity as any).resource_kind = row.resource_kind ?? undefined;
    (entity as any).employee_qualification_id = row.employee_qualification_id ?? undefined;
    (entity as any).supplier_id = row.supplier_id ?? undefined;
    (entity as any).supplier_contract_ref = row.supplier_contract_ref ?? undefined;
    (entity as any).estimated_hours = row.estimated_hours ?? undefined;
    return entity;
  }
}
