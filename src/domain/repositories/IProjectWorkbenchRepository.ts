import type { WorkbenchProjectDTO, ProjectOperationDTO, SaveProjectOperationDTO, InfrastructureAssetDTO, SaveInfrastructureDTO, InfrastructureAnalysisDTO, SpatialZoneDTO, InfrastructureRealizationDTO, AssetTypeDTO, InfraDomainDTO, SaveAssetTypeDTO, ImportFeatureItemDTO, ImportResultDTO, InfraStructureDTO, SaveInfraStructureDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
export interface IProjectWorkbenchRepository {
  projects(): Promise<WorkbenchProjectDTO[]>;
  operations(projectId: string): Promise<ProjectOperationDTO[]>;
  saveOperation(input: SaveProjectOperationDTO): Promise<ProjectOperationDTO>;
  deleteOperation(projectId: string, id: string): Promise<void>;
  domains(): Promise<InfraDomainDTO[]>;
  assetTypes(domain?: string): Promise<AssetTypeDTO[]>;
  saveAssetType(input: SaveAssetTypeDTO): Promise<string>;
  assets(projectId: string): Promise<InfrastructureAssetDTO[]>;
  saveAsset(input: SaveInfrastructureDTO): Promise<string>;
  importAssets(projectId: string, items: ImportFeatureItemDTO[]): Promise<ImportResultDTO>;
  deleteAsset(projectId: string, id: string): Promise<void>;
  structures(projectId: string): Promise<InfraStructureDTO[]>;
  saveStructure(input: SaveInfraStructureDTO): Promise<string>;
  deleteStructure(projectId: string, id: string): Promise<void>;
  analyze(projectId: string, geometry: SpatialZoneDTO, bufferMeters: number): Promise<InfrastructureAnalysisDTO>;
  saveRealization(input: InfrastructureRealizationDTO): Promise<string>;
}
