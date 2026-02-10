/**
 * Phase Service - Hexagonal Architecture
 * Application service for phase management (unified with construction phases)
 * Following hexagonal architecture principles
 */

import { Phase, PhaseStatus as DomainPhaseStatus, ConstructionPhase, ConstructionStage } from '@/domain/entities/Phase';
import { PhaseDTO, PhaseStatus, PhaseStepDTO, PhaseTaskDTO } from '@/dtos/entities/PhaseDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ReferentialService } from './ReferentialService';
import { ReferentialType } from '@/config/referentials';
import { PhaseTransformer } from '@/dtos/transforms/PhaseTransformer';

/**
 * Phase Service
 * Orchestrates phase operations using domain entities
 */
export class PhaseService {
  private repository: IPhaseRepository;
  private referentialService: ReferentialService;

  constructor(repository?: IPhaseRepository) {
    this.repository = repository || RepositoryFactory.getPhaseRepository();
    this.referentialService = ReferentialService.getInstance();
  }

  /**
   * Create a new phase
   */
  async createPhase(phaseData: PhaseDTO, projectId: string): Promise<Phase> {
    try {
      // Validate input data
      if (!phaseData.name) {
        throw new AppError(ErrorCode.BAD_REQUEST, 'Phase name is required');
      }

      if (!projectId) {
        throw new AppError(ErrorCode.BAD_REQUEST, 'Project ID is required');
      }

      // Create phase entity
      const phase = PhaseTransformer.fromCreateDTO({
        ...phaseData,
        projectId,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Save to repository
      const savedPhase = await this.repository.create(phase);
      
      return savedPhase;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to create phase: ${error}`);
    }
  }

  /**
   * Get phase by ID
   */
  async getPhaseById(id: string): Promise<Phase | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const phase = await this.repository.findById(id);
      return phase;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get phase: ${error}`);
    }
  }

  /**
   * Get phases by project
   */
  async getPhasesByProject(projectId: string): Promise<Phase[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.BAD_REQUEST, 'Project ID is required');
      }

      const phases = await this.repository.findByProjectId(projectId);
      return phases;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get project phases: ${error}`);
    }
  }

  /**
   * Update phase
   */
  async updatePhase(id: string, data: Partial<PhaseDTO>): Promise<Phase> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      // Get existing phase
      const existingPhase = await this.repository.findById(id);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }

      // Update phase
      const updatedPhase = PhaseTransformer.updatePhase(existingPhase, data);
      
      // Save to repository
      const savedPhase = await this.repository.update(id, updatedPhase);
      
      return savedPhase;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update phase: ${error}`);
    }
  }

  /**
   * Delete phase
   */
  async deletePhase(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const result = await this.repository.delete(id);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to delete phase: ${error}`);
    }
  }

  /**
   * Create phases from referential
   */
  async createPhasesFromReferential(projectId: string, referentialType: ReferentialType): Promise<Phase[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.BAD_REQUEST, 'Project ID is required');
      }

      // Get referential data
      const referentialData = await this.referentialService.getReferentialData(referentialType);
      
      if (!referentialData || !referentialData.phases) {
        throw new AppError(ErrorCode.NOT_FOUND, `Referential data not found for type: ${referentialType}`);
      }

      // Convert referential phases to domain entities
      const phases: Phase[] = [];
      
      for (const phaseData of referentialData.phases) {
        const phase = PhaseTransformer.fromCreateDTO({
          id: crypto.randomUUID(),
          projectId,
          name: phaseData.name,
          description: phaseData.description || '',
          status: 'pending',
          progress: 0,
          orderIndex: phaseData.order || 0,
          estimatedDuration: phaseData.estimatedDuration,
          estimatedCost: phaseData.estimatedCost,
          steps: this.convertReferentialSteps(phaseData.steps || []),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        phases.push(phase);
      }

      // Save all phases
      const savedPhases = await Promise.all(
        phases.map(phase => this.repository.create(phase))
      );

      return savedPhases;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to create phases from referential: ${error}`);
    }
  }

  /**
   * Convert referential steps to PhaseStepDTO
   */
  private convertReferentialSteps(steps: Array<{name: string; description?: string; order?: number; estimatedDuration?: number; requiresInspection?: boolean; requiresEngineerApproval?: boolean; tasks?: Array<{name: string; description?: string; order?: number; estimatedDuration?: number; requiresInspection?: boolean; requiresEngineerApproval?: boolean; materials?: Array<string>}>}>): PhaseStepDTO[] {
    return steps.map(step => ({
      id: crypto.randomUUID(),
      name: step.name,
      description: step.description || '',
      status: PhaseStatus.PENDING,
      progress: 0,
      order_index: step.order || 0,
      estimated_duration_days: step.estimatedDuration || 0,
      actual_duration_days: 0,
      start_date: '',
      end_date: '',
      tasks: this.convertReferentialTasks(step.tasks || [])
    }));
  }

  /**
   * Convert referential tasks to PhaseTaskDTO
   */
  private convertReferentialTasks(tasks: Array<{name: string; description?: string; order?: number; estimatedDuration?: number; requiresInspection?: boolean; requiresEngineerApproval?: boolean; materials?: Array<string>}>): PhaseTaskDTO[] {
    return tasks.map(task => ({
      id: crypto.randomUUID(),
      name: task.name,
      description: task.description || '',
      status: PhaseStatus.PENDING,
      progress: 0,
      order_index: task.order || 0,
      estimated_duration_days: task.estimatedDuration || 0,
      actual_duration_days: 0,
      start_date: '',
      end_date: '',
      assigned_to: [],
      dependencies: []
    }));
  }

  /**
   * Update phase steps progress
   */
  async updatePhaseStepsProgress(phaseId: string, stepId: string, progress: number): Promise<Phase> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      if (!stepId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Step ID is required');
      }

      if (progress < 0 || progress > 100) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Progress must be between 0 and 100');
      }

      // Get existing phase
      const existingPhase = await this.repository.findById(phaseId);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }

      // Note: Steps are now handled as separate entities
      // This method should be updated to work with step repository
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Step progress update requires separate step repository');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update phase steps progress: ${error}`);
    }
  }

  /**
   * Get phase with steps
   */
  async getPhaseWithSteps(id: string): Promise<Phase | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const phase = await this.repository.findById(id);
      return phase;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get phase with steps: ${error}`);
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

      if (progress < 0 || progress > 100) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Progress must be between 0 and 100');
      }

      // Get existing phase
      const existingPhase = await this.repository.findById(phaseId);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }

      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Task status update requires separate step repository');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update task status: ${error}`);
    }
  }

  // ============= Construction-Specific Methods =============

  /**
   * Create phases from construction referential
   */
  async createConstructionPhasesFromReferential(projectId: string, referentialCode: ReferentialType): Promise<Phase[]> {
    try {
      // Get referential phases with proper type casting
      const referentialPhases = await this.referentialService.convertToProjectPhases(referentialCode, projectId);
      
      const createdPhases: Phase[] = [];
      
      for (const phaseData of referentialPhases) {
        // Create simplified phase entity
        const phaseEntity = Phase.create({
          id: `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId,
          phaseName: phaseData.name || 'Unknown Phase',
          description: phaseData.description || '',
          estimatedDuration: 30, // Default 30 days
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Save to repository
        const savedPhase = await this.repository.create(phaseEntity);
        createdPhases.push(savedPhase);
      }
      
      return createdPhases;
    } catch (error) {
      console.error('PhaseService.createConstructionPhasesFromReferential failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create construction phases from referential');
    }
  }

  /**
   * Get phase progress summary for construction phases
   */
  async getConstructionPhaseProgressSummary(projectId: string): Promise<{
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
      const overallProgress = totalPhases > 0 ? phases.reduce((sum, p) => sum + (p.progress || 0), 0) / totalPhases : 0;

      return {
        totalPhases,
        completedPhases,
        inProgressPhases,
        notStartedPhases,
        overallProgress
      };
    } catch (error) {
      console.error('PhaseService.getConstructionPhaseProgressSummary failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get construction phase progress summary');
    }
  }

  /**
   * Update construction phase with specific construction logic
   */
  async updateConstructionPhase(phaseId: string, phaseData: Partial<PhaseDTO>): Promise<Phase> {
    try {
      // Get existing phase
      const existingPhase = await this.repository.findById(phaseId);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Construction phase not found');
      }

      // Note: This method needs to be updated to work with the new Phase entity structure
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Construction phase update requires new implementation');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update construction phase: ${error}`);
    }
  }

  // ============= Helper Methods =============

  /**
   * Map string to ConstructionPhase type
   */
  private mapToConstructionPhase(type?: string): ConstructionPhase {
    // Simplified implementation - return default for now
    return 'PREPARATION' as ConstructionPhase;
  }

  /**
   * Map string to ConstructionStage type
   */
  private mapToConstructionStage(stage?: string): ConstructionStage {
    // Simplified implementation - return default for now
    return 'INITIAL' as ConstructionStage;
  }

  /**
   * Calculate phase duration in days
   */
  private calculatePhaseDuration(startDate: string, endDate: string): number {
    // Simplified implementation
    return 30; // Default 30 days
  }
}
