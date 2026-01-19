/**
 * Phase Service - Hexagonal Architecture
 * Business logic for phase management using repositories and transformers
 */

import { RepositoryFactory } from './RepositoryFactory';
import { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import { Phase } from '@/domain/entities/Phase';
import { PhaseDTO, CreatePhaseRequestDto, UpdatePhaseRequestDto } from '@/dtos/transforms/shared';
import { PhaseDomainTransformer } from '@/dtos/transforms/PhaseDomainTransformer';
import { ConstructionPhase, ConstructionStage } from '@/types/project';

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
  private phaseRepository: IPhaseRepository;
  private phaseTransformer: PhaseDomainTransformer;

  constructor() {
    this.phaseRepository = RepositoryFactory.getPhaseRepository();
    this.phaseTransformer = new PhaseDomainTransformer();
  }

  /**
   * Create a new phase
   */
  async createPhase(data: CreatePhaseRequestDto): Promise<PhaseDTO> {
    const entity = this.phaseTransformer.fromCreateDtoToEntity(data) as Partial<Phase>;
    const createdEntity = await this.phaseRepository.create(entity);
    return this.phaseTransformer.toDTO(createdEntity);
  }

  /**
   * Get phase by ID
   */
  async getPhaseById(id: string): Promise<PhaseDTO | null> {
    const entity = await this.phaseRepository.findById(id);
    return entity ? this.phaseTransformer.toDTO(entity) : null;
  }

  /**
   * Get all phases for a project
   */
  async getPhasesByProject(projectId: string): Promise<PhaseDTO[]> {
    const entities = await this.phaseRepository.findByProjectId(projectId);
    return entities.map(entity => this.phaseTransformer.toDTO(entity));
  }

  /**
   * Update a phase
   */
  async updatePhase(id: string, data: UpdatePhaseRequestDto): Promise<PhaseDTO> {
    const updates = this.phaseTransformer.fromUpdateDtoToEntity(data);
    const updatedEntity = await this.phaseRepository.update(id, updates);
    return this.phaseTransformer.toDTO(updatedEntity);
  }

  /**
   * Delete a phase
   */
  async deletePhase(id: string): Promise<void> {
    await this.phaseRepository.delete(id);
  }

  // ============= Legacy Methods for Backward Compatibility =============

  /**
   * Save phases to database (Legacy method)
   */
  static async saveProjectPhases(projectId: string, phases: PhaseData[]): Promise<void> {
    console.log('=== PHASE SERVICE SAVE START ===');
    console.log('ProjectId:', projectId);
    console.log('Phases count:', phases.length);
    
    try {
      // Skip saving if no phases provided
      if (!phases || phases.length === 0) {
        console.log('No phases to save - returning early');
        return;
      }

      // Import the legacy service for backward compatibility
      const { PhaseService: LegacyPhaseService } = await import('@/services/phaseService');
      await LegacyPhaseService.saveProjectPhases(projectId, phases);
      
      console.log('Successfully saved phases using legacy service');
    } catch (error) {
      console.error('Error saving project phases:', error);
      throw error;
    }
  }

  /**
   * Load phases from database (Legacy method)
   */
  static async loadProjectPhases(projectId: string): Promise<PhaseData[]> {
    console.log('=== LOADING PHASES FROM DATABASE ===');
    console.log('Project ID:', projectId);
    
    try {
      // Import the legacy service for backward compatibility
      const { PhaseService: LegacyPhaseService } = await import('@/services/phaseService');
      const phases = await LegacyPhaseService.loadProjectPhases(projectId);
      console.log('Successfully loaded phases using legacy service');
      return phases;
    } catch (error) {
      console.error('Error loading project phases:', error);
      throw error;
    }
  }

  /**
   * Update a single phase (Legacy method)
   */
  static async updatePhase(phase: PhaseData, projectId: string): Promise<void> {
    try {
      // Import the legacy service for backward compatibility
      const { PhaseService: LegacyPhaseService } = await import('@/services/phaseService');
      await LegacyPhaseService.updatePhase(phase, projectId);
    } catch (error) {
      console.error('Error updating phase:', error);
      throw error;
    }
  }

  /**
   * Delete a single phase (Legacy method)
   */
  static async deletePhase(phaseId: string): Promise<void> {
    try {
      // Import the legacy service for backward compatibility
      const { PhaseService: LegacyPhaseService } = await import('@/services/phaseService');
      await LegacyPhaseService.deletePhase(phaseId);
    } catch (error) {
      console.error('Error deleting phase:', error);
      throw error;
    }
  }

  /**
   * Get phase with all steps and tasks
   */
  async getPhaseWithSteps(id: string): Promise<PhaseDTO | null> {
    const entity = await this.phaseRepository.findWithSteps(id);
    return entity ? this.phaseTransformer.toDTO(entity) : null;
  }

  /**
   * Update phase progress
   */
  async updatePhaseProgress(id: string, progress: number): Promise<void> {
    await this.phaseRepository.updateProgress(id, progress);
  }

  /**
   * Recalculate phase progress from steps/tasks
   */
  async recalculatePhaseProgress(id: string): Promise<number> {
    return await this.phaseRepository.recalculateProgress(id);
  }

  /**
   * Add step to phase
   */
  async addStepToPhase(phaseId: string, step: Omit<any, 'id'>): Promise<any> {
    return await this.phaseRepository.addStep(phaseId, step);
  }

  /**
   * Update step in phase
   */
  async updateStepInPhase(phaseId: string, stepId: string, updates: Partial<any>): Promise<any> {
    return await this.phaseRepository.updateStep(phaseId, stepId, updates);
  }

  /**
   * Delete step from phase
   */
  async deleteStepFromPhase(phaseId: string, stepId: string): Promise<void> {
    await this.phaseRepository.deleteStep(phaseId, stepId);
  }

  /**
   * Add task to step
   */
  async addTaskToStep(phaseId: string, stepId: string, task: Omit<any, 'id'>): Promise<any> {
    return await this.phaseRepository.addTask(phaseId, stepId, task);
  }

  /**
   * Update task in step
   */
  async updateTaskInStep(phaseId: string, stepId: string, taskId: string, updates: Partial<any>): Promise<any> {
    return await this.phaseRepository.updateTask(phaseId, stepId, taskId, updates);
  }

  /**
   * Delete task from step
   */
  async deleteTaskFromStep(phaseId: string, stepId: string, taskId: string): Promise<void> {
    await this.phaseRepository.deleteTask(phaseId, stepId, taskId);
  }

  /**
   * Update task status
   */
  async updateTaskStatus(phaseId: string, stepId: string, taskId: string, status: string, progress: number): Promise<PhaseDTO> {
    const updatedPhase = await this.phaseRepository.updateTaskStatus(phaseId, stepId, taskId, status, progress);
    return this.phaseTransformer.toDTO(updatedPhase);
  }

  /**
   * Get phase metrics
   */
  async getPhaseMetrics(id: string): Promise<any> {
    return await this.phaseRepository.getMetrics(id);
  }

  /**
   * Validate phase data
   */
  validatePhaseData(data: CreatePhaseRequestDto | UpdatePhaseRequestDto): { isValid: boolean; errors: string[] } {
    const dto = data as CreatePhaseRequestDto; // Simplified validation
    return PhaseDomainTransformer.validate(dto as PhaseDTO);
  }
}
