/**
 * Infrastructure Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following camelCase convention (Rule #2)
 */

import { BaseEntityDTO } from './BaseEntityDTO';

// =============================================================================
// ASSET TYPE DTO
// =============================================================================

export interface AssetTypeDTO extends BaseEntityDTO {
  code: string;
  domainCode: string;
  assetGroup: string;
  assetType: string;
  labelFr: string;
  labelAr: string;
  labelEn: string;
  geometryKind: string;
}

// =============================================================================
// STRUCTURE DTO
// =============================================================================

export interface StructureDTO extends BaseEntityDTO {
  id: string;
  structureType: string;
  geometry: any; // GeoJSON geometry
  assetTypeCode?: string;
  operationalStatus: string;
  lifecycle: string;
  validFrom: string;
  validTo?: string;
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
  name?: string;
}

// =============================================================================
// NETWORK FEATURE DTO
// =============================================================================

export interface NetworkFeatureDTO extends BaseEntityDTO {
  id: string;
  assetTypeCode: string;
  geometry: any; // GeoJSON geometry
  domainCode?: string;
  operationalStatus: string;
  lifecycle: string;
  validFrom: string;
  validTo?: string;
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
}

// =============================================================================
// SAVE FEATURE DTO (for create/update operations)
// =============================================================================

export interface SaveFeatureDTO {
  id?: string;
  assetTypeCode: string;
  geometry: any;
  domainCode?: string;
  operationalStatus?: string;
  lifecycle?: string;
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
  properties?: Record<string, unknown>;
}

// =============================================================================
// IMPORT RESULT DTO
// =============================================================================

export interface ImportResultDTO {
  importedCount: number;
  ids: string[];
  errors: Array<{
    index: number;
    message: string;
    feature?: any;
  }>;
}

// =============================================================================
// INFRASTRUCTURE ANALYSIS DTO
// =============================================================================

export interface InfrastructureAnalysisDTO {
  projectId: string;
  zone: any; // GeoJSON geometry
  bufferMeters: number;
  features: NetworkFeatureDTO[];
  structures: StructureDTODTO[];
  statistics: {
    totalFeatures: number;
    totalStructures: number;
    byDomain: Record<string, number>;
    byAssetType: Record<string, number>;
    totalLengthM?: number;
    totalCapacityKva?: number;
  };
}

// Type alias for StructureDTO (fixing typo)
export type StructureDTODTO = StructureDTO;

// =============================================================================
// REALIZATION DTO (for presence vs realization tracking)
// =============================================================================

export interface RealizationDTO {
  featureId: string;
  projectId: string;
  planned: boolean;
  realized: boolean;
  realizationDate?: string;
  realizationProgress?: number;
  notes?: string;
}

// =============================================================================
// DOMAIN DTO
// =============================================================================

export interface DomainDTO extends BaseEntityDTO {
  code: string;
  labelFr: string;
  labelAr: string;
  labelEn: string;
  description?: string;
}

// =============================================================================
// ASSET ATTRIBUTE DTO
// =============================================================================

export interface AssetAttributeDTO extends BaseEntityDTO {
  attributeId: string;
  assetClass: string;
  assetGlobalid: string;
  attributeName: string;
  attributeValue?: string;
  unit?: string;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
  recordedDate: string;
  source?: string;
}

// =============================================================================
// ASSEMBLY CONTENT DTO
// =============================================================================

export interface AssemblyContentDTO extends BaseEntityDTO {
  assemblyGlobalid: string;
  componentGlobalid: string;
  componentRole?: string;
  quantity: number;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
}

// =============================================================================
// STRUCTURE CONTENT DTO
// =============================================================================

export interface StructureContentDTO extends BaseEntityDTO {
  contentId: string;
  structureGlobalid: string;
  assetGlobalid: string;
  occupancyRatio?: number;
  startMeasure?: number;
  endMeasure?: number;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
  source?: string;
}

// =============================================================================
// STRUCTURAL ATTACHMENT DTO
// =============================================================================

export interface StructuralAttachmentDTO extends BaseEntityDTO {
  attachmentId: string;
  structureGlobalid: string;
  equipmentGlobalid: string;
  attachmentPoint?: string;
  offsetDistanceM?: number;
  orientationDegrees?: number;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
  source?: string;
}

// =============================================================================
// OUTAGE LOG DTO
// =============================================================================

export interface OutageLogDTO extends BaseEntityDTO {
  outageId: string;
  projectId?: string;
  outageStarttime: string;
  outageEndtime?: string;
  affectedFeatureClass: string;
  affectedFeatureGlobalid: string;
  rootCauseCategory?: string;
  rootCauseDetail?: string;
  impactedCustomerCount?: number;
  impactedDemandMw?: number;
  durationMinutes?: number;
  resolutionTeam?: string;
  incidentReportLink?: string;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
}

// =============================================================================
// INTERVENTION LOG DTO
// =============================================================================

export interface InterventionLogDTO extends BaseEntityDTO {
  interventionId: string;
  projectId?: string;
  workOrderId: string;
  interventionType?: string;
  affectedFeatureClass: string;
  affectedFeatureGlobalid: string;
  scheduledDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  durationHours?: number;
  status?: string;
  technicianId?: string;
  technicianName?: string;
  technicianTeam?: string;
  descriptionWork?: string;
  downtimeMinutes?: number;
  impactedCustomersCount?: number;
  partsCostUsd?: number;
  laborCostUsd?: number;
  totalCostUsd?: number;
  weatherCondition?: string;
  photoAttachments?: any;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
}

// =============================================================================
// CUSTOMER ACCOUNT DTO
// =============================================================================

export interface CustomerAccountDTO extends BaseEntityDTO {
  customerId: string;
  projectId?: string;
  customerName: string;
  servicePointGlobalid?: string;
  meterInstallationDate?: string;
  voltageClass?: string;
  billingStatus?: string;
  actualConsumptionKwh?: number;
  estimatedAnnualKwh?: number;
  outageHistoryCount?: number;
  lastOutageDate?: string;
  contactEmail?: string;
  contactPhone?: string;
  codeGeo?: string;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
  localiteType?: string;
  codeAdm?: string;
}

// =============================================================================
// CONNECTION REQUEST DTO
// =============================================================================

export interface ConnectionRequestDTO extends BaseEntityDTO {
  requestId: string;
  projectId?: string;
  requestDate: string;
  requestType?: string;
  customerId?: string;
  requestedLocation?: any; // GeoJSON Point
  nearestServicePointGlobalid?: string;
  nearestTransformerDistanceM?: number;
  status?: string;
  requestedCapacityKw?: number;
  availableCapacityKw?: number;
  capacityShortfallKw?: number;
  upgradeCostEstimated?: number;
  infrastructureRequired?: string;
  lostRevenueImpactUsd?: number;
  priorityLevel?: string;
  codeGeo?: string;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
  localiteType?: string;
  codeAdm?: string;
}

// =============================================================================
// TELEMETRY READING DTO
// =============================================================================

export interface TelemetryReadingDTO extends BaseEntityDTO {
  readingId: string;
  assetGlobalid: string;
  timestamp: string;
  parameter: string;
  value?: number;
  unit?: string;
  quality?: string;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
  source?: string;
}

// =============================================================================
// ALERT DTO (Infrastructure-specific)
// =============================================================================

export interface InfraAlertDTO extends BaseEntityDTO {
  alertId: string;
  assetGlobalid: string;
  alertType?: string;
  severity?: 'Critical' | 'High' | 'Medium' | 'Low';
  message?: string;
  timestamp: string;
  isAcknowledged?: boolean;
  acknowledgedBy?: string;
  clearedTimestamp?: string;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
  source?: string;
}

// =============================================================================
// TOPOLOGY ERROR LOG DTO
// =============================================================================

export interface TopologyErrorLogDTO extends BaseEntityDTO {
  errorId: string;
  projectId?: string;
  errorType?: string;
  featureClass?: string;
  featureGlobalid?: string;
  errorDescription?: string;
  detectedTimestamp: string;
  resolvedTimestamp?: string;
  resolvedBy?: string;
  labelFr?: string;
  labelAr?: string;
  labelDefault?: string;
  source?: string;
}

// =============================================================================
// CODE GEO MAPPING DTO
// =============================================================================

export interface CodeGeoMappingDTO extends BaseEntityDTO {
  codeGeo: string;
  longitudeDeg: number;
  latitudeDeg: number;
  hemisphere?: 'E' | 'O';
  xCoordAbs?: number;
  yCoordAbs?: number;
  localiteFr?: string;
  localiteAr?: string;
  localiteDefault?: string;
  codeAdm?: string;
  localiteType?: string;
  source?: string;
}
