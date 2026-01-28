// Domain Entity: Material
// Pure business logic without infrastructure concerns

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

export class Material {
  // Private fields for encapsulation
  private _id: string;
  private _name: string;
  private _description: string;
  private _category: MaterialCategory;
  private _unit: string;
  private _pricePerUnit: number;
  private _availableQuantity: number;
  private _sku: string | null;
  private _ean: string | null;
  private _gtin: string | null;
  private _asin: string | null;
  private _image: string | null;
  private _coordinates: { latitude: number; longitude: number } | null;
  private _workspaceId: string | null;
  private _createdAt: string;
  private _updatedAt: string;
  // Extended fields for Materials page compatibility
  private _originLocation: string | null;
  private _adresse: any = null;
  private _coordinatesLatitude: number | null;
  private _coordinatesLongitude: number | null;
  private _forme: string | null;
  private _localisation: any = null;

  constructor(
    id: string,
    name: string,
    description: string,
    category: MaterialCategory,
    unit: string,
    pricePerUnit: number,
    availableQuantity: number,
    sku: string | null,
    ean: string | null,
    gtin: string | null,
    asin: string | null,
    image: string | null,
    coordinates: { latitude: number; longitude: number } | null,
    workspaceId: string | null,
    createdAt: string,
    updatedAt: string,
    originLocation: string | null = null,
    adresse: any = null,
    coordinatesLatitude: number | null = null,
    coordinatesLongitude: number | null = null,
    forme: string | null = null,
    localisation: any = null
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._name = this.validateName(name);
    this._description = description;
    this._category = this.validateCategory(category);
    this._unit = this.validateUnit(unit);
    this._pricePerUnit = this.validatePricePerUnit(pricePerUnit);
    this._availableQuantity = this.validateAvailableQuantity(availableQuantity);
    this._sku = sku;
    this._ean = ean;
    this._gtin = gtin;
    this._asin = asin;
    this._image = image;
    this._coordinates = coordinates;
    this._workspaceId = workspaceId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._originLocation = originLocation;
    this._adresse = adresse;
    this._coordinatesLatitude = coordinatesLatitude;
    this._coordinatesLongitude = coordinatesLongitude;
    this._forme = forme;
    this._localisation = localisation;
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get category(): MaterialCategory { return this._category; }
  get unit(): string { return this._unit; }
  get pricePerUnit(): number { return this._pricePerUnit; }
  get availableQuantity(): number { return this._availableQuantity; }
  get sku(): string | null { return this._sku; }
  get ean(): string | null { return this._ean; }
  get gtin(): string | null { return this._gtin; }
  get asin(): string | null { return this._asin; }
  get image(): string | null { return this._image; }
  get coordinates(): { latitude: number; longitude: number } | null { return this._coordinates; }
  get workspaceId(): string | null { return this._workspaceId; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }
  get originLocation(): string | null { return this._originLocation; }
  get adresse(): any { return this._adresse; }
  get coordinatesLatitude(): number | null { return this._coordinatesLatitude; }
  get coordinatesLongitude(): number | null { return this._coordinatesLongitude; }
  get forme(): string | null { return this._forme; }
  get localisation(): any { return this._localisation; }

  // ============= Getters with Business Logic =============
  get displayName(): string {
    return this._name || `Material-${this._id}`;
  }

  getFormattedPrice(): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: 'MRU'
    }).format(this._pricePerUnit);
  }

  getTotalValue(): number {
    return this._availableQuantity * this._pricePerUnit;
  }

  isInStock(): boolean {
    return this._availableQuantity > 0;
  }

  // ============= Setters with Validation =============
  set name(value: string) { 
    this._name = this.validateName(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set description(value: string) { 
    this._description = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set category(value: MaterialCategory) { 
    this._category = this.validateCategory(value); 
    this._updatedAt = new Date().toISOString();
  }
  
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
