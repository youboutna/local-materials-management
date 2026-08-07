/**
 * Material Transformer - Hexagonal Architecture
 * Transforms between Material entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes BTP calculations and business logic from MaterialDomainTransformer
 * Updated to handle EnhancedMaterialForm requirements
 * ✅ Gestion complète des relations projet-matériaux
 * ✅ Utilisation correcte des méthodes statiques
 */

import { Material } from '@/domain/entities/Material';
import {
  CreateMaterialDTO,
  CreateProjectMaterialDTO,
  MaterialCategory,
  MaterialDTO,
  MaterialFormDataDTO,
  MaterialStatus,
  MaterialUnit,
  ProjectMaterialDTO,
  UpdateMaterialDTO
} from '@/dtos/entities/MaterialDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class MaterialTransformer implements EntityToDTOMapper<Material, MaterialDTO> {
  // ============================================================================
  // BATCH TRANSFORMATIONS
  // ============================================================================

  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(materials: Material[]): MaterialDTO[] {
    return materials.map(material => MaterialTransformer.toDTO(material));
  }

  /**
   * Batch: DTOs → Domain Entities
   */
  static manyFromDTO(dtos: MaterialDTO[]): Material[] {
    return dtos.map(dto => MaterialTransformer.fromDTO(dto));
  }

  // ============================================================================
  // DATABASE ↔ DOMAIN
  // ============================================================================

  /**
   * Supabase Row (snake_case) → Domain Entity
   */
  static fromSupabase(row: Record<string, unknown>): Material {
    let timeline: { start: Date; end: Date; estimatedDuration?: number } | undefined;
    if (row.timeline) {
      const t = row.timeline as { start?: string; end?: string; estimatedDuration?: number };
      timeline = { 
        start: new Date(t.start as string), 
        end: new Date(t.end as string), 
        estimatedDuration: t.estimatedDuration ?? 7 
      };
    }

    return Material.create({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      category: row.category as any ?? 'other',
      unit: row.unit as string ?? 'unit',
      pricePerUnit: row.price_per_unit as number ?? 0,
      availableQuantity: row.available_quantity as number ?? 0,
      workspaceId: row.workspace_id as string,
      coordinatesLatitude: row.coordinates_latitude as number,
      coordinatesLongitude: row.coordinates_longitude as number,
      adresse: row.adresse as string,
    });
  }

  /**
   * Domain Entity → Supabase Insert/Update Object (snake_case)
   */
  static toSupabase(entity: Material): Record<string, unknown> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      quantity: entity.quantity,
      unit: entity.unit,
      min_quantity: entity.minQuantity,
      workspace_id: entity.workspaceId,
      price_per_unit: entity.pricePerUnit,
      available_quantity: entity.availableQuantity,
      origin_location: entity.originLocation,
      category: entity.category,
      subcategory: entity.subcategory,
      localisation: entity.localisation,
      forme: entity.forme,
      adresse: entity.adresse,
      gtin: entity.gtin,
      sku: entity.sku,
      ean: entity.ean,
      asin: entity.asin,
      image: entity.image,
      coordinates_latitude: entity.coordinatesLatitude,
      coordinates_longitude: entity.coordinatesLongitude,
      multilang_labels: entity.multilangLabels,
      supplier: entity.supplier,
      timeline: entity.timeline,
      last_restock: entity.lastRestock instanceof Date ? entity.lastRestock.toISOString() : entity.lastRestock,
      material_status: entity.materialStatus,
      tags: entity.tags,
    };
  }

  // ============================================================================
  // PROJECT MATERIAL RELATIONSHIPS
  // ============================================================================

  /**
   * Transform ProjectMaterial (DB) → ProjectMaterialDTO
   */
  static toProjectMaterialDTO(row: Record<string, unknown>): ProjectMaterialDTO {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      materialId: row.material_id as string,
      quantity: row.quantity as number,
      unit: row.unit as string || 'unit',
      unitPrice: row.unit_price as number || 0,
      totalPrice: row.total_price as number || 0,
      status: row.status as 'planned' | 'ordered' | 'received' | 'used' || 'planned',
      notes: row.notes as string,
      createdAt: row.created_at as string || new Date().toISOString(),
      updatedAt: row.updated_at as string || new Date().toISOString(),
    };
  }

  /**
   * Transform ProjectMaterialDTO → DB (snake_case)
   */
  static toProjectMaterialSupabase(dto: CreateProjectMaterialDTO): Record<string, unknown> {
    const totalPrice = dto.unitPrice ? dto.quantity * dto.unitPrice : 0;
    return {
      project_id: dto.projectId,
      material_id: dto.materialId,
      quantity: dto.quantity,
      unit: dto.unit || 'unit',
      unit_price: dto.unitPrice || 0,
      total_price: totalPrice,
      status: dto.status || 'planned',
      notes: dto.notes || null,
    };
  }

  /**
   * Transform ProjectMaterialDTO → DTO for API
   */
  static toProjectMaterialApi(dto: ProjectMaterialDTO): ProjectMaterialDTO {
    return {
      id: dto.id,
      projectId: dto.projectId,
      materialId: dto.materialId,
      quantity: dto.quantity,
      unit: dto.unit,
      unitPrice: dto.unitPrice,
      totalPrice: dto.totalPrice,
      status: dto.status,
      notes: dto.notes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Batch: ProjectMaterial Rows → DTOs
   */
  static toProjectMaterialDTOList(rows: Record<string, unknown>[]): ProjectMaterialDTO[] {
    return rows.map(row => MaterialTransformer.toProjectMaterialDTO(row));
  }

  // ============================================================================
  // DOMAIN → DTO
  // ============================================================================

  /**
   * Domain Entity → DTO (for UI)
   */
  static toDTO(entity: Material): MaterialDTO {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      category: entity.category,
      subcategory: entity.subcategory,
      status: MaterialStatus.AVAILABLE,
      unit: entity.unit as MaterialUnit,
      quantity: entity.quantity,
      pricePerUnit: entity.pricePerUnit,
      availableQuantity: entity.availableQuantity,
      minQuantity: entity.minQuantity,
      totalValue: entity.calculateTotalValue(),
      workspaceId: entity.workspaceId || '',
      originLocation: entity.originLocation,
      coordinatesLatitude: entity.coordinatesLatitude,
      coordinatesLongitude: entity.coordinatesLongitude,
      adresse: entity.adresse,
      forme: entity.forme,
      localisation: entity.localisation,
      gtin: entity.gtin,
      sku: entity.sku,
      ean: entity.ean,
      asin: entity.asin,
      multilangLabels: entity.multilangLabels,
      timeline: entity.timeline,
      supplier: entity.supplier,
      image: entity.image,
      tags: [],
      notes: undefined,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  // ============================================================================
  // DTO → DOMAIN
  // ============================================================================

  /**
   * DTO → Domain Entity
   */
  static fromDTO(dto: MaterialDTO): Material {
    return new Material(
      dto.id,
      dto.name,
      dto.quantity,
      dto.unit,
      dto.category,
      dto.workspaceId,
      { code: 'default', name: 'Default', nameAr: 'افتراضي', lat: 0, lng: 0 },
      {
        description: dto.description || '',
        minQuantity: dto.minQuantity,
        timeline: dto.timeline,
        supplier: dto.supplier,
        pricePerUnit: dto.pricePerUnit,
        availableQuantity: dto.availableQuantity,
        originLocation: dto.originLocation,
        subcategory: dto.subcategory,
        localisation: dto.localisation,
        forme: dto.forme,
        adresse: dto.adresse,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
        gtin: dto.gtin,
        sku: dto.sku,
        ean: dto.ean,
        asin: dto.asin,
        image: dto.image,
        coordinatesLatitude: dto.coordinatesLatitude,
        coordinatesLongitude: dto.coordinatesLongitude,
        multilangLabels: dto.multilangLabels
      }
    );
  }

  /**
   * Create Material entity from CreateMaterialDTO
   */
  static createEntityFromCreateDTO(dto: CreateMaterialDTO): Material {
    return new Material(
      crypto.randomUUID(),
      dto.name,
      dto.quantity,
      dto.unit,
      dto.category,
      dto.workspaceId,
      { code: 'default', name: 'Default', nameAr: 'افتراضي', lat: dto.coordinatesLatitude || 0, lng: dto.coordinatesLongitude || 0 },
      {
        description: dto.description || '',
        timeline: dto.timeline,
        supplier: dto.supplier,
        pricePerUnit: dto.pricePerUnit,
        availableQuantity: dto.availableQuantity,
        originLocation: dto.originLocation,
        subcategory: dto.subcategory,
        localisation: dto.localisation || [],
        forme: dto.forme,
        adresse: dto.adresse,
        gtin: dto.gtin,
        sku: dto.sku,
        ean: dto.ean,
        asin: dto.asin,
        image: dto.image,
        coordinatesLatitude: dto.coordinatesLatitude,
        coordinatesLongitude: dto.coordinatesLongitude,
        multilangLabels: dto.multilangLabels,
        materialStatus: 'active'
      }
    );
  }

  // ============================================================================
  // FORM ↔ DTO
  // ============================================================================

  /**
   * Convert MaterialFormDataDTO to CreateMaterialDTO
   */
  static formToCreateRequest(formData: MaterialFormDataDTO): CreateMaterialDTO {
    return {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      unit: formData.unit,
      pricePerUnit: formData.pricePerUnit,
      quantity: formData.quantity,
      availableQuantity: formData.availableQuantity,
      minQuantity: formData.minQuantity,
      workspaceId: formData.workspaceId,
      gtin: formData.gtin,
      sku: formData.sku,
      ean: formData.ean,
      asin: formData.asin,
      image: formData.image,
      coordinatesLatitude: formData.coordinatesLatitude,
      coordinatesLongitude: formData.coordinatesLongitude,
      adresse: formData.adresse,
      forme: formData.forme,
      localisation: formData.localisation,
      multilangLabels: formData.multilangLabels,
      timeline: formData.timeline ? {
        start: formData.timeline.start,
        end: formData.timeline.end,
        estimatedDuration: formData.timeline.estimatedDuration
      } : undefined,
      supplier: formData.supplier,
      supplierId: formData.supplierId
    };
  }

  /**
   * Convert MaterialFormDataDTO to UpdateMaterialDTO
   */
  static formToUpdateRequest(formData: MaterialFormDataDTO): UpdateMaterialDTO {
    return {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      unit: formData.unit,
      pricePerUnit: formData.pricePerUnit,
      quantity: formData.quantity,
      availableQuantity: formData.availableQuantity,
      workspaceId: formData.workspaceId,
      gtin: formData.gtin,
      sku: formData.sku,
      ean: formData.ean,
      asin: formData.asin,
      image: formData.image,
      coordinatesLatitude: formData.coordinatesLatitude,
      coordinatesLongitude: formData.coordinatesLongitude,
      adresse: formData.adresse,
      forme: formData.forme,
      localisation: formData.localisation,
      multilangLabels: formData.multilangLabels,
      timeline: formData.timeline ? {
        start: formData.timeline.start,
        end: formData.timeline.end,
        estimatedDuration: formData.timeline.estimatedDuration
      } : undefined,
      supplier: formData.supplier,
      supplierId: formData.supplierId
    };
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate DTO
   */
  validate(dto: MaterialDTO): ValidationResult {
    const errors: string[] = [];

    if (!dto.name?.trim()) {
      errors.push('Material name is required');
    }

    if (dto.pricePerUnit < 0) {
      errors.push('Price per unit must be positive');
    }

    if (dto.availableQuantity < 0) {
      errors.push('Available quantity must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Enhanced Form Data Validation
   */
  static validateFormData(formData: MaterialFormDataDTO): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic Information Tab
    if (!formData.name?.trim()) {
      errors.push('Le nom du matériau est obligatoire');
    }

    if (!formData.category) {
      errors.push('La catégorie est obligatoire');
    }

    if (!formData.unit) {
      errors.push('L\'unité est obligatoire');
    }

    // Quantities Tab
    if (formData.quantity < 0) {
      errors.push('La quantité doit être positive');
    }

    if (formData.pricePerUnit < 0) {
      errors.push('Le prix unitaire doit être positif');
    }

    if (formData.availableQuantity < 0) {
      errors.push('La quantité disponible doit être positive');
    }

    // Supplier Tab
    if (formData.supplier?.name && !formData.supplier.contact) {
      warnings.push('Les coordonnées du fournisseur sont recommandées');
    }

    if (formData.supplier?.leadTime && formData.supplier.leadTime > 30) {
      warnings.push('Le délai de livraison semble long (> 30 jours)');
    }

    // Timeline Tab
    if (formData.timeline?.start && formData.timeline.end) {
      const startDate = new Date(formData.timeline.start);
      const endDate = new Date(formData.timeline.end);

      if (endDate <= startDate) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }

    // Location Tab
    if (formData.coordinatesLatitude && (formData.coordinatesLatitude < -90 || formData.coordinatesLatitude > 90)) {
      errors.push('La latitude doit être comprise entre -90° et 90°');
    }

    if (formData.coordinatesLongitude && (formData.coordinatesLongitude < -180 || formData.coordinatesLongitude > 180)) {
      errors.push('La longitude doit être comprise entre -180° et 180°');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // ENHANCED MATERIAL CREATION
  // ============================================================================

  /**
   * Enhanced Material Creation with Business Logic
   */
  static createEnhancedMaterial(dto: CreateMaterialDTO): { material: Material; validation: ReturnType<typeof MaterialTransformer.validateFormData> } {
    const formData: MaterialFormDataDTO = {
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
        ...dto.timeline,
        estimatedDuration: dto.timeline.estimatedDuration ?? 0
      } : undefined,
      supplier: dto.supplier,
      supplierId: dto.supplierId
    };

    const validation = MaterialTransformer.validateFormData(formData);
    const material = MaterialTransformer.createEntityFromCreateDTO(dto);

    return { material, validation };
  }

  // ============================================================================
  // BULK PROCESSING
  // ============================================================================

  /**
   * Batch Material Processing for Bulk Operations
   */
  static processBulkMaterials(dtos: CreateMaterialDTO[]): {
    materials: Material[];
    results: Array<{ index: number; success: boolean; errors: string[]; warnings: string[] }>
  } {
    const materials: Material[] = [];
    const results: Array<{ index: number; success: boolean; errors: string[]; warnings: string[] }> = [];

    dtos.forEach((dto, index) => {
      try {
        const { material, validation } = MaterialTransformer.createEnhancedMaterial(dto);

        if (validation.isValid) {
          materials.push(material);
          results.push({ index, success: true, errors: [], warnings: validation.warnings });
        } else {
          results.push({ index, success: false, errors: validation.errors, warnings: validation.warnings });
        }
      } catch (error) {
        results.push({
          index,
          success: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: []
        });
      }
    });

    return { materials, results };
  }

  // ============================================================================
  // CATEGORY HIERARCHY
  // ============================================================================

  /**
   * Category Hierarchy Mapping
   */
  static getCategoryHierarchy(): Record<MaterialCategory, { label: string; subcategories: string[] }> {
    return {
      construction: {
        label: 'Construction',
        subcategories: ['béton', 'acier', 'bois', 'maçonnerie', 'étanchéité', 'isolation']
      },
      building: {
        label: 'Bâtiment',
        subcategories: ['plomberie', 'électricité', 'menuiserie', 'peinture', 'carrelage']
      },
      pierre: {
        label: 'Pierre',
        subcategories: ['marbre', 'granit', 'calcaire', 'ardoise', 'sable', 'gravier']
      },
      electrical: {
        label: 'Électrique',
        subcategories: ['câbles', 'prises', 'interrupteurs', 'éclairage', 'sécurité']
      },
      plumbing: {
        label: 'Plomberie',
        subcategories: ['tuyaux', 'robinetterie', 'chauffe-eau', 'canalisations']
      },
      finishing: {
        label: 'Finitions',
        subcategories: ['peintures', 'revêtements', 'quincaillerie', 'décoration']
      },
      equipment: {
        label: 'Équipement',
        subcategories: ['outillage', 'machinerie', 'sécurité', 'levage']
      },
      safety: {
        label: 'Sécurité',
        subcategories: ['casques', 'gilets', 'chaussures', 'lunettes', 'gants']
      },
      tools: {
        label: 'Outils',
        subcategories: ['manuels', 'électriques', 'mesure', 'soudure']
      },
      other: {
        label: 'Autre',
        subcategories: ['divers']
      }
    };
  }

  // ============================================================================
  // ENTITY TO DTO MAPPER INTERFACE
  // ============================================================================

  toDTO(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  fromDTO(dto: MaterialDTO): Material {
    return MaterialTransformer.fromDTO(dto);
  }

  fromEntityToDTO(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  toResponseDto(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  toRequestDto(dto: MaterialDTO): MaterialDTO {
    return dto;
  }

  toUpdateDto(dto: MaterialDTO): Partial<MaterialDTO> {
    const { id, status, createdAt, updatedAt, ...updateFields } = dto;
    return updateFields;
  }

  fromDtosToAdapter(dtos: MaterialDTO[]): MaterialDTO[] | Record<string, unknown>[] {
    return dtos;
  }

  toDTOs(entities: Material[]): MaterialDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  toEntities(dtos: MaterialDTO[]): Material[] {
    return dtos.map(dto => this.fromDTO(dto));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Material[] {
    return rows.map(row => MaterialTransformer.fromSupabase(row));
  }
}

export default MaterialTransformer;