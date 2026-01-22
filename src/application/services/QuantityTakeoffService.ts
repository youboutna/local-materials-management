/**
 * Quantity Takeoff Service
 * Business logic for quantity takeoff operations
 * Following hexagonal architecture principles
 */

import { AppError, ErrorLogger } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Types for quantity takeoff operations
export interface QuantityTakeoffWithDetails {
  id: string;
  quantity: number;
  unit_price?: number;
  total_value?: number;
  material?: {
    id: string;
    name: string;
    unit: string;
    price_per_unit?: number;
  };
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface QuantityTakeoffStats {
  totalQuantityByUnit: Record<string, number>;
  totalValue: number;
  count: number;
}

export class QuantityTakeoffService {
  private repository: any; // Replace with actual repository interface when available

  constructor(repository?: any) {
    this.repository = repository || RepositoryFactory.getQuantityTakeoffRepository();
  }

  /**
   * Get all quantity takeoffs for a project
   */
  async getQuantityTakeoffsByProject(projectId: string): Promise<QuantityTakeoffWithDetails[]> {
    try {
      // In real implementation, this would use the repository
      // For now, return mock data or implement actual logic
      const mockData: QuantityTakeoffWithDetails[] = [];
      return mockData;
    } catch (error) {
      ErrorLogger.log(error as Error, 'QuantityTakeoffService.getQuantityTakeoffsByProject');
      throw error;
    }
  }

  /**
   * Delete a quantity takeoff
   */
  async deleteQuantityTakeoff(id: string): Promise<void> {
    try {
      // In real implementation, this would use the repository
      console.log('Deleting quantity takeoff:', id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'QuantityTakeoffService.deleteQuantityTakeoff');
      throw error;
    }
  }

  /**
   * Calculate total quantity by unit
   */
  async getTotalQuantityByUnit(projectId: string, unit: string): Promise<number> {
    try {
      const takeoffs = await this.getQuantityTakeoffsByProject(projectId);
      return takeoffs
        .filter(qt => qt.material?.unit === unit)
        .reduce((sum, qt) => sum + qt.quantity, 0);
    } catch (error) {
      ErrorLogger.log(error as Error, 'QuantityTakeoffService.getTotalQuantityByUnit');
      throw error;
    }
  }

  /**
   * Calculate total value for a project
   */
  async getTotalValue(projectId: string): Promise<number> {
    try {
      const takeoffs = await this.getQuantityTakeoffsByProject(projectId);
      return takeoffs.reduce((sum, qt) => {
        const materialPrice = qt.material?.price_per_unit || 0;
        return sum + (qt.quantity * materialPrice);
      }, 0);
    } catch (error) {
      ErrorLogger.log(error as Error, 'QuantityTakeoffService.getTotalValue');
      throw error;
    }
  }

  /**
   * Get comprehensive statistics for a project
   */
  async getProjectStats(projectId: string): Promise<QuantityTakeoffStats> {
    try {
      const takeoffs = await this.getQuantityTakeoffsByProject(projectId);
      
      const totalQuantityByUnit = takeoffs.reduce((acc, qt) => {
        const unit = qt.material?.unit || 'unknown';
        acc[unit] = (acc[unit] || 0) + qt.quantity;
        return acc;
      }, {} as Record<string, number>);

      const totalValue = takeoffs.reduce((sum, qt) => {
        const materialPrice = qt.material?.price_per_unit || 0;
        return sum + (qt.quantity * materialPrice);
      }, 0);

      return {
        totalQuantityByUnit,
        totalValue,
        count: takeoffs.length
      };
    } catch (error) {
      ErrorLogger.log(error as Error, 'QuantityTakeoffService.getProjectStats');
      throw error;
    }
  }

  /**
   * Create a new quantity takeoff
   */
  async createQuantityTakeoff(data: Partial<QuantityTakeoffWithDetails>): Promise<QuantityTakeoffWithDetails> {
    try {
      // In real implementation, this would use the repository
      const newTakeoff: QuantityTakeoffWithDetails = {
        id: `qt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        quantity: data.quantity || 0,
        unit_price: data.unit_price,
        total_value: data.total_value,
        material: data.material,
        project_id: data.project_id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newTakeoff;
    } catch (error) {
      ErrorLogger.log(error as Error, 'QuantityTakeoffService.createQuantityTakeoff');
      throw error;
    }
  }

  /**
   * Update a quantity takeoff
   */
  async updateQuantityTakeoff(id: string, updates: Partial<QuantityTakeoffWithDetails>): Promise<QuantityTakeoffWithDetails> {
    try {
      // In real implementation, this would use the repository
      const updatedTakeoff: QuantityTakeoffWithDetails = {
        id,
        quantity: updates.quantity || 0,
        unit_price: updates.unit_price,
        total_value: updates.total_value,
        material: updates.material,
        project_id: updates.project_id || '',
        created_at: updates.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return updatedTakeoff;
    } catch (error) {
      ErrorLogger.log(error as Error, 'QuantityTakeoffService.updateQuantityTakeoff');
      throw error;
    }
  }

  // Static methods for backward compatibility
  static async getQuantityTakeoffsByProject(projectId: string): Promise<QuantityTakeoffWithDetails[]> {
    const service = new QuantityTakeoffService();
    return service.getQuantityTakeoffsByProject(projectId);
  }

  static async deleteQuantityTakeoff(id: string): Promise<void> {
    const service = new QuantityTakeoffService();
    return service.deleteQuantityTakeoff(id);
  }
}
