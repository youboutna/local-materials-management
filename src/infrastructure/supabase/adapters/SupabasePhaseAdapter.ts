// @ts-nocheck
/**
 * Supabase Phase Adapter
 * Implements IPhaseRepository using Supabase
 * Handles both regular phases and construction phases with semantic logic
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { Phase, PhaseStep, PhaseTask, PhaseStatus } from '@/domain/entities';
import { IPhaseRepository } from '@/domain/repositories';
import { PhaseTransformer } from '@/dtos/transforms/PhaseTransformer';
import { PhaseDTO, CreatePhaseDTO, UpdatePhaseDTO } from '@/dtos/entities/PhaseDTO';

// Define PhaseMetrics interface locally since it's not in domain entities
interface PhaseMetrics {
  materialCost: number;
  totalMaterials: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  totalInspections: number;
  passedInspections: number;
  inspectionPassRate: number;
  totalEmployees: number;
  totalPayments: number;
  totalPaymentAmount: number;
  totalDocuments: number;
  milestoneProgress: number;
  stepsCount: number;
  completedSteps: number;
}

interface PhaseOperationParams {
  id: string;
  name?: string;
  projectId: string;
  status: PhaseStatus;
}

interface PhaseDB {
  id: string;
  project_id: string;
  phase_name: string | null;
  description: string | null;
  status: string | null;
  progress: number | null;
  order_index: number | null;
  start_date: string | null;
  end_date: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  construction_phase: string | null;
  construction_stage: string | null;
  custom_phase_data: Record<string, unknown> | null;
}

export class SupabasePhaseAdapter implements IPhaseRepository {
  // ============= CRUD Operations =============

  async findById(id: string): Promise<Phase | null> {
    const { data, error } = await supabase
      .from<PhaseDB>('project_phases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return PhaseTransformer.fromDTO(data);
  }

  async getPhasesByProjectId(projectId: string): Promise<Phase[]> {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw new Error(error.message);
    return data.map(d => PhaseTransformer.fromDB(d));
  }

  async findByProjectId(projectId: string): Promise<Phase[]> {
    return this.getPhasesByProjectId(projectId);
  }

  /**
   * Certaines bases historiques portent un CHECK restrictif sur `phase_type`
   * (ex: IN ('standard','custom')). On tente la valeur métier normalisée puis
   * on dégrade proprement au lieu de faire échouer tout l'import.
   */
  private async withPhaseTypeFallback<T>(
    row: Record<string, unknown>,
    run: (payload: Record<string, unknown>) => Promise<{ data: T; error: any }>,
  ): Promise<T> {
    const original = row.phase_type;
    const candidates: Array<Record<string, unknown>> = [row];
    if (original !== undefined) {
      if (original !== 'standard') candidates.push({ ...row, phase_type: 'standard' });
      if (original !== 'custom') candidates.push({ ...row, phase_type: 'custom' });
      const withoutType = { ...row };
      delete withoutType.phase_type;
      candidates.push(withoutType);
    }

    let lastError: any = null;
    for (const payload of candidates) {
      const { data, error } = await run(payload);
      if (!error) return data;
      lastError = error;
      const isPhaseTypeCheck =
        error.code === '23514' || /phase_type/i.test(error.message ?? '');
      if (!isPhaseTypeCheck) break;
    }
    throw lastError;
  }

  async create(phase: Partial<Phase>): Promise<Phase> {
    const entityData = await this.mapToEntity(phase);

    const data = await this.withPhaseTypeFallback(entityData as Record<string, unknown>, (payload) =>
      supabase.from('project_phases').insert(payload).select().single(),
    );

    return PhaseTransformer.fromDTO(data);
  }

  async update(id: string, updates: Partial<Phase>): Promise<Phase> {
    const entityData = await this.mapToEntity(updates);

    const data = await this.withPhaseTypeFallback(entityData as Record<string, unknown>, (payload) =>
      supabase.from('project_phases').update(payload).eq('id', id).select().single(),
    );

    return PhaseTransformer.fromDTO(data);
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

  async updateTaskStatus(phaseId: string, stepId: string, taskId: string, status: TaskStatus, progress: number): Promise<Phase> {
    await this.updateTask(phaseId, stepId, taskId, {
      status,
      progress 
    });
    const phase = await this.findById(phaseId);
    if (!phase) throw new Error(`Phase ${phaseId} not found after update`);
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

  private async mapToEntity(phase: Partial<Phase>): Promise<Partial<PhaseDB>> {
    // Delegate to centralized transformer for guaranteed round-trip parity
    return PhaseTransformer.toDB(phase as any) as Partial<PhaseDB>;
  }

  async updatePhase(params: PhaseOperationParams): Promise<Phase> {
    const entityData = await this.mapToEntity(params);

    const { data, error } = await supabase
      .from('project_phases')
      .update(entityData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return PhaseTransformer.fromDTO(data);
  }

  async getAllPhases(): Promise<Phase[]> {
    const { data, error } = await supabase
      .from<PhaseDB>('project_phases')
      .select();
      
    if (error) throw error;
    return data.map(d => PhaseTransformer.fromDTO(d));
  }
}
