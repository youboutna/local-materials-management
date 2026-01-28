/**
 * Phase Domain Transformer
 * Handles transformation between Phase entities and PhaseDTOs
 * Following hexagonal architecture principles
 */

import { Phase, PhaseTask, PhaseStatus, PhaseType } from '@/domain/entities/Phase';
import { Employee, Material, Document, Inspection } from '@/domain/entities';
import { PhaseMetrics } from '@/domain/repositories/IPhaseRepository';
import { PhaseDTO, CreatePhaseRequestDto, UpdatePhaseRequestDto, PhaseTaskDTO, ValidationResult } from './shared';
import { EntityToDTOMapper } from './shared';

// Status mapping between domain and DTO
type DTOStatus = PhaseDTO['status'];
type TaskDTOStatus = PhaseTaskDTO['status'];

const mapPhaseStatusToDTO = (status: PhaseStatus): DTOStatus => {
  switch (status) {
    case 'pending': return 'pending';
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'blocked': return 'cancelled'; // Map blocked to cancelled
    case 'delayed': return 'requires_changes'; // Map delayed to requires_changes
    default: return 'pending';
  }
};

const mapDTOStatusToPhase = (status: DTOStatus): PhaseStatus => {
  switch (status) {
    case 'pending': return 'pending';
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'cancelled': return 'blocked'; // Map cancelled to blocked
    case 'approved': return 'completed'; // Map approved to completed
    case 'rejected': return 'blocked'; // Map rejected to blocked
    case 'requires_changes': return 'delayed'; // Map requires_changes to delayed
    default: return 'pending';
  }
};

const mapPhaseStatusToTaskDTO = (status: PhaseStatus): TaskDTOStatus => {
  switch (status) {
    case 'pending': return 'pending';
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'blocked': return 'delayed'; // Map blocked to delayed
    case 'delayed': return 'delayed'; // Keep delayed as is
    default: return 'pending';
  }
};

const mapTaskDTOStatusToPhase = (status: TaskDTOStatus): PhaseStatus => {
  switch (status) {
    case 'pending': return 'pending';
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'delayed': return 'delayed'; // Keep delayed as is
    default: return 'pending';
  }
};

export class PhaseDomainTransformer implements EntityToDTOMapper<Phase, PhaseDTO> {
  /**
   * Transform Phase entity to PhaseDTO
   */
  toDTO(entity: Phase): PhaseDTO {
    return PhaseDomainTransformer.toDTO(entity);
  }

  /**
   * Transform PhaseDTO to Phase entity
   */
  fromDTO(dto: PhaseDTO): Phase {
    return PhaseDomainTransformer.fromDTO(dto);
  }

  /**
   * Transform Phase entity to PhaseDTO (alias for toDTO)
   */
  fromEntityToDTO(entity: Phase): PhaseDTO {
    return PhaseDomainTransformer.toDTO(entity);
  }

  /**
   * Transform array of PhaseDTOs to adapter format
   */
  fromDtosToAdapter(dtos: PhaseDTO[]): PhaseDTO[] {
    return dtos;
  }

  /**
   * Transform Phase entity to response DTO
   */
  toResponseDto(entity: Phase): PhaseDTO {
    return PhaseDomainTransformer.toDTO(entity);
  }

  /**
   * Transform PhaseDTO to request DTO
   */
  toRequestDto(dto: PhaseDTO): PhaseDTO {
    return dto;
  }

  /**
   * Transform PhaseDTO to update DTO
   */
  toUpdateDto(dto: PhaseDTO): Partial<PhaseDTO> {
    return {
      phase_name: dto.phase_name,
      description: dto.description,
      construction_phase: dto.construction_phase,
      construction_stage: dto.construction_stage,
      status: dto.status,
      progress: dto.progress,
      estimated_cost: dto.estimated_cost,
      actual_cost: dto.actual_cost,
      estimated_duration_days: dto.estimated_duration_days,
      start_date: dto.start_date,
      end_date: dto.end_date,
      order_index: dto.order_index,
      steps: dto.steps
    };
  }

  /**
   * Validate PhaseDTO
   */
  validate(dto: PhaseDTO): ValidationResult {
    return PhaseDomainTransformer.validate(dto);
  }

  /**
   * Static method: Transform Phase entity to PhaseDTO
   */
  static toDTO(entity: Phase): PhaseDTO {
    return {
      id: entity.id,
      project_id: entity.projectId,
      phase_name: entity.phaseName,
      description: entity.description || '',
      construction_phase: entity.constructionPhase || null,
      construction_stage: entity.constructionStage || null,
      status: mapPhaseStatusToDTO(entity.status),
      progress: entity.progress || 0,
      estimated_cost: entity.estimatedCost || 0,
      actual_cost: entity.actualCost || 0,
      estimated_duration_days: entity.estimatedDuration || 30,
      start_date: typeof entity.startDate === 'string' ? entity.startDate : entity.startDate?.toISOString() || '',
      end_date: typeof entity.endDate === 'string' ? entity.endDate : entity.endDate?.toISOString() || '',
      order_index: entity.orderIndex || 0,
      steps: entity.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description || '',
        status: mapPhaseStatusToDTO(step.status),
        progress: step.progress || 0,
        order_index: step.orderIndex || 0,
        tasks: step.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description || '',
          status: mapPhaseStatusToTaskDTO(task.status),
          progress: task.progress || 0,
          order_index: task.orderIndex || 0,
          assigned_to: task.assignedTo?.map(emp => emp.id) || [],
          requires_inspection: task.requiresInspection || false,
          requires_engineer_approval: task.requiresEngineerApproval || false
        })) || []
      })) || [],
      dependencies: entity.dependencies?.map(dep => dep.id) || [],
      milestones: entity.milestones?.map(milestone => milestone.id) || [],
      location: entity.location,
      notes: entity.notes,
      weight: entity.weight,
      created_by: entity.createdBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform PhaseDTO to Phase entity
   */
  static fromDTO(dto: PhaseDTO): Phase {
    return new Phase(
      dto.id,
      dto.project_id,
      dto.phase_name,
      dto.description,
      mapDTOStatusToPhase(dto.status),
      dto.progress,
      dto.order_index,
      dto.start_date ? new Date(dto.start_date) : null,
      dto.end_date ? new Date(dto.end_date) : null,
      dto.estimated_cost,
      dto.actual_cost,
      dto.estimated_duration_days,
      dto.construction_phase,
      dto.construction_stage,
      'execution' as PhaseType, // Default phase type - not in DTO
      dto.location || null, // From DTO field
      null, // customPhaseData - not in DTO (complex object)
      [], // dependencies - dto.dependencies has IDs, need service to load PhaseTask[]
      [], // milestones - dto.milestones has IDs, need service to load Milestone[]
      [], // materials - not in DTO, need separate service calls
      [], // suppliers - not in DTO, need separate service calls
      null, // humanResources - not in DTO (complex object)
      dto.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: mapDTOStatusToPhase(step.status),
        progress: step.progress,
        orderIndex: step.order_index,
        tasks: step.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: mapTaskDTOStatusToPhase(task.status),
          progress: task.progress,
          orderIndex: task.order_index,
          assignedTo: task.assigned_to?.map(empId => ({ id: empId } as Employee)) || [],
          requiresInspection: task.requires_inspection,
          requiresEngineerApproval: task.requires_engineer_approval
        })) || []
      })) || [],
      dto.notes || null, // notes
      dto.weight || null, // weight
      dto.created_by || null, // createdBy
      dto.created_at,
      dto.updated_at
    );
  }

  /**
   * Transform CreatePhaseRequestDto to Phase entity
   */
  static fromCreateDtoToEntity(dto: CreatePhaseRequestDto): Partial<Phase> {
    return {
      projectId: dto.project_id,
      phaseName: dto.phase_name,
      description: dto.description,
      constructionPhase: dto.construction_phase || null,
      constructionStage: dto.construction_stage || null,
      status: dto.status ? mapDTOStatusToPhase(dto.status) : undefined,
      progress: dto.progress || 0,
      estimatedCost: dto.estimated_cost,
      estimatedDuration: dto.estimated_duration_days,
      startDate: dto.start_date ? new Date(dto.start_date) : null,
      endDate: dto.end_date ? new Date(dto.end_date) : null,
      orderIndex: dto.order_index || 0,
      steps: dto.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: mapDTOStatusToPhase(step.status),
        progress: step.progress,
        orderIndex: step.order_index,
        tasks: step.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: mapTaskDTOStatusToPhase(task.status),
          progress: task.progress,
          orderIndex: task.order_index,
          assignedTo: task.assigned_to?.map(empId => ({ id: empId } as Employee)) || [],
          requiresInspection: task.requires_inspection,
          requiresEngineerApproval: task.requires_engineer_approval
        })) || []
      })) || [],
      location: dto.location || null,
      notes: dto.notes || null,
      weight: dto.weight || null
    };
  }

  /**
   * Transform UpdatePhaseRequestDto to Partial<Phase> entity
   */
  static fromUpdateDtoToEntity(dto: UpdatePhaseRequestDto): Partial<Phase> {
    return {
      phaseName: dto.phase_name,
      description: dto.description,
      constructionPhase: dto.construction_phase,
      constructionStage: dto.construction_stage,
      status: dto.status ? mapDTOStatusToPhase(dto.status) : undefined,
      progress: dto.progress,
      estimatedCost: dto.estimated_cost,
      actualCost: dto.actual_cost,
      estimatedDuration: dto.estimated_duration_days,
      startDate: dto.start_date ? new Date(dto.start_date) : null,
      endDate: dto.end_date ? new Date(dto.end_date) : null,
      orderIndex: dto.order_index,
      steps: dto.steps?.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: mapDTOStatusToPhase(step.status),
        progress: step.progress,
        orderIndex: step.order_index,
        tasks: step.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: mapTaskDTOStatusToPhase(task.status),
          progress: task.progress,
          orderIndex: task.order_index,
          assignedTo: task.assigned_to?.map(empId => ({ id: empId } as Employee)) || [],
          requiresInspection: task.requires_inspection,
          requiresEngineerApproval: task.requires_engineer_approval
        })) || []
      })) || [],
      location: dto.location,
      notes: dto.notes,
      weight: dto.weight
    };
  }

  /**
   * Transform PhaseTask entity to PhaseTaskDTO (PhaseService version)
   */
  static taskToDTO(entity: PhaseTask, stepId: string): PhaseTaskDTO {
    // Filter status to only include values compatible with PhaseTaskDTO
    const compatibleStatus = entity.status === 'blocked' ? 'delayed' : entity.status;
    
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      status: compatibleStatus as PhaseTaskDTO['status'],
      progress: entity.progress,
      order_index: entity.orderIndex || 0,
      assigned_to: entity.assignedTo?.map(emp => emp.id) || [],
      requires_inspection: entity.requiresInspection || false,
      requires_engineer_approval: entity.requiresEngineerApproval || false,
      estimated_duration_days: entity.estimatedDurationDays,
      actual_duration_days: entity.actualDurationDays,
      start_date: typeof entity.startDate === 'string' ? entity.startDate : entity.startDate?.toISOString(),
      end_date: typeof entity.endDate === 'string' ? entity.endDate : entity.endDate?.toISOString(),
      dependencies: entity.dependencies?.map(dep => dep.id) || [],
      weight: undefined, // PhaseTask entity doesn't have weight field (exists in DB but not entity)
      cost_estimate: undefined, // PhaseTask entity doesn't have cost_estimate field (exists in DB but not entity)
      actual_cost: undefined // PhaseTask entity doesn't have actual_cost field (exists in DB but not entity)
    };
  }

  /**
   * Transform PhaseTaskDTO to PhaseTask entity
   */
  static taskFromDTO(dto: PhaseTaskDTO): PhaseTask {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      status: dto.status,
      progress: dto.progress,
      orderIndex: dto.order_index,
      assignedTo: dto.assigned_to?.map(empId => ({ id: empId } as Employee)) || [],
      requiresInspection: dto.requires_inspection,
      requiresEngineerApproval: dto.requires_engineer_approval,
      estimatedDurationDays: dto.estimated_duration_days,
      actualDurationDays: dto.actual_duration_days,
      startDate: dto.start_date ? new Date(dto.start_date) : undefined,
      endDate: dto.end_date ? new Date(dto.end_date) : undefined,
      dependencies: [], // Transformer only maps basic fields - dto.dependencies (IDs) → PhaseTask[] would need service loading
      materials: [], // Not in PhaseTaskDTO - would need separate service calls
      documents: [], // Not in PhaseTaskDTO - would need separate service calls  
      inspections: [] // Not in PhaseTaskDTO - would need separate service calls
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

  /**
   * Transform PhaseMetrics domain entity to PhaseMetricsDTO
   */
  static toMetricsDTO(metrics: PhaseMetrics): import('./shared').PhaseMetricsDTO {
    return {
      totalSteps: metrics.stepsCount || 0,
      completedSteps: Math.floor((metrics.taskCompletionRate || 0) * metrics.totalTasks / 100),
      totalTasks: metrics.totalTasks || 0,
      completedTasks: metrics.completedTasks || 0,
      overallProgress: metrics.taskCompletionRate || 0,
      estimatedCompletionDate: undefined, // Not available in PhaseMetrics domain entity
      budgetUtilization: metrics.materialCost > 0 ? (metrics.materialCost / 100) : 0, // Simplified calculation
      onTimeDelivery: metrics.milestoneProgress || 0
    };
  }
}
