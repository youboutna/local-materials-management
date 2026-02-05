/**
 * Phase Service - Hexagonal Architecture
 * Business logic for phase management using repositories and transformers
 */

import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { Phase, PhaseStep, PhaseTask, PhaseStatus } from '@/domain/entities/Phase';
import { PhaseDTO, CreatePhaseDTO, UpdatePhaseDTO, PhaseStepDTO, PhaseMetricsDTO } from '@/dtos/entities/PhaseDTO';
import { PhaseTransformer, CreatePhaseRequestDTO } from '@/dtos/transforms/PhaseTransformer';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Type alias for backward compatibility
type CreatePhaseRequestDto = CreatePhaseRequestDTO;
type UpdatePhaseRequestDto = UpdatePhaseDTO;
type PhaseTaskDTO = PhaseStepDTO;

// Service DTOs for data exchange

// Legacy interface - kept for backward compatibility
export interface PhaseData {
  id: string;
  phase?: string;
  stage?: string;
  customPhase?: CustomPhase;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: PhaseStatus;
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
  status: PhaseStatus;
  progress: number;
}

export interface PhaseDTOLegacy {
  id: string;
  project_id: string;
  phase_name: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  actual_cost: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  phase_type?: string;
  construction_phase?: string;
  construction_stage?: string;
}

// Add proper type guard for status fields
function isPhaseStatus(status: string): status is PhaseStatus {
  return ['pending', 'in_progress', 'completed', 'blocked', 'delayed'].includes(status);
}

// Add status transition validation
function isValidPhaseStatusTransition(current: PhaseStatus, next: PhaseStatus): boolean {
  const validTransitions: Record<PhaseStatus, PhaseStatus[]> = {
    pending: ['in_progress', 'blocked', 'delayed'],
    in_progress: ['completed', 'blocked', 'delayed'],
    completed: [],
    blocked: ['in_progress'],
    delayed: ['in_progress']
  };
  return validTransitions[current].includes(next);
}

export class PhaseService {
  constructor(private phaseRepository: IPhaseRepository) {}

  /**
   * Create a new phase
   */
  async createPhase(phaseData: CreatePhaseRequestDto): Promise<PhaseDTO> {
    try {
      // Validate phase data
      const validation = this.validatePhaseData(phaseData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      const entity = PhaseTransformer.fromCreateRequest(phaseData, crypto.randomUUID());
      const createdEntity = await this.phaseRepository.create(entity);
      const dto = PhaseTransformer.toDTO(createdEntity);
      return this.convertLegacyToPhaseDTO(dto);
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
      if (!entity) return null;
      
      const dto = PhaseTransformer.toDTO(entity);
      return this.convertLegacyToPhaseDTO(dto);
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
      return entities.map(e => {
        const dto = PhaseTransformer.toDTO(e);
        return this.convertLegacyToPhaseDTO(dto);
      });
    } catch (error) {
      console.error('PhaseService.getPhasesByProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phases');
    }
  }

  /**
   * Update a phase
   */
  async updatePhase(id: string, phaseData: UpdatePhaseRequestDto): Promise<PhaseDTO> {
    try {
      const validation = this.validatePhaseData(phaseData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      const entity = await this.phaseRepository.findById(id);
      if (!entity) throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      
      const updatedEntity = await this.phaseRepository.update(id, entity);
      const dto = PhaseTransformer.toDTO(updatedEntity);
      return this.convertLegacyToPhaseDTO(dto);
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
   * Get phase metrics
   */
  async getPhaseMetrics(phaseId: string): Promise<PhaseMetricsDTO> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const metrics = await this.phaseRepository.getMetrics(phaseId);
      // Cast metrics to PhaseMetricsDTO with defaults for missing fields
      return {
        ...metrics,
        totalSteps: metrics.stepsCount || 0,
        overallProgress: metrics.milestoneProgress || 0,
        budgetUtilization: metrics.materialCost > 0 ? (metrics.materialCost / (metrics.materialCost + 1)) : 0,
        onTimeDelivery: 100
      };
    } catch (error) {
      console.error('PhaseService.getPhaseMetrics failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phase metrics');
    }
  }

  /**
   * Update phase progress
   */
  async updateProgress(phaseId: string, progress: number): Promise<void> {
    try {
      if (!phaseId || typeof progress !== 'number') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID and progress are required');
      }
      if (progress < 0 || progress > 100) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Progress must be between 0 and 100');
      }

      await this.phaseRepository.updateProgress(phaseId, progress);
    } catch (error) {
      console.error('PhaseService.updateProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update phase progress');
    }
  }

  /**
   * Add step to phase
   */
  async addStep(phaseId: string, stepData: Omit<PhaseStep, 'id'>): Promise<PhaseStep> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const step = await this.phaseRepository.addStep(phaseId, stepData);
      return step;
    } catch (error) {
      console.error('PhaseService.addStep failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add step');
    }
  }

  /**
   * Update step
   */
  async updateStep(phaseId: string, stepId: string, updates: Partial<PhaseStep>): Promise<PhaseStep> {
    try {
      if (!phaseId || !stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID and Step ID are required');
      }

      const step = await this.phaseRepository.updateStep(phaseId, stepId, updates);
      return step;
    } catch (error) {
      console.error('PhaseService.updateStep failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update step');
    }
  }

  /**
   * Delete step
   */
  async deleteStep(phaseId: string, stepId: string): Promise<void> {
    try {
      if (!phaseId || !stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID and Step ID are required');
      }

      await this.phaseRepository.deleteStep(phaseId, stepId);
    } catch (error) {
      console.error('PhaseService.deleteStep failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete step');
    }
  }

  /**
   * Add task to step
   */
  async addTask(phaseId: string, stepId: string, taskData: Omit<PhaseTask, 'id'>): Promise<PhaseTask> {
    try {
      if (!phaseId || !stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID and Step ID are required');
      }

      const task = await this.phaseRepository.addTask(phaseId, stepId, taskData);
      return task;
    } catch (error) {
      console.error('PhaseService.addTask failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add task');
    }
  }

  /**
   * Update task
   */
  async updateTask(phaseId: string, stepId: string, taskId: string, updates: Partial<PhaseTask>): Promise<PhaseTask> {
    try {
      if (!phaseId || !stepId || !taskId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID, Step ID, and Task ID are required');
      }

      const task = await this.phaseRepository.updateTask(phaseId, stepId, taskId, updates);
      return task;
    } catch (error) {
      console.error('PhaseService.updateTask failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update task');
    }
  }

  /**
   * Delete task
   */
  async deleteTask(phaseId: string, stepId: string, taskId: string): Promise<void> {
    try {
      if (!phaseId || !stepId || !taskId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID, Step ID, and Task ID are required');
      }

      await this.phaseRepository.deleteTask(phaseId, stepId, taskId);
    } catch (error) {
      console.error('PhaseService.deleteTask failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete task');
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(phaseId: string, stepId: string, taskId: string, status: string, progress: number): Promise<Phase> {
    try {
      if (!phaseId || !stepId || !taskId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID, Step ID, and Task ID are required');
      }

      if (!isPhaseStatus(status)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid status: ${status}`);
      }

      const phase = await this.phaseRepository.updateTaskStatus(phaseId, stepId, taskId, status, progress);
      return phase;
    } catch (error) {
      console.error('PhaseService.updateTaskStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update task status');
    }
  }

  /**
   * Validate phase data
   */
  private validatePhaseData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name && typeof data.name !== 'string') {
      errors.push('Phase name must be a string');
    }

    if (data.budget !== undefined && typeof data.budget !== 'number') {
      errors.push('Budget must be a number');
    }

    if (data.progress !== undefined) {
      if (typeof data.progress !== 'number' || data.progress < 0 || data.progress > 100) {
        errors.push('Progress must be a number between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert PhaseDTO to legacy PhaseDTOLegacy format
   */
  private convertLegacyToPhaseDTO(dto: PhaseDTO): PhaseDTO {
    // Return as-is since PhaseDTO is already in the right format
    return dto;
  }

  /**
   * Get all phases for a project (alternative method name)
   */
  async getProjectPhases(projectId: string): Promise<PhaseDTO[]> {
    return this.getPhasesByProject(projectId);
  }

  /**
   * Get phase with steps and tasks
   */
  async getPhaseWithSteps(phaseId: string): Promise<Phase | null> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const phase = await this.phaseRepository.findWithSteps(phaseId);
      return phase;
    } catch (error) {
      console.error('PhaseService.getPhaseWithSteps failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phase with steps');
    }
  }

  /**
   * Recalculate phase progress from steps and tasks
   */
  async recalculateProgress(phaseId: string): Promise<number> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const progress = await this.phaseRepository.recalculateProgress(phaseId);
      return progress;
    } catch (error) {
      console.error('PhaseService.recalculateProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to recalculate progress');
    }
  }
}
