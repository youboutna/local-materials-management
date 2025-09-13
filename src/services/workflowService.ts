// Unified workflow service for projects and tenders
import { supabase } from '@/integrations/supabase/client';
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

export class WorkflowService {
  // Get workflow status for entity (project or tender)
  static async getEntityWorkflowStatus(entityId: string, entityType: 'project' | 'tender'): Promise<WorkflowStatus[]> {
    const { data, error } = await supabase
      .from('workflow_status')
      .select('*')
      .eq('entity_id', entityId)
      .eq('entity_type', entityType)
      .order('phase_code', { ascending: true })
      .order('stage_code', { ascending: true });

    if (error) throw error;
    return (data || []) as WorkflowStatus[];
  }

  // Update workflow stage status
  static async updateStageStatus(
    entityId: string,
    entityType: 'project' | 'tender',
    phaseCode: string,
    stageCode: string,
    status: 'pending' | 'in_progress' | 'completed' | 'blocked',
    assignedTo?: string,
    notes?: string
  ): Promise<void> {
    const updateData: any = {
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

    const { error } = await supabase
      .from('workflow_status')
      .upsert({
        entity_id: entityId,
        entity_type: entityType,
        phase_code: phaseCode,
        stage_code: stageCode,
        ...updateData
      }, {
        onConflict: 'entity_id,entity_type,phase_code,stage_code,task_id'
      });

    if (error) throw error;
  }

  // Calculate progress for entity
  static async calculateEntityProgress(entityId: string, entityType: 'project' | 'tender'): Promise<PhaseProgress[]> {
    const workflowStatuses = await this.getEntityWorkflowStatus(entityId, entityType);
    const progress: PhaseProgress[] = [];

    for (const phase of standardWorkflow) {
      const phaseStatuses = workflowStatuses.filter(ws => ws.phase_code === phase.code);
      const stageProgressArray: StageProgress[] = [];

      for (const stage of phase.stages) {
        const stageStatus = phaseStatuses.find(ps => ps.stage_code === stage.code);
        const completedTasks = stage.tasks.length; // Simplified - in real app, track individual tasks
        
        const stageProgress: StageProgress = {
          stage_code: stage.code,
          stage_label: stage.label,
          status: stageStatus?.status || 'pending',
          total_tasks: stage.tasks.length,
          completed_tasks: stageStatus?.status === 'completed' ? stage.tasks.length : 0,
          progress_percentage: stageStatus?.status === 'completed' ? 100 : 
                              stageStatus?.status === 'in_progress' ? 50 : 0,
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
  }

  // Initialize workflow for new entity
  static async initializeWorkflow(entityId: string, entityType: 'project' | 'tender'): Promise<void> {
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
            status: 'pending'
          });
        }

        // Also create stage-level record
        workflowRecords.push({
          entity_id: entityId,
          entity_type: entityType,
          phase_code: phase.code,
          stage_code: stage.code,
          status: 'pending'
        });
      }
    }

    const { error } = await supabase
      .from('workflow_status')
      .insert(workflowRecords);

    if (error) throw error;
  }

  // Get current phase and stage for entity
  static async getCurrentPhaseStage(entityId: string, entityType: 'project' | 'tender'): Promise<{ currentPhase: string; currentStage: string } | null> {
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
  }

  // Get overdue stages
  static async getOverdueStages(entityId?: string, entityType?: 'project' | 'tender'): Promise<WorkflowStatus[]> {
    const query = supabase
      .from('workflow_status')
      .select('*')
      .not('due_date', 'is', null)
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed');

    if (entityId && entityType) {
      query.eq('entity_id', entityId).eq('entity_type', entityType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as WorkflowStatus[];
  }
}