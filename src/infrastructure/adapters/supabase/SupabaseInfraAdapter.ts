/**
 * Supabase Infrastructure Adapter
 * Implements IInfraRepository using Supabase
 * Following hexagonal architecture principles
 * Handles snake_case ↔ camelCase conversion internally
 */

import { AssetType } from '@/domain/entities/AssetType';
import { NetworkFeature } from '@/domain/entities/NetworkFeature';
import { Structure } from '@/domain/entities/Structure';
import { IInfraRepository } from '@/domain/repositories/IInfraRepository';
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

export class SupabaseInfraAdapter implements IInfraRepository {
  private client: any;

  constructor() {
    // Use supabase client with infra schema
    const { supabase } = require('@/integrations/supabase/client');
    this.client = supabase;
  }

  // Helper to get table with schema prefix
  private table(tableName: string) {
    return this.client.schema('infra').from(tableName);
  }

  // ============= DOMAINS =============

  async findAllDomains(): Promise<DomainDTO[]> {
    const { data, error } = await this.table('domains')
      .select('*')
      .order('code');

    if (error) throw error;
    return (data || []).map(row => this.domainRowToDTO(row));
  }

  async findDomainByCode(code: string): Promise<DomainDTO | null> {
    const { data, error } = await this.table('domains')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.domainRowToDTO(data);
  }

  // ============= ASSET TYPES =============

  async findAllAssetTypes(): Promise<AssetTypeDTO[]> {
    const { data, error } = await this.table('asset_types')
      .select('*')
      .order('code');

    if (error) throw error;
    return (data || []).map(row => this.assetTypeRowToDTO(row));
  }

  async findAssetTypesByDomain(domainCode: string): Promise<AssetTypeDTO[]> {
    const { data, error } = await this.table('asset_types')
      .select('*')
      .eq('domain_code', domainCode)
      .order('code');

    if (error) throw error;
    return (data || []).map(row => this.assetTypeRowToDTO(row));
  }

  async findAssetTypeByCode(code: string): Promise<AssetTypeDTO | null> {
    const { data, error } = await this.table('asset_types')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.assetTypeRowToDTO(data);
  }

  // ============= NETWORK FEATURES =============

  async findFeatureById(id: string): Promise<NetworkFeature | null> {
    const { data, error } = await this.table('network_features')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.featureRowToEntity(data);
  }

  async findAllFeatures(filters?: {
    domainCode?: string;
    assetTypeCode?: string;
    projectId?: string;
  }): Promise<NetworkFeature[]> {
    let query = this.table('network_features').select('*');

    if (filters?.domainCode) {
      query = query.eq('domain_code', filters.domainCode);
    }
    if (filters?.assetTypeCode) {
      query = query.eq('asset_type_code', filters.assetTypeCode);
    }
    if (filters?.projectId) {
      // Join with project_asset_links
      query = query.in('id', this.table('project_asset_links')
        .select('asset_globalid')
        .eq('project_id', filters.projectId)
        .eq('asset_class', 'network_feature')
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.featureRowToEntity(row));
  }

  async findFeaturesInZone(
    zone: any,
    bufferMeters: number,
    projectId?: string
  ): Promise<NetworkFeature[]> {
    // Call RPC infra_zone_analysis or use PostGIS query
    const { data, error } = await this.client.rpc('infra_zone_analysis', {
      p_project_id: projectId,
      p_zone: zone,
      p_buffer_meters: bufferMeters
    });

    if (error) throw error;
    return (data || []).map(row => this.featureRowToEntity(row));
  }

  async createFeature(feature: SaveFeatureDTO): Promise<NetworkFeature> {
    const dbRow = this.featureDtoToRow(feature);
    const { data, error } = await this.table('network_features')
      .insert(dbRow)
      .select()
      .single();

    if (error) throw error;
    return this.featureRowToEntity(data);
  }

  async updateFeature(id: string, updates: Partial<SaveFeatureDTO>): Promise<NetworkFeature> {
    const dbRow = this.featureDtoToRow(updates);
    const { data, error } = await this.table('network_features')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.featureRowToEntity(data);
  }

  async deleteFeature(id: string): Promise<void> {
    const { error } = await this.table('network_features')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async importFeatures(
    projectId: string,
    features: SaveFeatureDTO[]
  ): Promise<ImportResultDTO> {
    // Call RPC infra_feature_import
    const { data, error } = await this.client.rpc('infra_zone_analysis', {
      p_project_id: projectId,
      p_zone: { type: 'FeatureCollection', features: features.map(f => ({ geometry: f.geometry })) },
      p_buffer_meters: 0
    });

    if (error) throw error;
    return {
      importedCount: data?.length || 0,
      ids: data?.map((f: any) => f.id) || [],
      errors: []
    };
  }

  // ============= STRUCTURES =============

  async findStructureById(id: string): Promise<Structure | null> {
    const { data, error } = await this.table('structures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.structureRowToEntity(data);
  }

  async findAllStructures(filters?: {
    structureType?: string;
    assetTypeCode?: string;
    projectId?: string;
  }): Promise<Structure[]> {
    let query = this.table('structures').select('*');

    if (filters?.structureType) {
      query = query.eq('structure_type', filters.structureType);
    }
    if (filters?.assetTypeCode) {
      query = query.eq('asset_type_code', filters.assetTypeCode);
    }
    if (filters?.projectId) {
      query = query.in('id', this.table('project_asset_links')
        .select('asset_globalid')
        .eq('project_id', filters.projectId)
        .eq('asset_class', 'structure')
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.structureRowToEntity(row));
  }

  async findStructuresInZone(
    zone: any,
    bufferMeters: number,
    projectId?: string
  ): Promise<Structure[]> {
    // Use PostGIS spatial query
    const { data, error } = await this.table('structures')
      .select('*')
      .filter('geometry', 'ST_Intersects',
        `ST_Buffer(ST_GeomFromGeoJSON('${JSON.stringify(zone)}')::geography, ${bufferMeters})::geometry`
      );

    if (error) throw error;
    return (data || []).map(row => this.structureRowToEntity(row));
  }

  async createStructure(structure: Partial<StructureDTO>): Promise<Structure> {
    const dbRow = this.structureDtoToRow(structure);
    const { data, error } = await this.table('structures')
      .insert(dbRow)
      .select()
      .single();

    if (error) throw error;
    return this.structureRowToEntity(data);
  }

  async updateStructure(id: string, updates: Partial<StructureDTO>): Promise<Structure> {
    const dbRow = this.structureDtoToRow(updates);
    const { data, error } = await this.table('structures')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.structureRowToEntity(data);
  }

  async deleteStructure(id: string): Promise<void> {
    const { error } = await this.table('structures')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============= ANALYSIS =============

  async analyzeZone(
    projectId: string,
    zone: any,
    bufferMeters: number
  ): Promise<InfrastructureAnalysisDTO> {
    // Call RPC infra_zone_analysis with full statistics
    const { data, error } = await this.client.rpc('infra_zone_analysis', {
      p_project_id: projectId,
      p_zone: zone,
      p_buffer_meters: bufferMeters
    });

    if (error) throw error;
    return data as InfrastructureAnalysisDTO;
  }

  // ============= REALIZATION =============

  async findRealizations(projectId: string): Promise<RealizationDTO[]> {
    // Query project_asset_links with realization metadata stored in properties
    const { data, error } = await this.table('project_asset_links')
      .select('*')
      .eq('project_id', projectId)
      .eq('asset_class', 'network_feature');

    if (error) throw error;

    return (data || []).map((row: any) => ({
      featureId: row.asset_globalid,
      projectId: row.project_id,
      planned: row.properties?.realization === 'planned',
      realized: row.properties?.realization === 'completed',
      realizationDate: row.properties?.completed_on,
      realizationProgress: row.properties?.progress,
      notes: row.properties?.notes
    }));
  }

  async updateRealization(realization: RealizationDTO): Promise<RealizationDTO> {
    // Update realization metadata in project_asset_links properties
    const { error } = await this.table('project_asset_links')
      .update({
        properties: {
          realization: realization.realized ? 'completed' : 'planned',
          completed_on: realization.realizationDate,
          progress: realization.realizationProgress,
          notes: realization.notes
        }
      })
      .eq('project_id', realization.projectId)
      .eq('asset_globalid', realization.featureId);

    if (error) throw error;
    return realization;
  }

  // ============= PROJECT ASSET LINKS =============

  async linkAssetToProject(
    projectId: string,
    assetGlobalid: string,
    assetClass: 'network_feature' | 'structure'
  ): Promise<void> {
    const { error } = await this.table('project_asset_links')
      .insert({
        project_id: projectId,
        asset_globalid: assetGlobalid,
        asset_class: assetClass
      });

    if (error) throw error;
  }

  async unlinkAssetFromProject(
    projectId: string,
    assetGlobalid: string
  ): Promise<void> {
    const { error } = await this.table('project_asset_links')
      .delete()
      .eq('project_id', projectId)
      .eq('asset_globalid', assetGlobalid);

    if (error) throw error;
  }

  async findProjectAssets(projectId: string): Promise<{
    networkFeatures: NetworkFeature[];
    structures: Structure[];
  }> {
    const [featuresResult, structuresResult] = await Promise.all([
      this.table('network_features')
        .select('*')
        .in('id', this.table('project_asset_links')
          .select('asset_globalid')
          .eq('project_id', projectId)
          .eq('asset_class', 'network_feature')
        ),
      this.table('structures')
        .select('*')
        .in('id', this.table('project_asset_links')
          .select('asset_globalid')
          .eq('project_id', projectId)
          .eq('asset_class', 'structure')
        )
    ]);

    if (featuresResult.error) throw featuresResult.error;
    if (structuresResult.error) throw structuresResult.error;

    return {
      networkFeatures: (featuresResult.data || []).map(row => this.featureRowToEntity(row)),
      structures: (structuresResult.data || []).map(row => this.structureRowToEntity(row))
    };
  }

  // ============= TRANSFORMERS (snake_case ↔ camelCase) =============

  private domainRowToDTO(row: any): DomainDTO {
    return {
      id: row.id ?? row.code,
      code: row.code,
      labelFr: row.label_fr,
      labelAr: row.label_ar,
      labelEn: row.label_en,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private assetTypeRowToDTO(row: any): AssetTypeDTO {
    return {
      id: row.id ?? row.code,
      code: row.code,
      domainCode: row.domain_code,
      assetGroup: row.asset_group,
      assetType: row.asset_type,
      labelFr: row.label_fr,
      labelAr: row.label_ar,
      labelEn: row.label_en,
      geometryKind: row.geometry_kind,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private featureRowToEntity(row: any): NetworkFeature {
    return NetworkFeature.create({
      id: row.id,
      assetTypeCode: row.asset_type_code,
      geometry: row.geometry,
      domainCode: row.domain_code,
      operationalStatus: row.operational_status,
      lifecycle: row.lifecycle,
      validFrom: new Date(row.valid_from),
      validTo: row.valid_to ? new Date(row.valid_to) : undefined,
      tier: row.tier,
      owner: row.owner,
      responsibilityTeam: row.responsibility_team,
      installationMethod: row.installation_method,
      ratedVoltageKv: row.rated_voltage_kv,
      ratedCurrentA: row.rated_current_a,
      capacityKva: row.capacity_kva,
      capacityVolume: row.capacity_volume,
      diameterMm: row.diameter_mm,
      lengthM: row.length_m,
      material: row.material,
      codeGeo: row.code_geo,
      localiteType: row.localite_type,
      codeAdm: row.code_adm,
      labelFr: row.label_fr,
      labelAr: row.label_ar,
      labelDefault: row.label_default,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    });
  }

  private featureDtoToRow(dto: SaveFeatureDTO | Partial<SaveFeatureDTO>): any {
    const row: any = {};
    if (dto.id) row.id = dto.id;
    if (dto.assetTypeCode) row.asset_type_code = dto.assetTypeCode;
    if (dto.geometry) row.geometry = dto.geometry;
    if (dto.domainCode) row.domain_code = dto.domainCode;
    if (dto.operationalStatus) row.operational_status = dto.operationalStatus;
    if (dto.lifecycle) row.lifecycle = dto.lifecycle;
    if (dto.tier !== undefined) row.tier = dto.tier;
    if (dto.owner) row.owner = dto.owner;
    if (dto.responsibilityTeam) row.responsibility_team = dto.responsibilityTeam;
    if (dto.installationMethod) row.installation_method = dto.installationMethod;
    if (dto.ratedVoltageKv !== undefined) row.rated_voltage_kv = dto.ratedVoltageKv;
    if (dto.ratedCurrentA !== undefined) row.rated_current_a = dto.ratedCurrentA;
    if (dto.capacityKva !== undefined) row.capacity_kva = dto.capacityKva;
    if (dto.capacityVolume !== undefined) row.capacity_volume = dto.capacityVolume;
    if (dto.diameterMm !== undefined) row.diameter_mm = dto.diameterMm;
    if (dto.lengthM !== undefined) row.length_m = dto.lengthM;
    if (dto.material) row.material = dto.material;
    if (dto.codeGeo) row.code_geo = dto.codeGeo;
    if (dto.localiteType) row.localite_type = dto.localiteType;
    if (dto.codeAdm) row.code_adm = dto.codeAdm;
    if (dto.labelFr) row.label_fr = dto.labelFr;
    if (dto.labelAr) row.label_ar = dto.labelAr;
    if (dto.labelDefault) row.label_default = dto.labelDefault;
    if (dto.properties) row.properties = dto.properties;
    // Set default valid_from if not provided
    if (!row.valid_from) row.valid_from = new Date().toISOString();
    return row;
  }

  private structureRowToEntity(row: any): Structure {
    return Structure.create({
      id: row.id,
      structureType: row.structure_type,
      geometry: row.geometry,
      assetTypeCode: row.asset_type_code,
      operationalStatus: row.operational_status,
      lifecycle: row.lifecycle,
      validFrom: new Date(row.valid_from),
      validTo: row.valid_to ? new Date(row.valid_to) : undefined,
      owner: row.owner,
      responsibilityTeam: row.responsibility_team,
      material: row.material,
      capacityVolume: row.capacity_volume,
      widthM: row.width_m,
      heightM: row.height_m,
      burialDepthCm: row.burial_depth_cm,
      groundClearanceM: row.ground_clearance_m,
      loadCapacityKg: row.load_capacity_kg,
      codeGeo: row.code_geo,
      labelFr: row.label_fr,
      labelAr: row.label_ar,
      labelDefault: row.label_default,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    });
  }

  private structureDtoToRow(dto: Partial<StructureDTO>): any {
    const row: any = {};
    if (dto.id) row.id = dto.id;
    if (dto.structureType) row.structure_type = dto.structureType;
    if (dto.geometry) row.geometry = dto.geometry;
    if (dto.assetTypeCode) row.asset_type_code = dto.assetTypeCode;
    if (dto.operationalStatus) row.operational_status = dto.operationalStatus;
    if (dto.lifecycle) row.lifecycle = dto.lifecycle;
    if (dto.validFrom) row.valid_from = new Date(dto.validFrom).toISOString();
    if (dto.validTo) row.valid_to = new Date(dto.validTo).toISOString();
    if (dto.owner) row.owner = dto.owner;
    if (dto.responsibilityTeam) row.responsibility_team = dto.responsibilityTeam;
    if (dto.material) row.material = dto.material;
    if (dto.capacityVolume !== undefined) row.capacity_volume = dto.capacityVolume;
    if (dto.widthM !== undefined) row.width_m = dto.widthM;
    if (dto.heightM !== undefined) row.height_m = dto.heightM;
    if (dto.burialDepthCm !== undefined) row.burial_depth_cm = dto.burialDepthCm;
    if (dto.groundClearanceM !== undefined) row.ground_clearance_m = dto.groundClearanceM;
    if (dto.loadCapacityKg !== undefined) row.load_capacity_kg = dto.loadCapacityKg;
    if (dto.codeGeo) row.code_geo = dto.codeGeo;
    if (dto.labelFr) row.label_fr = dto.labelFr;
    if (dto.labelAr) row.label_ar = dto.labelAr;
    if (dto.labelDefault) row.label_default = dto.labelDefault;
    return row;
  }
}
