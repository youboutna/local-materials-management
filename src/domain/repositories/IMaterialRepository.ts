/**
 * Repository interface for Material entity
 * Hexagonal Architecture - PORT
 * Définit le contrat pour l'accès aux données des matériaux
 * 
 * ✅ Interface complète pour CRUD et relations projet-matériaux
 * ✅ Méthodes de recherche et d'agrégation
 * ✅ Gestion des stocks et des relations
 */

import { Material, MaterialCategory } from '../entities/Material';

/**
 * Interface pour les relations projet-matériaux
 */
export interface ProjectMaterial {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  status: 'planned' | 'ordered' | 'received' | 'used';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface pour les statistiques de stock
 */
export interface StockSummary {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  averagePrice: number;
  categoriesCount: Record<MaterialCategory, number>;
}

export interface IMaterialRepository {
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Find a material by ID
   */
  findById(id: string): Promise<Material | null>;

  /**
   * Find materials by multiple IDs
   */
  findByIds(ids: string[]): Promise<Material[]>;

  /**
   * Find all materials
   */
  findAll(): Promise<Material[]>;

  /**
   * Save a material (create or update)
   */
  save(material: Material): Promise<void>;

  /**
   * Update a material
   */
  update(id: string, data: Partial<Material>): Promise<void>;

  /**
   * Delete a material
   */
  delete(id: string): Promise<void>;

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Find materials by category
   */
  findByCategory(category: MaterialCategory): Promise<Material[]>;

  /**
   * Find materials by workspace
   */
  findByWorkspace(workspaceId: string): Promise<Material[]>;

  /**
   * Find a material by SKU
   */
  findBySku(sku: string): Promise<Material | null>;

  /**
   * Find a material by EAN
   */
  findByEan(ean: string): Promise<Material | null>;

  /**
   * Find a material by GTIN
   */
  findByGtin(gtin: string): Promise<Material | null>;

  /**
   * Find materials by supplier
   */
  findBySupplier(supplierId: string): Promise<Material[]>;

  /**
   * Find materials with low stock
   */
  findLowStock(threshold: number): Promise<Material[]>;

  /**
   * Find materials out of stock
   */
  findOutOfStock(): Promise<Material[]>;

  /**
   * Find materials with stock below minimum
   */
  findBelowMinStock(): Promise<Material[]>;

  /**
   * Find materials by status
   */
  findByStatus(status: string): Promise<Material[]>;

  /**
   * Find materials with location
   */
  findByLocation(location: string): Promise<Material[]>;

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search materials by query
   */
  search(query: string): Promise<Material[]>;

  /**
   * Advanced search with filters
   */
  advancedSearch(filters: {
    query?: string;
    category?: MaterialCategory;
    subcategory?: string;
    workspaceId?: string;
    supplierId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    lowStock?: boolean;
  }): Promise<Material[]>;

  // ============================================================================
  // AGGREGATIONS
  // ============================================================================

  /**
   * Get total value of all materials
   */
  getTotalValue(): Promise<number>;

  /**
   * Get total value by category
   */
  getTotalValueByCategory(): Promise<Record<MaterialCategory, number>>;

  /**
   * Get stock summary
   */
  getStockSummary(): Promise<StockSummary>;

  /**
   * Get material count
   */
  count(): Promise<number>;

  /**
   * Count materials by category
   */
  countByCategory(): Promise<Record<MaterialCategory, number>>;

  // ============================================================================
  // PROJECT MATERIAL RELATIONSHIPS
  // ============================================================================

  /**
   * Get all materials associated with a project
   */
  getProjectMaterials(projectId: string): Promise<ProjectMaterial[]>;

  /**
   * Get a specific project material relationship
   */
  findProjectMaterial(projectId: string, materialId: string): Promise<ProjectMaterial | null>;

  /**
   * Add a material to a project
   */
  addToProject(projectId: string, materialId: string, quantity: number): Promise<ProjectMaterial>;

  /**
   * Remove a material from a project
   */
  removeFromProject(projectId: string, materialId: string): Promise<void>;

  /**
   * Update the quantity of a material in a project
   */
  updateProjectMaterial(projectId: string, materialId: string, quantity: number): Promise<ProjectMaterial>;

  /**
   * Update project material with full data
   */
  updateProjectMaterialFull(
    projectId: string,
    materialId: string,
    data: Partial<ProjectMaterial>
  ): Promise<ProjectMaterial>;

  /**
   * Delete all materials associated with a project
   */
  deleteByProjectId(projectId: string): Promise<void>;

  /**
   * Get project materials by category
   */
  getProjectMaterialsByCategory(projectId: string, category: MaterialCategory): Promise<ProjectMaterial[]>;

  /**
   * Get project materials by supplier
   */
  getProjectMaterialsBySupplier(projectId: string, supplierId: string): Promise<ProjectMaterial[]>;

  /**
   * Search project materials
   */
  searchProjectMaterials(
    projectId: string,
    searchTerm: string,
    category?: MaterialCategory
  ): Promise<ProjectMaterial[]>;

  /**
   * Get project materials with low stock
   */
  getProjectLowStockMaterials(projectId: string, threshold: number): Promise<ProjectMaterial[]>;

  /**
   * Bulk add materials to a project
   */
  bulkAddToProject(
    projectId: string,
    materials: Array<{ materialId: string; quantity: number }>
  ): Promise<ProjectMaterial[]>;

  /**
   * Bulk remove materials from a project
   */
  bulkRemoveFromProject(projectId: string, materialIds: string[]): Promise<void>;

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Save multiple materials
   */
  saveMany(materials: Material[]): Promise<void>;

  /**
   * Delete multiple materials
   */
  deleteMany(ids: string[]): Promise<void>;

  /**
   * Update stock for multiple materials
   */
  updateStock(updates: Array<{ id: string; quantity: number }>): Promise<void>;

  /**
   * Find materials by multiple criteria
   */
  findByCriteria(criteria: {
    category?: MaterialCategory;
    workspaceId?: string;
    supplierId?: string;
    minQuantity?: number;
    maxQuantity?: number;
    status?: string;
  }): Promise<Material[]>;
}