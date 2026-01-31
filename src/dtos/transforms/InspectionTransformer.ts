/**
 * Inspection Transformer - Hexagonal Architecture
 * Transforms between Inspection entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes functionality from InspectionDomainTransformer
 */

import { Inspection } from '@/domain/entities/Inspection';
import { InspectionDTO, CreateInspectionDTO, UpdateInspectionDTO } from '@/dtos/entities/InspectionDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class InspectionTransformer implements EntityToDTOMapper<Inspection, InspectionDTO> {
  /**
   * Transform Inspection entity to InspectionDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Inspection): InspectionDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      date: entity.date,
      inspector: entity.inspector,
      status: entity.status,
      progressAtInspection: entity.progressAtInspection,
      comments: entity.comments,
      documents: entity.documents && entity.documents.length > 0 ? { documents: entity.documents } : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform InspectionDTO to Inspection entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: InspectionDTO): Inspection {
    return {
      id: dto.id,
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      date: dto.date,
      inspector: dto.inspector,
      status: dto.status,
      progressAtInspection: dto.progressAtInspection,
      comments: dto.comments,
      documents: dto.documents?.documents || [],
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Transform CreateInspectionDTO to Inspection entity
   */
  static fromCreateDTOToEntity(dto: CreateInspectionDTO): Inspection {
    return {
      id: dto.id || crypto.randomUUID(),
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      date: dto.date,
      inspector: dto.inspector,
      status: dto.status || 'scheduled',
      progressAtInspection: dto.progressAtInspection || 0,
      comments: dto.comments,
      documents: dto.documents?.documents || [],
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Transform UpdateInspectionDTO to partial Inspection entity
   */
  static fromUpdateDTOToEntity(dto: UpdateInspectionDTO): Partial<Inspection> {
    return {
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      date: dto.date,
      inspector: dto.inspector,
      status: dto.status,
      progressAtInspection: dto.progressAtInspection,
      comments: dto.comments,
      documents: dto.documents?.documents,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Validate inspection data for business rules
   */
  static validateInspectionData(inspection: Partial<Inspection>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!inspection.projectId || inspection.projectId.trim() === '') {
      errors.push('Project ID is required');
    }
    
    if (!inspection.inspector || inspection.inspector.trim() === '') {
      errors.push('Inspector name is required');
    }
    
    if (!inspection.date) {
      errors.push('Inspection date is required');
    } else if (new Date(inspection.date) > new Date()) {
      errors.push('Inspection date cannot be in the future');
    }
    
    if (inspection.progressAtInspection !== undefined && (inspection.progressAtInspection < 0 || inspection.progressAtInspection > 100)) {
      errors.push('Progress at inspection must be between 0 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if inspection is overdue
   */
  static isOverdue(inspection: Inspection): boolean {
    const inspectionDate = new Date(inspection.date);
    const now = new Date();
    return inspectionDate < now && inspection.status === 'scheduled';
  }

  /**
   * Get inspection priority based on status and date
   */
  static getPriority(inspection: Inspection): 'high' | 'medium' | 'low' {
    if (inspection.status === 'requires_changes' || inspection.status === 'rejected') {
      return 'high';
    }
    
    if (InspectionTransformer.isOverdue(inspection)) {
      return 'high';
    }
    
    if (inspection.status === 'in_progress') {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Calculate inspection score based on results
   */
  static calculateScore(inspection: Inspection): number {
    let score = 100; // Start with perfect score
    
    // Deduct points based on status
    switch (inspection.status) {
      case 'rejected':
        score -= 50;
        break;
      case 'requires_changes':
        score -= 30;
        break;
      case 'cancelled':
        score -= 20;
        break;
      case 'completed':
        // No deduction for completed
        break;
      case 'approved':
        score += 10; // Bonus for approval
        break;
    }
    
    // Deduct points for overdue inspections
    if (InspectionTransformer.isOverdue(inspection)) {
      score -= 20;
    }
    
    // Deduct points for missing comments when required
    if (inspection.status === 'requires_changes' && !inspection.comments) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Inspection): InspectionDTO {
    return InspectionTransformer.toDTO(entity);
  }

  fromDTO(dto: InspectionDTO): Inspection {
    return InspectionTransformer.toEntity(dto);
  }

  fromEntityToDTO(entity: Inspection): InspectionDTO {
    return InspectionTransformer.toDTO(entity);
  }

  fromDtosToAdapter(dtos: InspectionDTO[]): InspectionDTO[] {
    return dtos;
  }

  toResponseDto(entity: Inspection): InspectionDTO {
    return InspectionTransformer.toDTO(entity);
  }

  toRequestDto(dto: InspectionDTO): InspectionDTO {
    return dto;
  }

  toUpdateDto(dto: InspectionDTO): Partial<InspectionDTO> {
    return {
      projectId: dto.projectId,
      phaseId: dto.phaseId,
      date: dto.date,
      inspector: dto.inspector,
      status: dto.status,
      progressAtInspection: dto.progressAtInspection,
      comments: dto.comments,
      documents: dto.documents
    };
  }

  validate(dto: InspectionDTO): ValidationResult {
    const inspection = InspectionTransformer.toEntity(dto);
    const validation = InspectionTransformer.validateInspectionData(inspection);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  toDTOs(entities: Inspection[]): InspectionDTO[] {
    return entities.map(entity => InspectionTransformer.toDTO(entity));
  }

  toEntities(dtos: InspectionDTO[]): Inspection[] {
    return dtos.map(dto => InspectionTransformer.toEntity(dto));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Inspection[] {
    return rows.map(row => InspectionTransformer.toEntityFromDatabaseRow(row));
  }

  static toEntityFromDatabaseRow(row: Record<string, unknown>): Inspection {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      phaseId: row.phase_id as string || null,
      date: row.date as string,
      inspector: row.inspector as string,
      status: row.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending',
      progressAtInspection: Number(row.progress_at_inspection) || 0,
      comments: row.comments as string || null,
      documents: row.documents ? JSON.parse(row.documents as string).documents || [] : [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }
}
