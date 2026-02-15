/**
 * Domain Entity: Material
 * Aligned with DB schema (materials table) per Rule #9
 * DB → Entity → Repository → Service
 */

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
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: MaterialCategory;
  readonly unit: string;
  readonly pricePerUnit: number;
  readonly availableQuantity: number;
  readonly sku: string | null;
  readonly ean: string | null;
  readonly gtin: string | null;
  readonly asin: string | null;
  readonly image: string | null;
  readonly coordinatesLatitude: number | null;
  readonly coordinatesLongitude: number | null;
  readonly workspaceId: string | null;
  readonly originLocation: string | null;
  readonly adresse: string | null;
  readonly forme: string | null;
  readonly localisation: Record<string, unknown>[] | null;
  readonly multilangLabels: Record<string, string> | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(params: MaterialParams) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.category = params.category;
    this.unit = params.unit;
    this.pricePerUnit = params.pricePerUnit;
    this.availableQuantity = params.availableQuantity;
    this.sku = params.sku;
    this.ean = params.ean;
    this.gtin = params.gtin;
    this.asin = params.asin;
    this.image = params.image;
    this.coordinatesLatitude = params.coordinatesLatitude;
    this.coordinatesLongitude = params.coordinatesLongitude;
    this.workspaceId = params.workspaceId;
    this.originLocation = params.originLocation;
    this.adresse = params.adresse;
    this.forme = params.forme;
    this.localisation = params.localisation;
    this.multilangLabels = params.multilangLabels;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  // ============= Business Logic =============
  isAvailable(): boolean {
    return this.availableQuantity > 0;
  }

  isLowStock(threshold: number = 10): boolean {
    return this.availableQuantity <= threshold && this.availableQuantity > 0;
  }

  isOutOfStock(): boolean {
    return this.availableQuantity <= 0;
  }

  calculateTotalValue(): number {
    return this.availableQuantity * this.pricePerUnit;
  }

  hasCoordinates(): boolean {
    return this.coordinatesLatitude !== null && this.coordinatesLongitude !== null;
  }

  // ============= Validation =============
  static validate(params: Partial<MaterialParams>): string[] {
    const errors: string[] = [];
    if (!params.name?.trim()) errors.push('Material name is required');
    if (!params.category) errors.push('Material category is required');
    if (!params.unit?.trim()) errors.push('Material unit is required');
    if (params.pricePerUnit !== undefined && params.pricePerUnit < 0) {
      errors.push('Price per unit must be non-negative');
    }
    if (params.availableQuantity !== undefined && params.availableQuantity < 0) {
      errors.push('Available quantity must be non-negative');
    }
    return errors;
  }

  // ============= Factory =============
  static create(params: MaterialParams): Material {
    const errors = Material.validate(params);
    if (errors.length > 0) {
      throw new Error(`Material validation failed: ${errors.join(', ')}`);
    }
    return new Material(params);
  }

  static fromDatabase(row: Record<string, unknown>): Material {
    return new Material({
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) || '',
      category: (row.category as MaterialCategory) || 'other',
      unit: (row.unit as string) || 'unit',
      pricePerUnit: Number(row.price_per_unit) || 0,
      availableQuantity: Number(row.available_quantity) || 0,
      sku: (row.sku as string) || null,
      ean: (row.ean as string) || null,
      gtin: (row.gtin as string) || null,
      asin: (row.asin as string) || null,
      image: (row.image as string) || null,
      coordinatesLatitude: row.coordinates_latitude != null ? Number(row.coordinates_latitude) : null,
      coordinatesLongitude: row.coordinates_longitude != null ? Number(row.coordinates_longitude) : null,
      workspaceId: (row.workspace_id as string) || null,
      originLocation: (row.origin_location as string) || null,
      adresse: row.adresse != null ? (typeof row.adresse === 'string' ? row.adresse : JSON.stringify(row.adresse)) : null,
      forme: (row.forme as string) || null,
      localisation: Array.isArray(row.localisation) ? row.localisation : (row.localisation ? [row.localisation] : null),
      multilangLabels: (row.multilang_labels as Record<string, string>) || null,
      createdAt: (row.created_at as string) || new Date().toISOString(),
      updatedAt: (row.updated_at as string) || new Date().toISOString(),
    });
  }

  toDatabase(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      unit: this.unit,
      price_per_unit: this.pricePerUnit,
      available_quantity: this.availableQuantity,
      sku: this.sku,
      ean: this.ean,
      gtin: this.gtin,
      asin: this.asin,
      image: this.image,
      coordinates_latitude: this.coordinatesLatitude,
      coordinates_longitude: this.coordinatesLongitude,
      workspace_id: this.workspaceId,
      origin_location: this.originLocation,
      adresse: this.adresse,
      forme: this.forme,
      localisation: this.localisation,
      multilang_labels: this.multilangLabels,
    };
  }
}

export interface MaterialParams {
  id: string;
  name: string;
  description: string;
  category: MaterialCategory;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  sku: string | null;
  ean: string | null;
  gtin: string | null;
  asin: string | null;
  image: string | null;
  coordinatesLatitude: number | null;
  coordinatesLongitude: number | null;
  workspaceId: string | null;
  originLocation: string | null;
  adresse: string | null;
  forme: string | null;
  localisation: Record<string, unknown>[] | null;
  multilangLabels: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}
