/**
 * Construction Phase Service
 * Application service for construction phase management
 * Following hexagonal architecture principles
 */

import { ConstructionPhaseEntity, ConstructionPhase } from '@/domain/entities/ConstructionPhase';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IConstructionPhaseRepository } from '@/domain/repositories/IConstructionPhaseRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { PhaseDTO, PhaseTaskDTO, PhaseStepDTO } from '@/types/phase-dto';
import { ReferentialService } from './ReferentialService';
import { ReferentialType } from '@/config/referentials';
import { ConstructionPhaseTransformer } from '@/dtos/transforms/ConstructionPhaseTransformer';

/**
 * Construction Phase Service
 * Orchestrates construction phase operations using domain entities
 */
export class ConstructionPhaseService {
  private repository: IConstructionPhaseRepository;
  private referentialService: ReferentialService;

  constructor(repository?: IConstructionPhaseRepository) {
    this.repository = repository || RepositoryFactory.getConstructionPhaseRepository();
    this.referentialService = ReferentialService.getInstance();
  }

  /**
   * Create a new construction phase
   */
  async createConstructionPhase(phaseData: PhaseDTO, projectId: string): Promise<ConstructionPhaseEntity> {
    try {
      // Validate input data
      const validation = this.validatePhaseData(phaseData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, validation.errors.join(', '));
      }

      // Create domain entity from DTO using transformer
      const phaseEntity = ConstructionPhaseTransformer.toEntity({
        ...phaseData,
        project_id: projectId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Save to repository
      const savedPhase = await this.repository.create(phaseEntity);
      
      return savedPhase;
    } catch (error) {
      console.error('ConstructionPhaseService.createConstructionPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create construction phase');
    }
  }

  /**
   * Update an existing construction phase
   */
  async updateConstructionPhase(id: string, phaseData: Partial<PhaseDTO>): Promise<ConstructionPhase> {
    try {
      // Get existing phase
      const existingPhase = await this.repository.findById(id);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Construction phase not found');
      }

      // Validate update data
      const validation = this.validatePhaseData(phaseData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, validation.errors.join(', '));
      }

      // Update entity
      const updatedPhase = ConstructionPhase.fromDTO({
        ...existingPhase.toDTO(),
        ...phaseData,
        updatedAt: new Date()
      });

      // Save to repository
      const savedPhase = await this.repository.update(id, updatedPhase);
      
      return savedPhase;
    } catch (error) {
      console.error('ConstructionPhaseService.updateConstructionPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update construction phase');
    }
  }

  /**
   * Update an existing construction phase
   */
  async updatePhase(phaseId: string, phaseData: Partial<PhaseDTO>): Promise<ConstructionPhaseEntity> {
    try {
      // Get existing phase
      const existingPhase = await this.repository.findById(phaseId);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }

      // Convert to DTO, update, and convert back using transformer
      const existingDTO = ConstructionPhaseTransformer.toDTO(existingPhase);
      const updatedDTO = { ...existingDTO, ...phaseData, updated_at: new Date().toISOString() };
      const updatedEntity = ConstructionPhaseTransformer.toEntity(updatedDTO);

      // Save to repository
      const savedPhase = await this.repository.update(phaseId, updatedEntity);
      return savedPhase;
    } catch (error) {
      console.error('ConstructionPhaseService.updatePhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update construction phase');
    }
  }

  /**
   * Get a construction phase by ID
   */
  async getConstructionPhase(id: string): Promise<ConstructionPhaseEntity | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      console.error('ConstructionPhaseService.getConstructionPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get construction phase');
    }
  }

  /**
   * Get all construction phases for a project
   */
  async getPhasesByProject(projectId: string): Promise<ConstructionPhaseEntity[]> {
    try {
      return await this.repository.findByProjectId(projectId);
    } catch (error) {
      console.error('ConstructionPhaseService.getPhasesByProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get construction phases');
    }
  }

  /**
   * Delete a construction phase
   */
  async deletePhase(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      console.error('ConstructionPhaseService.deletePhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete construction phase');
    }
  }

  /**
   * Get phase progress summary
   */
  async getPhaseProgressSummary(projectId: string): Promise<{
    totalPhases: number;
    completedPhases: number;
    inProgressPhases: number;
    notStartedPhases: number;
    overallProgress: number;
  }> {
    try {
      const phases = await this.repository.findByProjectId(projectId);
      
      const totalPhases = phases.length;
      const completedPhases = phases.filter(p => p.status === 'completed').length;
      const inProgressPhases = phases.filter(p => p.status === 'in_progress').length;
      const notStartedPhases = phases.filter(p => p.status === 'not_started').length;
      const overallProgress = totalPhases > 0 ? phases.reduce((sum, p) => sum + p.progress, 0) / totalPhases : 0;

      return {
        totalPhases,
        completedPhases,
        inProgressPhases,
        notStartedPhases,
        overallProgress
      };
    } catch (error) {
      console.error('ConstructionPhaseService.getPhaseProgressSummary failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get phase progress summary');
    }
  }

  /**
   * Validate phase data
   */
  private validatePhaseData(phaseData: Partial<PhaseData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!phaseData.title || phaseData.title.trim().length === 0) {
      errors.push('Phase title is required');
    }

    if (!phaseData.estimatedDuration || phaseData.estimatedDuration <= 0) {
      errors.push('Estimated duration must be greater than 0');
    }

    if (phaseData.budget !== undefined && phaseData.budget < 0) {
      errors.push('Budget cannot be negative');
    }

    if (phaseData.progress !== undefined && (phaseData.progress < 0 || phaseData.progress > 100)) {
      errors.push('Progress must be between 0 and 100');
    }

    // Date validation
    if (phaseData.startDate && phaseData.endDate) {
      const start = new Date(phaseData.startDate);
      const end = new Date(phaseData.endDate);
      
      if (start >= end) {
        errors.push('End date must be after start date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create phases from referential
   */
  async createPhasesFromReferential(projectId: string, referentialCode: ReferentialType): Promise<ConstructionPhase[]> {
    try {
      // Get referential phases with proper type casting
      const referentialPhases = await this.referentialService.convertToProjectPhases(referentialCode, projectId);
      
      const createdPhases: ConstructionPhase[] = [];
      
      for (const phaseData of referentialPhases) {
        // Convert referential phase to domain entity with steps from referential
        const phaseEntity = ConstructionPhase.fromDTO({
          id: `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId,
          name: phaseData.name,
          description: phaseData.description,
          estimatedDuration: this.calculatePhaseDuration(phaseData.phases?.steps || []),
          createdAt: new Date(),
          updatedAt: new Date(),
          steps: this.convertReferentialSteps(phaseData.phases?.steps || [])
        });

        // Save to repository
        const savedPhase = await this.repository.create(phaseEntity);
        createdPhases.push(savedPhase);
      }
      
      return createdPhases;
    } catch (error) {
      console.error('ConstructionPhaseService.createPhasesFromReferential failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create phases from referential');
    }
  }

  /**
   * Convert referential steps to PhaseStepDTO format
   */
  private convertReferentialSteps(referentialSteps: Array<{
    step_id: string;
    name: string;
    description?: string;
    order_index: number;
    tasks: Array<{
      task_id: string;
      name: string;
      description?: string;
      order_index: number;
      estimated_duration_days?: number;
    }>;
  }>): PhaseStepDTO[] {
    return referentialSteps.map((step, index) => ({
      id: step.step_id,
      name: step.name,
      description: step.description || '',
      status: 'pending' as const,
      progress: 0,
      estimated_duration_days: this.calculateStepDuration(step.tasks || []),
      actual_duration_days: 0,
      start_date: undefined,
      end_date: undefined,
      order_index: step.order_index,
      tasks: this.convertReferentialTasks(step.tasks || [])
    }));
  }

  /**
   * Convert referential tasks to PhaseTaskDTO format
   */
  private convertReferentialTasks(referentialTasks: Array<{
    task_id: string;
    name: string;
    description?: string;
    order_index: number;
    estimated_duration_days?: number;
  }>): PhaseTaskDTO[] {
    return referentialTasks.map((task, index) => ({
      id: task.task_id,
      name: task.name,
      description: task.description || '',
      status: 'pending' as const,
      progress: 0,
      estimated_duration_days: task.estimated_duration_days || 0,
      actual_duration_days: 0,
      start_date: undefined,
      end_date: undefined,
      assigned_to: [],
      dependencies: [],
      weight: 1,
      order_index: task.order_index
    }));
  }

  /**
   * Calculate step duration based on tasks
   */
  private calculateStepDuration(tasks: Array<{
    estimated_duration_days?: number;
  }>): number {
    return tasks.reduce((total, task) => total + (task.estimated_duration_days || 0), 0);
  }

  /**
   * Calculate phase duration based on steps
   */
  private calculatePhaseDuration(steps: Array<{
    tasks: Array<{
      estimated_duration_days?: number;
    }>;
  }>): number {
    return steps.reduce((total, step) => total + this.calculateStepDuration(step.tasks || []), 0);
  }

  /**
   * Update phase steps progress
   */
  async updatePhaseStepsProgress(phaseId: string, stepUpdates: Array<{ stepId: string; progress: number; status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' }>): Promise<ConstructionPhaseEntity> {
    try {
      // Get existing phase
      const phase = await this.repository.findById(phaseId);
      if (!phase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }

      // Update steps progress
      if (phase.steps) {
        phase.steps = phase.steps.map(step => {
          const update = stepUpdates.find(u => u.stepId === step.id);
          if (update) {
            return {
              ...step,
              progress: update.progress,
              status: update.status || step.status
            };
          }
          return step;
        });

        // Update overall phase progress based on steps
        const totalSteps = phase.steps.length;
        const completedSteps = phase.steps.filter(s => s.progress >= 100).length;
        phase.progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        
        if (phase.progress >= 100) {
          phase.status = 'completed';
        } else if (phase.progress > 0) {
          phase.status = 'in_progress';
        }
      }

      // Save updated phase
      const updatedPhase = await this.repository.update(phaseId, phase);
      return updatedPhase;
    } catch (error) {
      console.error('ConstructionPhaseService.updatePhaseStepsProgress failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update phase steps progress');
    }
  }

  /**
   * Convert domain entity to DTO using transformer
   */
  toDTO(phase: ConstructionPhaseEntity): PhaseDTO {
    return ConstructionPhaseTransformer.toDTO(phase);
  }
}
