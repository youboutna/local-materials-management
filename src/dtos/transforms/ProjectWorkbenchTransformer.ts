import type { ProjectOperationDTO, SaveProjectOperationDTO, SaveInfrastructureDTO, InfrastructureAssetDTO, WorkbenchProjectDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { Geometry } from 'geojson';
type Row = Record<string, unknown>;
const optional = (value: unknown): string | undefined => typeof value === 'string' && value ? value : undefined;
export class ProjectWorkbenchTransformer {
  static project(row: Row): WorkbenchProjectDTO { return { id: String(row.id), title: String(row.title), reference: optional(row.reference), canManage: row.can_manage === true }; }
  static operation(row: Row): ProjectOperationDTO { return { id: String(row.id), projectId: String(row.project_id), phaseId: optional(row.phase_id), taskId: optional(row.task_id), kind: row.kind as ProjectOperationDTO['kind'], occurredOn: String(row.occurred_on), label: String(row.label), resourceFamily: row.resource_family as ProjectOperationDTO['resourceFamily'], quantity: Number(row.quantity), unit: String(row.unit), amount: Number(row.amount), currency: String(row.currency), sourceReference: optional(row.source_reference), notes: optional(row.notes) }; }
  static toOperationRow(input: SaveProjectOperationDTO): Row { return { project_id: input.projectId, phase_id: input.phaseId || null, task_id: input.taskId || null, kind: input.kind, occurred_on: input.occurredOn, label: input.label.trim(), resource_family: input.resourceFamily || null, quantity: input.quantity, unit: input.unit, amount: input.amount, currency: input.currency, source_reference: input.sourceReference || null, notes: input.notes || null }; }
  static formToOperation(form: SaveProjectOperationDTO): SaveProjectOperationDTO { return { ...form, quantity: Number(form.quantity), amount: Number(form.amount), label: form.label.trim() }; }
  static asset(row: Row): InfrastructureAssetDTO { return { id: String(row.id), projectId: String(row.project_id), name: String(row.name), assetType: String(row.asset_type), status: String(row.status), geometry: row.geojson as Geometry, properties: (row.properties || {}) as Row }; }
  static formToAsset(form: Omit<SaveInfrastructureDTO, 'geometry'> & { geometry: string }): SaveInfrastructureDTO {
    const geometry = JSON.parse(form.geometry);
    if (!geometry || typeof geometry !== 'object' || !['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon','GeometryCollection'].includes(geometry.type)) throw new Error('Invalid GeoJSON geometry');
    return { ...form, name: form.name.trim(), geometry: geometry as Geometry };
  }
}