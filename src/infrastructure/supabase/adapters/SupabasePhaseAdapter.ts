/**
 * Supabase Phase Adapter
 * Implements IPhaseRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { Phase, PhaseStep, PhaseTask } from '@/domain/entities';
import { IPhaseRepository, PhaseMetrics } from '@/domain/repositories';

const defaultMetrics: PhaseMetrics = {
  materialCost: 0,
  totalMaterials: 0,
  totalTasks: 0,
  completedTasks: 0,
  taskCompletionRate: 0,
  totalInspections: 0,
  passedInspections: 0,
  inspectionPassRate: 0,
  totalEmployees: 0,
  totalPayments: 0,
  totalPaymentAmount: 0,
  totalDocuments: 0,
  milestoneProgress: 0,
  stepsCount: 0,
  completedSteps: 0,
};

export class SupabasePhaseAdapter implements IPhaseRepository {
  // ============= CRUD Operations =============

  async findById(id: string): Promise<Phase | null> {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapToPhase(data);
  }

  async findByProjectId(projectId: string): Promise<Phase[]> {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToPhase);
  }

  async create(phase: Partial<Phase>): Promise<Phase> {
    const entityData = this.mapToEntity(phase);

    const { data, error } = await supabase
      .from('project_phases')
      .insert(entityData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToPhase(data);
  }

  async update(id: string, updates: Partial<Phase>): Promise<Phase> {
    const entityData = this.mapToEntity(updates);

    const { data, error } = await supabase
      .from('project_phases')
      .update(entityData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapToPhase(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_phases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============= Specialized Queries =============

  async findForBreadcrumb(id: string): Promise<{ id: string; name: string } | null> {
    const { data, error } = await supabase
      .from('project_phases')
      .select('id, phase_name')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return { id: data.id, name: data.phase_name };
  }

  async findWithSteps(id: string): Promise<Phase | null> {
    // Phase with steps is same as findById since steps are in custom_phase_data
    return this.findById(id);
  }

  async getMetrics(id: string): Promise<PhaseMetrics> {
    try {
      const [
        materialData,
        tasksData,
        inspectionsData,
        employeeData,
        paymentsData,
        documentsData,
        phaseData,
      ] = await Promise.all([
        supabase.from('project_materials').select('quantity, material_id').eq('phase_id', id),
        supabase.from('task_assignments').select('status').eq('phase_id', id),
        supabase.from('inspections').select('status').eq('phase_id', id),
        supabase.from('phase_employees').select('*').eq('phase_id', id),
        supabase.from('payments').select('amount').eq('phase_id', id),
        supabase.from('documents').select('id, document_type').eq('phase_id', id),
        supabase.from('project_phases').select('*').eq('id', id).single(),
      ]);

      // Calculate material cost
      let materialCost = 0;
      const materialIds = materialData.data?.map((m) => m.material_id).filter(Boolean) || [];

      if (materialIds.length > 0) {
        const { data: materials } = await supabase
          .from('materials')
          .select('id, price_per_unit')
          .in('id', materialIds);

        materialCost = materialData.data?.reduce((sum, pm) => {
          const material = materials?.find((m) => m.id === pm.material_id);
          return sum + (pm.quantity || 0) * (material?.price_per_unit || 0);
        }, 0) || 0;
      }

      const totalTasks = tasksData.data?.length || 0;
      const completedTasks = tasksData.data?.filter((t) => t.status === 'completed').length || 0;
      const totalInspections = inspectionsData.data?.length || 0;
      const passedInspections = inspectionsData.data?.filter(
        (i) => i.status === 'approved' || i.status === 'passed'
      ).length || 0;
      const totalPayments = paymentsData.data?.length || 0;
      const totalPaymentAmount = paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Parse steps from custom_phase_data
      const phase = phaseData.data;
      let stepsCount = 0;
      let completedSteps = 0;

      if (phase?.custom_phase_data) {
        const customData = typeof phase.custom_phase_data === 'string'
          ? JSON.parse(phase.custom_phase_data)
          : phase.custom_phase_data;
        
        const steps = customData?.steps || customData?.customStages || [];
        stepsCount = steps.length;
        completedSteps = steps.filter((s: any) => s.status === 'completed').length;
      }

      const milestoneProgress = stepsCount > 0 ? (completedSteps / stepsCount) * 100 : 0;

      return {
        materialCost,
        totalMaterials: materialData.data?.length || 0,
        totalTasks,
        completedTasks,
        taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        totalInspections,
        passedInspections,
        inspectionPassRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
        totalEmployees: employeeData.data?.length || 0,
        totalPayments,
        totalPaymentAmount,
        totalDocuments: documentsData.data?.length || 0,
        milestoneProgress,
        stepsCount,
        completedSteps,
      };
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return defaultMetrics;
    }
  }

  // ============= Step Operations =============

  async addStep(phaseId: string, step: Omit<PhaseStep, 'id'>): Promise<PhaseStep> {
    const phase = await this.findById(phaseId);
    if (!phase) throw new Error('Phase not found');

    const newStep: PhaseStep = {
      ...step,
      id: crypto.randomUUID(),
    };

    const updatedSteps = [...phase.steps, newStep];
    await this.updateSteps(phaseId, updatedSteps);

    return newStep;
  }

  async updateStep(phaseId: string, stepId: string, updates: Partial<PhaseStep>): Promise<PhaseStep> {
    const phase = await this.findById(phaseId);
    if (!phase) throw new Error('Phase not found');

    const updatedSteps = phase.steps.map(step =>
      step.id === stepId ? { ...step, ...updates } : step
    );

    await this.updateSteps(phaseId, updatedSteps);

    const updatedStep = updatedSteps.find(s => s.id === stepId);
    if (!updatedStep) throw new Error('Step not found');

    return updatedStep;
  }

  async deleteStep(phaseId: string, stepId: string): Promise<void> {
    const phase = await this.findById(phaseId);
    if (!phase) throw new Error('Phase not found');

    const updatedSteps = phase.steps.filter(step => step.id !== stepId);
    await this.updateSteps(phaseId, updatedSteps);
  }

  // ============= Task Operations =============

  async addTask(phaseId: string, stepId: string, task: Omit<PhaseTask, 'id'>): Promise<PhaseTask> {
    const phase = await this.findById(phaseId);
    if (!phase) throw new Error('Phase not found');

    const newTask: PhaseTask = {
      ...task,
      id: crypto.randomUUID(),
    };

    const updatedSteps = phase.steps.map(step =>
      step.id === stepId
        ? { ...step, tasks: [...step.tasks, newTask] }
        : step
    );

    await this.updateSteps(phaseId, updatedSteps);

    return newTask;
  }

  async updateTask(phaseId: string, stepId: string, taskId: string, updates: Partial<PhaseTask>): Promise<PhaseTask> {
    const phase = await this.findById(phaseId);
    if (!phase) throw new Error('Phase not found');

    let updatedTask: PhaseTask | undefined;

    const updatedSteps = phase.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          tasks: step.tasks.map(task => {
            if (task.id === taskId) {
              updatedTask = { ...task, ...updates };
              return updatedTask;
            }
            return task;
          }),
        };
      }
      return step;
    });

    await this.updateSteps(phaseId, updatedSteps);

    if (!updatedTask) throw new Error('Task not found');
    return updatedTask;
  }

  async deleteTask(phaseId: string, stepId: string, taskId: string): Promise<void> {
    const phase = await this.findById(phaseId);
    if (!phase) throw new Error('Phase not found');

    const updatedSteps = phase.steps.map(step =>
      step.id === stepId
        ? { ...step, tasks: step.tasks.filter(task => task.id !== taskId) }
        : step
    );

    await this.updateSteps(phaseId, updatedSteps);
  }

  async updateTaskStatus(phaseId: string, stepId: string, taskId: string, status: string, progress: number): Promise<Phase> {
    await this.updateTask(phaseId, stepId, taskId, { 
      status: status as any, 
      progress 
    });

    const phase = await this.findById(phaseId);
    if (!phase) throw new Error('Phase not found');
    
    return phase;
  }

  // ============= Progress Management =============

  async updateProgress(id: string, progress: number): Promise<void> {
    const { error } = await supabase
      .from('project_phases')
      .update({ progress: Math.round(progress) })
      .eq('id', id);

    if (error) throw error;
  }

  async recalculateProgress(id: string): Promise<number> {
    const phase = await this.findById(id);
    if (!phase || phase.steps.length === 0) return 0;

    const completedSteps = phase.steps.filter(s => s.status === 'completed').length;
    const progress = (completedSteps / phase.steps.length) * 100;

    await this.updateProgress(id, progress);
    return progress;
  }

  // ============= Private Helpers =============

  private async updateSteps(phaseId: string, steps: PhaseStep[]): Promise<void> {
    // Convert steps to custom_phase_data format
    const customPhaseData = JSON.stringify({ steps });

    const { error } = await supabase
      .from('project_phases')
      .update({ custom_phase_data: customPhaseData })
      .eq('id', phaseId);

    if (error) throw error;
  }

  private mapToPhase(data: any): Phase {
    // Parse steps from custom_phase_data
    let steps: PhaseStep[] = [];
    
    if (data.custom_phase_data) {
      const customData = typeof data.custom_phase_data === 'string'
        ? JSON.parse(data.custom_phase_data)
        : data.custom_phase_data;
      
      const rawSteps = customData?.steps || customData?.customStages || [];
      steps = rawSteps.map((s: any, index: number) => ({
        id: s.id || crypto.randomUUID(),
        name: s.name,
        description: s.description || '',
        status: s.status || 'pending',
        progress: s.progress || 0,
        orderIndex: s.order_index ?? s.order ?? index,
        tasks: (s.tasks || []).map((t: any, tIndex: number) => ({
          id: t.id || crypto.randomUUID(),
          name: t.name,
          description: t.description || '',
          status: t.status || 'pending',
          progress: t.progress || 0,
          orderIndex: t.order_index ?? tIndex,
          assignedTo: t.assigned_to || t.assignedTo || [],
          requiresInspection: t.requires_inspection || t.requiresInspection || false,
          requiresEngineerApproval: t.requires_engineer_approval || t.requiresEngineerApproval || false,
        })),
        estimatedDurationDays: s.estimated_duration_days,
        requiresInspection: s.requires_inspection || false,
        requiresEngineerApproval: s.requires_engineer_approval || false,
      }));
    }

    return Phase.create({
      id: data.id,
      projectId: data.project_id,
      name: data.phase_name,
      description: data.description || '',
      status: data.status || 'pending',
      progress: data.progress || 0,
      orderIndex: data.order_index || 0,
      startDate: data.start_date ? new Date(data.start_date) : null,
      endDate: data.end_date ? new Date(data.end_date) : null,
      estimatedCost: data.estimated_cost || 0,
      actualCost: data.actual_cost || 0,
      constructionPhase: data.construction_phase,
      constructionStage: data.construction_stage,
      steps,
    });
  }

  private mapToEntity(phase: Partial<Phase>): any {
    const entity: any = {};

    if (phase.projectId !== undefined) entity.project_id = phase.projectId;
    if (phase.name !== undefined) entity.phase_name = phase.name;
    if (phase.description !== undefined) entity.description = phase.description;
    if (phase.status !== undefined) entity.status = phase.status;
    if (phase.progress !== undefined) entity.progress = phase.progress;
    if (phase.orderIndex !== undefined) entity.order_index = phase.orderIndex;
    if (phase.startDate !== undefined) {
      entity.start_date = phase.startDate instanceof Date
        ? phase.startDate.toISOString().split('T')[0]
        : phase.startDate;
    }
    if (phase.endDate !== undefined) {
      entity.end_date = phase.endDate instanceof Date
        ? phase.endDate.toISOString().split('T')[0]
        : phase.endDate;
    }
    if (phase.estimatedCost !== undefined) entity.estimated_cost = phase.estimatedCost;
    if (phase.actualCost !== undefined) entity.actual_cost = phase.actualCost;
    if (phase.constructionPhase !== undefined) entity.construction_phase = phase.constructionPhase;
    if (phase.constructionStage !== undefined) entity.construction_stage = phase.constructionStage;
    if (phase.steps !== undefined) {
      entity.custom_phase_data = JSON.stringify({ steps: phase.steps });
    }

    return entity;
  }
}
