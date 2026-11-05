import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * Infrastructure Service
 * Generic multi-network infrastructure management (Utility Network)
 * Following hexagonal architecture principles
 * Integrates with existing ProjectWorkbenchService pattern
 */

import { IInfraRepository } from '@/domain/repositories/IInfraRepository';
import { NetworkFeature } from '@/domain/entities/NetworkFeature';
import { Structure } from '@/domain/entities/Structure';
import type {
  AssetTypeDTO,
  NetworkFeatureDTO,
  StructureDTO,
  SaveFeatureDTO,
  InfrastructureAnalysisDTO,
  DomainDTO,
  RealizationDTO
} from '@/dtos/entities/InfraDTO';
import type {
  InfrastructureAssetDTO,
  SaveInfrastructureDTO,
  InfraStructureDTO,
  SaveInfraStructureDTO,
  ImportFeatureItemDTO,
  SaveAssetTypeDTO,
  InfrastructureRealizationDTO,
  InfrastructureAnalysisDTO as ProjectWorkbenchAnalysisDTO,
  ImportResultDTO as ProjectWorkbenchImportResultDTO
} from '@/dtos/entities/ProjectWorkbenchDTO';
import type { Geometry, FeatureCollection } from 'geojson';

export class InfrastructureService {
  constructor(private readonly repository: IInfraRepository = RepositoryFactory.getInfraRepository()) {}

  // ============= DOMAINS =============

  async domains() {
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().domains();
  }

  // ============= ASSET TYPES =============

  async assetTypes(domain?: string) {
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().assetTypes(domain);
  }

  async saveAssetType(input: SaveAssetTypeDTO): Promise<string> {
    // Validation
    if (!/^[a-z0-9_]+$/.test(input.code)) {
      throw new Error('Asset type code must use lowercase letters, digits and underscores');
    }
    if (!input.domainCode.trim() || !input.labelFr.trim()) {
      throw new Error('Domain and label are required');
    }

    // Delegate to the existing ProjectWorkbenchService via RPC
    // This maintains backward compatibility while we transition to the new schema
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().saveAssetType(input);
  }

  // ============= NETWORK FEATURES (ASSETS) =============

  async assets(projectId: string): Promise<InfrastructureAssetDTO[]> {
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().assets(projectId);
  }

  async saveAsset(projectId: string, input: SaveInfrastructureDTO): Promise<string> {
    // Validation
    if (!input.name.trim()) {
      throw new Error('Infrastructure name is required');
    }
    if (!input.assetTypeCode) {
      throw new Error('Asset type is required');
    }

    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().saveAsset({ ...input, projectId });
  }

  async importAssets(projectId: string, items: ImportFeatureItemDTO[]): Promise<ProjectWorkbenchImportResultDTO> {
    // Validation
    if (!items.length) {
      throw new Error('GeoJSON contains no feature');
    }
    if (items.length > 5000) {
      throw new Error('Too many features (max 5000)');
    }

    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().importAssets(projectId, items);
  }

  async deleteAsset(projectId: string, id: string): Promise<void> {
    // Delegate to the canonical ProjectWorkbenchService RPC.
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().deleteAsset(projectId, id);
  }

  // ============= STRUCTURES =============

  async structures(projectId: string): Promise<InfraStructureDTO[]> {
    // Delegate to the canonical ProjectWorkbenchService RPC.
    // This maintains backward compatibility while we transition to the new schema
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().structures(projectId);
  }

  async saveStructure(input: SaveInfraStructureDTO): Promise<string> {
    // Delegate to the canonical ProjectWorkbenchService RPC.
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().saveStructure(input);
  }

  async deleteStructure(projectId: string, id: string): Promise<void> {
    // Delegate to the canonical ProjectWorkbenchService RPC.
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().deleteStructure(projectId, id);
  }

  // ============= ANALYSIS =============

  async analyze(projectId: string, geometry: Geometry | FeatureCollection, bufferMeters: number): Promise<ProjectWorkbenchAnalysisDTO> {
    // Validation
    if (!Number.isFinite(bufferMeters) || bufferMeters < 0 || bufferMeters > 100000) {
      throw new Error('Invalid buffer (must be 0-100000 meters)');
    }

    // Delegate to the canonical ProjectWorkbenchService RPC.
    // This maintains backward compatibility while we transition to the new schema
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().analyze(projectId, geometry, bufferMeters);
  }

  // ============= REALIZATION =============

  async saveRealization(input: InfrastructureRealizationDTO): Promise<string> {
    // Delegate to the canonical ProjectWorkbenchService RPC.
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().saveRealization(input);
  }

  // ============= TRANSFORMERS (New Generic ↔ Existing Workbench) =============
  // Persistence delegates to ProjectWorkbenchService RPCs, whose adapters own the row ↔ DTO mapping.
}

// Singleton instance
const service = new InfrastructureService();
export const getInfrastructureService = () => service;
