/**
 * Structure Domain Entity
 * Represents physical infrastructure structures (poles, towers, manholes, etc.)
 * Following hexagonal architecture principles
 */

export class Structure {
  private _id: string;
  private _structureType: string;
  private _geometry: any; // GeoJSON geometry
  private _assetTypeCode?: string;
  private _operationalStatus: string;
  private _lifecycle: string;
  private _validFrom: Date;
  private _validTo?: Date;
  private _owner?: string;
  private _responsibilityTeam?: string;
  private _material?: string;
  private _capacityVolume?: number;
  private _widthM?: number;
  private _heightM?: number;
  private _burialDepthCm?: number;
  private _groundClearanceM?: number;
  private _loadCapacityKg?: number;
  private _codeGeo?: string;
  private _labelFr?: string;
  private _labelAr?: string;
  private _labelDefault?: string;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  constructor(
    id: string,
    structureType: string,
    geometry: any,
    operationalStatus: string = 'planned',
    lifecycle: string = 'active',
    validFrom: Date = new Date(),
    validTo?: Date,
    assetTypeCode?: string,
    owner?: string,
    responsibilityTeam?: string,
    material?: string,
    capacityVolume?: number,
    widthM?: number,
    heightM?: number,
    burialDepthCm?: number,
    groundClearanceM?: number,
    loadCapacityKg?: number,
    codeGeo?: string,
    labelFr?: string,
    labelAr?: string,
    labelDefault?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this._id = id;
    this._structureType = structureType;
    this._geometry = geometry;
    this._operationalStatus = operationalStatus;
    this._lifecycle = lifecycle;
    this._validFrom = validFrom;
    this._validTo = validTo;
    this._assetTypeCode = assetTypeCode;
    this._owner = owner;
    this._responsibilityTeam = responsibilityTeam;
    this._material = material;
    this._capacityVolume = capacityVolume;
    this._widthM = widthM;
    this._heightM = heightM;
    this._burialDepthCm = burialDepthCm;
    this._groundClearanceM = groundClearanceM;
    this._loadCapacityKg = loadCapacityKg;
    this._codeGeo = codeGeo;
    this._labelFr = labelFr;
    this._labelAr = labelAr;
    this._labelDefault = labelDefault;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): string { return this._id; }
  get structureType(): string { return this._structureType; }
  get geometry(): any { return this._geometry; }
  get assetTypeCode(): string | undefined { return this._assetTypeCode; }
  get operationalStatus(): string { return this._operationalStatus; }
  get lifecycle(): string { return this._lifecycle; }
  get validFrom(): Date { return this._validFrom; }
  get validTo(): Date | undefined { return this._validTo; }
  get owner(): string | undefined { return this._owner; }
  get responsibilityTeam(): string | undefined { return this._responsibilityTeam; }
  get material(): string | undefined { return this._material; }
  get capacityVolume(): number | undefined { return this._capacityVolume; }
  get widthM(): number | undefined { return this._widthM; }
  get heightM(): number | undefined { return this._heightM; }
  get burialDepthCm(): number | undefined { return this._burialDepthCm; }
  get groundClearanceM(): number | undefined { return this._groundClearanceM; }
  get loadCapacityKg(): number | undefined { return this._loadCapacityKg; }
  get codeGeo(): string | undefined { return this._codeGeo; }
  get labelFr(): string | undefined { return this._labelFr; }
  get labelAr(): string | undefined { return this._labelAr; }
  get labelDefault(): string | undefined { return this._labelDefault; }
  get createdAt(): Date | undefined { return this._createdAt; }
  get updatedAt(): Date | undefined { return this._updatedAt; }

  // Business methods
  isActive(): boolean {
    return this._lifecycle === 'active' && (this._validTo === null || this._validTo === undefined || this._validTo > new Date());
  }

  isValid(): boolean {
    return this._validTo === null || this._validTo === undefined || this._validTo >= this._validFrom;
  }

  getLabel(lang: 'fr' | 'ar' | 'default' = 'fr'): string | undefined {
    switch (lang) {
      case 'fr': return this._labelFr;
      case 'ar': return this._labelAr;
      case 'default': return this._labelDefault;
      default: return this._labelFr;
    }
  }

  // Static factory method
  static create(data: {
    id: string;
    structureType: string;
    geometry: any;
    operationalStatus?: string;
    lifecycle?: string;
    validFrom?: Date;
    validTo?: Date;
    assetTypeCode?: string;
    owner?: string;
    responsibilityTeam?: string;
    material?: string;
    capacityVolume?: number;
    widthM?: number;
    heightM?: number;
    burialDepthCm?: number;
    groundClearanceM?: number;
    loadCapacityKg?: number;
    codeGeo?: string;
    labelFr?: string;
    labelAr?: string;
    labelDefault?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Structure {
    return new Structure(
      data.id,
      data.structureType,
      data.geometry,
      data.operationalStatus,
      data.lifecycle,
      data.validFrom,
      data.validTo,
      data.assetTypeCode,
      data.owner,
      data.responsibilityTeam,
      data.material,
      data.capacityVolume,
      data.widthM,
      data.heightM,
      data.burialDepthCm,
      data.groundClearanceM,
      data.loadCapacityKg,
      data.codeGeo,
      data.labelFr,
      data.labelAr,
      data.labelDefault,
      data.createdAt,
      data.updatedAt
    );
  }
}
