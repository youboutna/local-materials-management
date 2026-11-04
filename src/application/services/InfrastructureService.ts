/**
 * Infrastructure Service
 * Generic multi-network infrastructure management (Utility Network)
 * Following hexagonal architecture principles
 * Integrates with existing ProjectWorkbenchService pattern
 */

import { IInfraRepository } from '@/domain/repositories/IInfraRepository';
import { SupabaseInfraAdapter } from '@/infrastructure/adapters/supabase/SupabaseInfraAdapter';
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
  constructor(private readonly repository: IInfraRepository = new SupabaseInfraAdapter()) {}

  // ============= DOMAINS =============

  async domains(): Promise<DomainDTO[]> {
    return this.repository.findAllDomains();
  }

  // ============= ASSET TYPES =============

  async assetTypes(domain?: string): Promise<AssetTypeDTO[]> {
    if (domain) {
      return this.repository.findAssetTypesByDomain(domain);
    }
    return this.repository.findAllAssetTypes();
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

    // Convert to SaveFeatureDTO
    const saveFeature: SaveFeatureDTO = {
      id: input.id,
      assetTypeCode: input.assetTypeCode,
      geometry: input.geometry,
      properties: input.properties,
      operationalStatus: input.status,
      // New fields from generic schema (optional for backward compatibility)
      codeGeo: input.properties?.code_geo as string | undefined,
      labelFr: input.properties?.label_fr as string | undefined,
      labelAr: input.properties?.label_ar as string | undefined,
      labelDefault: input.properties?.label_default as string | undefined
    };

    const feature = input.id
      ? await this.repository.updateFeature(input.id, saveFeature)
      : await this.repository.createFeature(saveFeature);

    // Link to project
    await this.repository.linkAssetToProject(projectId, feature.id, 'network_feature');

    return feature.id;
  }

  async importAssets(projectId: string, items: ImportFeatureItemDTO[]): Promise<ProjectWorkbenchImportResultDTO> {
    // Validation
    if (!items.length) {
      throw new Error('GeoJSON contains no feature');
    }
    if (items.length > 5000) {
      throw new Error('Too many features (max 5000)');
    }

    // Convert to SaveFeatureDTO format
    const features: SaveFeatureDTO[] = items.map(item => ({
      assetTypeCode: item.asset_type_code,
      geometry: item.geometry,
      properties: item.properties,
      operationalStatus: item.status,
      codeGeo: item.properties?.code_geo as string | undefined,
      labelFr: item.properties?.label_fr as string | undefined,
      labelAr: item.properties?.label_ar as string | undefined,
      labelDefault: item.properties?.label_default as string | undefined
    }));

    const result = await this.repository.importFeatures(projectId, features);

    // Transform InfraDTO.ImportResultDTO to ProjectWorkbenchDTO.ImportResultDTO
    return {
      importedCount: result.importedCount,
      ids: result.ids,
      errors: result.errors.map(err => ({
        name: err.feature?.name as string | undefined,
        error: err.message
      }))
    };
  }

  async deleteAsset(projectId: string, id: string): Promise<void> {
    // For now, delegate to the existing ProjectWorkbenchService via RPC
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().deleteAsset(projectId, id);
  }

  // ============= STRUCTURES =============

  async structures(projectId: string): Promise<InfraStructureDTO[]> {
    // For now, delegate to the existing ProjectWorkbenchService via RPC
    // This maintains backward compatibility while we transition to the new schema
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().structures(projectId);
  }

  async saveStructure(input: SaveInfraStructureDTO): Promise<string> {
    // For now, delegate to the existing ProjectWorkbenchService via RPC
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().saveStructure(input);
  }

  async deleteStructure(projectId: string, id: string): Promise<void> {
    // For now, delegate to the existing ProjectWorkbenchService via RPC
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().deleteStructure(projectId, id);
  }

  // ============= ANALYSIS =============

  async analyze(projectId: string, geometry: Geometry | FeatureCollection, bufferMeters: number): Promise<ProjectWorkbenchAnalysisDTO> {
    // Validation
    if (!Number.isFinite(bufferMeters) || bufferMeters < 0 || bufferMeters > 100000) {
      throw new Error('Invalid buffer (must be 0-100000 meters)');
    }

    // For now, delegate to the existing ProjectWorkbenchService via RPC
    // This maintains backward compatibility while we transition to the new schema
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().analyze(projectId, geometry, bufferMeters);
  }

  // ============= REALIZATION =============

  async saveRealization(input: InfrastructureRealizationDTO): Promise<string> {
    // For now, delegate to the existing ProjectWorkbenchService via RPC
    const { getProjectWorkbenchService } = await import('./ProjectWorkbenchService');
    return getProjectWorkbenchService().saveRealization(input);
  }

  // ============= TRANSFORMERS (New Generic ↔ Existing Workbench) =============
  // TODO: Implement transformers when RPCs are updated to support new schema columns
  // For now, all operations delegate to existing ProjectWorkbenchService via RPC
}

// Singleton instance
const service = new InfrastructureService();
export const getInfrastructureService = () => service;
