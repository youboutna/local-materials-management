/**
 * Quantity Takeoff Repository Interface
 * Defines contract for quantity takeoff data access
 */

import { QuantityTakeoffWithDetails } from '@/dtos/types/quantityTakeoff';

export interface IQuantityTakeoffRepository {
  // ============= CRUD Operations =============
  
  /**
   * Find quantity takeoffs by project ID
   */
  findByProjectId(projectId: string): Promise<QuantityTakeoffWithDetails[]>;

  /**
   * Create new quantity takeoff
   */
  create(takeoff: Partial<QuantityTakeoffWithDetails>): Promise<QuantityTakeoffWithDetails>;

  /**
   * Update existing quantity takeoff
   */
  update(id: string, updates: Partial<QuantityTakeoffWithDetails>): Promise<QuantityTakeoffWithDetails>;

  /**
   * Delete quantity takeoff
   */
  delete(id: string): Promise<void>;

  // ============= Specialized Queries =============

  /**
   * Get total quantity by unit for a project
   */
  getTotalQuantityByUnit(projectId: string, unit: string): Promise<number>;

  /**
   * Get total value for a project
   */
  getTotalValue(projectId: string): Promise<number>;
}
