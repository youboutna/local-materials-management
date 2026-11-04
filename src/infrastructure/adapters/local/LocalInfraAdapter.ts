/**
 * LocalInfraAdapter — SIG en mode données locales.
 * Aucun appel réseau : les lectures renvoient un inventaire vide (carte vide propre),
 * les écritures lèvent une erreur explicite au lieu de simuler un succès.
 */
import type { IInfraRepository } from '@/domain/repositories/IInfraRepository';
import type { NetworkFeature } from '@/domain/entities/NetworkFeature';
import type { Structure } from '@/domain/entities/Structure';
import type {
  AssetTypeDTO, DomainDTO, ImportResultDTO, InfrastructureAnalysisDTO,
  RealizationDTO, SaveFeatureDTO, StructureDTO,
} from '@/dtos/entities/InfraDTO';

export const LOCAL_INFRA_READ_ONLY = 'LOCAL_INFRA_READ_ONLY';

const readOnly = (): never => {
  throw new Error(LOCAL_INFRA_READ_ONLY);
};

export class LocalInfraAdapter implements IInfraRepository {
  async findAllDomains(): Promise<DomainDTO[]> { return []; }
  async findDomainByCode(): Promise<DomainDTO | null> { return null; }
  async findAllAssetTypes(): Promise<AssetTypeDTO[]> { return []; }
  async findAssetTypesByDomain(): Promise<AssetTypeDTO[]> { return []; }
  async findAssetTypeByCode(): Promise<AssetTypeDTO | null> { return null; }
  async findFeatureById(): Promise<NetworkFeature | null> { return null; }
  async findAllFeatures(): Promise<NetworkFeature[]> { return []; }
  async findFeaturesInZone(): Promise<NetworkFeature[]> { return []; }
  async createFeature(_f: SaveFeatureDTO): Promise<NetworkFeature> { return readOnly(); }
  async updateFeature(): Promise<NetworkFeature> { return readOnly(); }
  async deleteFeature(): Promise<void> { readOnly(); }
  async importFeatures(): Promise<ImportResultDTO> { return readOnly(); }
  async findStructureById(): Promise<Structure | null> { return null; }
  async findAllStructures(): Promise<Structure[]> { return []; }
  async findStructuresInZone(): Promise<Structure[]> { return []; }
  async createStructure(_s: Partial<StructureDTO>): Promise<Structure> { return readOnly(); }
  async updateStructure(): Promise<Structure> { return readOnly(); }
  async deleteStructure(): Promise<void> { readOnly(); }
  async analyzeZone(projectId: string, zone: unknown, bufferMeters: number): Promise<InfrastructureAnalysisDTO> {
    return {
      projectId, zone, bufferMeters, features: [], structures: [],
      statistics: { totalFeatures: 0, totalStructures: 0, byDomain: {}, byAssetType: {} },
    };
  }
  async findRealizations(): Promise<RealizationDTO[]> { return []; }
  async updateRealization(): Promise<RealizationDTO> { return readOnly(); }
  async linkAssetToProject(): Promise<void> { readOnly(); }
  async unlinkAssetFromProject(): Promise<void> { readOnly(); }
  async findProjectAssets(): Promise<{ networkFeatures: NetworkFeature[]; structures: Structure[] }> {
    return { networkFeatures: [], structures: [] };
  }
}
