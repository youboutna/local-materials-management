import type { Geometry, FeatureCollection } from 'geojson';
export type SpatialZoneDTO = Geometry | FeatureCollection;
export interface InfrastructureRealizationDTO { projectId: string; assetId: string; realization: 'planned' | 'partial' | 'completed'; inspectionId?: string; completedOn?: string; phaseId?: string }
export type WorkbenchView = 'calendar' | 'consumption' | 'expense' | 'revenue' | 'plans' | 'infrastructure';
export type CalendarPeriod = 'day' | 'month' | 'year';
export interface WorkbenchProjectDTO { id: string; title: string; reference?: string; canManage: boolean }
export interface ProjectCalendarEventDTO { id: string; entityId?: string; title: string; kind: 'task' | 'phase' | 'inspection' | 'payment' | 'consumption' | 'expense' | 'revenue'; dateKind: 'start' | 'end' | 'due' | 'scheduled' | 'actual' | 'payment' | 'recorded'; date?: string; href: string; phaseId?: string }
export interface ProjectOperationDTO { id: string; projectId: string; phaseId?: string; taskId?: string; kind: 'consumption' | 'expense' | 'revenue'; occurredOn: string; label: string; resourceFamily?: 'human' | 'material' | 'equipment'; quantity: number; unit: string; amount: number; currency: string; sourceReference?: string; notes?: string }
export type SaveProjectOperationDTO = Omit<ProjectOperationDTO, 'id'> & { id?: string };
export interface InfrastructureAssetDTO { id: string; projectId: string; name: string; assetType: string; status: string; geometry: Geometry; properties: Record<string, unknown> }
export interface SaveInfrastructureDTO { id?: string; projectId: string; name: string; assetType: string; status: string; geometry: Geometry }
export interface InfrastructureAnalysisDTO { presentCount: number; completedCount: number; assetIds: string[]; intersectedLengthMeters: number; bufferGeojson: Geometry }