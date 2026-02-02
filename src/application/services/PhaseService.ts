/**
 * Phase Service - Hexagonal Architecture
 * Business logic for phase management using repositories and transformers
 */

import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { Phase, PhaseStep, PhaseTask, PhaseStatus } from '@/domain/entities/Phase';
import { PhaseDTO, CreatePhaseRequestDto, UpdatePhaseRequestDto, PhaseTaskDTO, PhaseStepDTO } from '@/dtos/entities/PhaseDTO';
import { PhaseTransformer } from '@/dtos/transforms/PhaseTransformer';
import { ConstructionPhase, ConstructionStage } from '@/types/project';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Service DTOs for data exchange
export interface PhaseMetricsDTO {
  totalSteps: number;
  completedSteps: number;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number;
  estimatedCompletionDate?: string;
  budgetUtilization: number;
  onTimeDelivery: number;
}

// Legacy interface - kept for backward compatibility
export interface PhaseData {
  id: string;
  phase?: ConstructionPhase;
  stage?: ConstructionStage;
  customPhase?: CustomPhase;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  budget: number;
  actualCost: number;
  progress: number;
  materials: Array<{ materialId: string; quantity: number; name?: string }>;
  humanResources: Array<{ roleId: string; quantity: number; role?: string }>;
  suppliers: Array<{ supplierId: string; name?: string; contact?: string }>;
  location: string;
  notes?: string;
}

export interface CustomPhase {
  id: string;
  name: string;
  number: number;
  customStages: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  materials?: Array<{ materialId: string; quantity: number; name?: string }>;
  humanResources?: Array<{ roleId: string; quantity: number; role?: string }>;
  suppliers?: Array<{ supplierId: string; name?: string; contact?: string }>;
  location?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
}

export class PhaseService {
  constructor(
    private phaseRepository: IPhaseRepository = RepositoryFactory.getPhaseRepository(),
    private phaseTransformer: PhaseTransformer = new PhaseTransformer()
  ) {}

  /**
   * Create a new phase
   */
  async createPhase(phaseData: PhaseDTOLegacy): Promise<PhaseDTO> {
    try {
      // Validate phase data
      const validation = this.validatePhaseData(phaseData as unknown as CreatePhaseRequestDto);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      // Convert PhaseDTOLegacy to CreatePhaseRequestDto
      const createRequest: CreatePhaseRequestDto = {
        project_id: phaseData.project_id || '',
        phase_name: phaseData.phase_name || '',
        description: phaseData.description || '',
        status: phaseData.status as "approved" | "cancelled" | "completed" | "in_progress" | "pending" | "rejected" | "requires_changes",
        progress: phaseData.progress || 0,
        estimated_cost: Number(phaseData.budget || 0),
        start_date: phaseData.start_date || '',
        end_date: phaseData.end_date || '',
        steps: [],
      };

      const entity = this.phaseTransformer.toEntity(createRequest as unknown as PhaseDTOLegacy);
      const createdEntity = await this.phaseRepository.create(entity);
      return this.convertLegacyToPhaseDTO(this.phaseTransformer.toDTO(createdEntity));
    } catch (error) {
      console.error('PhaseService.createPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create phase');
    }
  }

  /**
   * Get phase by ID
   */
  async getPhaseById(id: string): Promise<PhaseDTO | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const entity = await this.phaseRepository.findById(id);
      return entity ? this.convertLegacyToPhaseDTO(this.phaseTransformer.toDTO(entity)) : null;
    } catch (error) {
      console.error('PhaseService.getPhaseById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phase');
    }
  }

  /**
   * Get all phases for a project
   */
  async getPhasesByProject(projectId: string): Promise<PhaseDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const entities = await this.phaseRepository.findByProjectId(projectId);
      return entities.map(entity => this.convertLegacyToPhaseDTO(this.phaseTransformer.toDTO(entity)));
    } catch (error) {
      console.error('PhaseService.getPhasesByProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phases');
    }
  }

  /**
   * Update a phase
   */
  async updatePhase(id: string, data: UpdatePhaseRequestDto): Promise<PhaseDTO> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      // Validate update data
      const validation = this.validatePhaseData(data);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      const updates = this.phaseTransformer.toEntity(data as unknown as PhaseDTOLegacy);
      const updatedEntity = await this.phaseRepository.update(id, updates);
      return this.convertLegacyToPhaseDTO(this.phaseTransformer.toDTO(updatedEntity));
    } catch (error) {
      console.error('PhaseService.updatePhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update phase');
    }
  }

  /**
   * Delete a phase
   */
  async deletePhase(id: string): Promise<void> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      await this.phaseRepository.delete(id);
    } catch (error) {
      console.error('PhaseService.deletePhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete phase');
    }
  }

  /**
   * Get phase with all steps and tasks
   */
  async getPhaseWithSteps(id: string): Promise<PhaseDTO | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const entity = await this.phaseRepository.findWithSteps(id);
      return entity ? this.convertLegacyToPhaseDTO(this.phaseTransformer.toDTO(entity)) : null;
    } catch (error) {
      console.error('PhaseService.getPhaseWithSteps failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phase with steps');
    }
  }

  /**
   * Update phase progress
   */
  async updatePhaseProgress(id: string, progress: number): Promise<void> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      if (progress < 0 || progress > 100) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Progress must be between 0 and 100');
      }

      await this.phaseRepository.updateProgress(id, progress);
    } catch (error) {
      console.error('PhaseService.updatePhaseProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update phase progress');
    }
  }

  /**
   * Recalculate phase progress from steps/tasks
   */
  async recalculatePhaseProgress(id: string): Promise<number> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      return await this.phaseRepository.recalculateProgress(id);
    } catch (error) {
      console.error('PhaseService.recalculatePhaseProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to recalculate phase progress');
    }
  }

  /**
   * Add step to phase
   */
  async addStepToPhase(phaseId: string, step: Omit<PhaseStepDTO, 'id'>): Promise<PhaseStepDTO> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      if (!step.name) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Step name is required');
      }

      // Convert DTO to PhaseStep entity structure for repository
      const stepEntity: Omit<PhaseStep, 'id'> = {
        name: step.name,
        description: step.description,
        status: step.status as PhaseStatus,
        progress: step.progress,
        orderIndex: step.orderIndex,
        tasks: step.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status as PhaseStatus,
          progress: task.progress,
          orderIndex: task.orderIndex,
          assignedTo: [], // Entity expects Employee[] objects, DTO has IDs
          requiresInspection: task.requiresInspection,
          requiresEngineerApproval: task.requiresEngineerApproval,
          estimatedDurationDays: task.estimatedDurationDays,
          actualDurationDays: task.actualDurationDays,
          startDate: task.startDate ? new Date(task.startDate) : undefined,
          endDate: task.endDate ? new Date(task.endDate) : undefined,
          dependencies: [], // Entity expects PhaseTask[] objects, DTO has IDs
          materials: [], // Entity expects Material[] objects, DTO has IDs
          documents: [], // Entity expects Document[] objects, DTO has IDs
          inspections: [] // Entity expects Inspection[] objects, DTO has IDs
        })) || [],
        estimatedDurationDays: step.estimatedDurationDays,
        requiresInspection: step.requiresInspection,
        requiresEngineerApproval: step.requiresEngineerApproval,
        startDate: step.startDate ? new Date(step.startDate) : undefined,
        endDate: step.endDate ? new Date(step.endDate) : undefined,
        inspections: [], // Entity expects Inspection[] objects, DTO has IDs
        documents: [] // Entity expects Document[] objects, DTO has IDs
      };

      const result = await this.phaseRepository.addStep(phaseId, stepEntity);
      
      // Transform PhaseStep entity back to PhaseStepDTO
      return {
        id: result.id,
        name: result.name,
        description: result.description,
        status: result.status,
        progress: result.progress,
        orderIndex: result.orderIndex,
        tasks: result.tasks?.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description,
          status: task.status,
          progress: task.progress,
          orderIndex: task.orderIndex,
          assignedTo: task.assignedTo?.map(emp => emp.id) || [], // Extract IDs from Employee objects
          requiresInspection: task.requiresInspection,
          requiresEngineerApproval: task.requiresEngineerApproval,
          estimatedDurationDays: task.estimatedDurationDays,
          actualDurationDays: task.actualDurationDays,
          startDate: task.startDate?.toISOString(),
          endDate: task.endDate?.toISOString(),
          dependencies: task.dependencies?.map(dep => dep.id) || [], // Extract IDs from PhaseTask objects
          materials: task.materials?.map(mat => mat.id) || [], // Extract IDs from Material objects
          documents: task.documents?.map(doc => doc.id) || [], // Extract IDs from Document objects
          inspections: task.inspections?.map(insp => insp.id) || [] // Extract IDs from Inspection objects
        })) || [],
        estimatedDurationDays: result.estimatedDurationDays,
        requiresInspection: result.requiresInspection,
        requiresEngineerApproval: result.requiresEngineerApproval,
        startDate: result.startDate?.toISOString(),
        endDate: result.endDate?.toISOString(),
        inspections: result.inspections?.map(insp => insp.id) || [], // Extract IDs from Inspection objects
        documents: result.documents?.map(doc => doc.id) || [] // Extract IDs from Document objects
      } as PhaseStepDTO;
    } catch (error) {
      console.error('PhaseService.addStepToPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add step to phase');
    }
  }

  async deleteStepFromPhase(phaseId: string, stepId: string): Promise<void> {
    try {
      if (!phaseId || !stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID and Step ID are required');
      }

      await this.phaseRepository.deleteStep(phaseId, stepId);
    } catch (error) {
      console.error('PhaseService.deleteStepFromPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete step from phase');
    }
  }

  /**
   * Add task to step
   */
  async addTaskToStep(phaseId: string, stepId: string, task: Omit<PhaseTaskDTO, 'id'>): Promise<PhaseTaskDTO> {
    try {
      if (!phaseId || !stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID and Step ID are required');
      }

      if (!task.name) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Task name is required');
      }

      // Convert DTO to PhaseTask entity structure for repository
      const taskEntityForRepo: Omit<PhaseTask, 'id'> = {
        name: task.name,
        description: task.description || '',
        status: task.status as PhaseStatus,
        progress: task.progress,
        orderIndex: task.orderIndex,
        assignedTo: [], // Entity expects Employee[] objects, DTO has IDs
        requiresInspection: task.requiresInspection,
        requiresEngineerApproval: task.requiresEngineerApproval,
        estimatedDurationDays: task.estimatedDurationDays,
        actualDurationDays: task.actualDurationDays,
        startDate: task.startDate ? new Date(task.startDate) : undefined,
        endDate: task.endDate ? new Date(task.endDate) : undefined,
        dependencies: [], // Entity expects PhaseTask[] objects, DTO has IDs
        materials: [], // Entity expects Material[] objects, DTO has IDs
        documents: [], // Entity expects Document[] objects, DTO has IDs
        inspections: [] // Entity expects Inspection[] objects, DTO has IDs
      };

      const result = await this.phaseRepository.addTask(phaseId, stepId, taskEntityForRepo);
      // Transform PhaseTask entity to PhaseTaskDTO (local format)
      const taskResult = result as PhaseTask;
      const taskDTO: PhaseTaskDTO = {
        id: taskResult.id,
        name: taskResult.name,
        description: taskResult.description,
        status: taskResult.status === 'blocked' ? 'delayed' : taskResult.status,
        progress: taskResult.progress,
        orderIndex: taskResult.orderIndex,
        assignedTo: taskResult.assignedTo?.map(emp => emp.id) || [],
        requiresInspection: taskResult.requiresInspection,
        requiresEngineerApproval: taskResult.requiresEngineerApproval,
        estimatedDurationDays: taskResult.estimatedDurationDays,
        actualDurationDays: taskResult.actualDurationDays,
        startDate: taskResult.startDate?.toISOString(),
        endDate: taskResult.endDate?.toISOString(),
        dependencies: taskResult.dependencies?.map(dep => dep.id) || [],
        materials: taskResult.materials?.map(mat => mat.id) || [],
        documents: taskResult.documents?.map(doc => doc.id) || [],
        inspections: taskResult.inspections?.map(insp => insp.id) || []
      };
      
      return taskDTO;
    } catch (error) {
      console.error('PhaseService.addTaskToStep failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add task to step');
    }
  }

  /**
   * Delete task from step
   */
  async deleteTaskFromStep(phaseId: string, stepId: string, taskId: string): Promise<void> {
    try {
      if (!phaseId || !stepId || !taskId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID, Step ID and Task ID are required');
      }

      await this.phaseRepository.deleteTask(phaseId, stepId, taskId);
    } catch (error) {
      console.error('PhaseService.deleteTaskFromStep failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete task from step');
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(phaseId: string, stepId: string, taskId: string, status: string, progress: number): Promise<PhaseDTO> {
    try {
      if (!phaseId || !stepId || !taskId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID, Step ID and Task ID are required');
      }

      if (!status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      }

      if (progress < 0 || progress > 100) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Progress must be between 0 and 100');
      }

      const updatedPhase = await this.phaseRepository.updateTaskStatus(phaseId, stepId, taskId, status, progress);
      return this.convertLegacyToPhaseDTO(this.phaseTransformer.toDTO(updatedPhase));
    } catch (error) {
      console.error('PhaseService.updateTaskStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update task status');
    }
  }

  /**
   * Get phase metrics
   */
  async getPhaseMetrics(id: string): Promise<PhaseMetricsDTO> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const result = await this.phaseRepository.getMetrics(id);
      // Convert metrics to DTO format
      return result as unknown as PhaseMetricsDTO;
    } catch (error) {
      console.error('PhaseService.getPhaseMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phase metrics');
    }
  }

  /**
   * Convert PhaseDTOLegacy to PhaseDTO with missing properties
   */
  private convertLegacyToPhaseDTO(legacy: PhaseDTOLegacy): PhaseDTO {
    return {
      id: legacy.id,
      createdAt: legacy.created_at,
      updatedAt: legacy.updated_at,
      project_id: legacy.project_id,
      phase_name: legacy.phase_name,
      description: legacy.description || '',
      construction_phase: legacy.construction_phase || null,
      construction_stage: legacy.construction_stage || null,
      status: legacy.status as 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes',
      progress: legacy.progress || 0,
      estimated_cost: legacy.budget || 0,
      actual_cost: legacy.actual_cost || 0,
      estimated_duration_days: 0, // Default value
      start_date: legacy.start_date || '',
      end_date: legacy.end_date || '',
      order_index: 0, // Default value
      steps: [], // Default empty array
      dependencies: [], // Default empty array
      milestones: [], // Default empty array
      location: null,
      notes: null,
      weight: null,
      created_by: null,
      created_at: legacy.created_at,
      updated_at: legacy.updated_at
    };
  }

  /**
   * Validate phase data
   */
  validatePhaseData(data: CreatePhaseRequestDto | UpdatePhaseRequestDto): { isValid: boolean; errors: string[] } {
    const dto = data as CreatePhaseRequestDto;
    // Create transformer instance to use validate method
    const transformer = new PhaseTransformer();
    return transformer.validate(dto as unknown as PhaseDTOLegacy);
  }
}
