import { supabase } from '@/integrations/supabase/client';
import { standardWorkflow, WorkflowPhase, WorkflowStage, WorkflowTask } from '@/types/workflow';

export interface PhaseStepTask {
  phase_id: string;
  phase_name: string;
  phase_code: string;
  step_id?: string;
  step_name?: string;
  step_code?: string;
  task_id?: string;
  task_name?: string;
  task_code?: string;
  task_description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  assigned_to?: string[];
  resources?: any;
  documents?: any[];
  inspections?: any[];
  payments?: any[];
}

export class WorkflowPhaseService {
  /**
   * Create phases from standard workflow template for a project
   */
  async createPhasesFromTemplate(projectId: string, selectedPhases?: string[]): Promise<void> {
    const phasesToCreate = selectedPhases 
      ? standardWorkflow.filter(p => selectedPhases.includes(p.code))
      : standardWorkflow;

    const phaseRecords = phasesToCreate.map(phase => ({
      project_id: projectId,
      phase_name: phase.label,
      phase_code: phase.code,
      description: `Phase: ${phase.label}`,
      status: 'planned',
      progress: 0,
      stages: phase.stages.map(stage => ({
        stage_code: stage.code,
        stage_name: stage.label,
        tasks: stage.tasks.map(task => ({
          task_code: task.code,
          task_name: task.label,
          task_description: task.description,
          assigned_to: task.assignedTo || [],
          dependencies: task.dependencies || [],
          inspections: task.inspections || [],
        }))
      }))
    }));

    const { error } = await supabase
      .from('project_phases')
      .insert(phaseRecords);

    if (error) throw error;
  }

  /**
   * Get all phases with their steps and tasks for a project
   */
  async getProjectPhaseHierarchy(projectId: string): Promise<PhaseStepTask[]> {
    const { data: phases, error } = await supabase
      .from('project_phases')
      .select(`
        id,
        phase_name,
        construction_phase,
        construction_stage,
        description,
        status,
        start_date,
        end_date,
        progress,
        milestones,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform to flat hierarchy
    const hierarchy: PhaseStepTask[] = [];
    
    phases?.forEach(phase => {
      // Use milestones JSON structure or default empty
      const milestones = (phase.milestones as any) || {};
      const stages = (milestones.stages as any[]) || [];
      
      if (stages.length === 0) {
        // Phase without stages
        hierarchy.push({
          phase_id: phase.id,
          phase_name: phase.phase_name,
          phase_code: phase.construction_phase || '',
          status: phase.status,
          start_date: phase.start_date || undefined,
          end_date: phase.end_date || undefined,
          progress: phase.progress || undefined,
        });
      } else {
        stages.forEach((stage: any) => {
          const tasks = stage.tasks || [];
          
          if (tasks.length === 0) {
            // Stage without tasks
            hierarchy.push({
              phase_id: phase.id,
              phase_name: phase.phase_name,
              phase_code: phase.construction_phase || '',
              step_id: stage.stage_code,
              step_name: stage.stage_name,
              step_code: stage.stage_code,
              status: stage.status || phase.status,
              start_date: phase.start_date || undefined,
              end_date: phase.end_date || undefined,
              progress: phase.progress || undefined,
            });
          } else {
            tasks.forEach((task: any) => {
              hierarchy.push({
                phase_id: phase.id,
                phase_name: phase.phase_name,
                phase_code: phase.construction_phase || '',
                step_id: stage.stage_code,
                step_name: stage.stage_name,
                step_code: stage.stage_code,
                task_id: task.task_code,
                task_name: task.task_name,
                task_code: task.task_code,
                task_description: task.task_description,
                status: task.status || stage.status || phase.status,
                assigned_to: task.assigned_to || [],
                resources: task.resources,
              });
            });
          }
        });
      }
    });

    return hierarchy;
  }

  /**
   * Update phase status and progress
   */
  async updatePhase(phaseId: string, updates: {
    status?: string;
    progress?: number;
    start_date?: string;
    end_date?: string;
    milestones?: any;
  }): Promise<void> {
    const { error } = await supabase
      .from('project_phases')
      .update(updates)
      .eq('id', phaseId);

    if (error) throw error;
  }

  /**
   * Update a specific task within a phase's stages
   */
  async updateTask(
    phaseId: string,
    stageCode: string,
    taskCode: string,
    updates: Partial<WorkflowTask>
  ): Promise<void> {
    // Get current phase data
    const { data: phase, error: fetchError } = await supabase
      .from('project_phases')
      .select('milestones')
      .eq('id', phaseId)
      .single();

    if (fetchError) throw fetchError;

    const milestones = (phase?.milestones as any) || {};
    const stages = (milestones.stages as any[]) || [];
    const stageIndex = stages.findIndex((s: any) => s.stage_code === stageCode);
    
    if (stageIndex === -1) throw new Error('Stage not found');

    const tasks = stages[stageIndex].tasks || [];
    const taskIndex = tasks.findIndex((t: any) => t.task_code === taskCode);
    
    if (taskIndex === -1) throw new Error('Task not found');

    // Update task
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    stages[stageIndex].tasks = tasks;
    milestones.stages = stages;

    // Save back to database
    const { error: updateError } = await supabase
      .from('project_phases')
      .update({ milestones })
      .eq('id', phaseId);

    if (updateError) throw updateError;
  }

  /**
   * Get documents for a specific context (phase/step/task)
   */
  async getContextDocuments(
    projectId: string,
    phaseId?: string,
    stepId?: string,
    taskId?: string
  ): Promise<any[]> {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId);

    if (phaseId) {
      query = query.eq('phase_id', phaseId);
    }

    if (stepId) {
      query = query.eq('step_id', stepId);
    }

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Calculate phase completion based on tasks
   */
  calculatePhaseProgress(phase: any): number {
    const milestones = (phase.milestones as any) || {};
    const stages = (milestones.stages as any[]) || [];
    if (stages.length === 0) return 0;

    let totalTasks = 0;
    let completedTasks = 0;

    stages.forEach((stage: any) => {
      const tasks = stage.tasks || [];
      totalTasks += tasks.length;
      completedTasks += tasks.filter((t: any) => t.status === 'completed').length;
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }
}

export default new WorkflowPhaseService();
