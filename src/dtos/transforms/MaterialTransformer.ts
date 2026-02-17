/**
 * Material Transformer - Hexagonal Architecture
 * Transforms between Material entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes BTP calculations and business logic from MaterialDomainTransformer
 * Updated to handle EnhancedMaterialForm requirements
 */

import { Material } from '@/domain/entities/Material';
import {
  MaterialDTO,
  MaterialFormDataDTO,
  CreateMaterialDTO,
  UpdateMaterialDTO,
  MaterialCategory,
  MaterialUnit,
  MaterialStatus
} from '@/dtos/entities/MaterialDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class MaterialTransformer implements EntityToDTOMapper<Material, MaterialDTO> {
  /**
   * Transform Material entity to MaterialDTO (Domain → DTO)
   * Converts domain entity to data transfer object for UI/API
  */
  static fromSupabase(row: Record<string, unknown>): Material {
    return Material.fromDatabase(row);
  }

  /**
   * Domain Entity → DB row
   */
  static toSupabase(entity: Material): Record<string, unknown> {
    return entity.toDatabase();
  }

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
      status: MaterialStatus.AVAILABLE, // Default status, can be enhanced with business logic
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
      tags: [], // Can be enhanced with additional logic
      notes: undefined, // Can be enhanced with additional logic
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

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
      { code: 'default', name: 'Default', nameAr: 'افتراضي', lat: 0, lng: 0 }, // Default location
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
      crypto.randomUUID(), // Generate new ID
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

  /**
   * Convert MaterialFormDataDTO to CreateMaterialDTO
   * Form data → Create request for service layer
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
      supplier: formData.supplier
    };
  }

  /**
   * Convert MaterialFormDataDTO to UpdateMaterialDTO
   * Form data → Update request for service layer
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
      supplier: formData.supplier
    };
  }

  // EntityToDTOMapper interface implementation
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
    return dto; // For this implementation, request and response are the same
  }

  toUpdateDto(dto: MaterialDTO): Partial<MaterialDTO> {
    const { id, status, createdAt, updatedAt, ...updateFields } = dto;
    return updateFields;
  }

  fromDtosToAdapter(dtos: MaterialDTO[]): MaterialDTO[] | Record<string, unknown>[] {
    return dtos; // Return DTOs as-is for adapter
  }

  validate(dto: MaterialDTO): ValidationResult {
    // Basic validation - can be enhanced with more business rules
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

  toDTOs(entities: Material[]): MaterialDTO[] {
    return entities.map(entity => MaterialTransformer.toDTO(entity));
  }

  /**
   * Category Hierarchy Mapping
   * Maps category/subcategory combinations for UI display
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

  /**
   * Multi-Language Label Processing
   * Processes and validates multi-language labels for materials
   */
  static processMultiLanguageLabels(labels: Record<string, string> | undefined): Record<string, string> {
    const defaultLabels: Record<string, string> = {};

    if (!labels) return defaultLabels;

    // Supported languages: French (fr), Arabic (ar), English (en), Spanish (es)
    const supportedLanguages = ['fr', 'ar', 'en', 'es'];

    supportedLanguages.forEach(lang => {
      if (labels[lang] && labels[lang].trim()) {
        defaultLabels[lang] = labels[lang].trim();
      }
    });

    return defaultLabels;
  }

  /**
   * Supplier Relationship Enhancement
   * Enhances supplier data with additional business logic
   */
  static enhanceSupplierData(supplier: MaterialDTO['supplier']): MaterialDTO['supplier'] & { rating?: number; reliability?: string } {
    if (!supplier) return supplier as any;

    // Add supplier rating calculation (mock for now)
    const rating = supplier.leadTime <= 7 ? 5 : supplier.leadTime <= 14 ? 4 : 3;
    const reliability = rating >= 4 ? 'high' : rating >= 3 ? 'medium' : 'low';

    return {
      ...supplier,
      rating,
      reliability
    };
  }

  /**
   * Location/Geocoding Integration
   * Processes location data with geocoding enhancements
   */
  static processLocationData(dto: Partial<MaterialDTO>): {
    coordinates: { lat: number; lng: number } | null;
    address: string;
    region?: string;
    city?: string;
    country?: string;
  } {
    const coordinates = dto.coordinatesLatitude && dto.coordinatesLongitude
      ? { lat: dto.coordinatesLatitude, lng: dto.coordinatesLongitude }
      : null;

    // Extract region/city from localisation data if available
    let region: string | undefined;
    let city: string | undefined;
    let country = 'Mauritania'; // Default for BTP context

    if (dto.localisation && dto.localisation.length > 0) {
      const firstLocation = dto.localisation[0];
      if (firstLocation.address) {
        // Parse address for region/city info (simplified)
        const addressParts = firstLocation.address.split(',');
        if (addressParts.length >= 2) {
          city = addressParts[0].trim();
          region = addressParts[1].trim();
        }
      }
    }

    return {
      coordinates,
      address: dto.adresse || '',
      region,
      city,
      country
    };
  }

  /**
   * Document Attachment Management
   * Processes document attachments for materials
   */
  static processDocumentAttachments(documents: string[] | undefined): Array<{
    id: string;
    type: 'certificate' | 'manual' | 'specification' | 'safety' | 'other';
    url: string;
    uploadedAt: string;
    size?: number;
  }> {
    if (!documents || documents.length === 0) return [];

    return documents.map(docId => ({
      id: docId,
      type: 'other' as const, // Could be enhanced with document type detection
      url: `/api/documents/${docId}`,
      uploadedAt: new Date().toISOString(),
      size: undefined // Would need to be fetched from document service
    }));
  }

  /**
   * Enhanced Form Data Validation
   * Validates multi-tab form data with business rules
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

  /**
   * Enhanced Material Creation with Business Logic
   * Creates material with enhanced validation and business rules
   */
  static createEnhancedMaterial(dto: CreateMaterialDTO): { material: Material; validation: ReturnType<typeof MaterialTransformer.validateFormData> } {
    // Convert to form data for validation
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
      supplier: dto.supplier
    };

    const validation = MaterialTransformer.validateFormData(formData);

    const material = MaterialTransformer.createEntityFromCreateDTO(dto);

    return { material, validation };
  }

  /**
   * Batch Material Processing for Bulk Operations
   * Processes multiple materials with enhanced validation
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
