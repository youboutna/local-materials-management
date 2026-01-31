/**
 * Phase Transformer - Hexagonal Architecture
 * Transforms between Phase entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes functionality from PhaseDomainTransformer
 */

import { Phase, PhaseStatus, PhaseType } from '@/domain/entities/Phase';
import { PhaseDTO } from '@/dtos/transforms/PhaseDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

/**
 * Phase Transformer - Hexagonal Architecture
 * Handles transformation between Phase entities and DTOs
 */
export class PhaseTransformer implements EntityToDTOMapper<Phase, PhaseDTO> {
  /**
   * Transform Phase entity to PhaseDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Phase): PhaseDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      phaseName: entity.phaseName,
      phaseType: entity.phaseType,
      status: entity.status,
      progress: entity.progress || 0,
      startDate: entity.startDate?.toISOString(),
      endDate: entity.endDate?.toISOString(),
      estimatedDuration: entity.estimatedDuration || undefined,
      actualDuration: entity.estimatedDuration || undefined, // Map from estimatedDuration for now
      budget: entity.estimatedCost || undefined,
      actualCost: entity.actualCost || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      // Convert complex objects to IDs for DTO (Rule #4)
      milestones: entity.milestones?.map(m => m.id) || [],
      materials: entity.materials?.map(m => m.id) || [],
      // inspections and documents are in steps, not directly on phase
    };
  }

  /**
   * Transform PhaseDTO to Phase entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: PhaseDTO): Phase {
    return new Phase(
      dto.id,
      dto.projectId,
      dto.phaseName,
      null, // description - not in DTO
      dto.status,
      dto.progress,
      null, // orderIndex - not in DTO
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
      dto.budget || null,
      dto.actualCost || null,
      dto.estimatedDuration || null,
      null, // constructionPhase - not in DTO
      null, // constructionStage - not in DTO
      dto.phaseType,
      null, // location - not in DTO
      null, // customPhaseData - not in DTO
      [], // dependencies - empty for now
      [], // milestones - would need to be fetched separately
      [], // materials - would need to be fetched separately
      [], // suppliers - empty for now
      null, // humanResources - not in DTO
      [], // steps - would need to be fetched separately
      null, // notes - not in DTO
      null, // weight - not in DTO
      null, // createdBy - not in DTO
      dto.createdAt || new Date().toISOString(),
      dto.updatedAt || new Date().toISOString()
    );
  }

  /**
   * Transform array of Phase entities to array of PhaseDTOs
   */
  static toDTOList(entities: Phase[]): PhaseDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Transform array of PhaseDTOs to array of Phase entities
   */
  static toEntityList(dtos: PhaseDTO[]): Phase[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Transform Phase entity to Update DTO (partial)
   * Used for partial updates in form workflows
   */
  static toUpdateDTO(entity: Partial<Phase>): Partial<PhaseDTO> {
    const dto: Partial<PhaseDTO> = {};

    if (entity.id !== undefined) dto.id = entity.id;
    if (entity.projectId !== undefined) dto.projectId = entity.projectId;
    if (entity.phaseName !== undefined) dto.phaseName = entity.phaseName;
    if (entity.status !== undefined) dto.status = entity.status;
    if (entity.startDate !== undefined) dto.startDate = entity.startDate?.toISOString();
    if (entity.endDate !== undefined) dto.endDate = entity.endDate?.toISOString();
    if (entity.progress !== undefined) dto.progress = entity.progress || undefined;
    if (entity.estimatedCost !== undefined) dto.budget = entity.estimatedCost || undefined;
    if (entity.actualCost !== undefined) dto.actualCost = entity.actualCost || undefined;
    if (entity.estimatedDuration !== undefined) dto.estimatedDuration = entity.estimatedDuration || undefined;
    if (entity.phaseType !== undefined) dto.phaseType = entity.phaseType;

    return dto;
  }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Phase): PhaseDTO {
    return PhaseTransformer.toDTO(entity);
  }

  fromDTO(dto: PhaseDTO): Phase {
    return PhaseTransformer.toEntity(dto);
  }

  fromEntityToDTO(entity: Phase): PhaseDTO {
    return PhaseTransformer.toDTO(entity);
  }

  fromDtosToAdapter(dtos: PhaseDTO[]): PhaseDTO[] {
    return dtos;
  }

  toResponseDto(entity: Phase): PhaseDTO {
    return PhaseTransformer.toDTO(entity);
  }

  toRequestDto(dto: PhaseDTO): PhaseDTO {
    return dto;
  }

  toUpdateDto(dto: PhaseDTO): Partial<PhaseDTO> {
    return {
      id: dto.id,
      projectId: dto.projectId,
      phaseName: dto.phaseName,
      phaseType: dto.phaseType,
      status: dto.status,
      progress: dto.progress,
      startDate: dto.startDate,
      endDate: dto.endDate,
      estimatedDuration: dto.estimatedDuration,
      budget: dto.budget,
      actualCost: dto.actualCost
    };
  }

  validate(dto: PhaseDTO): ValidationResult {
    const errors: string[] = [];
    
    if (!dto.phaseName || dto.phaseName.trim() === '') {
      errors.push('Phase name is required');
    }
    
    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
    }
    
    if (dto.startDate && dto.endDate && new Date(dto.startDate) >= new Date(dto.endDate)) {
      errors.push('End date must be after start date');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toDTOs(entities: Phase[]): PhaseDTO[] {
    return entities.map(entity => PhaseTransformer.toDTO(entity));
  }

  toEntities(dtos: PhaseDTO[]): Phase[] {
    return dtos.map(dto => PhaseTransformer.toEntity(dto));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Phase[] {
    return rows.map(row => PhaseTransformer.toEntityFromDatabaseRow(row));
  }

  static toEntityFromDatabaseRow(row: Record<string, unknown>): Phase {
    return Phase.create({
      id: row.id as string,
      projectId: row.projectId as string,
      phaseName: row.phaseName as string,
      description: row.description as string,
      status: row.status as PhaseStatus,
      progress: Number(row.progress) || 0,
      orderIndex: Number(row.orderIndex) || 0,
      startDate: row.startDate ? new Date(row.startDate as string) : null,
      endDate: row.endDate ? new Date(row.endDate as string) : null,
      estimatedCost: Number(row.estimatedCost) || null,
      actualCost: Number(row.actualCost) || null,
      estimatedDuration: Number(row.estimatedDuration) || null,
      constructionPhase: row.constructionPhase as string || null,
      constructionStage: row.constructionStage as string || null,
      phaseType: row.phaseType as PhaseType || 'execution',
      location: row.location as string || null,
      customPhaseData: row.customPhaseData as Record<string, unknown> || null,
      dependencies: [], // Would need to be loaded separately
      milestones: [], // Would need to be loaded separately
      materials: [], // Would need to be loaded separately
      suppliers: [], // Would need to be loaded separately
      humanResources: null,
      steps: [], // Would need to be loaded separately
      notes: row.notes as string || null,
      weight: Number(row.weight) || null,
      createdBy: row.createdBy as string || null,
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string
    });
  }
}
