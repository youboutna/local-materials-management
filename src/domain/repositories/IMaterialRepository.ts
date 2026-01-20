// Repository interface for Material entity
import { Material, MaterialCategory } from '../entities/Material';

export interface IMaterialRepository {
  // CRUD operations
  findById(id: string): Promise<Material | null>;
  findAll(): Promise<Material[]>;
  save(material: Material): Promise<void>;
  update(id: string, data: Partial<Material>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByCategory(category: MaterialCategory): Promise<Material[]>;
  findByWorkspace(workspaceId: string): Promise<Material[]>;
  findBySku(sku: string): Promise<Material | null>;
  findByEan(ean: string): Promise<Material | null>;
  
  // Search
  search(query: string): Promise<Material[]>;
  
  // Stock queries
  findLowStock(threshold: number): Promise<Material[]>;
  findOutOfStock(): Promise<Material[]>;
  
  // Aggregations
  getTotalValue(): Promise<number>;
  getTotalValueByCategory(): Promise<Record<MaterialCategory, number>>;
  getStockSummary(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }>;
  
  // Project materials methods
  getProjectMaterials(projectId: string): Promise<any[]>;
  addMaterialToProject(projectId: string, materialId: string, quantity: number): Promise<void>;
  removeMaterialFromProject(projectId: string, materialId: string): Promise<void>;
  updateProjectMaterialQuantity(projectId: string, materialId: string, quantity: number): Promise<void>;
  deleteByProjectId(projectId: string): Promise<void>;
}
