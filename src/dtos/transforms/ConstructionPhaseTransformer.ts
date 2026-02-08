/**
 * Construction Phase Transformer
 * Converts between ConstructionPhase entities and PhaseDTOs
 * Following hexagonal architecture principles
 */

import { ConstructionPhaseEntity, ConstructionPhase } from '@/domain/entities/ConstructionPhase';
import { PhaseDTO, PhaseStepDTO, PhaseTaskDTO } from '@/types/phase-dto';

export class ConstructionPhaseTransformer {
  /**
   * Convert domain entity to DTO for UI/API exchange
   */
  static toDTO(phase: ConstructionPhaseEntity): PhaseDTO {
    return {
      id: phase.id,
      project_id: phase.projectId,
      phase_name: phase.name,
      construction_phase: phase.type,
      construction_stage: phase.stage,
      description: phase.description || '',
      status: phase.status as 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled',
      progress: phase.progress,
      estimated_cost: phase.budget,
      actual_cost: phase.actualCost,
      estimated_duration_days: phase.estimatedDuration,
      actual_duration_days: phase.actualDuration,
      start_date: phase.startDate?.toISOString().split('T')[0],
      end_date: phase.endDate?.toISOString().split('T')[0],
      order_index: 0, // Default order since entity doesn't have it
      dependencies: [], // Default empty array since entity doesn't have it
      steps: phase.steps || [], // Include steps from referential if available
      created_at: phase.createdAt.toISOString(),
      updated_at: phase.updatedAt.toISOString()
    };
  }

  /**
   * Convert DTO to domain entity
   */
  static toEntity(dto: PhaseDTO): ConstructionPhaseEntity {
    return {
      id: dto.id,
      projectId: dto.project_id,
      name: dto.phase_name,
      type: dto.construction_phase,
      stage: dto.construction_stage,
      description: dto.description,
      status: dto.status as 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'blocked',
      progress: dto.progress,
      estimatedDuration: dto.estimated_duration_days || 30,
      actualDuration: dto.actual_duration_days,
      budget: dto.estimated_cost,
      actualCost: dto.actual_cost,
      startDate: dto.start_date ? new Date(dto.start_date) : undefined,
      endDate: dto.end_date ? new Date(dto.end_date) : undefined,
      materials: [],
      humanResources: [],
      suppliers: [],
      location: undefined,
      notes: undefined,
      milestones: [],
      steps: dto.steps || [],
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  /**
   * Convert DTO to ConstructionPhase class instance
   */
  static toConstructionPhase(dto: PhaseDTO): ConstructionPhase {
    return new ConstructionPhase(
      dto.id,
      dto.project_id,
      dto.phase_name,
      dto.estimated_duration_days || 30,
      dto.status as 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'blocked',
      dto.description,
      dto.construction_phase,
      dto.construction_stage,
      dto.progress,
      dto.start_date ? new Date(dto.start_date) : undefined,
      dto.end_date ? new Date(dto.end_date) : undefined,
      dto.actual_duration_days,
      dto.estimated_cost,
      dto.actual_cost,
      [], // materials
      [], // humanResources
      [], // suppliers
      undefined, // location
      undefined, // notes
      [], // milestones
      dto.steps || [], // steps
      new Date(dto.created_at),
      new Date(dto.updated_at)
    );
  }

  /**
   * Convert ConstructionPhase class instance to DTO
   */
  static fromConstructionPhaseToDTO(phase: ConstructionPhase): PhaseDTO {
    return {
      id: phase.id,
      project_id: phase.projectId,
      phase_name: phase.name,
      construction_phase: phase.type,
      construction_stage: phase.stage,
      description: phase.description || '',
      status: phase.status as 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled',
      progress: phase.progress,
      estimated_cost: phase.budget,
      actual_cost: phase.actualCost,
      estimated_duration_days: phase.estimatedDuration,
      actual_duration_days: phase.actualDuration,
      start_date: phase.startDate?.toISOString().split('T')[0],
      end_date: phase.endDate?.toISOString().split('T')[0],
      order_index: 0,
      dependencies: [],
      steps: phase.steps || [],
      created_at: phase.createdAt.toISOString(),
      updated_at: phase.updatedAt.toISOString()
    };
  }

  /**
   * Validate phase status according to business rules
   */
  static validatePhaseStatus(status: string): 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled' {
    const validStatuses = ['pending', 'in_progress', 'completed', 'delayed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid phase status: ${status}. Valid statuses: ${validStatuses.join(', ')}`);
    }
    return status as 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  }

  /**
   * Convert step entity to DTO
   */
  static stepToDTO(step: PhaseStepDTO): PhaseStepDTO {
    return {
      id: step.id,
      name: step.name,
      description: step.description || '',
      status: step.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      progress: step.progress,
      estimated_duration_days: step.estimated_duration_days,
      actual_duration_days: step.actual_duration_days,
      start_date: step.start_date,
      end_date: step.end_date,
      order_index: step.order_index,
      tasks: step.tasks || []
    };
  }

  /**
   * Convert task entity to DTO
   */
  static taskToDTO(task: PhaseTaskDTO): PhaseTaskDTO {
    return {
      id: task.id,
      name: task.name,
      description: task.description || '',
      status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      progress: task.progress,
      estimated_duration_days: task.estimated_duration_days,
      actual_duration_days: task.actual_duration_days,
      start_date: task.start_date,
      end_date: task.end_date,
      assigned_to: task.assigned_to || [],
      dependencies: task.dependencies || [],
      weight: task.weight || 1,
      order_index: task.order_index
    };
  }
}
