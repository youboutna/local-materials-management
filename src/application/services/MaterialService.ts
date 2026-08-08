/**
 * Material Service - Hexagonal Architecture
 * Business logic for material management with geocoding integration
 * Rule #1: Form → DTO → Service → Domain → Adapter → DB
 * 
 * ✅ Utilise les DTOs pour les données
 * ✅ Injection de dépendances via constructeur
 * ✅ Gestion des erreurs avec AppError
 * ✅ Pas de supabase direct
 * ✅ Séparation des responsabilités
 * ✅ Gestion complète des relations projet-matériaux
 * ✅ Typage correct pour les retours de ProjectMaterial
 */

import { SupplierService } from '@/application/services/SupplierService';
import { Material } from '@/domain/entities/Material';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { IWorkspaceRepository } from '@/domain/repositories/IWorkspaceRepository';
import {
  CreateMaterialDTO,
  MaterialCategory,
  MaterialDTO,
  MaterialFilterDTO,
  MaterialFormDataDTO,
  ProjectMaterialDTO,
  UpdateMaterialDTO,
} from '@/dtos/entities/MaterialDTO';
import { MaterialTransformer } from '@/dtos/transforms/MaterialTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { DocumentService } from './DocumentService';
import { GeocodingService } from './GeocodingService';
import { getGeocodingService } from './GeocodingServiceFactory';
import { WorkspaceService } from './WorkspaceService';

// ============================================================================
// INTERFACE POUR LES RÉSULTATS AVEC FOURNISSEURS
// ============================================================================

export interface MaterialWithSupplierResult {
  material: MaterialDTO;
  projectMaterial: ProjectMaterialDTO;
  supplier?: any;
}

// ============================================================================
// SERVICE
// ============================================================================

export class MaterialService {
  private geocodingService: GeocodingService;
  private supplierService: SupplierService;
  private workspaceService: WorkspaceService;
  private documentService: DocumentService;

  constructor(
    private materialRepository: IMaterialRepository,
    supplierRepository?: ISupplierRepository,
    workspaceRepository?: IWorkspaceRepository,
    documentRepository?: IDocumentRepository
  ) {
    this.geocodingService = getGeocodingService();
    this.supplierService = new SupplierService(
      supplierRepository || RepositoryFactory.getSupplierRepository()
    );
    this.workspaceService = new WorkspaceService(
      workspaceRepository || RepositoryFactory.getWorkspaceRepository()
    );
    this.documentService = new DocumentService(
      documentRepository || RepositoryFactory.getDocumentRepository()
    );
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  static default(): MaterialService {
    return new MaterialService(
      RepositoryFactory.getMaterialRepository()
    );
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  async getAllMaterials(filter?: MaterialFilterDTO): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findAll();
      let dtos = materials.map(m => MaterialTransformer.toDTO(m));

      if (filter) {
        dtos = this.applyFilters(dtos, filter);
      }

      return dtos;
    } catch (error) {
      console.error('MaterialService.getAllMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials');
    }
  }

  async getMaterialsForUI(filter?: MaterialFilterDTO): Promise<MaterialDTO[]> {
    return this.getAllMaterials(filter);
  }

  async getMaterialById(id: string): Promise<MaterialDTO | null> {
    try {
      const material = await this.materialRepository.findById(id);
      return material ? MaterialTransformer.toDTO(material) : null;
    } catch (error) {
      console.error('MaterialService.getMaterialById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch material');
    }
  }

  async createMaterial(dto: CreateMaterialDTO): Promise<MaterialDTO> {
    try {
      this.validateCreateMaterialData(dto);
      await this.validateRelatedEntities(dto);

      const entity = MaterialTransformer.createEntityFromCreateDTO(dto);
      const enrichedEntity = dto.adresse ? await this.enrichWithGeocoding(entity) : entity;

      await this.materialRepository.save(enrichedEntity);

      const savedMaterial = await this.materialRepository.findById(enrichedEntity.id);
      if (!savedMaterial) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve saved material');
      }

      return MaterialTransformer.toDTO(savedMaterial);
    } catch (error) {
      console.error('MaterialService.createMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create material');
    }
  }

  async updateMaterial(id: string, dto: UpdateMaterialDTO): Promise<MaterialDTO> {
    try {
      const existing = await this.materialRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Material not found');
      }

      this.validateUpdateMaterialData(dto);
      const updatedEntity = this.applyUpdatesToEntity(existing, dto);
      const enrichedEntity = dto.adresse ? await this.enrichWithGeocoding(updatedEntity) : updatedEntity;

      await this.materialRepository.update(id, enrichedEntity);

      const updated = await this.materialRepository.findById(id);
      if (!updated) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated material');
      }

      return MaterialTransformer.toDTO(updated);
    } catch (error) {
      console.error('MaterialService.updateMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update material');
    }
  }

  async deleteMaterial(id: string): Promise<void> {
    try {
      const existing = await this.materialRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Material not found');
      }
      await this.materialRepository.delete(id);
    } catch (error) {
      console.error('MaterialService.deleteMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete material');
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  async getMaterialsByCategory(category: string): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findByCategory(category as MaterialCategory);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getMaterialsByCategory failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials by category');
    }
  }

  async getMaterialsByWorkspace(workspaceId: string): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findByWorkspace(workspaceId);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getMaterialsByWorkspace failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials by workspace');
    }
  }

  async searchMaterials(query: string): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.search(query);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.searchMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search materials');
    }
  }

  async getLowStockMaterials(threshold: number = 10): Promise<MaterialDTO[]> {
    try {
      const allMaterials = await this.materialRepository.findAll();
      const lowStockMaterials = allMaterials.filter(m => m.availableQuantity <= threshold);
      return lowStockMaterials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getLowStockMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch low stock materials');
    }
  }

  // ============================================================================
  // PROJECT MATERIAL RELATIONSHIPS
  // ============================================================================

  /**
   * Récupère tous les matériaux associés à un projet
   */
  async getProjectMaterials(projectId: string): Promise<ProjectMaterialDTO[]> {
    try {
      const projectMaterials = await this.materialRepository.getProjectMaterials(projectId);
      return projectMaterials.map(pm => this.toProjectMaterialDTO(pm));
    } catch (error) {
      console.error('MaterialService.getProjectMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project materials');
    }
  }

  /**
   * Récupère les matériaux d'un projet avec leurs détails complets
   */
  async getProjectMaterialsWithDetails(projectId: string): Promise<MaterialDTO[]> {
    try {
      const projectMaterials = await this.materialRepository.getProjectMaterials(projectId);
      const materialIds = projectMaterials.map(pm => pm.materialId);
      
      if (materialIds.length === 0) return [];
      
      const materials = await this.materialRepository.findByIds(materialIds);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getProjectMaterialsWithDetails failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project materials with details');
    }
  }

  /**
   * Ajoute un matériau à un projet
   */
  async addMaterialToProject(projectId: string, materialId: string, quantity: number): Promise<ProjectMaterialDTO> {
    try {
      const material = await this.materialRepository.findById(materialId);
      if (!material) {
        throw new AppError(ErrorCode.NOT_FOUND, `Material with ID ${materialId} not found`);
      }

      const existing = await this.materialRepository.findProjectMaterial(projectId, materialId);
      if (existing) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Material already associated with project ${projectId}`);
      }

      const projectMaterial = await this.materialRepository.addToProject(projectId, materialId, quantity);
      return this.toProjectMaterialDTO(projectMaterial);
    } catch (error) {
      console.error('MaterialService.addMaterialToProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add material to project');
    }
  }

  /**
   * Met à jour la quantité d'un matériau dans un projet
   */
  async updateProjectMaterialQuantity(projectId: string, materialId: string, quantity: number): Promise<ProjectMaterialDTO> {
    try {
      if (quantity < 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Quantity must be positive');
      }

      const existing = await this.materialRepository.findProjectMaterial(projectId, materialId);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, `Material not found in project ${projectId}`);
      }

      const updated = await this.materialRepository.updateProjectMaterial(projectId, materialId, quantity);
      return this.toProjectMaterialDTO(updated);
    } catch (error) {
      console.error('MaterialService.updateProjectMaterialQuantity failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update project material quantity');
    }
  }

  /**
   * Supprime un matériau d'un projet
   */
  async removeMaterialFromProject(projectId: string, materialId: string): Promise<void> {
    try {
      const existing = await this.materialRepository.findProjectMaterial(projectId, materialId);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, `Material not found in project ${projectId}`);
      }

      await this.materialRepository.removeFromProject(projectId, materialId);
    } catch (error) {
      console.error('MaterialService.removeMaterialFromProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to remove material from project');
    }
  }

  /**
   * Récupère les matériaux d'un projet par catégorie
   */
  async getProjectMaterialsByCategory(projectId: string, category: MaterialCategory): Promise<ProjectMaterialDTO[]> {
    try {
      const projectMaterials = await this.materialRepository.getProjectMaterialsByCategory(projectId, category);
      return projectMaterials.map(pm => this.toProjectMaterialDTO(pm));
    } catch (error) {
      console.error('MaterialService.getProjectMaterialsByCategory failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project materials by category');
    }
  }

  /**
   * Récupère les matériaux d'un projet avec stock faible
   */
  async getProjectLowStockMaterials(projectId: string, threshold: number = 10): Promise<ProjectMaterialDTO[]> {
    try {
      const projectMaterials = await this.materialRepository.getProjectLowStockMaterials(projectId, threshold);
      return projectMaterials.map(pm => this.toProjectMaterialDTO(pm));
    } catch (error) {
      console.error('MaterialService.getProjectLowStockMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project low stock materials');
    }
  }

  /**
   * Récupère les matériaux d'un projet avec leurs fournisseurs
   */
  async getProjectMaterialsWithSuppliers(projectId: string): Promise<MaterialWithSupplierResult[]> {
    try {
      const projectMaterials = await this.materialRepository.getProjectMaterials(projectId);
      const result: MaterialWithSupplierResult[] = [];

      for (const pm of projectMaterials) {
        const material = await this.materialRepository.findById(pm.materialId);
        if (!material) continue;

        let supplier = undefined;
        if (material.supplierId) {
          const supplierData = await this.supplierService.getSupplierById(material.supplierId);
          if (supplierData) {
            supplier = supplierData;
          }
        }

        result.push({
          material: MaterialTransformer.toDTO(material),
          projectMaterial: this.toProjectMaterialDTO(pm),
          supplier: supplier,
        });
      }

      return result;
    } catch (error) {
      console.error('MaterialService.getProjectMaterialsWithSuppliers failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project materials with suppliers');
    }
  }

  /**
   * Récupère les matériaux d'un projet par fournisseur
   */
  async getProjectMaterialsBySupplier(projectId: string, supplierId: string): Promise<ProjectMaterialDTO[]> {
    try {
      const projectMaterials = await this.materialRepository.getProjectMaterialsBySupplier(projectId, supplierId);
      return projectMaterials.map(pm => this.toProjectMaterialDTO(pm));
    } catch (error) {
      console.error('MaterialService.getProjectMaterialsBySupplier failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project materials by supplier');
    }
  }

  /**
   * Récupère la quantité totale d'un matériau dans un projet
   */
  async getTotalProjectMaterialQuantity(projectId: string, materialId: string): Promise<number> {
    try {
      const projectMaterial = await this.materialRepository.findProjectMaterial(projectId, materialId);
      return projectMaterial?.quantity || 0;
    } catch (error) {
      console.error('MaterialService.getTotalProjectMaterialQuantity failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get total project material quantity');
    }
  }

  /**
   * Récupère les matériaux d'un projet avec filtres avancés
   */
  async searchProjectMaterials(
    projectId: string,
    searchTerm: string,
    category?: MaterialCategory
  ): Promise<ProjectMaterialDTO[]> {
    try {
      const projectMaterials = await this.materialRepository.searchProjectMaterials(projectId, searchTerm, category);
      return projectMaterials.map(pm => this.toProjectMaterialDTO(pm));
    } catch (error) {
      console.error('MaterialService.searchProjectMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search project materials');
    }
  }

  /**
   * Vérifie si un matériau est associé à un projet
   */
  async isMaterialInProject(projectId: string, materialId: string): Promise<boolean> {
    try {
      const projectMaterial = await this.materialRepository.findProjectMaterial(projectId, materialId);
      return !!projectMaterial;
    } catch (error) {
      console.error('MaterialService.isMaterialInProject failed:', error);
      return false;
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Ajoute plusieurs matériaux à un projet
   */
  async addMultipleMaterialsToProject(
    projectId: string,
    materials: { materialId: string; quantity: number }[]
  ): Promise<ProjectMaterialDTO[]> {
    try {
      const projectMaterials = await this.materialRepository.bulkAddToProject(projectId, materials);
      return projectMaterials.map(pm => this.toProjectMaterialDTO(pm));
    } catch (error) {
      console.error('MaterialService.addMultipleMaterialsToProject failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add multiple materials to project');
    }
  }

  /**
   * Supprime plusieurs matériaux d'un projet
   */
  async removeMultipleMaterialsFromProject(
    projectId: string,
    materialIds: string[]
  ): Promise<void> {
    try {
      await this.materialRepository.bulkRemoveFromProject(projectId, materialIds);
    } catch (error) {
      console.error('MaterialService.removeMultipleMaterialsFromProject failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to remove multiple materials from project');
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Convertit un ProjectMaterial en ProjectMaterialDTO
   */
  private toProjectMaterialDTO(pm: any): ProjectMaterialDTO {
    return {
      id: pm.id,
      projectId: pm.projectId,
      materialId: pm.materialId,
      quantity: pm.quantity,
      unit: pm.unit || 'unit',
      unitPrice: pm.unitPrice || 0,
      totalPrice: pm.totalPrice || 0,
      status: pm.status || 'planned',
      notes: pm.notes || null,
      createdAt: pm.createdAt || new Date().toISOString(),
      updatedAt: pm.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Enrichit un matériau avec les données de géocodage
   */
  private async enrichWithGeocoding(material: Material): Promise<Material> {
    try {
      if (!material.adresse) return material;

      const results = await this.geocodingService.geocode(material.adresse);

      if (results.length > 0) {
        const bestResult = results[0];

        let updatedMaterial = material.withCoordinates(
          bestResult.coordinates.lat,
          bestResult.coordinates.lng
        );

        updatedMaterial = updatedMaterial.withLocalisation([{
          lat: bestResult.coordinates.lat,
          lng: bestResult.coordinates.lng,
          address: bestResult.address,
          type: 'point' as const,
          confidence: bestResult.confidence
        }]);

        return updatedMaterial;
      }

      return material;
    } catch (error) {
      console.warn('Geocoding enrichment failed:', error);
      return material;
    }
  }

  /**
   * Reverse géocode des coordonnées
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<{ address: string; coordinates: { lat: number; lng: number }; confidence: number; type: string } | null> {
    try {
      const results = await this.geocodingService.reverseGeocode(latitude, longitude);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private validateCreateMaterialData(data: CreateMaterialDTO): void {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Material name is required');
    }

    if (data.pricePerUnit !== undefined && data.pricePerUnit < 0) {
      errors.push('Price per unit must be positive');
    }

    if (data.availableQuantity !== undefined && data.availableQuantity < 0) {
      errors.push('Available quantity must be positive');
    }

    if (errors.length > 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${errors.join(', ')}`);
    }
  }

  private validateUpdateMaterialData(data: UpdateMaterialDTO): void {
    const errors: string[] = [];

    if (data.name !== undefined && !data.name?.trim()) {
      errors.push('Material name cannot be empty');
    }

    if (data.pricePerUnit !== undefined && data.pricePerUnit < 0) {
      errors.push('Price per unit must be positive');
    }

    if (data.availableQuantity !== undefined && data.availableQuantity < 0) {
      errors.push('Available quantity must be positive');
    }

    if (errors.length > 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${errors.join(', ')}`);
    }
  }

  private async validateRelatedEntities(dto: CreateMaterialDTO): Promise<void> {
    const errors: string[] = [];

    if (dto.workspaceId) {
      try {
        const workspace = await this.workspaceService.getWorkspaceById(dto.workspaceId);
        if (!workspace) {
          errors.push(`Workspace with ID ${dto.workspaceId} does not exist`);
        }
      } catch (error) {
        errors.push(`Failed to validate workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (dto.supplierId) {
      try {
        const supplier = await this.supplierService.getSupplierById(dto.supplierId);
        if (!supplier) {
          errors.push(`Supplier with ID ${dto.supplierId} does not exist`);
        }
      } catch (error) {
        errors.push(`Failed to validate supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Related entity validation failed: ${errors.join(', ')}`);
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private applyFilters(materials: MaterialDTO[], filter: MaterialFilterDTO): MaterialDTO[] {
    return materials.filter(material => {
      if (filter.category && material.category !== filter.category) return false;
      if (filter.subcategory && material.subcategory !== filter.subcategory) return false;
      if (filter.workspaceId && material.workspaceId !== filter.workspaceId) return false;
      if (filter.search && !material.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.inStockOnly && material.availableQuantity <= 0) return false;
      if (filter.lowStockOnly && material.availableQuantity > 10) return false;
      return true;
    });
  }

  private applyUpdatesToEntity(existing: Material, updates: UpdateMaterialDTO): Material {
    return new Material(
      existing.id,
      updates.name ?? existing.name,
      updates.quantity ?? existing.quantity,
      updates.unit ?? existing.unit,
      updates.category ?? existing.category,
      updates.workspaceId ?? existing.workspaceId,
      existing.location,
      {
        description: updates.description ?? existing.description,
        minQuantity: updates.minQuantity ?? existing.minQuantity,
        timeline: existing.timeline,
        lastRestock: existing.lastRestock,
        supplier: updates.supplier ?? existing.supplier,
        images: existing.images,
        pricePerUnit: updates.pricePerUnit ?? existing.pricePerUnit,
        availableQuantity: updates.availableQuantity ?? existing.availableQuantity,
        originLocation: updates.originLocation ?? existing.originLocation,
        subcategory: updates.subcategory ?? existing.subcategory,
        localisation: updates.localisation ?? existing.localisation,
        forme: updates.forme ?? existing.forme,
        adresse: updates.adresse ?? existing.adresse,
        createdAt: existing.createdAt,
        updatedAt: new Date(),
        gtin: updates.gtin ?? existing.gtin,
        sku: updates.sku ?? existing.sku,
        ean: updates.ean ?? existing.ean,
        asin: updates.asin ?? existing.asin,
        image: updates.image ?? existing.image,
        coordinatesLatitude: updates.coordinatesLatitude ?? existing.coordinatesLatitude,
        coordinatesLongitude: updates.coordinatesLongitude ?? existing.coordinatesLongitude,
        multilangLabels: updates.multilangLabels ?? existing.multilangLabels
      }
    );
  }

  // ============================================================================
  // FORM INTEGRATION
  // ============================================================================

  async createMaterialFromForm(formData: MaterialFormDataDTO): Promise<MaterialDTO> {
    const dto: CreateMaterialDTO = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      unit: formData.unit,
      pricePerUnit: formData.pricePerUnit,
      quantity: formData.quantity,
      minQuantity: formData.minQuantity,
      availableQuantity: formData.availableQuantity,
      workspaceId: formData.workspaceId,
      image: formData.image,
      adresse: formData.adresse,
      forme: formData.forme,
      localisation: formData.localisation,
      coordinatesLatitude: formData.coordinatesLatitude,
      coordinatesLongitude: formData.coordinatesLongitude,
      gtin: formData.gtin,
      sku: formData.sku,
      ean: formData.ean,
      asin: formData.asin,
      multilangLabels: formData.multilangLabels,
      timeline: formData.timeline ? {
        start: formData.timeline.start,
        end: formData.timeline.end,
        estimatedDuration: formData.timeline.estimatedDuration || 0
      } : undefined,
      supplier: formData.supplier,
      supplierId: formData.supplierId
    };
    return this.createMaterial(dto);
  }

  async updateMaterialFromForm(id: string, formData: Partial<MaterialFormDataDTO>): Promise<MaterialDTO> {
    const dto: UpdateMaterialDTO = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      unit: formData.unit,
      pricePerUnit: formData.pricePerUnit,
      quantity: formData.quantity,
      availableQuantity: formData.availableQuantity,
      workspaceId: formData.workspaceId,
      image: formData.image,
      adresse: formData.adresse,
      forme: formData.forme,
      localisation: formData.localisation,
      coordinatesLatitude: formData.coordinatesLatitude,
      coordinatesLongitude: formData.coordinatesLongitude,
      gtin: formData.gtin,
      sku: formData.sku,
      ean: formData.ean,
      asin: formData.asin,
      multilangLabels: formData.multilangLabels,
      timeline: formData.timeline ? {
        start: formData.timeline.start,
        end: formData.timeline.end,
        estimatedDuration: formData.timeline.estimatedDuration || 0
      } : undefined,
      supplier: formData.supplier,
      supplierId: formData.supplierId
    };
    return this.updateMaterial(id, dto);
  }

  async getMaterialForForm(id: string): Promise<MaterialFormDataDTO | null> {
    const dto = await this.getMaterialById(id);
    if (!dto) return null;

    return {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      subcategory: dto.subcategory,
      unit: dto.unit,
      quantity: dto.quantity,
      minQuantity: dto.minQuantity,
      pricePerUnit: dto.pricePerUnit,
      availableQuantity: dto.availableQuantity,
      workspaceId: dto.workspaceId,
      image: dto.image,
      adresse: dto.adresse,
      forme: dto.forme,
      localisation: dto.localisation,
      coordinatesLatitude: dto.coordinatesLatitude,
      coordinatesLongitude: dto.coordinatesLongitude,
      gtin: dto.gtin,
      sku: dto.sku,
      ean: dto.ean,
      asin: dto.asin,
      multilangLabels: dto.multilangLabels,
      timeline: dto.timeline ? {
        start: dto.timeline.start,
        end: dto.timeline.end,
        estimatedDuration: dto.timeline.estimatedDuration || 7
      } : undefined,
      supplier: dto.supplier,
      supplierId: dto.supplierId
    };
  }
}

export default MaterialService;