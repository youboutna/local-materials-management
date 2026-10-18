import type { IProjectWorkbenchRepository } from '@/domain/repositories/IProjectWorkbenchRepository';
import { ProjectWorkbenchTransformer as T } from '@/dtos/transforms/ProjectWorkbenchTransformer';
import type { SaveProjectOperationDTO, SaveInfrastructureDTO, InfrastructureAnalysisDTO, SpatialZoneDTO, InfrastructureRealizationDTO, SaveAssetTypeDTO, ImportFeatureItemDTO, SaveInfraStructureDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { SupabaseClient } from '@supabase/supabase-js';
type Rpc = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
export class SupabaseProjectWorkbenchAdapter implements IProjectWorkbenchRepository {
  private async client(): Promise<SupabaseClient> { const { supabase } = await import('@/integrations/supabase/client'); return supabase; }
  private async rpc(fn: string, args?: Record<string, unknown>): Promise<unknown> { const client = await this.client(); const { data, error } = await (client.rpc as unknown as Rpc).call(client, fn, args); if (error) throw error; return data; }
  private async rows(fn: string, args?: Record<string, unknown>) { return ((await this.rpc(fn, args)) || []) as Record<string, unknown>[]; }
  async projects() { return (await this.rows('project_workbench_projects')).map(T.project); }
  async operations(projectId: string) { const client = await this.client(); const result = await client.schema('btp').from('project_operation_entries').select('*').eq('project_id', projectId).order('occurred_on', { ascending: false }); if (result.error) throw result.error; return (result.data || []).map(T.operation); }
  async saveOperation(input: SaveProjectOperationDTO) { const client = await this.client(); const table = client.schema('btp').from('project_operation_entries'); const row = T.toOperationRow(input); const result = input.id ? await table.update(row).eq('id', input.id).eq('project_id', input.projectId).select().single() : await table.insert(row).select().single(); if (result.error) throw result.error; return T.operation(result.data); }
  async deleteOperation(projectId: string, id: string) { const client = await this.client(); const { data, error } = await client.schema('btp').from('project_operation_entries').delete().eq('id', id).eq('project_id', projectId).select('id'); if (error) throw error; if (!data?.length) throw new Error('Operation not found or access denied'); }
  async domains() { return (await this.rows('infra_domains')).map(T.domain); }
  async assetTypes(domain?: string) { return (await this.rows('infra_asset_types', { p_domain: domain ?? null })).map(T.assetType); }
  async saveAssetType(input: SaveAssetTypeDTO) { return String(await this.rpc('infra_asset_type_save', { p_code: input.code, p_domain_code: input.domainCode, p_label_fr: input.labelFr, p_geometry_kind: input.geometryKind, p_label_ar: input.labelAr || null, p_label_en: input.labelEn || null, p_asset_group: input.assetGroup || null, p_asset_type: input.assetType || null, p_domain_label_fr: input.domainLabelFr || null })); }
  async assets(projectId: string) { return (await this.rows('infra_feature_list', { p_project_id: projectId })).map(T.asset); }
  async saveAsset(input: SaveInfrastructureDTO) { return String(await this.rpc('infra_feature_save', { p_project_id: input.projectId, p_asset_type_code: input.assetTypeCode, p_name: input.name, p_geojson: input.geometry, p_status: input.status, p_properties: input.properties ?? {}, p_feature_id: input.id ?? null, p_parent_feature_id: input.parentFeatureId ?? null, p_structure_id: input.structureId ?? null })); }
  async importAssets(projectId: string, items: ImportFeatureItemDTO[]) { return T.importResult(await this.rpc('infra_feature_import', { p_project_id: projectId, p_features: items })); }
  async deleteAsset(projectId: string, id: string) { await this.rpc('infra_feature_delete', { p_project_id: projectId, p_feature_id: id }); }
  async structures(projectId: string) { return (await this.rows('infra_structure_list', { p_project_id: projectId })).map(T.structure); }
  async saveStructure(input: SaveInfraStructureDTO) { return String(await this.rpc('infra_structure_save', { p_project_id: input.projectId, p_structure_type: input.structureType, p_name: input.name ?? null, p_geojson: input.geometry, p_properties: input.properties ?? {}, p_structure_id: input.id ?? null })); }
  async deleteStructure(projectId: string, id: string) { await this.rpc('infra_structure_delete', { p_project_id: projectId, p_structure_id: id }); }
  async analyze(projectId: string, geometry: SpatialZoneDTO, bufferMeters: number): Promise<InfrastructureAnalysisDTO> { return (await this.rpc('infra_zone_analysis', { p_project_id: projectId, p_zone: geometry, p_buffer_meters: bufferMeters })) as InfrastructureAnalysisDTO; }
  async saveRealization(input: InfrastructureRealizationDTO) { return String(await this.rpc('infra_realization_save', { p_project_id: input.projectId, p_feature_id: input.assetId, p_realization: input.realization, p_inspection_id: input.inspectionId || null, p_completed_on: input.completedOn || null, p_phase_id: input.phaseId || null })); }
}
