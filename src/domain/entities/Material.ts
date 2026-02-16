// Domain Entity: Material
// Pure business logic without infrastructure concerns

import { GeographicUnit } from "@/utils/mauritania";
import { CoordinatePoint } from "@/dtos/entities/MaterialDTO";

export type MaterialCategory = 
  | 'construction' 
  | 'building'
  | 'pierre'
  | 'electrical' 
  | 'plumbing' 
  | 'finishing' 
  | 'equipment' 
  | 'safety' 
  | 'tools'
  | 'other';
export interface MaterialImage {
  id: string;
  url: string;
  materialId: string;
  createdAt: Date;
  updatedAt: Date;
}
export class Material {
  // Private fields for encapsulation
  private _id: string;
  private _name: string;
  private _description?: string;
  private _quantity: number;
  private _unit: string;
  private _minQuantity: number;
  private _workspaceId?: string;
  private _location?: GeographicUnit;
  private _timeline?: {
    start: Date;
    end: Date;
    estimatedDuration?: number;
  };
  private _lastRestock: Date;
  private _supplier?: {
    name: string;
    contact: string;
    leadTime: number;
    id?: string; // Added supplier ID
  };
  private _images: MaterialImage[];
  private _pricePerUnit: number;
  private _availableQuantity: number;
  private _originLocation?: string;
  private _category: MaterialCategory;
  private _subcategory?: string;
  private _localisation: CoordinatePoint[];
  private _forme?: "polygon" | "rectangle" | "circle" | "point";
  private _adresse?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  // New identifier fields for product identification
  private _gtin?: string;
  private _sku?: string;
  private _ean?: string;
  private _asin?: string;
  private _image?: string;
  private _coordinatesLatitude?: number;
  private _coordinatesLongitude?: number;
  // Multi-language support
  private _multilangLabels?: Record<string, string>;
  // Database-specific fields
  private _supplierId?: string; // Foreign key to suppliers table
  private _materialCode?: string; // Unique material code
  private _minimumStock?: number; // Renamed from minQuantity for clarity
  private _maximumStock?: number;
  private _leadTimeDays?: number;
  private _qualityGrade?: string;
  private _technicalSpecifications?: Record<string, unknown>;
  private _materialStatus?: 'active' | 'discontinued' | 'pending';
  private _tags?: string[];

  constructor(
    id: string,
    name: string,
    quantity: number = 0,
    unit: string = 'unit',
    category: MaterialCategory = 'other',
    workspaceId?: string,
    location?: GeographicUnit,
    options?: {
      description?: string;
      minQuantity?: number;
      timeline?: { start: Date; end: Date; estimatedDuration?: number };
      lastRestock?: Date;
      supplier?: { name: string; contact: string; leadTime: number; id?: string };
      images?: MaterialImage[];
      pricePerUnit?: number;
      availableQuantity?: number;
      originLocation?: string;
      subcategory?: string;
      localisation?: CoordinatePoint[];
      forme?: "polygon" | "rectangle" | "circle" | "point";
      adresse?: string;
      createdAt?: Date;
      updatedAt?: Date;
      gtin?: string;
      sku?: string;
      ean?: string;
      asin?: string;
      image?: string;
      coordinatesLatitude?: number;
      coordinatesLongitude?: number;
      multilangLabels?: Record<string, string>;
      supplierId?: string;
      materialCode?: string;
      minimumStock?: number;
      maximumStock?: number;
      leadTimeDays?: number;
      qualityGrade?: string;
      technicalSpecifications?: Record<string, unknown>;
      materialStatus?: 'active' | 'discontinued' | 'pending';
      tags?: string[];
    }
  ) {
    this._id = this.validateId(id);
    this._name = this.validateName(name);
    this._quantity = this.validateQuantity(quantity);
    this._unit = this.validateUnit(unit);
    this._category = this.validateCategory(category);
    this._workspaceId = workspaceId;
    this._location = location;
    
    // Apply options with defaults
    this._description = options?.description;
    this._minQuantity = options?.minQuantity || 0;
    this._timeline = options?.timeline;
    this._lastRestock = options?.lastRestock || new Date();
    this._supplier = options?.supplier;
    this._images = options?.images || [];
    this._pricePerUnit = options?.pricePerUnit || 0;
    this._availableQuantity = options?.availableQuantity || 0;
    this._originLocation = options?.originLocation;
    this._subcategory = options?.subcategory;
    this._localisation = options?.localisation || [];
    this._forme = options?.forme;
    this._adresse = options?.adresse;
    this._createdAt = options?.createdAt || new Date();
    this._updatedAt = options?.updatedAt || new Date();
    this._gtin = options?.gtin;
    this._sku = options?.sku;
    this._ean = options?.ean;
    this._asin = options?.asin;
    this._image = options?.image;
    this._coordinatesLatitude = options?.coordinatesLatitude;
    this._coordinatesLongitude = options?.coordinatesLongitude;
    this._multilangLabels = options?.multilangLabels || {};
    this._supplierId = options?.supplierId;
    this._materialCode = options?.materialCode;
    this._minimumStock = options?.minimumStock;
    this._maximumStock = options?.maximumStock;
    this._leadTimeDays = options?.leadTimeDays;
    this._qualityGrade = options?.qualityGrade;
    this._technicalSpecifications = options?.technicalSpecifications || {};
    this._materialStatus = options?.materialStatus || 'active';
    this._tags = options?.tags || [];
  }

  // Validation methods
  set unit(value: string) { 
    this._unit = this.validateUnit(value); 
    this._updatedAt = new Date();
  }
  
  set pricePerUnit(value: number) { 
    this._pricePerUnit = this.validatePricePerUnit(value); 
    this._updatedAt = new Date();
  }
  
  set availableQuantity(value: number) { 
    this._availableQuantity = this.validateAvailableQuantity(value); 
    this._updatedAt = new Date();
  }

  // ============= Business Logic Methods =============
  isAvailable(): boolean {
    return this._availableQuantity > 0;
  }

  isLowStock(threshold: number = 10): boolean {
    return this._availableQuantity <= threshold;
  }

  calculateTotalValue(): number {
    return this._availableQuantity * this._pricePerUnit;
  }

  // ============= Immutability Methods =============
  withPricePerUnit(newPrice: number): Material {
    return new Material(
      this._id,
      this._name,
      this._quantity,
      this._unit,
      this._category,
      this._workspaceId,
      this._location,
      {
        description: this._description,
        minQuantity: this._minQuantity,
        timeline: this._timeline,
        lastRestock: this._lastRestock,
        supplier: this._supplier,
        images: this._images,
        pricePerUnit: this.validatePricePerUnit(newPrice),
        availableQuantity: this._availableQuantity,
        originLocation: this._originLocation,
        subcategory: this._subcategory,
        localisation: this._localisation,
        forme: this._forme,
        adresse: this._adresse,
        createdAt: this._createdAt,
        updatedAt: new Date(),
        gtin: this._gtin,
        sku: this._sku,
        ean: this._ean,
        asin: this._asin,
        image: this._image,
        coordinatesLatitude: this._coordinatesLatitude,
        coordinatesLongitude: this._coordinatesLongitude,
        multilangLabels: this._multilangLabels,
        supplierId: this._supplierId,
        materialCode: this._materialCode,
        minimumStock: this._minimumStock,
        maximumStock: this._maximumStock,
        leadTimeDays: this._leadTimeDays,
        qualityGrade: this._qualityGrade,
        technicalSpecifications: this._technicalSpecifications,
        materialStatus: this._materialStatus,
        tags: this._tags
      }
    );
  }

  withAvailableQuantity(newQuantity: number): Material {
    return new Material(
      this._id,
      this._name,
      this._quantity,
      this._unit,
      this._category,
      this._workspaceId,
      this._location,
      {
        description: this._description,
        minQuantity: this._minQuantity,
        timeline: this._timeline,
        lastRestock: this._lastRestock,
        supplier: this._supplier,
        images: this._images,
        pricePerUnit: this._pricePerUnit,
        availableQuantity: this.validateAvailableQuantity(newQuantity),
        originLocation: this._originLocation,
        subcategory: this._subcategory,
        localisation: this._localisation,
        forme: this._forme,
        adresse: this._adresse,
        createdAt: this._createdAt,
        updatedAt: new Date(),
        gtin: this._gtin,
        sku: this._sku,
        ean: this._ean,
        asin: this._asin,
        image: this._image,
        coordinatesLatitude: this._coordinatesLatitude,
        coordinatesLongitude: this._coordinatesLongitude,
        multilangLabels: this._multilangLabels,
        supplierId: this._supplierId,
        materialCode: this._materialCode,
        minimumStock: this._minimumStock,
        maximumStock: this._maximumStock,
        leadTimeDays: this._leadTimeDays,
        qualityGrade: this._qualityGrade,
        technicalSpecifications: this._technicalSpecifications,
        materialStatus: this._materialStatus,
        tags: this._tags
      }
    );
  }

  withCoordinates(latitude?: number, longitude?: number): Material {
    return new Material(
      this._id,
      this._name,
      this._quantity,
      this._unit,
      this._category,
      this._workspaceId,
      this._location,
      {
        description: this._description,
        minQuantity: this._minQuantity,
        timeline: this._timeline,
        lastRestock: this._lastRestock,
        supplier: this._supplier,
        images: this._images,
        pricePerUnit: this._pricePerUnit,
        availableQuantity: this._availableQuantity,
        originLocation: this._originLocation,
        subcategory: this._subcategory,
        localisation: this._localisation,
        forme: this._forme,
        adresse: this._adresse,
        createdAt: this._createdAt,
        updatedAt: new Date(),
        gtin: this._gtin,
        sku: this._sku,
        ean: this._ean,
        asin: this._asin,
        image: this._image,
        coordinatesLatitude: latitude,
        coordinatesLongitude: longitude,
        multilangLabels: this._multilangLabels,
        supplierId: this._supplierId,
        materialCode: this._materialCode,
        minimumStock: this._minimumStock,
        maximumStock: this._maximumStock,
        leadTimeDays: this._leadTimeDays,
        qualityGrade: this._qualityGrade,
        technicalSpecifications: this._technicalSpecifications,
        materialStatus: this._materialStatus,
        tags: this._tags
      }
    );
  }

  withLocalisation(localisation: CoordinatePoint[]): Material {
    return new Material(
      this._id,
      this._name,
      this._quantity,
      this._unit,
      this._category,
      this._workspaceId,
      this._location,
      {
        description: this._description,
        minQuantity: this._minQuantity,
        timeline: this._timeline,
        lastRestock: this._lastRestock,
        supplier: this._supplier,
        images: this._images,
        pricePerUnit: this._pricePerUnit,
        availableQuantity: this._availableQuantity,
        originLocation: this._originLocation,
        subcategory: this._subcategory,
        localisation: localisation,
        forme: this._forme,
        adresse: this._adresse,
        createdAt: this._createdAt,
        updatedAt: new Date(),
        gtin: this._gtin,
        sku: this._sku,
        ean: this._ean,
        asin: this._asin,
        image: this._image,
        coordinatesLatitude: this._coordinatesLatitude,
        coordinatesLongitude: this._coordinatesLongitude,
        multilangLabels: this._multilangLabels,
        supplierId: this._supplierId,
        materialCode: this._materialCode,
        minimumStock: this._minimumStock,
        maximumStock: this._maximumStock,
        leadTimeDays: this._leadTimeDays,
        qualityGrade: this._qualityGrade,
        technicalSpecifications: this._technicalSpecifications,
        materialStatus: this._materialStatus,
        tags: this._tags
      }
    );
  }

  // ============= Factory Methods =============
  static create(params: {
    id: string;
    name: string;
    description?: string;
    category?: MaterialCategory;
    unit?: string;
    pricePerUnit?: number;
    availableQuantity?: number;
    workspaceId?: string;
    location?: GeographicUnit;
    supplierId?: string;
    coordinatesLatitude?: number;
    coordinatesLongitude?: number;
    adresse?: string;
  }): Material {
    return new Material(
      params.id,
      params.name,
      0, // quantity - default to 0
      params.unit || 'unit',
      params.category || 'other',
      params.workspaceId,
      params.location,
      {
        description: params.description,
        pricePerUnit: params.pricePerUnit,
        availableQuantity: params.availableQuantity,
        coordinatesLatitude: params.coordinatesLatitude,
        coordinatesLongitude: params.coordinatesLongitude,
        adresse: params.adresse,
        supplierId: params.supplierId,
        materialStatus: 'active'
      }
    );
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get description(): string | undefined { return this._description; }
  get quantity(): number { return this._quantity; }
  get unit(): string { return this._unit; }
  get minQuantity(): number { return this._minQuantity; }
  get workspaceId(): string | undefined { return this._workspaceId; }
  get location(): GeographicUnit | undefined { return this._location; }
  get timeline(): { start: Date; end: Date; estimatedDuration?: number } | undefined { return this._timeline; }
  get lastRestock(): Date { return this._lastRestock; }
  get supplier(): { name: string; contact: string; leadTime: number; id?: string } | undefined { return this._supplier; }
  get images(): MaterialImage[] { return this._images; }
  get pricePerUnit(): number { return this._pricePerUnit; }
  get availableQuantity(): number { return this._availableQuantity; }
  get originLocation(): string | undefined { return this._originLocation; }
  get category(): MaterialCategory { return this._category; }
  get subcategory(): string | undefined { return this._subcategory; }
  get localisation(): CoordinatePoint[] { return this._localisation; }
  get forme(): "polygon" | "rectangle" | "circle" | "point" | undefined { return this._forme; }
  get adresse(): string | undefined { return this._adresse; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get gtin(): string | undefined { return this._gtin; }
  get sku(): string | undefined { return this._sku; }
  get ean(): string | undefined { return this._ean; }
  get asin(): string | undefined { return this._asin; }
  get image(): string | undefined { return this._image; }
  get coordinatesLatitude(): number | undefined { return this._coordinatesLatitude; }
  get coordinatesLongitude(): number | undefined { return this._coordinatesLongitude; }
  get multilangLabels(): Record<string, string> | undefined { return this._multilangLabels; }
  // Database-specific getters
  get supplierId(): string | undefined { return this._supplierId; }
  get materialCode(): string | undefined { return this._materialCode; }
  get minimumStock(): number | undefined { return this._minimumStock; }
  get maximumStock(): number | undefined { return this._maximumStock; }
  get leadTimeDays(): number | undefined { return this._leadTimeDays; }
  get qualityGrade(): string | undefined { return this._qualityGrade; }
  get technicalSpecifications(): Record<string, unknown> | undefined { return this._technicalSpecifications; }
  get materialStatus(): 'active' | 'discontinued' | 'pending' | undefined { return this._materialStatus; }
  get tags(): string[] | undefined { return this._tags; }

  // ============= Validation Methods =============
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Material ID is required');
    }
    return id.trim();
  }

  private validateName(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new Error('Material name is required');
    }
    if (name.length > 200) {
      throw new Error('Material name must be less than 200 characters');
    }
    return name.trim();
  }

  private validateCategory(category: MaterialCategory): MaterialCategory {
    const validCategories: MaterialCategory[] = [
      'construction', 'building', 'pierre', 'electrical', 'plumbing', 'finishing', 'equipment', 'safety', 'tools', 'other'
    ];
    
    // Accept both lowercase and capitalized versions
    const normalizedCategory = category.toLowerCase() as MaterialCategory;
    
    if (!validCategories.includes(normalizedCategory)) {
      throw new Error(`Invalid material category: ${category}`);
    }
    return normalizedCategory;
  }

  private validateUnit(unit: string): string {
    if (!unit || unit.trim().length === 0) {
      throw new Error('Material unit is required');
    }
    return unit.trim();
  }

  private validateWorkspaceId(workspaceId: string): string {
    // Workspace ID is now optional - return as-is or empty string for backward compatibility
    return workspaceId || '';
  }

  private validatePricePerUnit(price: number): number {
    if (price < 0) {
      throw new Error('Price per unit must be positive');
    }
    if (price > 10000000) {
      throw new Error('Price per unit seems too high');
    }
    return price;
  }

  private validateAvailableQuantity(quantity: number): number {
    if (quantity < 0) {
      throw new Error('Available quantity must be positive');
    }
    if (quantity > 10000000) {
      throw new Error('Available quantity seems too high');
    }
    return quantity;
  }

  private validateQuantity(quantity: number): number {
    if (quantity < 0) {
      throw new Error('Quantity must be positive');
    }
    if (quantity > 10000000) {
      throw new Error('Quantity seems too high');
    }
    return quantity;
  }

  // ============= Database Integration Methods =============

  /**
   * Create Material entity from database record (snake_case)
   */
  static fromDatabase(row: Record<string, unknown>): Material {
    // Extract timeline safely
    let timeline: { start: Date; end: Date; estimatedDuration?: number } | undefined;
    if (row.timeline) {
      const timelineData = row.timeline as {
        start?: string;
        end?: string;
        estimatedDuration?: number;
      };
      timeline = {
        start: new Date(timelineData.start as string),
        end: new Date(timelineData.end as string),
        estimatedDuration: timelineData.estimatedDuration as number ?? 7
      };
    }

    return new Material(
      row.id as string,
      row.name as string,
      row.quantity as number ?? 0,
      row.unit as string ?? 'unit',
      row.category as MaterialCategory ?? 'other',
      row.workspace_id as string,
      { code: 'default', name: 'Default', nameAr: 'افتراضي', lat: 0, lng: 0 }, // Default location, can be enhanced
      {
        description: row.description as string,
        minQuantity: row.min_quantity as number ?? 0,
        timeline: timeline,
        lastRestock: row.last_restock ? new Date(row.last_restock as string) : new Date(),
        supplier: row.supplier as { name: string; contact: string; leadTime: number } | undefined,
        images: [], // images - can be loaded separately
        pricePerUnit: row.price_per_unit as number ?? 0,
        availableQuantity: row.available_quantity as number ?? 0,
        originLocation: row.origin_location as string,
        subcategory: row.subcategory as string,
        localisation: row.localisation as CoordinatePoint[] ?? [],
        forme: row.forme as "polygon" | "rectangle" | "circle" | "point",
        adresse: row.adresse as string,
        createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
        gtin: row.gtin as string,
        sku: row.sku as string,
        ean: row.ean as string,
        asin: row.asin as string,
        image: row.image as string,
        coordinatesLatitude: row.coordinates_latitude as number,
        coordinatesLongitude: row.coordinates_longitude as number,
        multilangLabels: row.multilang_labels as Record<string, string>,
        supplierId: row.supplier_id as string,
        materialCode: row.material_code as string,
        minimumStock: row.minimum_stock as number,
        maximumStock: row.maximum_stock as number,
        leadTimeDays: row.lead_time_days as number,
        qualityGrade: row.quality_grade as string,
        technicalSpecifications: row.technical_specifications as Record<string, unknown>,
        materialStatus: row.material_status as 'active' | 'discontinued' | 'pending' ?? 'active',
        tags: row.tags as string[]
      }
    );
  }

  /**
   * Convert Material entity to database record (snake_case)
   */
  toDatabase(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      quantity: this._quantity,
      unit: this._unit,
      min_quantity: this._minQuantity,
      workspace_id: this._workspaceId,
      location: this._location,
      timeline: this._timeline,
      last_restock: this._lastRestock.toISOString(),
      supplier: this._supplier,
      images: this._images,
      price_per_unit: this._pricePerUnit,
      available_quantity: this._availableQuantity,
      origin_location: this._originLocation,
      category: this._category,
      subcategory: this._subcategory,
      localisation: this._localisation,
      forme: this._forme,
      adresse: this._adresse,
      created_at: this._createdAt.toISOString(),
      updated_at: this._updatedAt.toISOString(),
      gtin: this._gtin,
      sku: this._sku,
      ean: this._ean,
      asin: this._asin,
      image: this._image,
      coordinates_latitude: this._coordinatesLatitude,
      coordinates_longitude: this._coordinatesLongitude,
      multilang_labels: this._multilangLabels,
      supplier_id: this._supplierId,
      material_code: this._materialCode,
      minimum_stock: this._minimumStock,
      maximum_stock: this._maximumStock,
      lead_time_days: this._leadTimeDays,
      quality_grade: this._qualityGrade,
      technical_specifications: this._technicalSpecifications,
      material_status: this._materialStatus,
      tags: this._tags
    };
  }
}
