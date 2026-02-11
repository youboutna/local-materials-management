/**
 * Workflow Service - Hexagonal Architecture
 * Business logic for workflow management with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IWorkflowRepository } from '@/domain/repositories/IWorkflowRepository';
import { standardWorkflow, WorkflowPhase, WorkflowStage, WorkflowTask } from '@/types/workflow';

export interface WorkflowStatus {
  id: string;
  entity_id: string;
  entity_type: 'project' | 'tender';
  phase_code: string;
  stage_code: string;
  task_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  started_at?: string;
  completed_at?: string;
  due_date?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PhaseProgress {
  phase_code: string;
  phase_label: string;
  total_stages: number;
  completed_stages: number;
  in_progress_stages: number;
  pending_stages: number;
  progress_percentage: number;
  stages: StageProgress[];
}

export interface StageProgress {
  stage_code: string;
  stage_label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
  tasks: WorkflowTask[];
}

/**
 * Service for managing workflow operations with hexagonal architecture
 */
export class WorkflowService {
  private workflowRepository: IWorkflowRepository;

  constructor() {
    this.workflowRepository = RepositoryFactory.getWorkflowRepository();
  }

  /**
   * Get workflow status for entity (project or tender)
   */
  async getEntityWorkflowStatus(entityId: string, entityType: 'project' | 'tender'): Promise<WorkflowStatus[]> {
    try {
      if (!entityId || !entityType) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Entity ID and type are required');
      }

      if (!['project', 'tender'].includes(entityType)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Entity type must be project or tender');
      }

      const workflowStatuses = await this.workflowRepository.getEntityWorkflowStatus(entityId, entityType);
      
      // Validate and transform data
      return workflowStatuses.map(status => this.validateAndTransformWorkflowStatus(status));
    } catch (error) {
      console.error('Error getting entity workflow status:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get entity workflow status',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update workflow stage status
   */
  async updateStageStatus(
    entityId: string,
    entityType: 'project' | 'tender',
    phaseCode: string,
    stageCode: string,
    status: 'pending' | 'in_progress' | 'completed' | 'blocked',
    assignedTo?: string,
    notes?: string
  ): Promise<void> {
    try {
      // Validate inputs
      this.validateWorkflowUpdateInputs(entityId, entityType, phaseCode, stageCode, status);

      // Validate status transition
      await this.validateStatusTransition(entityId, entityType, phaseCode, stageCode, status);

      // Prepare update data
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        notes: notes || null,
        assigned_to: assignedTo || null
      };

      // Add timestamps based on status
      if (status === 'in_progress' && assignedTo) {
        updateData.started_at = new Date().toISOString();
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      await this.workflowRepository.updateStageStatus(
        entityId,
        entityType,
        phaseCode,
        stageCode,
        updateData
      );
    } catch (error) {
      console.error('Error updating stage status:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update stage status',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Calculate progress for entity
   */
  async calculateEntityProgress(entityId: string, entityType: 'project' | 'tender'): Promise<PhaseProgress[]> {
    try {
      const workflowStatuses = await this.getEntityWorkflowStatus(entityId, entityType);
      const progress: PhaseProgress[] = [];

      for (const phase of standardWorkflow) {
        const phaseStatuses = workflowStatuses.filter(ws => ws.phase_code === phase.code);
        const stageProgressArray: StageProgress[] = [];

        for (const stage of phase.stages) {
          const stageStatus = phaseStatuses.find(ps => ps.stage_code === stage.code);
          const completedTasks = this.calculateCompletedTasks(stageStatus, stage.tasks);
          
          const stageProgress: StageProgress = {
            stage_code: stage.code,
            stage_label: stage.label,
            status: stageStatus?.status || 'pending',
            total_tasks: stage.tasks.length,
            completed_tasks: completedTasks,
            progress_percentage: this.calculateStageProgressPercentage(stageStatus?.status, completedTasks, stage.tasks.length),
            tasks: stage.tasks,
          };

          stageProgressArray.push(stageProgress);
        }

        const totalStages = phase.stages.length;
        const completedStages = stageProgressArray.filter(sp => sp.status === 'completed').length;
        const inProgressStages = stageProgressArray.filter(sp => sp.status === 'in_progress').length;
        const pendingStages = stageProgressArray.filter(sp => sp.status === 'pending').length;

        const phaseProgress: PhaseProgress = {
          phase_code: phase.code,
          phase_label: phase.label,
          total_stages: totalStages,
          completed_stages: completedStages,
          in_progress_stages: inProgressStages,
          pending_stages: pendingStages,
          progress_percentage: Math.round((completedStages / totalStages) * 100),
          stages: stageProgressArray,
        };

        progress.push(phaseProgress);
      }

      return progress;
    } catch (error) {
      console.error('Error calculating entity progress:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to calculate entity progress',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Initialize workflow for new entity
   */
  async initializeWorkflow(entityId: string, entityType: 'project' | 'tender'): Promise<void> {
    try {
      if (!entityId || !entityType) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Entity ID and type are required');
      }

      // Check if workflow already exists
      const existingStatus = await this.getEntityWorkflowStatus(entityId, entityType);
      if (existingStatus.length > 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Workflow already exists for this entity');
      }

      const workflowRecords = this.generateWorkflowRecords(entityId, entityType);
      
      await this.workflowRepository.initializeWorkflow(workflowRecords);
    } catch (error) {
      console.error('Error initializing workflow:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to initialize workflow',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get current phase and stage for entity
   */
  async getCurrentPhaseStage(entityId: string, entityType: 'project' | 'tender'): Promise<{ currentPhase: string; currentStage: string } | null> {
    try {
      const statuses = await this.getEntityWorkflowStatus(entityId, entityType);
      
      // Find the first non-completed stage
      for (const phase of standardWorkflow) {
        for (const stage of phase.stages) {
          const status = statuses.find(s => s.phase_code === phase.code && s.stage_code === stage.code);
          if (!status || status.status !== 'completed') {
            return {
              currentPhase: phase.code,
              currentStage: stage.code,
            };
          }
        }
      }

      // If all stages are completed, return the last stage
      const lastPhase = standardWorkflow[standardWorkflow.length - 1];
      const lastStage = lastPhase.stages[lastPhase.stages.length - 1];
      
      return {
        currentPhase: lastPhase.code,
        currentStage: lastStage.code,
      };
    } catch (error) {
      console.error('Error getting current phase stage:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get current phase stage',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get overdue stages
   */
  async getOverdueStages(entityId?: string, entityType?: 'project' | 'tender'): Promise<WorkflowStatus[]> {
    try {
      const overdueStages = await this.workflowRepository.getOverdueStages(entityId, entityType);
      
      // Validate and transform data
      return overdueStages.map(status => this.validateAndTransformWorkflowStatus(status));
    } catch (error) {
      console.error('Error getting overdue stages:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get overdue stages',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  /**
   * Validate and transform workflow status
   */
  private validateAndTransformWorkflowStatus(status: any): WorkflowStatus {
    return {
      id: status.id,
      entity_id: status.entity_id,
      entity_type: status.entity_type,
      phase_code: status.phase_code,
      stage_code: status.stage_code,
      task_id: status.task_id || undefined,
      status: status.status,
      started_at: status.started_at || undefined,
      completed_at: status.completed_at || undefined,
      due_date: status.due_date || undefined,
      assigned_to: status.assigned_to || undefined,
      notes: status.notes || undefined,
      created_at: status.created_at,
      updated_at: status.updated_at
    };
  }

  /**
   * Validate workflow update inputs
   */
  private validateWorkflowUpdateInputs(
    entityId: string,
    entityType: string,
    phaseCode: string,
    stageCode: string,
    status: string
  ): void {
    if (!entityId || !entityType || !phaseCode || !stageCode || !status) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'All workflow fields are required');
    }

    if (!['project', 'tender'].includes(entityType)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Entity type must be project or tender');
    }

    if (!['pending', 'in_progress', 'completed', 'blocked'].includes(status)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid status value');
    }
  }

  /**
   * Validate status transition
   */
  private async validateStatusTransition(
    entityId: string,
    entityType: string,
    phaseCode: string,
    stageCode: string,
    newStatus: string
  ): Promise<void> {
    const currentStatus = await this.workflowRepository.getStageStatus(entityId, entityType, phaseCode, stageCode);
    
    if (currentStatus) {
      const validTransitions: Record<string, string[]> = {
        'pending': ['in_progress', 'blocked'],
        'in_progress': ['completed', 'blocked'],
        'completed': ['pending'], // Can reopen
        'blocked': ['pending', 'in_progress']
      };

      if (!validTransitions[currentStatus.status]?.includes(newStatus)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Invalid status transition from ${currentStatus.status} to ${newStatus}`
        );
      }
    }
  }

  /**
   * Calculate completed tasks for a stage
   */
  private calculateCompletedTasks(stageStatus: any, tasks: WorkflowTask[]): number {
    if (!stageStatus || stageStatus.status === 'completed') {
      return tasks.length;
    }
    if (stageStatus.status === 'in_progress') {
      return Math.floor(tasks.length * 0.5); // Simplified calculation
    }
    return 0;
  }

  /**
   * Calculate stage progress percentage
   */
  private calculateStageProgressPercentage(status: string | undefined, completedTasks: number, totalTasks: number): number {
    if (status === 'completed') return 100;
    if (status === 'in_progress') return 50;
    if (status === 'blocked') return 25;
    return 0;
  }

  /**
   * Generate workflow records for initialization
   */
  private generateWorkflowRecords(entityId: string, entityType: string): any[] {
    const workflowRecords: any[] = [];

    for (const phase of standardWorkflow) {
      for (const stage of phase.stages) {
        for (const task of stage.tasks) {
          workflowRecords.push({
            entity_id: entityId,
            entity_type: entityType,
            phase_code: phase.code,
            stage_code: stage.code,
            task_id: task.id,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        // Also create stage-level record
        workflowRecords.push({
          entity_id: entityId,
          entity_type: entityType,
          phase_code: phase.code,
          stage_code: stage.code,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    return workflowRecords;
  }
}

// Factory function for service instance
let workflowServiceInstance: WorkflowService | null = null;

export function getWorkflowService(): WorkflowService {
  if (!workflowServiceInstance) {
    workflowServiceInstance = new WorkflowService();
  }
  return workflowServiceInstance;
}
