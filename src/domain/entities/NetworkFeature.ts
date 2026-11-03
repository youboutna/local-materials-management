/**
 * NetworkFeature Domain Entity
 * Represents network infrastructure features (lines, devices, assemblies)
 * Following hexagonal architecture principles
 */

export class NetworkFeature {
  private _id: string;
  private _assetTypeCode: string;
  private _geometry: any; // GeoJSON geometry
  private _domainCode?: string;
  private _operationalStatus: string;
  private _lifecycle: string;
  private _validFrom: Date;
  private _validTo?: Date;
  private _tier?: number;
  private _owner?: string;
  private _responsibilityTeam?: string;
  private _installationMethod?: string;
  private _ratedVoltageKv?: number;
  private _ratedCurrentA?: number;
  private _capacityKva?: number;
  private _capacityVolume?: number;
  private _diameterMm?: number;
  private _lengthM?: number;
  private _material?: string;
  private _codeGeo?: string;
  private _localiteType?: string;
  private _codeAdm?: string;
  private _labelFr?: string;
  private _labelAr?: string;
  private _labelDefault?: string;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  constructor(
    id: string,
    assetTypeCode: string,
    geometry: any,
    operationalStatus: string = 'planned',
    lifecycle: string = 'active',
    validFrom: Date = new Date(),
    validTo?: Date,
    domainCode?: string,
    tier?: number,
    owner?: string,
    responsibilityTeam?: string,
    installationMethod?: string,
    ratedVoltageKv?: number,
    ratedCurrentA?: number,
    capacityKva?: number,
    capacityVolume?: number,
    diameterMm?: number,
    lengthM?: number,
    material?: string,
    codeGeo?: string,
    localiteType?: string,
    codeAdm?: string,
    labelFr?: string,
    labelAr?: string,
    labelDefault?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this._id = id;
    this._assetTypeCode = assetTypeCode;
    this._geometry = geometry;
    this._operationalStatus = operationalStatus;
    this._lifecycle = lifecycle;
    this._validFrom = validFrom;
    this._validTo = validTo;
    this._domainCode = domainCode;
    this._tier = tier;
    this._owner = owner;
    this._responsibilityTeam = responsibilityTeam;
    this._installationMethod = installationMethod;
    this._ratedVoltageKv = ratedVoltageKv;
    this._ratedCurrentA = ratedCurrentA;
    this._capacityKva = capacityKva;
    this._capacityVolume = capacityVolume;
    this._diameterMm = diameterMm;
    this._lengthM = lengthM;
    this._material = material;
    this._codeGeo = codeGeo;
    this._localiteType = localiteType;
    this._codeAdm = codeAdm;
    this._labelFr = labelFr;
    this._labelAr = labelAr;
    this._labelDefault = labelDefault;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // Getters
  get id(): string { return this._id; }
  get assetTypeCode(): string { return this._assetTypeCode; }
  get geometry(): any { return this._geometry; }
  get domainCode(): string | undefined { return this._domainCode; }
  get operationalStatus(): string { return this._operationalStatus; }
  get lifecycle(): string { return this._lifecycle; }
  get validFrom(): Date { return this._validFrom; }
  get validTo(): Date | undefined { return this._validTo; }
  get tier(): number | undefined { return this._tier; }
  get owner(): string | undefined { return this._owner; }
  get responsibilityTeam(): string | undefined { return this._responsibilityTeam; }
  get installationMethod(): string | undefined { return this._installationMethod; }
  get ratedVoltageKv(): number | undefined { return this._ratedVoltageKv; }
  get ratedCurrentA(): number | undefined { return this._ratedCurrentA; }
  get capacityKva(): number | undefined { return this._capacityKva; }
  get capacityVolume(): number | undefined { return this._capacityVolume; }
  get diameterMm(): number | undefined { return this._diameterMm; }
  get lengthM(): number | undefined { return this._lengthM; }
  get material(): string | undefined { return this._material; }
  get codeGeo(): string | undefined { return this._codeGeo; }
  get localiteType(): string | undefined { return this._localiteType; }
  get codeAdm(): string | undefined { return this._codeAdm; }
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
    assetTypeCode: string;
    geometry: any;
    operationalStatus?: string;
    lifecycle?: string;
    validFrom?: Date;
    validTo?: Date;
    domainCode?: string;
    tier?: number;
    owner?: string;
    responsibilityTeam?: string;
    installationMethod?: string;
    ratedVoltageKv?: number;
    ratedCurrentA?: number;
    capacityKva?: number;
    capacityVolume?: number;
    diameterMm?: number;
    lengthM?: number;
    material?: string;
    codeGeo?: string;
    localiteType?: string;
    codeAdm?: string;
    labelFr?: string;
    labelAr?: string;
    labelDefault?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): NetworkFeature {
    return new NetworkFeature(
      data.id,
      data.assetTypeCode,
      data.geometry,
      data.operationalStatus,
      data.lifecycle,
      data.validFrom,
      data.validTo,
      data.domainCode,
      data.tier,
      data.owner,
      data.responsibilityTeam,
      data.installationMethod,
      data.ratedVoltageKv,
      data.ratedCurrentA,
      data.capacityKva,
      data.capacityVolume,
      data.diameterMm,
      data.lengthM,
      data.material,
      data.codeGeo,
      data.localiteType,
      data.codeAdm,
      data.labelFr,
      data.labelAr,
      data.labelDefault,
      data.createdAt,
      data.updatedAt
    );
  }
}
