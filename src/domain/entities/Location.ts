/**
 * Location Domain Entity
 * Pure business entity following PROMPTS.md Rule #4: No DTOs in domain
 */

export type LocationType = 'region' | 'city';

export type EconomicImportance = 'capital' | 'economic' | 'regional' | 'local';

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Map Location DTO for UI components
 * Represents locations displayed on maps with additional UI properties
 */
export interface MapLocation {
  id: string;
  name: string;
  type: "project" | "warehouse" | "material";
  latitude: number;
  longitude: number;
  status?: string;
  region?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  warehouseShape?: { lat: number; lng: number }[];
  warehouseShapeType?: "polygon" | "rectangle" | "circle";
  adresse?: string | undefined;
}

/**
 * Location Domain Entity
 * Represents a geographical location (region or city) in Mauritania
 */
export class Location {
  private readonly _id: string;
  private _code: string;
  private _name: string;
  private _nameAr: string;
  private _type: LocationType;
  private _coordinates?: Coordinates;
  private _parentCode?: string;
  private _economicImportance?: EconomicImportance;
  private _population?: number;
  private readonly _createdAt?: Date;
  private _updatedAt?: Date;

  constructor({
    id,
    code,
    name,
    nameAr,
    type,
    coordinates,
    parentCode,
    economicImportance,
    population,
    createdAt,
    updatedAt
  }: {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    type: LocationType;
    coordinates?: Coordinates;
    parentCode?: string;
    economicImportance?: EconomicImportance;
    population?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this._id = id;
    this._code = code;
    this._name = name;
    this._nameAr = nameAr;
    this._type = type;
    this._coordinates = coordinates;
    this._parentCode = parentCode;
    this._economicImportance = economicImportance;
    this._population = population;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get nameAr(): string {
    return this._nameAr;
  }

  get type(): LocationType {
    return this._type;
  }

  get coordinates(): Coordinates | undefined {
    return this._coordinates;
  }

  get parentCode(): string | undefined {
    return this._parentCode;
  }

  get economicImportance(): EconomicImportance | undefined {
    return this._economicImportance;
  }

  get population(): number | undefined {
    return this._population;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // Business logic methods
  isRegion(): boolean {
    return this._type === 'region';
  }

  isCity(): boolean {
    return this._type === 'city';
  }

  isCapital(): boolean {
    return this._economicImportance === 'capital';
  }

  hasCoordinates(): boolean {
    return !!this._coordinates;
  }

  getDisplayName(): string {
    return `${this._name} (${this._nameAr})`;
  }

  /**
   * Calculate distance to another location
   */
  distanceTo(other: Location): number {
    if (!this._coordinates || !other._coordinates) {
      return Infinity;
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other._coordinates.lat - this._coordinates.lat);
    const dLng = this.toRadians(other._coordinates.lng - this._coordinates.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this._coordinates.lat)) * Math.cos(this.toRadians(other._coordinates.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Validate location data
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this._code || this._code.trim().length === 0) {
      errors.push('Code is required');
    }

    if (!this._name || this._name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!this._nameAr || this._nameAr.trim().length === 0) {
      errors.push('Arabic name is required');
    }

    if (!['region', 'city'].includes(this._type)) {
      errors.push('Type must be "region" or "city"');
    }

    if (this._type === 'city' && !this._parentCode) {
      errors.push('City must have a parent region code');
    }

    if (this._coordinates) {
      if (this._coordinates.lat < -90 || this._coordinates.lat > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
      if (this._coordinates.lng < -180 || this._coordinates.lng > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    if (this._population !== undefined && (this._population < 0 || !Number.isInteger(this._population))) {
      errors.push('Population must be a positive integer');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update location properties
   */
  update(updates: Partial<{
    name: string;
    nameAr: string;
    coordinates: Coordinates;
    economicImportance: EconomicImportance;
    population: number;
  }>): Location {
    return new Location({
      ...this,
      ...updates,
      updatedAt: new Date()
    });
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      code: this._code,
      name: this._name,
      nameAr: this._nameAr,
      type: this._type,
      coordinates: this._coordinates,
      parentCode: this._parentCode,
      economicImportance: this._economicImportance,
      population: this._population,
      createdAt: this._createdAt?.toISOString(),
      updatedAt: this._updatedAt?.toISOString()
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
