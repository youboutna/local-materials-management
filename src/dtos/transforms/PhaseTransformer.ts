/**
 * Phase Transformer - Hexagonal Architecture
 * Transforms between Phase entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 */

import { Phase, PhaseStatus, PhaseType } from '@/domain/entities/Phase';
import { PhaseDTOLegacy } from '@/dtos/entities/PhaseDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

// UI State types for display calculations (Rule #5: UI layer separation)
export interface PhaseUIState {
  id: string;
  name: string;
  status: PhaseStatus;
  progress: number;
  statusColor: string;
  statusIcon: string;
  statusLabel: string;
  isCritical: boolean;
  daysRemaining: number;
  budgetVariance: number;
  isOverBudget: boolean;
}

/**
 * Phase Transformer - Hexagonal Architecture
 * Handles transformation between Phase entities and DTOs
 * Also provides UI state calculations for display layer
 */
export class PhaseTransformer implements EntityToDTOMapper<Phase, PhaseDTOLegacy> {
  
  /**
   * Map PhaseStatus to legacy string format
   */
  private mapStatusToLegacy(status: PhaseStatus): string {
    switch (status) {
      case 'pending': return 'planning';
      case 'in_progress': return 'active';
      case 'completed': return 'completed';
      case 'blocked': return 'paused';
      case 'delayed': return 'cancelled';
      default: return 'planning';
    }
  }

  /**
   * Get status color for UI display (Rule #5: UI layer calculations)
   */
  static getStatusColor(status: PhaseStatus | string): string {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delayed":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
      case "blocked":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  /**
   * Get status label for UI display
   */
  static getStatusLabel(status: PhaseStatus | string): string {
    switch (status) {
      case "completed": return "Terminé";
      case "in_progress": return "En cours";
      case "delayed": return "Retardé";
      case "pending": return "En attente";
      case "blocked": return "Bloqué";
      default: return status;
    }
  }

  /**
   * Transform Phase entity to UI state for display (Rule #5 compliance)
   */
  static toUIState(phase: Phase): PhaseUIState {
    return {
      id: phase.id,
      name: phase.phaseName,
      status: phase.status,
      progress: phase.progress || 0,
      statusColor: PhaseTransformer.getStatusColor(phase.status),
      statusIcon: phase.isCritical() ? 'critical' : 'normal',
      statusLabel: PhaseTransformer.getStatusLabel(phase.status),
      isCritical: phase.isCritical(),
      daysRemaining: phase.getDaysRemaining(),
      budgetVariance: phase.getBudgetVariance(),
      isOverBudget: phase.isBudgetOverrun()
    };
  }

  /**
   * Map legacy string to PhaseStatus
   */
  private mapStatusFromLegacy(status: string): PhaseStatus {
    switch (status) {
      case 'planning': return 'pending';
      case 'active': return 'in_progress';
      case 'completed': return 'completed';
      case 'paused': return 'blocked';
      case 'cancelled': return 'delayed';
      default: return 'pending';
    }
  }

  /**
   * Transform Phase entity to PhaseDTOLegacy (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   */
  toDTO(entity: Phase): PhaseDTOLegacy {
    return {
      id: entity.id,
      project_id: entity.projectId,
      phase_name: entity.phaseName || '',
      phase_type: entity.phaseType || 'execution',
      description: entity.description || undefined,
      status: this.mapStatusToLegacy(entity.status),
      start_date: entity.startDate?.toISOString(),
      end_date: entity.endDate?.toISOString(),
      progress: entity.progress || 0,
      budget: entity.estimatedCost || undefined,
      actual_cost: entity.actualCost || undefined,
      construction_phase: entity.constructionPhase || undefined,
      construction_stage: entity.constructionStage || undefined,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Transform PhaseDTOLegacy to Phase entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity for business logic
   */
  toEntity(dto: PhaseDTOLegacy): Phase {
    return Phase.create({
      id: dto.id,
      projectId: dto.project_id,
      phaseName: dto.phase_name,
      description: dto.description,
      status: this.mapStatusFromLegacy(dto.status),
      progress: dto.progress || 0,
      orderIndex: 0, // Default value
      startDate: dto.start_date ? new Date(dto.start_date) : null,
      endDate: dto.end_date ? new Date(dto.end_date) : null,
      estimatedCost: dto.budget || null,
      actualCost: dto.actual_cost || null,
      estimatedDuration: null, // Not in legacy DTO
      constructionPhase: dto.construction_phase || null,
      constructionStage: dto.construction_stage || null,
      phaseType: dto.phase_type as PhaseType || 'execution',
      location: null, // Not in legacy DTO
      customPhaseData: null, // Not in legacy DTO
      dependencies: [], // Would need to be loaded separately
      milestones: [], // Would need to be loaded separately
      materials: [], // Would need to be loaded separately
      suppliers: [], // Would need to be loaded separately
      humanResources: null,
      steps: [], // Would need to be loaded separately
      notes: null, // Not in legacy DTO
      weight: null, // Not in legacy DTO
      createdBy: null, // Not in legacy DTO
      createdAt: dto.created_at,
      updatedAt: dto.updated_at
    });
  }

  /**
   * Transform array of Phase entities to array of PhaseDTOLegacy
   */
  static toDTOList(entities: Phase[]): PhaseDTOLegacy[] {
    const transformer = new PhaseTransformer();
    return entities.map(entity => transformer.toDTO(entity));
  }

  /**
   * Transform array of PhaseDTOLegacy to array of Phase entities
   */
  static toEntityList(dtos: PhaseDTOLegacy[]): Phase[] {
    const transformer = new PhaseTransformer();
    return dtos.map(dto => transformer.toEntity(dto));
  }

  /**
   * Transform Phase entity to Update DTO (partial)
   * Used for partial updates in form workflows
   */
  static toUpdateDTO(entity: Partial<Phase>): Partial<PhaseDTOLegacy> {
    const dto: Partial<PhaseDTOLegacy> = {};
    const transformer = new PhaseTransformer();

    if (entity.id !== undefined) dto.id = entity.id;
    if (entity.projectId !== undefined) dto.project_id = entity.projectId;
    if (entity.phaseName !== undefined) dto.phase_name = entity.phaseName;
    if (entity.phaseType !== undefined) dto.phase_type = entity.phaseType;
    if (entity.description !== undefined) dto.description = entity.description;
    if (entity.status !== undefined) dto.status = transformer.mapStatusToLegacy(entity.status);
    if (entity.startDate !== undefined) dto.start_date = entity.startDate?.toISOString() || undefined;
    if (entity.endDate !== undefined) dto.end_date = entity.endDate?.toISOString() || undefined;
    if (entity.progress !== undefined) dto.progress = entity.progress || undefined;
    if (entity.estimatedCost !== undefined) dto.budget = entity.estimatedCost || undefined;
    if (entity.actualCost !== undefined) dto.actual_cost = entity.actualCost || undefined;
    if (entity.constructionPhase !== undefined) dto.construction_phase = entity.constructionPhase || undefined;
    if (entity.constructionStage !== undefined) dto.construction_stage = entity.constructionStage || undefined;

    return dto;
  }

  // EntityToDTOMapper interface implementation
  fromDTO(dto: PhaseDTOLegacy): Phase {
    return this.toEntity(dto);
  }

  fromEntityToDTO(entity: Phase): PhaseDTOLegacy {
    return this.toDTO(entity);
  }

  fromDtosToAdapter(dtos: PhaseDTOLegacy[]): PhaseDTOLegacy[] {
    return dtos;
  }

  toResponseDto(entity: Phase): PhaseDTOLegacy {
    return this.toDTO(entity);
  }

  toRequestDto(dto: PhaseDTOLegacy): PhaseDTOLegacy {
    return dto;
  }

  toUpdateDto(dto: PhaseDTOLegacy): Partial<PhaseDTOLegacy> {
    return {
      id: dto.id,
      project_id: dto.project_id,
      phase_name: dto.phase_name,
      phase_type: dto.phase_type,
      description: dto.description,
      status: dto.status,
      progress: dto.progress,
      start_date: dto.start_date,
      end_date: dto.end_date,
      budget: dto.budget,
      actual_cost: dto.actual_cost,
      construction_phase: dto.construction_phase,
      construction_stage: dto.construction_stage
    };
  }

  validate(dto: PhaseDTOLegacy): ValidationResult {
    const errors: string[] = [];
    
    if (!dto.phase_name || dto.phase_name.trim() === '') {
      errors.push('Phase name is required');
    }
    
    if (!dto.project_id || dto.project_id.trim() === '') {
      errors.push('Project ID is required');
    }
    
    if (dto.start_date && dto.end_date && new Date(dto.start_date) >= new Date(dto.end_date)) {
      errors.push('End date must be after start date');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toDTOs(entities: Phase[]): PhaseDTOLegacy[] {
    return entities.map(entity => this.toDTO(entity));
  }

  toEntities(dtos: PhaseDTOLegacy[]): Phase[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Phase[] {
    return rows.map(row => this.toEntityFromDatabaseRow(row));
  }

  private toEntityFromDatabaseRow(row: Record<string, unknown>): Phase {
    return Phase.create({
      id: row.id as string,
      projectId: row.project_id as string,
      phaseName: row.phase_name as string,
      description: row.description as string,
      status: this.mapStatusFromLegacy(row.status as string),
      progress: Number(row.progress) || 0,
      orderIndex: 0, // Default value
      startDate: row.start_date ? new Date(row.start_date as string) : null,
      endDate: row.end_date ? new Date(row.end_date as string) : null,
      estimatedCost: Number(row.budget) || null,
      actualCost: Number(row.actual_cost) || null,
      estimatedDuration: null,
      constructionPhase: row.construction_phase as string || null,
      constructionStage: row.construction_stage as string || null,
      phaseType: row.phase_type as PhaseType || 'execution',
      location: null,
      customPhaseData: null,
      dependencies: [],
      milestones: [],
      materials: [],
      suppliers: [],
      humanResources: null,
      steps: [],
      notes: null,
      weight: null,
      createdBy: null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    });
  }
}
