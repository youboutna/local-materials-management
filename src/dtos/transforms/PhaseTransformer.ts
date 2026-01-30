/**
 * Phase Domain Transformer - Hexagonal Architecture
 * Transforms between Phase entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 */

import { Phase } from '@/domain/entities/Phase';
import { PhaseDTO } from '@/dtos/transforms/PhaseDTO';

/**
 * Phase Transformer - Hexagonal Architecture
 * Handles transformation between Phase entities and DTOs
 */
export class PhaseTransformer {
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
      name: entity.phaseName, // Alias for compatibility
      description: entity.description,
      status: entity.status,
      startDate: entity.startDate?.toISOString() || '',
      endDate: entity.endDate?.toISOString() || '',
      progress: entity.progress || 0,
      order: entity.order || 0,
      // Additional fields from domain entity
      estimatedDuration: entity.estimatedDuration || 0,
      actualDuration: entity.actualDuration || 0,
      budget: entity.budget || 0,
      actualCost: entity.actualCost || 0,
      teamSize: entity.teamSize || 0,
      // Metadata
      createdAt: entity.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() || new Date().toISOString(),
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
      dto.phaseName || dto.name || '',
      dto.description,
      dto.status,
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
      dto.progress || 0,
      dto.order || 0,
      // Additional fields
      dto.estimatedDuration || 0,
      dto.actualDuration || 0,
      dto.budget || 0,
      dto.actualCost || 0,
      dto.teamSize || 0,
      dto.createdAt ? new Date(dto.createdAt) : new Date(),
      dto.updatedAt ? new Date(dto.updatedAt) : new Date()
    );
  }

  /**
   * Transform CreatePhaseDTO to Phase entity
   * Used for creating new phases from form data
   */
  static fromCreateDTOToEntity(dto: Partial<PhaseDTO>): Phase {
    return new Phase(
      dto.id || crypto.randomUUID(),
      dto.projectId || '',
      dto.phaseName || dto.name || '',
      dto.description || null,
      dto.status || 'pending',
      dto.startDate ? new Date(dto.startDate) : null,
      dto.endDate ? new Date(dto.endDate) : null,
      dto.progress || 0,
      dto.order || 0,
      dto.estimatedDuration || 0,
      dto.actualDuration || 0,
      dto.budget || 0,
      dto.actualCost || 0,
      dto.teamSize || 0,
      new Date(),
      new Date()
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
    if (entity.description !== undefined) dto.description = entity.description;
    if (entity.status !== undefined) dto.status = entity.status;
    if (entity.startDate !== undefined) dto.startDate = entity.startDate?.toISOString();
    if (entity.endDate !== undefined) dto.endDate = entity.endDate?.toISOString();
    if (entity.progress !== undefined) dto.progress = entity.progress;
    if (entity.order !== undefined) dto.order = entity.order;
    if (entity.estimatedDuration !== undefined) dto.estimatedDuration = entity.estimatedDuration;
    if (entity.actualDuration !== undefined) dto.actualDuration = entity.actualDuration;
    if (entity.budget !== undefined) dto.budget = entity.budget;
    if (entity.actualCost !== undefined) dto.actualCost = entity.actualCost;
    if (entity.teamSize !== undefined) dto.teamSize = entity.teamSize;

    return dto;
  }
}
