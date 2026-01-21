// Material Service - Hexagonal Architecture (Placeholder)
import { Material, MaterialCategory } from '@/domain/entities/Material';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

// In-memory storage placeholder
const materialsStore: Map<string, Material> = new Map();

export class MaterialService {
  async getAllMaterials(): Promise<Material[]> {
    return Array.from(materialsStore.values());
  }

  async getMaterialById(id: string): Promise<Material | null> {
    return materialsStore.get(id) || null;
  }

  async getMaterialsByCategory(category: MaterialCategory): Promise<Material[]> {
    return Array.from(materialsStore.values()).filter(m => m.category === category);
  }

  async getMaterialsByWorkspace(workspaceId: string): Promise<Material[]> {
    return Array.from(materialsStore.values()).filter(m => m.workspaceId === workspaceId);
  }

  async searchMaterials(query: string): Promise<Material[]> {
    return Array.from(materialsStore.values()).filter(m => 
      m.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getLowStockMaterials(threshold: number = 10): Promise<Material[]> {
    return Array.from(materialsStore.values()).filter(m => m.availableQuantity <= threshold);
  }

  async getOutOfStockMaterials(): Promise<Material[]> {
    return Array.from(materialsStore.values()).filter(m => m.availableQuantity === 0);
  }

  async createMaterial(material: Partial<Material>): Promise<Material> {
    const newMaterial = Material.create({
      id: crypto.randomUUID(),
      name: material.name || '',
      description: material.description || '',
      category: material.category || 'other',
      unit: material.unit || 'unit',
      pricePerUnit: material.pricePerUnit || 0,
      availableQuantity: material.availableQuantity || 0
    });
    materialsStore.set(newMaterial.id, newMaterial);
    return newMaterial;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    const existing = materialsStore.get(id);
    if (!existing) throw new AppError('NOT_FOUND' as any, 'Material not found');
    const updated = { ...existing, ...updates } as Material;
    materialsStore.set(id, updated);
    return updated;
  }

  async deleteMaterial(id: string): Promise<void> {
    materialsStore.delete(id);
  }

  async getProjectMaterials(projectId: string): Promise<any[]> {
    console.log('Getting project materials:', projectId);
    return [];
  }

  async addMaterialToProject(projectId: string, materialId: string, quantity: number): Promise<void> {
    console.log('Adding material to project:', projectId, materialId, quantity);
  }

  async removeMaterialFromProject(projectId: string, materialId: string): Promise<void> {
    console.log('Removing material from project:', projectId, materialId);
  }

  static async getProjectMaterials(projectId: string): Promise<any[]> {
    return new MaterialService().getProjectMaterials(projectId);
  }

  static async addMaterialToProject(projectId: string, materialId: string, quantity: number): Promise<void> {
    return new MaterialService().addMaterialToProject(projectId, materialId, quantity);
  }

  static async removeMaterialFromProject(projectId: string, materialId: string): Promise<void> {
    return new MaterialService().removeMaterialFromProject(projectId, materialId);
  }
}
