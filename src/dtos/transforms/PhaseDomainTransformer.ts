/**
 * Phase Domain Transformer
 * Handles transformation between Phase entities and PhaseDTOs
 * Following hexagonal architecture principles
 */

import { Phase } from '@/domain/entities/Phase';
import { PhaseDTO, CreatePhaseRequestDto, UpdatePhaseRequestDto } from './shared';
import { EntityToDTOMapper } from './shared';

export class PhaseDomainTransformer implements EntityToDTOMapper<Phase, PhaseDTO> {
  /**
   * Transform Phase entity to PhaseDTO
   */
  static toDTO(entity: Phase): PhaseDTO {
    return {
      id: entity.id,
      project_id: entity.projectId,
      phase_name: entity.name,
      description: entity.description || '',
      construction_phase: entity.constructionPhase || null,
      construction_stage: entity.constructionStage || null,
      status: entity.status as any, // Type assertion to handle status compatibility
      progress: entity.progress || 0,
      estimated_cost: entity.budget || 0,
      actual_cost: entity.actualCost || 0,
      estimated_duration_days: entity.estimatedDuration || 30,
      start_date: typeof entity.startDate === 'string' ? entity.startDate : entity.startDate?.toISOString() || '',
      end_date: typeof entity.endDate === 'string' ? entity.endDate : entity.endDate?.toISOString() || '',
      order_index: entity.orderIndex || 0,
      steps: entity.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description || '',
        status: step.status as any, // Type assertion to handle status compatibility
        progress: step.progress || 0,
        order_index: step.orderIndex || 0,
        tasks: step.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description || '',
          status: task.status as any, // Type assertion to handle status compatibility
          progress: task.progress || 0,
          order_index: task.orderIndex || 0,
          assigned_to: task.assignedTo || [],
          requires_inspection: task.requiresInspection || false,
          requires_engineer_approval: task.requiresEngineerApproval || false
        })) || []
      })) || [],
      created_at: typeof entity.createdAt === 'string' ? entity.createdAt : entity.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: typeof entity.updatedAt === 'string' ? entity.updatedAt : entity.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  /**
   * Transform PhaseDTO to Phase entity
   */
  static fromDTO(dto: PhaseDTO): Phase {
    return {
      id: dto.id,
      projectId: dto.project_id,
      name: dto.phase_name,
      description: dto.description,
      constructionPhase: dto.construction_phase || undefined,
      constructionStage: dto.construction_stage || undefined,
      status: dto.status,
      progress: dto.progress,
      budget: dto.estimated_cost,
      actualCost: dto.actual_cost,
      estimatedDuration: dto.estimated_duration_days,
      startDate: dto.start_date,
      endDate: dto.end_date,
      orderIndex: dto.order_index,
      steps: dto.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: step.status,
        progress: step.progress,
        orderIndex: step.order_index,
        tasks: step.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          progress: task.progress,
          orderIndex: task.order_index,
          assignedTo: task.assigned_to,
          requiresInspection: task.requires_inspection,
          requiresEngineerApproval: task.requires_engineer_approval
        })) || []
      })) || [],
      createdAt: dto.created_at,
      updatedAt: dto.updated_at
    };
  }

  /**
   * Transform CreatePhaseRequestDto to Phase entity
   */
  static fromCreateDtoToEntity(dto: CreatePhaseRequestDto): Partial<Phase> {
    return {
      projectId: dto.project_id,
      name: dto.phase_name,
      description: dto.description,
      constructionPhase: dto.construction_phase || undefined,
      constructionStage: dto.construction_stage || undefined,
      status: dto.status || 'pending',
      progress: dto.progress || 0,
      budget: dto.estimated_cost,
      estimatedDuration: dto.estimated_duration_days,
      startDate: dto.start_date,
      endDate: dto.end_date,
      orderIndex: dto.order_index || 0,
      steps: dto.steps || []
    };
  }

  /**
   * Transform UpdatePhaseRequestDto to Partial<Phase> entity
   */
  static fromUpdateDtoToEntity(dto: UpdatePhaseRequestDto): Partial<Phase> {
    return {
      name: dto.phase_name,
      description: dto.description,
      constructionPhase: dto.construction_phase,
      constructionStage: dto.construction_stage,
      status: dto.status,
      progress: dto.progress,
      budget: dto.estimated_cost,
      actualCost: dto.actual_cost,
      estimatedDuration: dto.estimated_duration_days,
      startDate: dto.start_date,
      endDate: dto.end_date,
      orderIndex: dto.order_index,
      steps: dto.steps
    };
  }

  /**
   * Validate PhaseDTO
   */
  static validate(dto: PhaseDTO): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!dto.phase_name || dto.phase_name.trim() === '') {
      errors.push('Phase name is required');
    }

    if (!dto.project_id || dto.project_id.trim() === '') {
      errors.push('Project ID is required');
    }

    if (dto.progress < 0 || dto.progress > 100) {
      errors.push('Progress must be between 0 and 100');
    }

    if (dto.estimated_cost && dto.estimated_cost < 0) {
      errors.push('Estimated cost must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
