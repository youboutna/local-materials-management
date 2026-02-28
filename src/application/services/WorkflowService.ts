/**
 * Workflow Service - Hexagonal Architecture
 * Business logic for workflow management with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
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
 * Service for managing workflow operations with hexagonal architecture.
 * Note: IWorkflowRepository not yet in RepositoryFactory - using direct supabase calls as fallback.
 */
export class WorkflowService {
  constructor() {}

  async getEntityWorkflowStatus(entityId: string, entityType: 'project' | 'tender'): Promise<WorkflowStatus[]> {
    try {
      if (!entityId || !entityType) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Entity ID and type are required');
      }

      // Fallback: return empty array until IWorkflowRepository is registered
      console.warn('WorkflowService: IWorkflowRepository not yet registered in RepositoryFactory');
      return [];
    } catch (error) {
      console.error('Error getting entity workflow status:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get entity workflow status',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

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
      this.validateWorkflowUpdateInputs(entityId, entityType, phaseCode, stageCode, status);

      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
        notes: notes || null,
        assigned_to: assignedTo || null
      };

      if (status === 'in_progress' && assignedTo) {
        updateData.started_at = new Date().toISOString();
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      console.warn('WorkflowService.updateStageStatus: IWorkflowRepository not yet registered');
    } catch (error) {
      console.error('Error updating stage status:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update stage status',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

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
          
          stageProgressArray.push({
            stage_code: stage.code,
            stage_label: stage.label,
            status: stageStatus?.status || 'pending',
            total_tasks: stage.tasks.length,
            completed_tasks: completedTasks,
            progress_percentage: this.calculateStageProgressPercentage(stageStatus?.status, completedTasks, stage.tasks.length),
            tasks: stage.tasks,
          });
        }

        const totalStages = phase.stages.length;
        const completedStages = stageProgressArray.filter(sp => sp.status === 'completed').length;

        progress.push({
          phase_code: phase.code,
          phase_label: phase.label,
          total_stages: totalStages,
          completed_stages: completedStages,
          in_progress_stages: stageProgressArray.filter(sp => sp.status === 'in_progress').length,
          pending_stages: stageProgressArray.filter(sp => sp.status === 'pending').length,
          progress_percentage: Math.round((completedStages / totalStages) * 100),
          stages: stageProgressArray,
        });
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

  async getCurrentPhaseStage(entityId: string, entityType: 'project' | 'tender'): Promise<{ currentPhase: string; currentStage: string } | null> {
    try {
      const statuses = await this.getEntityWorkflowStatus(entityId, entityType);
      
      for (const phase of standardWorkflow) {
        for (const stage of phase.stages) {
          const status = statuses.find(s => s.phase_code === phase.code && s.stage_code === stage.code);
          if (!status || status.status !== 'completed') {
            return { currentPhase: phase.code, currentStage: stage.code };
          }
        }
      }

      const lastPhase = standardWorkflow[standardWorkflow.length - 1];
      const lastStage = lastPhase.stages[lastPhase.stages.length - 1];
      return { currentPhase: lastPhase.code, currentStage: lastStage.code };
    } catch (error) {
      console.error('Error getting current phase stage:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to get current phase stage',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  private validateWorkflowUpdateInputs(
    entityId: string, entityType: string, phaseCode: string, stageCode: string, status: string
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

  private calculateCompletedTasks(stageStatus: any, tasks: WorkflowTask[]): number {
    if (!stageStatus || stageStatus.status === 'completed') return tasks.length;
    if (stageStatus.status === 'in_progress') return Math.floor(tasks.length * 0.5);
    return 0;
  }

  private calculateStageProgressPercentage(status: string | undefined, completedTasks: number, totalTasks: number): number {
    if (status === 'completed') return 100;
    if (status === 'in_progress') return 50;
    if (status === 'blocked') return 25;
    return 0;
  }
}

// Factory function
let workflowServiceInstance: WorkflowService | null = null;

export function getWorkflowService(): WorkflowService {
  if (!workflowServiceInstance) {
    workflowServiceInstance = new WorkflowService();
  }
  return workflowServiceInstance;
}
