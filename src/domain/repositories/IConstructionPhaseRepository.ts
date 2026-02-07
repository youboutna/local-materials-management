/**
 * Construction Phase Repository Interface
 * Following hexagonal architecture principles
 */

import { ConstructionPhase } from '@/domain/entities/ConstructionPhase';

/**
 * Repository interface for construction phase operations
 */
export interface IConstructionPhaseRepository {
  /**
   * Create a new construction phase
   */
  create(phase: ConstructionPhase): Promise<ConstructionPhase>;

  /**
   * Update an existing construction phase
   */
  update(id: string, phase: ConstructionPhase): Promise<ConstructionPhase>;

  /**
   * Find a construction phase by ID
   */
  findById(id: string): Promise<ConstructionPhase | null>;

  /**
   * Find all construction phases for a project
   */
  findByProjectId(projectId: string): Promise<ConstructionPhase[]>;

  /**
   * Find all construction phases
   */
  findAll(): Promise<ConstructionPhase[]>;

  /**
   * Delete a construction phase
   */
  delete(id: string): Promise<void>;

  /**
   * Get phases by status
   */
  findByStatus(status: string): Promise<ConstructionPhase[]>;

  /**
   * Count phases by project
   */
  countByProject(projectId: string): Promise<number>;
}
