/**
 * AssetType Domain Entity
 * Represents the type of infrastructure asset (referential data)
 * Following hexagonal architecture principles
 */

export class AssetType {
  private _code: string;
  private _domainCode: string;
  private _assetGroup: string;
  private _assetType: string;
  private _labelFr: string;
  private _labelAr: string;
  private _labelEn: string;
  private _geometryKind: string;

  constructor(
    code: string,
    domainCode: string,
    assetGroup: string,
    assetType: string,
    labelFr: string,
    labelAr: string,
    labelEn: string,
    geometryKind: string
  ) {
    this._code = code;
    this._domainCode = domainCode;
    this._assetGroup = assetGroup;
    this._assetType = assetType;
    this._labelFr = labelFr;
    this._labelAr = labelAr;
    this._labelEn = labelEn;
    this._geometryKind = geometryKind;
  }

  // Getters
  get code(): string { return this._code; }
  get domainCode(): string { return this._domainCode; }
  get assetGroup(): string { return this._assetGroup; }
  get assetType(): string { return this._assetType; }
  get labelFr(): string { return this._labelFr; }
  get labelAr(): string { return this._labelAr; }
  get labelEn(): string { return this._labelEn; }
  get geometryKind(): string { return this._geometryKind; }

  // Business methods
  isValidGeometry(geometryType: string): boolean {
    if (this._geometryKind === 'Geometry') return true;
    return this._geometryKind === geometryType;
  }

  getLabel(lang: 'fr' | 'ar' | 'en' = 'fr'): string {
    switch (lang) {
      case 'fr': return this._labelFr;
      case 'ar': return this._labelAr;
      case 'en': return this._labelEn;
      default: return this._labelFr;
    }
  }

  // Static factory method
  static create(data: {
    code: string;
    domainCode: string;
    assetGroup: string;
    assetType: string;
    labelFr: string;
    labelAr: string;
    labelEn: string;
    geometryKind: string;
  }): AssetType {
    return new AssetType(
      data.code,
      data.domainCode,
      data.assetGroup,
      data.assetType,
      data.labelFr,
      data.labelAr,
      data.labelEn,
      data.geometryKind
    );
  }
}
