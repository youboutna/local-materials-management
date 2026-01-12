// Domain Entity: Material
// Pure business logic without infrastructure concerns

export type MaterialCategory = 
  | 'construction' 
  | 'electrical' 
  | 'plumbing' 
  | 'finishing' 
  | 'equipment' 
  | 'safety' 
  | 'other';

export class Material {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly category: MaterialCategory,
    public readonly unit: string,
    public readonly pricePerUnit: number,
    public readonly availableQuantity: number,
    public readonly sku: string | null,
    public readonly ean: string | null,
    public readonly gtin: string | null,
    public readonly asin: string | null,
    public readonly image: string | null,
    public readonly coordinates: { latitude: number; longitude: number } | null,
    public readonly workspaceId: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    // Extended fields for Materials page compatibility
    public readonly originLocation: string | null = null,
    public readonly adresse: any = null,
    public readonly coordinatesLatitude: number | null = null,
    public readonly coordinatesLongitude: number | null = null,
    public readonly forme: string | null = null,
    public readonly localisation: any = null
  ) {}

  // Business logic
  isAvailable(): boolean {
    return this.availableQuantity > 0;
  }

  isLowStock(threshold: number = 10): boolean {
    return this.availableQuantity <= threshold;
  }

  calculateTotalValue(): number {
    return this.availableQuantity * this.pricePerUnit;
  }

  canFulfillOrder(quantity: number): boolean {
    return this.availableQuantity >= quantity;
  }

  getFormattedPrice(): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: 'MRU'
    }).format(this.pricePerUnit);
  }

  hasBarcode(): boolean {
    return !!(this.ean || this.gtin || this.asin || this.sku);
  }

  // Factory method
  static create(params: {
    id: string;
    name: string;
    description: string;
    category: MaterialCategory;
    unit: string;
    pricePerUnit: number;
    availableQuantity?: number;
    sku?: string;
    workspaceId?: string;
    originLocation?: string;
    adresse?: any;
    coordinatesLatitude?: number;
    coordinatesLongitude?: number;
    forme?: string;
    localisation?: any;
  }): Material {
    return new Material(
      params.id,
      params.name,
      params.description,
      params.category,
      params.unit,
      params.pricePerUnit,
      params.availableQuantity || 0,
      params.sku || null,
      null,
      null,
      null,
      null,
      null,
      params.workspaceId || null,
      new Date().toISOString(),
      new Date().toISOString(),
      params.originLocation || null,
      params.adresse || null,
      params.coordinatesLatitude || null,
      params.coordinatesLongitude || null,
      params.forme || null,
      params.localisation || null
    );
  }
}
