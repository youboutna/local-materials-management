import { supabase } from '@/integrations/supabase/client';
import { ConstructionPhase, ConstructionStage } from '@/dtos/entities/ProjectAggregateDTO';
import { ProjectPhaseEntity, PhaseStepData, PhaseTaskData } from '@/types/entities';
import { PhaseDTO, PhaseSummaryDTO, PhaseFormDTO, PhaseStepDTO, PhaseTaskDTO, PhaseStatus } from '@/types/phase-dto';
import { DEV_MODE } from '@/config/constants';

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

export interface DatabasePhase {
  id: string;
  project_id: string;
  phase_name: string;
  phase_type: string;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  progress: number | null;
  description?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  dependencies?: any;
  milestones?: any;
  estimated_duration?: number | null;
  notes?: string | null;
  construction_phase?: string | null;
  construction_stage?: string | null;
  custom_phase_data?: any;
  materials?: any;
  human_resources?: any;
  suppliers?: any;
  location?: string | null;
  order_index?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export class PhaseService {
  private static mapPhaseEntityToDTO(entity: ProjectPhaseEntity): PhaseDTO {
    const steps = entity.custom_phase_data?.steps ?? [];

    return {
      id: entity.id,
      project_id: entity.project_id,
      phase_name: entity.phase_name || '',
      construction_phase: entity.construction_phase,
      construction_stage: entity.construction_stage,
      description: entity.description,
      status: (entity.status as PhaseStatus) || 'pending',
      progress: entity.progress ?? 0,
      estimated_cost: entity.estimated_cost,
      actual_cost: entity.actual_cost,
      estimated_duration_days: entity.estimated_duration_days,
      actual_duration_days: entity.actual_duration_days,
      start_date: entity.start_date,
      end_date: entity.end_date,
      actual_start_date: entity.actual_start_date,
      actual_end_date: entity.actual_end_date,
      order_index: entity.order_index ?? 0,
      dependencies: entity.dependencies,
      steps: steps.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        status: (s.status as PhaseStatus) || 'pending',
        progress: s.progress ?? 0,
        estimated_duration_days: s.estimated_duration_days,
        actual_duration_days: s.actual_duration_days,
        start_date: s.start_date,
        end_date: s.end_date,
        order_index: s.order_index,
        tasks: (s.tasks ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          status: (t.status as PhaseStatus) || 'pending',
          progress: t.progress ?? 0,
          estimated_duration_days: t.estimated_duration_days,
          actual_duration_days: t.actual_duration_days,
          start_date: t.start_date,
          end_date: t.end_date,
          assigned_to: t.assigned_to,
          dependencies: t.dependencies,
          weight: t.weight,
          order_index: t.order_index,
        })),
      })),
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }

  private static mapPhaseEntityToSummaryDTO(entity: ProjectPhaseEntity): PhaseSummaryDTO {
    const steps = entity.custom_phase_data?.steps ?? [];
    const tasksCount = steps.reduce((sum, s) => sum + (s.tasks?.length ?? 0), 0);
    const completedTasks = steps.reduce(
      (sum, s) => sum + (s.tasks ?? []).filter((t) => (t.status || '').toLowerCase() === 'completed').length,
      0
    );

    return {
      id: entity.id,
      project_id: entity.project_id,
      phase_name: entity.phase_name || '',
      status: (entity.status as PhaseStatus) || 'pending',
      progress: entity.progress ?? 0,
      steps_count: steps.length,
      tasks_count: tasksCount,
      completed_tasks: completedTasks,
      start_date: entity.start_date,
      end_date: entity.end_date,
      order_index: entity.order_index ?? 0,
    };
  }

  private static mapPhaseFormToEntity(projectId: string, formData: PhaseFormDTO): Omit<ProjectPhaseEntity, 'id' | 'created_at' | 'updated_at'> {
    return {
      project_id: projectId,
      phase_name: formData.phase_name,
      description: formData.description,
      construction_phase: formData.construction_phase,
      construction_stage: formData.construction_stage,
      status: 'pending',
      progress: 0,
      estimated_cost: formData.estimated_cost,
      estimated_duration_days: formData.estimated_duration_days,
      start_date: formData.start_date,
      end_date: formData.end_date,
      order_index: formData.order_index ?? 0,
      dependencies: [],
      custom_phase_data: {
        steps: (formData.steps ?? []).map((s, stepIndex) => ({
          id: crypto.randomUUID(),
          name: s.name,
          description: s.description || '',
          status: 'pending',
          progress: 0,
          estimated_duration_days: s.estimated_duration_days || undefined,
          order_index: s.order_index ?? stepIndex,
          tasks: (s.tasks ?? []).map((t, taskIndex) => ({
            id: crypto.randomUUID(),
            name: t.name,
            description: t.description || '',
            status: 'pending',
            progress: 0,
            estimated_duration_days: t.estimated_duration_days || undefined,
            assigned_to: t.assigned_to || [],
            order_index: t.order_index ?? taskIndex,
          })),
        })),
      },
      actual_cost: undefined,
      actual_duration_days: undefined,
      actual_start_date: undefined,
      actual_end_date: undefined,
      created_by: undefined,
    };
  }

  private static mapPhaseDTOToEntity(dto: PhaseDTO): Partial<ProjectPhaseEntity> {
    return {
      phase_name: dto.phase_name,
      description: dto.description,
      construction_phase: dto.construction_phase,
      construction_stage: dto.construction_stage,
      status: dto.status,
      progress: dto.progress,
      estimated_cost: dto.estimated_cost,
      actual_cost: dto.actual_cost,
      estimated_duration_days: dto.estimated_duration_days,
      actual_duration_days: dto.actual_duration_days,
      start_date: dto.start_date,
      end_date: dto.end_date,
      order_index: dto.order_index,
      dependencies: dto.dependencies,
      custom_phase_data: {
        steps: dto.steps.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          status: s.status,
          progress: s.progress || 0,
          estimated_duration_days: s.estimated_duration_days || undefined,
          order_index: s.order_index,
          tasks: s.tasks.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description || '',
            status: t.status,
            progress: t.progress || 0,
            estimated_duration_days: t.estimated_duration_days || undefined,
            assigned_to: t.assigned_to || [],
            order_index: t.order_index,
          })),
        })),
      },
    };
  }

  /**
   * Convert UI PhaseData to Database format
   */
  static mapPhaseToDatabase(phase: PhaseData, projectId: string): Omit<DatabasePhase, 'id' | 'created_at' | 'updated_at'> {
    // Convert customStages from ConstructionPhaseManager format to steps format for PhaseDTO
    let customPhaseData: any = null;

    if (phase.customPhase) {
      const customStages = phase.customPhase.customStages || [];

      // Convert customStages to steps format expected by EntityToDTOMapper
      const steps = customStages.map((stage: any, stageIndex: number) => ({
        id: stage.id || crypto.randomUUID(),
        name: stage.name,
        description: stage.description || '',
        status: stage.status || 'pending',
        progress: stage.progress || 0,
        estimated_duration_days: stage.estimatedDurationDays || undefined,
        order_index: stage.order || stageIndex,
        tasks: (stage.tasks || []).map((task: any, taskIndex: number) => ({
          id: task.id || crypto.randomUUID(),
          name: task.name,
          description: task.description || '',
          status: task.status || 'pending',
          progress: task.progress || 0,
          estimated_duration_days: task.estimatedDurationDays || undefined,
          order_index: taskIndex,
          assigned_to: task.assignedTo || [],
          requires_inspection: task.requiresInspection || false,
          requires_engineer_approval: task.requiresEngineerApproval || false
        }))
      }));

      customPhaseData = {
        ...phase.customPhase,
        steps // Add the converted steps for PhaseDTO compatibility
      };
    }

    return {
      project_id: projectId,
      phase_name: phase.title,
      phase_type: phase.customPhase ? 'custom' : 'construction',
      start_date: phase.startDate || null,
      end_date: phase.endDate || null,
      status: phase.status,
      progress: Math.max(0, Math.min(100, phase.progress || 0)),
      description: phase.description || null,
      estimated_cost: phase.budget || null,
      actual_cost: phase.actualCost || 0,
      estimated_duration: phase.estimatedDuration || 30,
      notes: phase.notes || null,
      construction_phase: phase.phase || null,
      construction_stage: phase.stage || null,
      custom_phase_data: customPhaseData ? JSON.stringify(customPhaseData) : null,
      materials: JSON.stringify(phase.materials || []),
      human_resources: JSON.stringify(phase.humanResources || []),
      suppliers: JSON.stringify(phase.suppliers || []),
      location: phase.location || null,
      dependencies: JSON.stringify([]), // Legacy field for compatibility
      milestones: JSON.stringify({
        materials: phase.materials || [],
        humanResources: phase.humanResources || [],
        suppliers: phase.suppliers || [],
        location: phase.location || '',
        notes: phase.notes || '',
        stage: phase.stage || null,
        customPhase: phase.customPhase || null
      })
    };
  }

  /**
   * Get all phases as DTOs for a project
   */
  static async getPhasesDTOByProject(projectId: string): Promise<PhaseDTO[]> {

    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching phases:', error);
      throw error;
    }

    return (data || []).map((entity) => this.mapPhaseEntityToDTO(entity as unknown as ProjectPhaseEntity));
  }

  /**
   * Get phase summaries (without nested data)
   */
  static async getPhaseSummaries(projectId: string): Promise<PhaseSummaryDTO[]> {

    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching phase summaries:', error);
      throw error;
    }

    return (data || []).map((entity) => this.mapPhaseEntityToSummaryDTO(entity as unknown as ProjectPhaseEntity));
  }

  /**
   * Get a single phase as DTO
   */
  static async getPhaseDTOById(phaseId: string): Promise<PhaseDTO | null> {

    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('id', phaseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching phase:', error);
      throw error;
    }

    return this.mapPhaseEntityToDTO(data as unknown as ProjectPhaseEntity);
  }

  /**
   * Create a new phase from form DTO
   */
  static async createPhaseFromDTO(projectId: string, formData: PhaseFormDTO): Promise<PhaseDTO> {
    const entity = this.mapPhaseFormToEntity(projectId, formData);

    const { data, error } = await supabase
      .from('project_phases')
      .insert(entity as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating phase:', error);
      throw error;
    }

    return this.mapPhaseEntityToDTO(data as unknown as ProjectPhaseEntity);
  }

  /**
   * Create phases from referential
   */
  static async createPhasesFromReferential(
    projectId: string,
    referentialPhases: PhaseFormDTO[]
  ): Promise<PhaseDTO[]> {
    const entities = referentialPhases.map((phase, index) => ({
      ...this.mapPhaseFormToEntity(projectId, phase),
      order_index: phase.order_index ?? index
    }));

    const { data, error } = await supabase
      .from('project_phases')
      .insert(entities as any)
      .select();

    if (error) {
      console.error('Error creating phases from referential:', error);
      throw error;
    }

    return (data || []).map((entity) => this.mapPhaseEntityToDTO(entity as unknown as ProjectPhaseEntity));
  }

  /**
   * Calculate overall project progress from phases
   */
  static calculateProjectProgress(phases: PhaseDTO[]): number {
    if (phases.length === 0) return 0;
    const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
    return Math.round(totalProgress / phases.length);
  }

  /**
   * Convert legacy PhaseData to PhaseDTO
   */
  static legacyPhaseDataToDTO(phaseData: PhaseData, projectId: string): PhaseDTO {
    return {
      id: phaseData.id,
      project_id: projectId,
      phase_name: phaseData.title,
      construction_phase: phaseData.phase,
      construction_stage: phaseData.stage,
      description: phaseData.description,
      status: phaseData.status === 'not_started' ? 'pending' : phaseData.status as PhaseStatus,
      progress: phaseData.progress,
      estimated_cost: phaseData.budget,
      actual_cost: phaseData.actualCost,
      estimated_duration_days: phaseData.estimatedDuration,
      start_date: phaseData.startDate,
      end_date: phaseData.endDate,
      order_index: 0,
      steps: phaseData.customPhase?.customStages?.map((stage, idx) => ({
        id: stage.id,
        name: stage.name,
        description: '',
        status: 'pending' as PhaseStatus,
        progress: 0,
        order_index: stage.order,
        tasks: []
      })) || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}