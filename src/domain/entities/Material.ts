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
  private _workspaceId: string;
  private _location: GeographicUnit;
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
  };
  private _images: MaterialImage[];
  private _pricePerUnit: number;
  private _availableQuantity: number;
  private _originLocation?: string;
  private _category: MaterialCategory;
  private _subcategory?: string;
  private _localisation: CoordinatePoint[]; // Array of coordinate objects
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
  private _coordinates?: string;
  private _coordinatesLatitude?: number;
  private _coordinatesLongitude?: number;
  // Multi-language support
  private _multilangLabels?: Record<string, string>;

  constructor(
    id: string,
    name: string,
    quantity: number,
    unit: string,
    workspaceId: string,
    location: GeographicUnit,
    description?: string,
    minQuantity?: number,
    timeline?: {
      start: Date;
      end: Date;
      estimatedDuration?: number;
    },
    lastRestock?: Date,
    supplier?: {
      name: string;
      contact: string;
      leadTime: number;
    },
    images?: MaterialImage[],
    pricePerUnit?: number,
    availableQuantity?: number,
    originLocation?: string,
    category?: MaterialCategory,
    subcategory?: string,
    localisation?: CoordinatePoint[],
    forme?: "polygon" | "rectangle" | "circle" | "point",
    adresse?: string,
    createdAt?: Date,
    updatedAt?: Date,
    gtin?: string,
    sku?: string,
    ean?: string,
    asin?: string,
    image?: string,
    coordinatesLatitude?: number,
    coordinatesLongitude?: number,
    multilangLabels?: Record<string, string>
  ) {
    this._id = this.validateId(id);
    this._name = this.validateName(name);
    this._description = description;
    this._quantity = this.validateQuantity(quantity);
    this._unit = this.validateUnit(unit);
    this._minQuantity = minQuantity || 0;
    this._workspaceId = this.validateWorkspaceId(workspaceId);
    this._location = location;
    this._timeline = timeline;
    this._lastRestock = lastRestock || new Date();
    this._supplier = supplier;
    this._images = images || [];
    this._pricePerUnit = pricePerUnit || 0;
    this._availableQuantity = availableQuantity || 0;
    this._originLocation = originLocation;
    this._category = category || 'other';
    this._subcategory = subcategory;
    this._localisation = localisation || [];
    this._forme = forme;
    this._adresse = adresse;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._gtin = gtin;
    this._sku = sku;
    this._ean = ean;
    this._asin = asin;
    this._image = image;
    this._coordinatesLatitude = coordinatesLatitude;
    this._coordinatesLongitude = coordinatesLongitude;
    this._multilangLabels = multilangLabels;
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
      this._workspaceId,
      this._location,
      this._description,
      this._minQuantity,
      this._timeline,
      this._lastRestock,
      this._supplier,
      this._images,
      this.validatePricePerUnit(newPrice),
      this._availableQuantity,
      this._originLocation,
      this._category,
      this._subcategory,
      this._localisation,
      this._forme,
      this._adresse,
      this._createdAt,
      new Date(),
      this._gtin,
      this._sku,
      this._ean,
      this._asin,
      this._image,
      this._coordinatesLatitude,
      this._coordinatesLongitude,
      this._multilangLabels
    );
  }

  withAvailableQuantity(newQuantity: number): Material {
    return new Material(
      this._id,
      this._name,
      this._quantity,
      this._unit,
      this._workspaceId,
      this._location,
      this._description,
      this._minQuantity,
      this._timeline,
      this._lastRestock,
      this._supplier,
      this._images,
      this._pricePerUnit,
      this.validateAvailableQuantity(newQuantity),
      this._originLocation,
      this._category,
      this._subcategory,
      this._localisation,
      this._forme,
      this._adresse,
      this._createdAt,
      new Date(),
      this._gtin,
      this._sku,
      this._ean,
      this._asin,
      this._image,
      this._coordinatesLatitude,
      this._coordinatesLongitude,
      this._multilangLabels
    );
  }

  withCoordinates(latitude?: number, longitude?: number): Material {
    return new Material(
      this._id,
      this._name,
      this._quantity,
      this._unit,
      this._workspaceId,
      this._location,
      this._description,
      this._minQuantity,
      this._timeline,
      this._lastRestock,
      this._supplier,
      this._images,
      this._pricePerUnit,
      this._availableQuantity,
      this._originLocation,
      this._category,
      this._subcategory,
      this._localisation,
      this._forme,
      this._adresse,
      this._createdAt,
      new Date(),
      this._gtin,
      this._sku,
      this._ean,
      this._asin,
      this._image,
      latitude,
      longitude,
      this._multilangLabels
    );
  }

  withLocalisation(localisation: CoordinatePoint[]): Material {
    return new Material(
      this._id,
      this._name,
      this._quantity,
      this._unit,
      this._workspaceId,
      this._location,
      this._description,
      this._minQuantity,
      this._timeline,
      this._lastRestock,
      this._supplier,
      this._images,
      this._pricePerUnit,
      this._availableQuantity,
      this._originLocation,
      this._category,
      this._subcategory,
      localisation,
      this._forme,
      this._adresse,
      this._createdAt,
      new Date(),
      this._gtin,
      this._sku,
      this._ean,
      this._asin,
      this._image,
      this._coordinatesLatitude,
      this._coordinatesLongitude,
      this._multilangLabels
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
  }): Material {
    return new Material(
      params.id,
      params.name,
      0, // quantity - default to 0
      params.unit || 'unit',
      params.workspaceId || '',
      params.location || { code: 'unknown', name: 'Unknown', nameAr: 'غير معروف', lat: 0, lng: 0 }, // default location
      params.description || '',
      undefined, // minQuantity
      undefined, // timeline
      undefined, // lastRestock
      undefined, // supplier
      undefined, // images
      params.pricePerUnit || 0,
      params.availableQuantity || 0,
      undefined, // originLocation
      params.category || 'other',
      undefined, // localisation
      undefined, // forme
      undefined, // adresse
      undefined, // createdAt
      undefined  // updatedAt
    );
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get description(): string | undefined { return this._description; }
  get quantity(): number { return this._quantity; }
  get unit(): string { return this._unit; }
  get minQuantity(): number { return this._minQuantity; }
  get workspaceId(): string { return this._workspaceId; }
  get location(): GeographicUnit { return this._location; }
  get timeline(): { start: Date; end: Date; estimatedDuration?: number } | undefined { return this._timeline; }
  get lastRestock(): Date { return this._lastRestock; }
  get supplier(): { name: string; contact: string; leadTime: number } | undefined { return this._supplier; }
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

  // ============= Data Transformation Methods =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      quantity: this._quantity,
      unit: this._unit,
      minQuantity: this._minQuantity,
      workspaceId: this._workspaceId,
      location: this._location,
      timeline: this._timeline,
      lastRestock: this._lastRestock,
      supplier: this._supplier,
      images: this._images,
      pricePerUnit: this._pricePerUnit,
      availableQuantity: this._availableQuantity,
      originLocation: this._originLocation,
      category: this._category,
      subcategory: this._subcategory,
      localisation: this._localisation,
      forme: this._forme,
      adresse: this._adresse,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      gtin: this._gtin,
      sku: this._sku,
      ean: this._ean,
      asin: this._asin,
      image: this._image,
      coordinatesLatitude: this._coordinatesLatitude,
      coordinatesLongitude: this._coordinatesLongitude,
      multilangLabels: this._multilangLabels
    };
  }

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
    let timeline: { start: Date; end: Date; estimatedDuration: number } | undefined;
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
      row.workspace_id as string ?? '',
      { code: 'default', name: 'Default', nameAr: 'افتراضي', lat: 0, lng: 0 }, // Default location, can be enhanced
      row.description as string,
      row.min_quantity as number ?? 0,
      timeline,
      row.last_restock ? new Date(row.last_restock as string) : new Date(),
      row.supplier as { name: string; contact: string; leadTime: number } | undefined,
      [], // images - can be loaded separately
      row.price_per_unit as number ?? 0,
      row.available_quantity as number ?? 0,
      row.origin_location as string,
      row.category as MaterialCategory ?? 'other',
      row.subcategory as string,
      row.localisation as CoordinatePoint[] ?? [],
      row.forme as "polygon" | "rectangle" | "circle" | "point",
      row.adresse as string,
      row.created_at ? new Date(row.created_at as string) : new Date(),
      row.updated_at ? new Date(row.updated_at as string) : new Date(),
      row.gtin as string,
      row.sku as string,
      row.ean as string,
      row.asin as string,
      row.image as string,
      row.coordinates_latitude as number,
      row.coordinates_longitude as number,
      row.multilang_labels as Record<string, string>
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
      multilang_labels: this._multilangLabels
    };
  }
}
