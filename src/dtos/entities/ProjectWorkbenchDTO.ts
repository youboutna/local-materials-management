import type { Geometry, FeatureCollection } from 'geojson';
export type SpatialZoneDTO = Geometry | FeatureCollection;
export type InfraRealization = 'planned' | 'partial' | 'completed';
export interface InfrastructureRealizationDTO { projectId: string; assetId: string; realization: InfraRealization; inspectionId?: string; completedOn?: string; phaseId?: string }
export type WorkbenchView = 'calendar' | 'consumption' | 'expense' | 'revenue' | 'plans' | 'infrastructure';
export type CalendarPeriod = 'day' | 'month' | 'year';
export interface WorkbenchProjectDTO { id: string; title: string; reference?: string; canManage: boolean }
export interface ProjectCalendarEventDTO { id: string; entityId?: string; title: string; kind: 'task' | 'phase' | 'inspection' | 'payment' | 'consumption' | 'expense' | 'revenue'; dateKind: 'start' | 'end' | 'due' | 'scheduled' | 'actual' | 'payment' | 'recorded'; date?: string; href: string; phaseId?: string }
export interface ProjectOperationDTO { id: string; projectId: string; phaseId?: string; taskId?: string; kind: 'consumption' | 'expense' | 'revenue'; occurredOn: string; label: string; resourceFamily?: 'human' | 'material' | 'equipment'; quantity: number; unit: string; amount: number; currency: string; sourceReference?: string; notes?: string }
export type SaveProjectOperationDTO = Omit<ProjectOperationDTO, 'id'> & { id?: string };

/** Référentiels SIG ouverts, seedés par le métier (schéma infra). */
export type GeometryKind = 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'Geometry';
export interface InfraDomainDTO { code: string; labelFr: string; labelAr?: string; labelEn?: string }
export interface AssetTypeDTO { code: string; domainCode: string; assetGroup?: string; assetType?: string; labelFr: string; labelAr?: string; labelEn?: string; geometryKind: GeometryKind; icon?: string }
export interface SaveAssetTypeDTO { code: string; domainCode: string; domainLabelFr?: string; labelFr: string; labelAr?: string; labelEn?: string; assetGroup?: string; assetType?: string; geometryKind: GeometryKind }

/** Ouvrage réseau (infra.network_features). */
export interface InfrastructureAssetDTO { id: string; projectId: string; name: string; assetTypeCode: string; status: string; geometry: Geometry; properties: Record<string, unknown>; updatedAt?: string; realization?: InfraRealization; inspectionId?: string; completedOn?: string; phaseId?: string }
export interface SaveInfrastructureDTO { id?: string; projectId: string; name: string; assetTypeCode: string; status: string; geometry: Geometry; properties?: Record<string, unknown>; parentFeatureId?: string | null; structureId?: string | null }
export interface ImportFeatureItemDTO { name: string; asset_type_code: string; status: string; geometry: Geometry; properties: Record<string, unknown> }
export interface ImportResultDTO { importedCount: number; ids: string[]; errors: Array<{ name?: string; error: string }> }

/** Support physique (infra.structures). */
export interface InfraStructureDTO { id: string; projectId: string; structureType: string; name?: string; geometry: Geometry; properties: Record<string, unknown>; updatedAt?: string }
export interface SaveInfraStructureDTO { id?: string; projectId: string; structureType: string; name?: string; geometry: Geometry; properties?: Record<string, unknown> }

export interface InfrastructureAnalysisDTO { presentCount: number; completedCount: number; assetIds: string[]; intersectedLengthMeters: number; bufferGeojson: Geometry }
