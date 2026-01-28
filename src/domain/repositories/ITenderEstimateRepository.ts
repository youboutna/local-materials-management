// Import domain entities - PAS d'interfaces dans repository
import { TenderEstimate, TenderEstimateItem } from '../entities/TenderEstimate';

// Export types for use in other layers
export type { TenderEstimate, TenderEstimateItem } from '../entities/TenderEstimate';

export interface ITenderEstimateRepository {
  /**
   * Create a new tender estimate
   * @param estimate The estimate entity
   * @returns The created estimate
   */
  create(estimate: Omit<TenderEstimate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenderEstimate>;

  /**
   * Get estimate by ID
   * @param id The estimate ID
   * @returns The estimate or null
   */
  findById(id: string): Promise<TenderEstimate | null>;

  /**
   * Get estimates by tender ID
   * @param tenderId The tender ID
   * @returns Array of estimates
   */
  findByTenderId(tenderId: string): Promise<TenderEstimate[]>;

  /**
   * Get estimates by project ID
   * @param projectId The project ID
   * @returns Array of estimates
   */
  findByProjectId(projectId: string): Promise<TenderEstimate[]>;

  /**
   * Get estimates by submitted user
   * @param userId The user ID
   * @returns Array of estimates
   */
  findBySubmittedBy(userId: string): Promise<TenderEstimate[]>;

  /**
   * Get all estimates
   * @returns Array of all estimates
   */
  findAll(): Promise<TenderEstimate[]>;

  /**
   * Update an estimate
   * @param id The estimate ID
   * @param updates The updates to apply
   * @returns The updated estimate
   */
  update(id: string, updates: Partial<TenderEstimate>): Promise<TenderEstimate>;

  /**
   * Delete an estimate
   * @param id The estimate ID
   */
  delete(id: string): Promise<void>;

  /**
   * Create estimate item
   * @param item The estimate item entity
   * @returns The created estimate item
   */
  createItem(item: Omit<TenderEstimateItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenderEstimateItem>;

  /**
   * Get estimate items by estimate ID
   * @param estimateId The estimate ID
   * @returns Array of estimate items
   */
  findItemsByEstimateId(estimateId: string): Promise<TenderEstimateItem[]>;

  /**
   * Update estimate item
   * @param id The item ID
   * @param updates The updates to apply
   * @returns The updated estimate item
   */
  updateItem(id: string, updates: Partial<TenderEstimateItem>): Promise<TenderEstimateItem>;

  /**
   * Delete estimate item
   * @param id The item ID
   */
  deleteItem(id: string): Promise<void>;

  /**
   * Get estimate statistics
   * @param tenderId The tender ID
   * @returns Statistics object
   */
  getEstimateStats(tenderId: string): Promise<{
    totalEstimates: number;
    totalAmount: number;
    averageAmount: number;
    byStatus: Record<string, number>;
  }>;
}
