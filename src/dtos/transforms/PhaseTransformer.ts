/**
 * Phase Transformer - Hexagonal Architecture
 * Handles transformations between Phase domain entities and PhaseDTO
 * Following hexagonal architecture principles
 */

import { Phase, PhaseStep, PhaseTask, PhaseResources, PhaseStatus, PhaseType, PhasePriority } from '@/domain/entities/Phase';
import { 
  PhaseDTO, 
  PhaseStepDTO,
  PhaseTaskDTO,
  PhaseStatus as DTOStatus,
  PhaseType as DTOType,
  PhasePriority as DTOPriority
} from '@/dtos/entities/PhaseDTO';

export class PhaseTransformer {
  // =================== Domain to DTO ===================

  /**
   * Batch: DTOs → Domain Entities
   */
  static manyFromDTO(dtos: PhaseDTO[]): Phase[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Batch: Domain Entities → DTOs
   */
  static manyToDTO(phases: Phase[]): PhaseDTO[] {
    return phases.map(phase => this.toDTO(phase));
  }

  static toDTO(phase: Phase): PhaseDTO {
    return {
      id: phase.id,
      projectId: phase.projectId,
      name: phase.phaseName,
      description: phase.description || '',
      status: phase.status as DTOStatus,
      progress: phase.progress || 0,
      orderIndex: phase.orderIndex || 0,
      startDate: phase.startDate || '',
      endDate: phase.endDate || '',
      estimatedDuration: phase.estimatedDuration || 0,
      actualDuration: phase.actualDuration || 0,
      estimatedCost: phase.estimatedCost || 0,
      actualCost: phase.actualCost || 0,
      type: 'execution' as DTOType, // Default type
      priority: 'medium' as DTOPriority, // Default priority
      dependencies: phase.dependencies || [],
      milestones: phase.milestones || [],
      createdAt: phase.createdAt,
      updatedAt: phase.updatedAt,

      // NEW: Additional database fields in DTO
      constructionPhase: phase.constructionPhase || undefined,
      constructionStage: phase.constructionStage || undefined,
      createdBy: phase.createdBy || undefined,
      customPhaseData: phase.customPhaseData ?? undefined,
      humanResources: phase.humanResources ? (phase.humanResources as unknown as Record<string, unknown>) : undefined,
      weight: phase.weight || undefined,
    };
  }

  static stepToDTO(step: PhaseStep): PhaseStepDTO {
    return {
      id: step.id,
      name: step.name,
      description: step.description,
      status: step.status as DTOStatus,
      progress: step.progress,
      order_index: step.order_index,
      estimated_duration_days: step.estimated_duration_days,
      actual_duration_days: step.actual_duration_days,
      start_date: step.start_date ? new Date(step.start_date).toISOString().split('T')[0] : undefined,
      end_date: step.end_date ? new Date(step.end_date).toISOString().split('T')[0] : undefined,
      requires_inspection: false, // Default value - not in PhaseStep interface
      requires_engineer_approval: false, // Default value - not in PhaseStep interface
      estimated_cost: 0, // Default value - not in PhaseStep interface
      actual_cost: 0, // Default value - not in PhaseStep interface
      assigned_to: [], // Default value - not in PhaseStep interface
      dependencies: [], // Default value - not in PhaseStep interface
      tasks: step.tasks.map(task => this.taskToDTO(task))
    };
  }

  static taskToDTO(task: PhaseTask): PhaseTaskDTO {
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      status: task.status as DTOStatus,
      progress: task.progress,
      order_index: task.order_index,
      estimated_duration_days: task.estimated_duration_days,
      actual_duration_days: task.actual_duration_days,
      start_date: task.start_date,
      end_date: task.end_date,
      assigned_to: task.assigned_to,
      dependencies: task.dependencies || [],
      weight: task.weight
    };
  }

  // =================== DTO to Domain ===================

  static toEntity(dto: PhaseDTO): Phase {
    return Phase.create({
      id: dto.id,
      projectId: dto.projectId,
      phaseName: dto.name,
      description: dto.description,
      status: dto.status as PhaseStatus,
      progress: dto.progress,
      orderIndex: dto.orderIndex,
      startDate: dto.startDate,
      endDate: dto.endDate,
      estimatedDuration: dto.estimatedDuration,
      actualDuration: dto.actualDuration,
      estimatedCost: dto.estimatedCost,
      actualCost: dto.actualCost,
      dependencies: [], // Will be loaded separately
      milestones: dto.milestones || [],
      humanResources: null, // Will be loaded separately
      materials: [], // Will be loaded separately
      suppliers: [], // Will be loaded separately
      location: null, // Not in DTO
      customPhaseData: null, // Not in DTO
      // Note: steps removed - handled as separate entities
      notes: null, // Not in DTO
      weight: null, // Not in DTO
      createdBy: null, // Not in DTO
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    });
  }

  static dtoToStep(dto: PhaseStepDTO): PhaseStep {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      status: dto.status as PhaseStatus,
      progress: dto.progress,
      order_index: dto.order_index,
      estimated_duration_days: dto.estimated_duration_days,
      actual_duration_days: dto.actual_duration_days,
      start_date: dto.start_date,
      end_date: dto.end_date,
      tasks: dto.tasks?.map(task => this.dtoToTask(task)) || []
    };
  }

  static dtoToTask(dto: PhaseTaskDTO): PhaseTask {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      status: dto.status as PhaseStatus,
      progress: dto.progress,
      order_index: dto.order_index,
      estimated_duration_days: dto.estimated_duration_days,
      actual_duration_days: dto.actual_duration_days,
      start_date: dto.start_date,
      end_date: dto.end_date,
      assigned_to: dto.assigned_to,
      dependencies: dto.dependencies,
      weight: dto.weight,
      // Note: materials property doesn't exist in PhaseTaskDTO
      materials: [],
    };
  }

  // =================== Create Operations ===================

  static fromCreateDTO(dto: Partial<PhaseDTO>): Phase {
    return Phase.create({
      id: dto.id,
      projectId: dto.projectId || '',
      phaseName: dto.name || '',
      description: dto.description || '',
      status: (dto.status as PhaseStatus) || 'pending',
      progress: dto.progress || 0,
      orderIndex: dto.orderIndex || 0,
      startDate: dto.startDate || null,
      endDate: dto.endDate || null,
      estimatedDuration: dto.estimatedDuration || null,
      actualDuration: dto.actualDuration || null,
      estimatedCost: dto.estimatedCost || null,
      actualCost: dto.actualCost || null,
      dependencies: [],
      milestones: dto.milestones || [],
      humanResources: null,
      materials: [],
      suppliers: [],
      location: null,
      customPhaseData: null,
      // Note: steps removed - handled as separate entities
      notes: null,
      weight: null,
      createdBy: null,
      createdAt: dto.createdAt || new Date().toISOString(),
      updatedAt: dto.updatedAt || new Date().toISOString()
    });
  }

  // =================== Validation ===================

  static validatePhaseStatus(status: string): PhaseStatus {
    const validStatuses: PhaseStatus[] = ['pending', 'in_progress', 'completed', 'blocked', 'delayed'];
    return validStatuses.includes(status as PhaseStatus) ? status as PhaseStatus : 'pending';
  }

  static validatePhaseType(type: string): PhaseType {
    const validTypes: PhaseType[] = ['preparation', 'execution', 'completion', 'validation'];
    return validTypes.includes(type as PhaseType) ? type as PhaseType : 'execution';
  }

  static validatePhasePriority(priority: string): PhasePriority {
    const validPriorities: PhasePriority[] = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority as PhasePriority) ? priority as PhasePriority : 'medium';
  }

  // =================== Update Operations ===================

  static updatePhase(phase: Phase, updates: Partial<PhaseDTO>): Phase {
    return Phase.create({
      ...phase.toJSON(),
      phaseName: updates.name || phase.phaseName,
      description: updates.description !== undefined ? updates.description : phase.description,
      status: updates.status ? this.validatePhaseStatus(updates.status) : phase.status,
      progress: updates.progress !== undefined ? updates.progress : phase.progress,
      orderIndex: updates.orderIndex !== undefined ? updates.orderIndex : phase.orderIndex,
      startDate: updates.startDate !== undefined ? updates.startDate : phase.startDate,
      endDate: updates.endDate !== undefined ? updates.endDate : phase.endDate,
      estimatedDuration: updates.estimatedDuration !== undefined ? updates.estimatedDuration : phase.estimatedDuration,
      actualDuration: updates.actualDuration !== undefined ? updates.actualDuration : phase.actualDuration,
      estimatedCost: updates.estimatedCost !== undefined ? updates.estimatedCost : phase.estimatedCost,
      actualCost: updates.actualCost !== undefined ? updates.actualCost : phase.actualCost,
      // Note: steps removed - handled as separate entities
      updatedAt: new Date().toISOString()
    });
  }
}
