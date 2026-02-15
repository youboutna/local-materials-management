// Domain Entity: Material
// Pure business logic without infrastructure concerns

import { GeographicUnit } from "@/utils/mauritania";

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
  // Missing fields referenced in methods
  private _sku?: string;
  private _ean?: string;
  private _gtin?: string;
  private _asin?: string;
  private _image?: string;
  private _coordinates?: string;
  private _coordinatesLatitude?: number;
  private _coordinatesLongitude?: number;

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
      this._localisation,
      this._forme,
      this._adresse,
      this._createdAt,
      new Date()
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
      this._localisation,
      this._forme,
      this._adresse,
      this._createdAt,
      new Date()
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
      localisation: this._localisation,
      forme: this._forme,
      adresse: this._adresse,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
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
    if (!workspaceId || workspaceId.trim().length === 0) {
      throw new Error('Workspace ID is required');
    }
    return workspaceId.trim();
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
}
