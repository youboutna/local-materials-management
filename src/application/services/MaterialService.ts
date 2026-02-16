/**
 * Material Service - Hexagonal Architecture
 * Business logic for material management with geocoding integration
 * Rule #1: Form → DTO → Service → Domain → Adapter → DB
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { Material } from '@/domain/entities/Material';
import {
  MaterialDTO,
  CreateMaterialDTO,
  UpdateMaterialDTO,
  MaterialFilterDTO,
  MaterialCategory,
  MaterialFormDataDTO
} from '@/dtos/entities/MaterialDTO';
import { MaterialTransformer } from '@/dtos/transforms/MaterialTransformer';
import { GeocodingService } from './GeocodingService';
import { SupplierService } from '@/application/services/SupplierService';
import { WorkspaceService } from './WorkspaceService';
import { DocumentService } from './DocumentService';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { IWorkspaceRepository } from '@/domain/repositories/IWorkspaceRepository';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';

export class MaterialService {
  private geocodingService: GeocodingService;
  private supplierService!: SupplierService;
  private workspaceService!: WorkspaceService;
  private documentService!: DocumentService;

  constructor(
    private materialRepository: IMaterialRepository,
    supplierRepository?: ISupplierRepository,
    workspaceRepository?: IWorkspaceRepository,
    documentRepository?: IDocumentRepository
  ) {
    // Initialize geocoding service for MAP geolocalizations
    this.geocodingService = new GeocodingService({
      userAgent: 'MauritaniaMapper/1.0 (contact@company.mr)'
    });

    // Initialize related services following hexagonal architecture
    if (supplierRepository) {
      this.supplierService = new SupplierService(supplierRepository);
    }
    if (workspaceRepository) {
      this.workspaceService = new WorkspaceService(workspaceRepository);
    }
    if (documentRepository) {
      this.documentService = new DocumentService(documentRepository);
    }
  }

  // =================== CRUD Operations ===================

  async getAllMaterials(filter?: MaterialFilterDTO): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findAll();
      let dtos = materials.map(m => MaterialTransformer.toDTO(m));

      // Apply filters if provided
      if (filter) {
        dtos = this.applyFilters(dtos, filter);
      }

      return dtos;
    } catch (error) {
      console.error('MaterialService.getAllMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials');
    }
  }

  /**
   * Get materials formatted for UI usage
   * Returns MaterialDTO[] instead of MaterialDTO[] for UI-specific formatting
   */
  async getMaterialsForUI(filter?: MaterialFilterDTO): Promise<MaterialDTO[]> {
    // For now, return the same as getAllMaterials
    // TODO: Add UI-specific formatting if needed
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
      // Validate input data
      this.validateCreateMaterialData(dto);

      // Hexagonal Architecture: Validate related entities exist
      await this.validateRelatedEntities(dto);

      // Create entity from DTO
      const entity = MaterialTransformer.createEntityFromCreateDTO(dto);

      // Additional business logic - geocode address if provided
      const enrichedEntity = dto.adresse ? await this.enrichWithGeocoding(entity) : entity;

      // Save via repository (returns void)
      await this.materialRepository.save(enrichedEntity);

      // Retrieve the saved material to get the generated ID
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

      // Validate update data
      this.validateUpdateMaterialData(dto);

      // Apply updates to entity
      const updatedEntity = this.applyUpdatesToEntity(existing, dto);

      // Additional business logic - geocode address if changed
      const enrichedEntity = dto.adresse ? await this.enrichWithGeocoding(updatedEntity) : updatedEntity;

      // Save via repository
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

  // =================== Query Operations ===================

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

  /**
   * Get materials for a specific project
   * TODO: Implement project-material relationships when available
   */
  async getProjectMaterials(projectId: string): Promise<MaterialDTO[]> {
    try {
      // For now, return all materials
      // TODO: Filter by project when project-material relationship is implemented
      return this.getAllMaterials();
    } catch (error) {
      console.error('MaterialService.getProjectMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project materials');
    }
  }

  /**
   * Add a material to a project
   * TODO: Implement project-material relationship management
   */
  async addMaterialToProject(projectId: string, materialId: string, quantity: number): Promise<void> {
    try {
      // TODO: Implement project-material relationship
      // For now, this is a placeholder
      console.log(`Adding material ${materialId} to project ${projectId} with quantity ${quantity}`);
    } catch (error) {
      console.error('MaterialService.addMaterialToProject failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add material to project');
    }
  }

  // =================== Geocoding Integration ===================

  /**
   * Enrich material with geocoding data for MAP geolocalizations
   * Returns updated material with geocoding data instead of modifying in place
   */
  private async enrichWithGeocoding(material: Material): Promise<Material> {
    try {
      if (!material.adresse) return material;

      // Use geocoding service to get coordinates from address
      const results = await this.geocodingService.geocode(material.adresse);

      if (results.length > 0) {
        const bestResult = results[0];

        // Create updated material with geocoding results using immutable methods
        let updatedMaterial = material.withCoordinates(
          bestResult.coordinates.lat,
          bestResult.coordinates.lng
        );

        // Update localisation array with geocoding data
        updatedMaterial = updatedMaterial.withLocalisation([{
          lat: bestResult.coordinates.lat,
          lng: bestResult.coordinates.lng,
          address: bestResult.address,
          type: 'point' as const, // Map geocoding type to valid forme type
          confidence: bestResult.confidence
        }]);

        return updatedMaterial;
      }

      return material;
    } catch (error) {
      console.warn('Geocoding enrichment failed:', error);
      // Don't fail the operation if geocoding fails, return original material
      return material;
    }
  }

  /**
   * Reverse geocode coordinates to get address information
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

  // =================== Related Entity Validation ===================

  /**
   * Validate that related entities (supplier, workspace) exist
   * Following hexagonal architecture - service orchestration
   */
  private async validateRelatedEntities(dto: CreateMaterialDTO): Promise<void> {
    const errors: string[] = [];

    // Validate workspace exists if provided
    if (dto.workspaceId && this.workspaceService) {
      try {
        const workspace = await this.workspaceService.getWorkspaceById(dto.workspaceId);
        if (!workspace) {
          errors.push(`Workspace with ID ${dto.workspaceId} does not exist`);
        }
      } catch (error) {
        errors.push(`Failed to validate workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate supplier exists if provided
    if (dto.supplierId && this.supplierService) {
      try {
        const supplier = await this.supplierService.getSupplierById(dto.supplierId);
        if (!supplier) {
          errors.push(`Supplier with ID ${dto.supplierId} does not exist`);
        }
      } catch (error) {
        errors.push(`Failed to validate supplier: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Note: Document validation is handled separately after material creation
    // The DocumentUpload component collects documents but association happens post-creation

    if (errors.length > 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Related entity validation failed: ${errors.join(', ')}`);
    }
  }

  private validateCreateMaterialData(data: CreateMaterialDTO): void {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push('Material name is required');
    }

    if (data.pricePerUnit < 0) {
      errors.push('Price per unit must be positive');
    }

    if (data.availableQuantity < 0) {
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

  private applyUpdatesToEntity(existing: Material, updates: UpdateMaterialDTO): Material {
    // Create updated entity with new values using the new constructor
    return new Material(
      existing.id,
      updates.name ?? existing.name,
      updates.quantity ?? existing.quantity,
      updates.unit ?? existing.unit,
      updates.category ?? existing.category,
      updates.workspaceId ?? existing.workspaceId,
      existing.location, // Keep existing location
      {
        description: updates.description ?? existing.description,
        minQuantity: updates.minQuantity ?? existing.minQuantity,
        timeline: existing.timeline, // Keep existing timeline
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
        updatedAt: new Date(), // Update timestamp
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

  private applyFilters(materials: MaterialDTO[], filter: MaterialFilterDTO): MaterialDTO[] {
    return materials.filter(material => {
      if (filter.category && material.category !== filter.category) return false;
      if (filter.subcategory && material.subcategory !== filter.subcategory) return false;
      if (filter.workspaceId && material.workspaceId !== filter.workspaceId) return false;
      if (filter.search && !material.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.inStockOnly && material.availableQuantity <= 0) return false;
      if (filter.lowStockOnly && material.availableQuantity > 10) return false; // Assuming 10 is low stock threshold

      return true;
    });
  }

  // =================== Form Integration Methods ===================

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
      timeline: formData.timeline,
      supplier: formData.supplier
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
      timeline: formData.timeline,
      supplier: formData.supplier
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
      supplier: dto.supplier
    };
  }
}
