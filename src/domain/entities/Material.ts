// Domain Entity: Material
// Pure business logic without infrastructure concerns

import { GeographicUnit } from "@/types/mauritania";

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
  private _localisation: GeographicUnit[];
  private _forme?: "polygon" | "rectangle" | "circle";
  private _adresse?: string;
  private _createdAt: Date;
  private _updatedAt: Date;

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
    localisation?: GeographicUnit[],
    forme?: "polygon" | "rectangle" | "circle",
    adresse?: string,
    createdAt?: Date,
    updatedAt?: Date
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
    this._localisation = localisation || [];
    this._forme = forme;
    this._adresse = adresse;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  // Validation methods
  set unit(value: string) { 
    this._unit = this.validateUnit(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set pricePerUnit(value: number) { 
    this._pricePerUnit = this.validatePricePerUnit(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set availableQuantity(value: number) { 
    this._availableQuantity = this.validateAvailableQuantity(value); 
    this._updatedAt = new Date().toISOString();
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
      this._description,
      this._category,
      this._unit,
      this.validatePricePerUnit(newPrice),
      this._availableQuantity,
      this._sku,
      this._ean,
      this._gtin,
      this._asin,
      this._image,
      this._coordinates,
      this._workspaceId,
      this._createdAt,
      new Date().toISOString(),
      this._originLocation,
      this._adresse,
      this._coordinatesLatitude,
      this._coordinatesLongitude,
      this._forme,
      this._localisation
    );
  }

  withAvailableQuantity(newQuantity: number): Material {
    return new Material(
      this._id,
      this._name,
      this._description,
      this._category,
      this._unit,
      this._pricePerUnit,
      this.validateAvailableQuantity(newQuantity),
      this._sku,
      this._ean,
      this._gtin,
      this._asin,
      this._image,
      this._coordinates,
      this._workspaceId,
      this._createdAt,
      new Date().toISOString(),
      this._originLocation,
      this._adresse,
      this._coordinatesLatitude,
      this._coordinatesLongitude,
      this._forme,
      this._localisation
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
  }): Material {
    return new Material(
      params.id,
      params.name,
      params.description || '',
      params.category || 'other',
      params.unit || 'unit',
      params.pricePerUnit || 0,
      params.availableQuantity || 0,
      null, // sku
      null, // ean
      null, // gtin
      null, // asin
      null, // image
      null, // coordinates
      params.workspaceId || null,
      new Date().toISOString(),
      new Date().toISOString(),
      null, // originLocation
      null, // adresse
      null, // coordinatesLatitude
      null, // coordinatesLongitude
      null, // forme
      null  // localisation
    );
  }

  // ============= Data Transformation Methods =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      category: this._category,
      unit: this._unit,
      price_per_unit: this._pricePerUnit,
      available_quantity: this._availableQuantity,
      sku: this._sku,
      ean: this._ean,
      gtin: this._gtin,
      asin: this._asin,
      image: this._image,
      coordinates: this._coordinates,
      workspace_id: this._workspaceId,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      origin_location: this._originLocation,
      adresse: this._adresse,
      coordinates_latitude: this._coordinatesLatitude,
      coordinates_longitude: this._coordinatesLongitude,
      forme: this._forme,
      localisation: this._localisation
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
}
