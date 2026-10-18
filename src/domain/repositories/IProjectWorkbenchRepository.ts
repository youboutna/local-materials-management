import type { WorkbenchProjectDTO, ProjectOperationDTO, SaveProjectOperationDTO, InfrastructureAssetDTO, SaveInfrastructureDTO, InfrastructureAnalysisDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import type { Geometry } from 'geojson';
import type { SpatialZoneDTO, InfrastructureRealizationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
export interface IProjectWorkbenchRepository {
  projects(): Promise<WorkbenchProjectDTO[]>;
  operations(projectId: string): Promise<ProjectOperationDTO[]>;
  saveOperation(input: SaveProjectOperationDTO): Promise<ProjectOperationDTO>;
  deleteOperation(projectId: string, id: string): Promise<void>;
  assets(projectId: string): Promise<InfrastructureAssetDTO[]>;
  saveAsset(input: SaveInfrastructureDTO): Promise<string>;
  deleteAsset(projectId: string, id: string): Promise<void>;
  analyze(projectId: string, geometry: SpatialZoneDTO, bufferMeters: number): Promise<InfrastructureAnalysisDTO>;
  saveRealization(input: InfrastructureRealizationDTO): Promise<string>;
}