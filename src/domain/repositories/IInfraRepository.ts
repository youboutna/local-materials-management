/**
 * Infrastructure Repository Interface
 * Defines contract for infrastructure (Utility Network) data access
 * Following hexagonal architecture principles
 */

import { AssetType } from '../entities/AssetType';
import { NetworkFeature } from '../entities/NetworkFeature';
import { Structure } from '../entities/Structure';
import type {
  AssetTypeDTO,
  NetworkFeatureDTO,
  StructureDTO,
  SaveFeatureDTO,
  ImportResultDTO,
  InfrastructureAnalysisDTO,
  DomainDTO,
  RealizationDTO
} from '@/dtos/entities/InfraDTO';

export interface IInfraRepository {
  // ============= DOMAINS =============

  /**
   * Get all domains
   */
  findAllDomains(): Promise<DomainDTO[]>;

  /**
   * Get domain by code
   */
  findDomainByCode(code: string): Promise<DomainDTO | null>;

  // ============= ASSET TYPES =============

  /**
   * Get all asset types
   */
  findAllAssetTypes(): Promise<AssetTypeDTO[]>;

  /**
   * Get asset types by domain
   */
  findAssetTypesByDomain(domainCode: string): Promise<AssetTypeDTO[]>;

  /**
   * Get asset type by code
   */
  findAssetTypeByCode(code: string): Promise<AssetTypeDTO | null>;

  // ============= NETWORK FEATURES =============

  /**
   * Find network feature by ID
   */
  findFeatureById(id: string): Promise<NetworkFeature | null>;

  /**
   * Find all network features
   */
  findAllFeatures(filters?: {
    domainCode?: string;
    assetTypeCode?: string;
    projectId?: string;
  }): Promise<NetworkFeature[]>;

  /**
   * Find features in zone (spatial query)
   */
  findFeaturesInZone(
    zone: any, // GeoJSON geometry
    bufferMeters: number,
    projectId?: string
  ): Promise<NetworkFeature[]>;

  /**
   * Create new network feature
   */
  createFeature(feature: SaveFeatureDTO): Promise<NetworkFeature>;

  /**
   * Update existing network feature
   */
  updateFeature(id: string, updates: Partial<SaveFeatureDTO>): Promise<NetworkFeature>;

  /**
   * Delete network feature
   */
  deleteFeature(id: string): Promise<void>;

  /**
   * Import features from GeoJSON
   */
  importFeatures(
    projectId: string,
    features: SaveFeatureDTO[]
  ): Promise<ImportResultDTO>;

  // ============= STRUCTURES =============

  /**
   * Find structure by ID
   */
  findStructureById(id: string): Promise<Structure | null>;

  /**
   * Find all structures
   */
  findAllStructures(filters?: {
    structureType?: string;
    assetTypeCode?: string;
    projectId?: string;
  }): Promise<Structure[]>;

  /**
   * Find structures in zone (spatial query)
   */
  findStructuresInZone(
    zone: any, // GeoJSON geometry
    bufferMeters: number,
    projectId?: string
  ): Promise<Structure[]>;

  /**
   * Create new structure
   */
  createStructure(structure: Partial<StructureDTO>): Promise<Structure>;

  /**
   * Update existing structure
   */
  updateStructure(id: string, updates: Partial<StructureDTO>): Promise<Structure>;

  /**
   * Delete structure
   */
  deleteStructure(id: string): Promise<void>;

  // ============= ANALYSIS =============

  /**
   * Analyze infrastructure in zone
   */
  analyzeZone(
    projectId: string,
    zone: any, // GeoJSON geometry
    bufferMeters: number
  ): Promise<InfrastructureAnalysisDTO>;

  // ============= REALIZATION =============

  /**
   * Get realization status for features
   */
  findRealizations(projectId: string): Promise<RealizationDTO[]>;

  /**
   * Update realization status
   */
  updateRealization(realization: RealizationDTO): Promise<RealizationDTO>;

  // ============= PROJECT ASSET LINKS =============

  /**
   * Link asset to project
   */
  linkAssetToProject(
    projectId: string,
    assetGlobalid: string,
    assetClass: 'network_feature' | 'structure'
  ): Promise<void>;

  /**
   * Unlink asset from project
   */
  unlinkAssetFromProject(
    projectId: string,
    assetGlobalid: string
  ): Promise<void>;

  /**
   * Get assets linked to project
   */
  findProjectAssets(projectId: string): Promise<{
    networkFeatures: NetworkFeature[];
    structures: Structure[];
  }>;
}
