/**
 * TenderEstimateService - In-memory implementation
 * Uses local storage while database tables are pending migration
 */

import { TenderEstimate, TenderEstimateItem } from '@/domain/entities/PerformanceMonitoring';

// In-memory stores
const estimatesStore = new Map<string, TenderEstimate>();
const estimateItemsStore = new Map<string, TenderEstimateItem>();

export interface TenderEstimateDTO {
  id: string;
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

export interface TenderEstimateItemDTO {
  id: string;
  estimate_id: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string | null;
  item_type: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TenderEstimateCreateDTO {
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
  status?: string;
}

export interface TenderEstimateItemCreateDTO {
  estimate_id: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description?: string | null;
  item_type?: string | null;
}

export class TenderEstimateService {
  /**
   * Create a new tender estimate
   */
  static async createEstimate(estimate: TenderEstimateCreateDTO): Promise<TenderEstimateDTO> {
    try {
      const id = `estimate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newEstimate: TenderEstimateDTO = {
        id,
        tender_id: estimate.tender_id,
        project_id: estimate.project_id || null,
        estimate_type: estimate.estimate_type,
        total_materials_cost: estimate.total_materials_cost || null,
        total_labor_cost: estimate.total_labor_cost || null,
        total_equipment_cost: estimate.total_equipment_cost || null,
        subtotal: estimate.subtotal || null,
        tax_rate: estimate.tax_rate || null,
        tax_amount: estimate.tax_amount || null,
        total_with_tax: estimate.total_with_tax || null,
        overhead_percentage: estimate.overhead_percentage || null,
        overhead_amount: estimate.overhead_amount || null,
        profit_margin_percentage: estimate.profit_margin_percentage || null,
        profit_margin_amount: estimate.profit_margin_amount || null,
        final_total: estimate.final_total || null,
        currency: estimate.currency || 'MRU',
        status: estimate.status || 'draft',
        created_at: now,
        updated_at: now
      };

      estimatesStore.set(id, newEstimate as unknown as TenderEstimate);
      return newEstimate;
    } catch (error) {
      console.error('Error creating estimate:', error);
      throw new Error(`Failed to create estimate: ${(error as Error).message}`);
    }
  }

  /**
   * Get estimates by tender ID
   */
  static async getEstimatesByTenderId(tenderId: string): Promise<TenderEstimateDTO[]> {
    try {
      const estimates: TenderEstimateDTO[] = [];
      estimatesStore.forEach((estimate) => {
        const dto = estimate as unknown as TenderEstimateDTO;
        if (dto.tender_id === tenderId) {
          estimates.push(dto);
        }
      });
      return estimates;
    } catch (error) {
      console.error('Error getting estimates by tender ID:', error);
      throw new Error(`Failed to get estimates by tender ID: ${(error as Error).message}`);
    }
  }

  /**
   * Get estimate by ID
   */
  static async getEstimateById(id: string): Promise<TenderEstimateDTO | null> {
    try {
      const estimate = estimatesStore.get(id);
      return estimate ? (estimate as unknown as TenderEstimateDTO) : null;
    } catch (error) {
      console.error('Error getting estimate by ID:', error);
      throw new Error(`Failed to get estimate by ID: ${(error as Error).message}`);
    }
  }

  /**
   * Update estimate
   */
  static async updateEstimate(id: string, updates: Partial<TenderEstimateCreateDTO>): Promise<TenderEstimateDTO> {
    try {
      const existing = estimatesStore.get(id);
      if (!existing) {
        throw new Error('Estimate not found');
      }

      const updatedEstimate = {
        ...(existing as unknown as TenderEstimateDTO),
        ...updates,
        updated_at: new Date().toISOString()
      };

      estimatesStore.set(id, updatedEstimate as unknown as TenderEstimate);
      return updatedEstimate;
    } catch (error) {
      console.error('Error updating estimate:', error);
      throw new Error(`Failed to update estimate: ${(error as Error).message}`);
    }
  }

  /**
   * Delete estimate
   */
  static async deleteEstimate(id: string): Promise<void> {
    try {
      estimatesStore.delete(id);
      // Also delete related items
      estimateItemsStore.forEach((item, itemId) => {
        const dto = item as unknown as TenderEstimateItemDTO;
        if (dto.estimate_id === id) {
          estimateItemsStore.delete(itemId);
        }
      });
    } catch (error) {
      console.error('Error deleting estimate:', error);
      throw new Error(`Failed to delete estimate: ${(error as Error).message}`);
    }
  }

  /**
   * Create estimate item
   */
  static async createEstimateItem(item: TenderEstimateItemCreateDTO): Promise<TenderEstimateItemDTO> {
    try {
      const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newItem: TenderEstimateItemDTO = {
        id,
        estimate_id: item.estimate_id,
        material_id: item.material_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        description: item.description || null,
        item_type: item.item_type || null,
        created_at: now,
        updated_at: now
      };

      estimateItemsStore.set(id, newItem as unknown as TenderEstimateItem);
      return newItem;
    } catch (error) {
      console.error('Error creating estimate item:', error);
      throw new Error(`Failed to create estimate item: ${(error as Error).message}`);
    }
  }

  /**
   * Get estimate items by estimate ID
   */
  static async getEstimateItems(estimateId: string): Promise<TenderEstimateItemDTO[]> {
    try {
      const items: TenderEstimateItemDTO[] = [];
      estimateItemsStore.forEach((item) => {
        const dto = item as unknown as TenderEstimateItemDTO;
        if (dto.estimate_id === estimateId) {
          items.push(dto);
        }
      });
      return items;
    } catch (error) {
      console.error('Error getting estimate items:', error);
      throw new Error(`Failed to get estimate items: ${(error as Error).message}`);
    }
  }

  /**
   * Update estimate item
   */
  static async updateEstimateItem(id: string, updates: Partial<TenderEstimateItemCreateDTO>): Promise<TenderEstimateItemDTO> {
    try {
      const existing = estimateItemsStore.get(id);
      if (!existing) {
        throw new Error('Estimate item not found');
      }

      const updatedItem = {
        ...(existing as unknown as TenderEstimateItemDTO),
        ...updates,
        updated_at: new Date().toISOString()
      };

      estimateItemsStore.set(id, updatedItem as unknown as TenderEstimateItem);
      return updatedItem;
    } catch (error) {
      console.error('Error updating estimate item:', error);
      throw new Error(`Failed to update estimate item: ${(error as Error).message}`);
    }
  }

  /**
   * Delete estimate item
   */
  static async deleteEstimateItem(id: string): Promise<void> {
    try {
      estimateItemsStore.delete(id);
    } catch (error) {
      console.error('Error deleting estimate item:', error);
      throw new Error(`Failed to delete estimate item: ${(error as Error).message}`);
    }
  }

  /**
   * Get user's own estimates
   */
  static async getMyEstimates(userId: string): Promise<TenderEstimateDTO[]> {
    try {
      // Return all estimates (in-memory doesn't have user association)
      const estimates: TenderEstimateDTO[] = [];
      estimatesStore.forEach((estimate) => {
        estimates.push(estimate as unknown as TenderEstimateDTO);
      });
      return estimates;
    } catch (error) {
      console.error('Error getting user estimates:', error);
      throw new Error(`Failed to get user estimates: ${(error as Error).message}`);
    }
  }

  /**
   * Get estimates by project ID
   */
  static async getEstimatesByProjectId(projectId: string): Promise<TenderEstimateDTO[]> {
    try {
      const estimates: TenderEstimateDTO[] = [];
      estimatesStore.forEach((estimate) => {
        const dto = estimate as unknown as TenderEstimateDTO;
        if (dto.project_id === projectId) {
          estimates.push(dto);
        }
      });
      return estimates;
    } catch (error) {
      console.error('Error getting estimates by project ID:', error);
      throw new Error(`Failed to get estimates by project ID: ${(error as Error).message}`);
    }
  }

  /**
   * Get all estimates
   */
  static async getAllEstimates(): Promise<TenderEstimateDTO[]> {
    try {
      const estimates: TenderEstimateDTO[] = [];
      estimatesStore.forEach((estimate) => {
        estimates.push(estimate as unknown as TenderEstimateDTO);
      });
      return estimates;
    } catch (error) {
      console.error('Error getting all estimates:', error);
      throw new Error(`Failed to get all estimates: ${(error as Error).message}`);
    }
  }

  /**
   * Get estimate statistics
   */
  static async getEstimateStats(tenderId: string): Promise<{
    totalEstimates: number;
    totalAmount: number;
    averageAmount: number;
    byStatus: Record<string, number>;
  }> {
    try {
      const estimates = await this.getEstimatesByTenderId(tenderId);
      
      const byStatus: Record<string, number> = {};
      let totalAmount = 0;

      estimates.forEach(estimate => {
        const status = estimate.status || 'draft';
        byStatus[status] = (byStatus[status] || 0) + 1;
        totalAmount += estimate.final_total || 0;
      });

      return {
        totalEstimates: estimates.length,
        totalAmount,
        averageAmount: estimates.length > 0 ? totalAmount / estimates.length : 0,
        byStatus
      };
    } catch (error) {
      console.error('Error getting estimate stats:', error);
      throw new Error(`Failed to get estimate stats: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate estimate totals
   */
  static async calculateEstimateTotals(estimateId: string): Promise<{
    subtotal: number;
    taxAmount: number;
    totalWithTax: number;
    overheadAmount: number;
    profitMarginAmount: number;
    finalTotal: number;
  }> {
    try {
      const estimate = await this.getEstimateById(estimateId);
      const items = await this.getEstimateItems(estimateId);

      if (!estimate) {
        throw new Error('Estimate not found');
      }

      const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
      const taxRate = estimate.tax_rate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const totalWithTax = subtotal + taxAmount;
      const overheadPercentage = estimate.overhead_percentage || 0;
      const overheadAmount = totalWithTax * (overheadPercentage / 100);
      const profitMarginPercentage = estimate.profit_margin_percentage || 0;
      const profitMarginAmount = (totalWithTax + overheadAmount) * (profitMarginPercentage / 100);
      const finalTotal = totalWithTax + overheadAmount + profitMarginAmount;

      return {
        subtotal,
        taxAmount,
        totalWithTax,
        overheadAmount,
        profitMarginAmount,
        finalTotal
      };
    } catch (error) {
      console.error('Error calculating estimate totals:', error);
      throw new Error(`Failed to calculate estimate totals: ${(error as Error).message}`);
    }
  }
}
