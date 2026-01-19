/**
 * Interface for Material Repository
 * Defines the contract for material data access operations
 */

import { MaterialDTO } from '@/dtos/entities/MaterialDTO';

export interface IMaterialRepository {
  // ============= CRUD Operations =============
  findById(id: string): Promise<MaterialDTO | null>;
  findAll(filters?: Record<string, any>): Promise<MaterialDTO[]>;
  create(data: Partial<MaterialDTO>): Promise<MaterialDTO>;
  update(id: string, data: Partial<MaterialDTO>): Promise<MaterialDTO>;
  delete(id: string): Promise<void>;

  // ============= Material-Specific Operations =============
  findByProjectId(projectId: string): Promise<MaterialDTO[]>;
  findByCategory(category: string): Promise<MaterialDTO[]>;
  findBySupplier(supplierId: string): Promise<MaterialDTO[]>;
  findLowStock(): Promise<MaterialDTO[]>;
  search(query: string): Promise<MaterialDTO[]>;
  deleteByProjectId(projectId: string): Promise<void>;
  createMany(materials: Partial<MaterialDTO>[]): Promise<MaterialDTO[]>;
}
