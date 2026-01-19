/**
 * LocalStorage Material Adapter
 * Implements IMaterialRepository using LocalStorage for DEV_MODE
 */

import { 
  IMaterialRepository, 
  Material, 
  MaterialStatus, 
  MaterialCategory 
} from '@/domain/repositories/IMaterialRepository';
import { allMaterialsData, MockMaterial } from '@/data/mockData';

// Convert MockMaterial to Material format
const mockMaterials: Material[] = allMaterialsData.map((mock: MockMaterial) => {
  // Map mock status to domain status
  const statusMap: Record<string, MaterialStatus> = {
    'available': 'available',
    'out_of_stock': 'out_of_stock',
    'low_stock': 'low_stock',
    'discontinued': 'discontinued'
  };

  return new Material(
    mock.id,
    mock.name,
    mock.description,
    mock.category,
    mock.unit,
    mock.unitPrice,
    mock.stockQuantity,
    mock.minStockLevel,
    mock.supplier,
    mock.location,
    statusMap[mock.status] || 'available',
    mock.lastRestocked,
    mock.createdAt, // created_at
    mock.updatedAt  // updated_at
  );
});

export class LocalStorageMaterialAdapter implements IMaterialRepository {
  
  async findById(id: string): Promise<Material | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    const material = materials.find(m => m.id === id);
    
    return material || null;
  }

  async findAll(): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    return materials;
  }

  async save(material: Material): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    const existingIndex = materials.findIndex(m => m.id === material.id);
    
    if (existingIndex >= 0) {
      materials[existingIndex] = material;
    } else {
      materials.push(material);
    }
    
    this.saveMaterialsToStorage(materials);
    
    console.log(`[DEV_MODE] Saved material ${material.id}`);
  }

  async update(id: string, data: Partial<Material>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    const materialIndex = materials.findIndex(m => m.id === id);
    
    if (materialIndex === -1) {
      throw new Error(`Material with id ${id} not found`);
    }
    
    materials[materialIndex] = {
      ...materials[materialIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveMaterialsToStorage(materials);
    
    console.log(`[DEV_MODE] Updated material ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    const materialIndex = materials.findIndex(m => m.id === id);
    
    if (materialIndex === -1) {
      throw new Error(`Material with id ${id} not found`);
    }
    
    materials.splice(materialIndex, 1);
    this.saveMaterialsToStorage(materials);
    
    console.log(`[DEV_MODE] Deleted material ${id}`);
  }

  async findByCategory(category: MaterialCategory): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    return materials.filter(material => material.category === category);
  }

  async findByStatus(status: MaterialStatus): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    return materials.filter(material => material.status === status);
  }

  async findLowStock(): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    return materials.filter(material => material.status === 'low_stock');
  }

  async findOutOfStock(): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    return materials.filter(material => material.status === 'out_of_stock');
  }

  async findBySupplier(supplierId: string): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    return materials.filter(material => material.supplier === supplierId);
  }

  async findByLocation(location: string): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    return materials.filter(material => material.location === location);
  }

  async search(query: string): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    const searchLower = query.toLowerCase();
    
    return materials.filter(material => 
      material.name.toLowerCase().includes(searchLower) ||
      material.description.toLowerCase().includes(searchLower) ||
      material.supplier.toLowerCase().includes(searchLower)
    );
  }

  async findBelowMinStock(): Promise<Material[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    return materials.filter(material => material.stockQuantity <= material.minStockLevel);
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const materials = this.getMaterialsFromStorage();
    const materialIndex = materials.findIndex(m => m.id === id);
    
    if (materialIndex === -1) {
      throw new Error(`Material with id ${id} not found`);
    }
    
    materials[materialIndex] = {
      ...materials[materialIndex],
      stockQuantity: quantity,
      updated_at: new Date().toISOString()
    };
    
    this.saveMaterialsToStorage(materials);
    
    console.log(`[DEV_MODE] Updated stock for material ${id} to ${quantity}`);
  }

  // ============= Utility Methods =============

  private getMaterialsFromStorage(): Material[] {
    if (typeof window === 'undefined') return mockMaterials;
    
    const stored = localStorage.getItem('dev_materials');
    return stored ? JSON.parse(stored) : mockMaterials;
  }

  private saveMaterialsToStorage(materials: Material[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_materials', JSON.stringify(materials));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_materials')) {
      localStorage.setItem('dev_materials', JSON.stringify(mockMaterials));
    }
    
    console.log('[DEV_MODE] LocalStorage materials initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_materials');
    
    console.log('[DEV_MODE] LocalStorage materials cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Material[] {
    return this.getMaterialsFromStorage();
  }
}
