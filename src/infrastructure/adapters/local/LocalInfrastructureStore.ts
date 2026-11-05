import type { IProjectWorkbenchRepository } from '@/domain/repositories/IProjectWorkbenchRepository';
import type { AssetTypeDTO, InfraDomainDTO, InfrastructureAssetDTO, InfraStructureDTO, SaveAssetTypeDTO, SaveInfrastructureDTO, SaveInfraStructureDTO, ImportFeatureItemDTO, ImportResultDTO, InfrastructureRealizationDTO, InfrastructureAnalysisDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import { INFRA_DOMAINS, LOCAL_SEED_ASSET_TYPES } from '@/config/referentials/projects/project-workbench.referential';
import { ProjectWorkbenchTransformer as T } from '@/dtos/transforms/ProjectWorkbenchTransformer';

const KEY = 'hadratech.local.infrastructure';
interface Inventory { domains: InfraDomainDTO[]; types: AssetTypeDTO[]; assets: InfrastructureAssetDTO[]; structures: InfraStructureDTO[] }
type InfraPort = Pick<IProjectWorkbenchRepository, 'domains' | 'assetTypes' | 'saveAssetType' | 'assets' | 'saveAsset' | 'importAssets' | 'deleteAsset' | 'structures' | 'saveStructure' | 'deleteStructure' | 'analyze' | 'saveRealization'>;

/** Browser-only inventory. No embedded client seed and no remote provider calls. */
export class LocalInfrastructureStore implements InfraPort {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> = globalThis.localStorage) {}
  private read(): Inventory {
    const raw = this.storage.getItem(KEY);
    return raw ? JSON.parse(raw) as Inventory : { domains: [...INFRA_DOMAINS], types: LOCAL_SEED_ASSET_TYPES.map(t => ({ ...t })), assets: [], structures: [] };
  }
  private write(data: Inventory) { this.storage.setItem(KEY, JSON.stringify(data)); }
  async domains() { return this.read().domains; }
  async assetTypes(domain?: string) { return this.read().types.filter(t => !domain || t.domainCode === domain); }
  async saveAssetType(input: SaveAssetTypeDTO) {
    const data = this.read();
    if (data.types.some(t => t.code === input.code && t.geometryKind !== input.geometryKind)) throw new Error('Asset type already exists with a different geometry');
    if (!data.domains.some(d => d.code === input.domainCode)) data.domains.push({ code: input.domainCode, labelFr: input.domainLabelFr || input.domainCode });
    data.types = [...data.types.filter(t => t.code !== input.code), { ...input }];
    this.write(data); return input.code;
  }
  async assets(projectId: string) { return this.read().assets.filter(a => a.projectId === projectId); }
  async saveAsset(input: SaveInfrastructureDTO) {
    const data = this.read();
    const type = data.types.find(t => t.code === input.assetTypeCode);
    if (!type) throw new Error('Unknown asset type: register it before import');
    T.assertKind(input.geometry, type.geometryKind); T.assertLonLat(input.geometry, 1);
    const existing = input.id ? data.assets.find(a => a.id === input.id) : undefined;
    if (input.id && (!existing || existing.projectId !== input.projectId)) throw new Error('Infrastructure not found in project');
    const saved: InfrastructureAssetDTO = { ...existing, ...input, id: existing?.id || crypto.randomUUID(), properties: input.properties || {}, updatedAt: new Date().toISOString() };
    data.assets = [...data.assets.filter(a => a.id !== saved.id), saved];
    this.write(data); return saved.id;
  }
  async importAssets(projectId: string, items: ImportFeatureItemDTO[]): Promise<ImportResultDTO> {
    const result: ImportResultDTO = { importedCount: 0, ids: [], errors: [] };
    for (const item of items) {
      try {
        const sourceId = item.properties.source_id ?? item.properties.id;
        const existing = sourceId === undefined ? undefined : (await this.assets(projectId)).find(a => (a.properties.source_id ?? a.properties.id) === sourceId);
        const id = await this.saveAsset({ id: existing?.id, projectId, name: item.name, assetTypeCode: item.asset_type_code, status: item.status, geometry: item.geometry, properties: item.properties });
        result.ids.push(id); result.importedCount++;
      } catch (error) { result.errors.push({ name: item.name, error: error instanceof Error ? error.message : String(error) }); }
    }
    return result;
  }
  async deleteAsset(projectId: string, id: string) {
    const data = this.read();
    if (!data.assets.some(a => a.id === id && a.projectId === projectId)) throw new Error('Infrastructure not found in project');
    data.assets = data.assets.filter(a => a.id !== id); this.write(data);
  }
  async structures(projectId: string) { return this.read().structures.filter(s => s.projectId === projectId); }
  async saveStructure(input: SaveInfraStructureDTO) {
    const data = this.read();
    const existing = input.id ? data.structures.find(s => s.id === input.id) : undefined;
    if (input.id && (!existing || existing.projectId !== input.projectId)) throw new Error('Structure not found in project');
    T.assertLonLat(input.geometry, 1);
    const saved = { ...input, id: existing?.id || crypto.randomUUID(), properties: input.properties || {}, updatedAt: new Date().toISOString() };
    data.structures = [...data.structures.filter(s => s.id !== saved.id), saved]; this.write(data); return saved.id;
  }
  async deleteStructure(projectId: string, id: string) {
    const data = this.read();
    if (!data.structures.some(s => s.id === id && s.projectId === projectId)) throw new Error('Structure not found in project');
    data.structures = data.structures.filter(s => s.id !== id); this.write(data);
  }
  async saveRealization(input: InfrastructureRealizationDTO) {
    const data = this.read(); const asset = data.assets.find(a => a.id === input.assetId && a.projectId === input.projectId);
    if (!asset) throw new Error('Infrastructure not found in project');
    data.assets = data.assets.map(a => a.id === asset.id ? { ...a, ...input, updatedAt: new Date().toISOString() } : a);
    this.write(data); return asset.id;
  }
  async analyze(): Promise<InfrastructureAnalysisDTO> {
    // Local drawings are approximate; never substitute an approximation for PostGIS metrics.
    throw new Error('Metric spatial analysis requires the configured spatial provider');
  }
}