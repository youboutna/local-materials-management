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

/**
 * Construction Phase Service
 * Orchestrates construction phase operations using domain entities
 */
export class ConstructionPhaseService {
  private repository: IConstructionPhaseRepository;

  constructor(repository?: IConstructionPhaseRepository) {
    this.repository = repository || RepositoryFactory.getConstructionPhaseRepository();
  }

  /**
   * Create a new construction phase
   */
  async createConstructionPhase(phaseData: PhaseData, projectId: string): Promise<ConstructionPhase> {
    try {
      // Validate input data
      const validation = this.validatePhaseData(phaseData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, validation.errors.join(', '));
      }

      // Create domain entity from DTO
      const constructionPhase = ConstructionPhase.fromDTO({
        ...phaseData,
        projectId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Save to repository
      const savedPhase = await this.repository.create(constructionPhase);
      
      return savedPhase;
    } catch (error) {
      console.error('ConstructionPhaseService.createConstructionPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create construction phase');
    }
  }

  /**
   * Update an existing construction phase
   */
  async updateConstructionPhase(id: string, phaseData: Partial<PhaseData>): Promise<ConstructionPhase> {
    try {
      // Get existing phase
      const existingPhase = await this.repository.findById(id);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Construction phase not found');
      }

      // Validate update data
      const validation = this.validatePhaseData(phaseData as PhaseData);
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
   * Get a construction phase by ID
   */
  async getConstructionPhase(id: string): Promise<ConstructionPhase | null> {
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
  async getProjectConstructionPhases(projectId: string): Promise<ConstructionPhase[]> {
    try {
      return await this.repository.findByProjectId(projectId);
    } catch (error) {
      console.error('ConstructionPhaseService.getProjectConstructionPhases failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project construction phases');
    }
  }

  /**
   * Delete a construction phase
   */
  async deleteConstructionPhase(id: string): Promise<void> {
    try {
      const existingPhase = await this.repository.findById(id);
      if (!existingPhase) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Construction phase not found');
      }

      await this.repository.delete(id);
    } catch (error) {
      console.error('ConstructionPhaseService.deleteConstructionPhase failed:', error);
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
   * Convert domain entity to DTO
   */
  toDTO(phase: ConstructionPhaseEntity): PhaseDTO {
    return {
      id: phase.id,
      project_id: phase.projectId,
      phase_name: phase.name,
      phase: phase.type,
      construction_phase: phase.type,
      construction_stage: phase.stage,
      description: phase.description || '',
      status: phase.status as PhaseDTO['status'],
      progress: phase.progress,
      estimated_cost: phase.budget || 0,
      actual_cost: phase.actualCost || 0,
      estimated_duration_days: phase.estimatedDuration,
      actual_duration_days: phase.actualDuration,
      materials: phase.materials.map(m => ({
        materialId: m.id,
        quantity: m.quantity || 1
      })),
      steps: phase.steps?.map(s => ({
        stepId: s.id,
        name: s.name,
        description: s.description,
        status: s.status,
        order_index: s.orderIndex
      })) || [],
      tasks: phase.humanResources.map(e => ({
        taskId: e.id,
        name: e.name,
        roleId: e.id,
        role: e.role || undefined
      }))
    };
  }
}
