/**
 * Phase Service - Hexagonal Architecture
 * Application service for phase management (unified with construction phases)
 * Following hexagonal architecture principles
 */

import {
    ReferentialStep,
    ReferentialTask,
    ReferentialType
} from '@/config/referentials';
import { ConstructionPhase, ConstructionStage, Phase } from '@/domain/entities/Phase';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { PhaseDTO, PhaseStatus, PhaseStepDTO, PhaseTaskDTO } from '@/dtos/entities/PhaseDTO';
import { PhaseTransformer } from '@/dtos/transforms/PhaseTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ReferentialService } from './ReferentialService';

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
      if (!phaseData.name) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase name is required');
      }

      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Create phase entity
      const phase = PhaseTransformer.fromCreateDTO({
        ...phaseData,
        projectId,
        status: PhaseStatus.PENDING,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const savedPhase = await this.repository.create(phase);
      return savedPhase;
    } catch (error) {
      if (error instanceof AppError) throw error;
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
      return await this.repository.findById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get phase: ${error}`);
    }
  }

  /**
   * Get phases by project
   */
  async getPhasesByProject(projectId: string): Promise<Phase[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }
      return await this.repository.findByProjectId(projectId);
    } catch (error) {
      if (error instanceof AppError) throw error;
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

      const existingPhase = await this.repository.findById(id);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');
      }

      const updatedPhase = PhaseTransformer.updatePhase(existingPhase, data);
      const savedPhase = await this.repository.update(id, updatedPhase);
      return savedPhase;
    } catch (error) {
      if (error instanceof AppError) throw error;
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

      await this.repository.delete(id);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to delete phase: ${error}`);
    }
  }

  /**
   * Create phases from referential
   */
  async createPhasesFromReferential(projectId: string, referentialType: ReferentialType): Promise<Phase[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const referentialData = await this.referentialService.getReferential(referentialType);
      
      if (!referentialData || !referentialData.phases) {
        throw new AppError(ErrorCode.NOT_FOUND, `Referential data not found for type: ${referentialType}`);
      }

      const phases: Phase[] = [];
      
      for (const phaseData of referentialData.phases) {
        const labelStr = typeof phaseData.label === 'string' ? phaseData.label : (phaseData.label as { fr?: string })?.fr || String(phaseData.label);
        const descStr = typeof phaseData.description === 'string' ? phaseData.description : (phaseData.description as { fr?: string })?.fr || '';
        const phase = PhaseTransformer.fromCreateDTO({
          id: crypto.randomUUID(),
          projectId,
          name: labelStr,
          description: descStr,
          status: PhaseStatus.PENDING,
          progress: 0,
          orderIndex: phaseData.order || 0,
          steps: this.convertReferentialSteps(phaseData.steps || []),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        phases.push(phase);
      }

      const savedPhases = await Promise.all(
        phases.map(phase => this.repository.create(phase))
      );

      return savedPhases;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to create phases from referential: ${error}`);
    }
  }

  /**
   * Convert referential steps to PhaseStepDTO
   */
  private convertReferentialSteps(steps: ReferentialStep[]): PhaseStepDTO[] {
    return steps.map(step => {
      const labelStr = step.label.fr || step.label.en || step.label.ar || '';
      
      return {
        id: step.code || crypto.randomUUID(),
        name: labelStr,
        description: '', // ReferentialStep n'a pas de description
        status: PhaseStatus.PENDING,
        progress: 0,
        order_index: step.order || 0,
        estimated_duration_days: 0,
        actual_duration_days: 0,
        start_date: '',
        end_date: '',
        tasks: this.convertReferentialTasks(step.tasks || [])
      };
    });
  }

  /**
   * Convert referential tasks to PhaseTaskDTO
   */
  private convertReferentialTasks(tasks: ReferentialTask[]): PhaseTaskDTO[] {
    return tasks.map(task => {
      const labelStr = task.label.fr || task.label.en || task.label.ar || '';
      const descStr = task.description?.fr || task.description?.en || task.description?.ar || '';
      
      return {
        id: task.code || crypto.randomUUID(),
        name: labelStr,
        description: descStr,
        status: PhaseStatus.PENDING,
        progress: 0,
        order_index: 0, // ReferentialTask n'a pas de order
        estimated_duration_days: task.estimatedDurationDays || 0,
        actual_duration_days: 0,
        start_date: '',
        end_date: '',
        assigned_to: [],
        dependencies: []
      };
    });
  }

  /**
   * Update phase steps progress
   */
  async updatePhaseStepsProgress(phaseId: string, stepId: string, progress: number): Promise<Phase> {
    try {
      if (!phaseId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      if (!stepId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Step ID is required');
      if (progress < 0 || progress > 100) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Progress must be between 0 and 100');

      const existingPhase = await this.repository.findById(phaseId);
      if (!existingPhase) throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');

      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Step progress update requires separate step repository');
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update phase steps progress: ${error}`);
    }
  }

  /**
   * Get phase with steps
   */
  async getPhaseWithSteps(id: string): Promise<Phase | null> {
    try {
      if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      return await this.repository.findById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to get phase with steps: ${error}`);
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(phaseId: string, stepId: string, taskId: string, status: string, progress: number): Promise<Phase> {
    try {
      if (!phaseId || !stepId || !taskId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID, Step ID, and Task ID are required');
      if (progress < 0 || progress > 100) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Progress must be between 0 and 100');

      const existingPhase = await this.repository.findById(phaseId);
      if (!existingPhase) throw new AppError(ErrorCode.NOT_FOUND, 'Phase not found');

      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Task status update requires separate step repository');
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update task status: ${error}`);
    }
  }

  // ============= Construction-Specific Methods =============

  /**
   * Create phases from construction referential
   */
  async createConstructionPhasesFromReferential(projectId: string, referentialCode: ReferentialType): Promise<Phase[]> {
    try {
      const referentialPhases = await this.referentialService.convertToProjectPhases(referentialCode, projectId);
      
      const createdPhases: Phase[] = [];
      
      for (const phaseData of referentialPhases) {
        const phaseEntity = Phase.create({
          id: `phase-${Date.now()}-${crypto.randomUUID().slice(0, 9)}`,
          projectId,
          phaseName: phaseData.name || 'Unknown Phase',
          description: phaseData.description || '',
          estimatedDuration: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

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

      return { totalPhases, completedPhases, inProgressPhases, notStartedPhases, overallProgress };
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
      const existingPhase = await this.repository.findById(phaseId);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Construction phase not found');
      }
      throw new AppError(ErrorCode.NOT_IMPLEMENTED, 'Construction phase update requires new implementation');
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update construction phase: ${error}`);
    }
  }

  // ============= Helper Methods =============

  private mapToConstructionPhase(type?: string): ConstructionPhase {
    return 'PREPARATION' as ConstructionPhase;
  }

  private mapToConstructionStage(stage?: string): ConstructionStage {
    return 'INITIAL' as ConstructionStage;
  }

  private calculatePhaseDuration(startDate: string, endDate: string): number {
    return 30;
  }
}
