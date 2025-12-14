import { supabase } from '@/integrations/supabase/client';
import { ConstructionPhase, ConstructionStage } from '@/types/project';
import { ProjectPhaseEntity, PhaseStepData, PhaseTaskData } from '@/types/entities';
import { PhaseDTO, PhaseSummaryDTO, PhaseFormDTO, PhaseStepDTO, PhaseTaskDTO, PhaseStatus } from '@/types/phase-dto';
import { EntityToDTOMapper } from './EntityToDTOMapper';
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
  /**
   * Convert UI PhaseData to Database format
   */
  static mapPhaseToDatabase(phase: PhaseData, projectId: string): Omit<DatabasePhase, 'id' | 'created_at' | 'updated_at'> {
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
      custom_phase_data: phase.customPhase ? JSON.stringify(phase.customPhase) : null,
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
   * Convert Database format to UI PhaseData
   */
  static mapDatabaseToPhase(dbPhase: DatabasePhase): PhaseData {
    const customPhaseData = dbPhase.custom_phase_data ? 
      (typeof dbPhase.custom_phase_data === 'string' ? JSON.parse(dbPhase.custom_phase_data) : dbPhase.custom_phase_data) : 
      null;

    const materials = dbPhase.materials ? 
      (typeof dbPhase.materials === 'string' ? JSON.parse(dbPhase.materials) : dbPhase.materials) : 
      [];

    const humanResources = dbPhase.human_resources ? 
      (typeof dbPhase.human_resources === 'string' ? JSON.parse(dbPhase.human_resources) : dbPhase.human_resources) : 
      [];

    const suppliers = dbPhase.suppliers ? 
      (typeof dbPhase.suppliers === 'string' ? JSON.parse(dbPhase.suppliers) : dbPhase.suppliers) : 
      [];

    return {
      id: dbPhase.id,
      phase: dbPhase.construction_phase as ConstructionPhase || undefined,
      stage: dbPhase.construction_stage as ConstructionStage || undefined,
      customPhase: customPhaseData,
      title: dbPhase.phase_name,
      description: dbPhase.description || '',
      startDate: dbPhase.start_date || new Date().toISOString().split('T')[0],
      endDate: dbPhase.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedDuration: dbPhase.estimated_duration || 30,
      status: dbPhase.status as 'not_started' | 'in_progress' | 'completed' | 'delayed',
      budget: dbPhase.estimated_cost || 0,
      actualCost: dbPhase.actual_cost || 0,
      progress: dbPhase.progress || 0,
      materials,
      humanResources,
      suppliers,
      location: dbPhase.location || '',
      notes: dbPhase.notes || ''
    };
  }

  /**
   * Save phases to database
   */
  static async saveProjectPhases(projectId: string, phases: PhaseData[]): Promise<void> {
    console.log('=== PHASE SERVICE SAVE START ===');
    console.log('ProjectId:', projectId);
    console.log('Phases count:', phases.length);
    console.log('DEV_MODE:', DEV_MODE);
    
    try {
      // Skip saving if no phases provided
      if (!phases || phases.length === 0) {
        console.log('No phases to save - returning early');
        return;
      }

      // Check if user is authenticated (skip in DEV_MODE)
      let user: any = null;
      if (!DEV_MODE) {
        console.log('Checking authentication (not DEV_MODE)...');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          console.error('Authentication failed:', authError);
          throw new Error('User not authenticated. Please log in and try again.');
        }
        user = authUser;
        console.log('User authenticated:', user.id);
      } else {
        console.log('DEV_MODE enabled - skipping authentication');
      }

      console.log(`Saving ${phases.length} phases for project ${projectId}`);

      // First, delete existing phases for this project (ignore errors if no phases exist)
      const { error: deleteError } = await supabase
        .from('project_phases')
        .delete()
        .eq('project_id', projectId);

      // Don't throw error if delete fails - project might not have phases yet
      if (deleteError) {
        console.warn('Warning deleting existing phases:', deleteError.message);
      }

      // Map phases to database format
      const phasesData = phases.map(phase => ({
        ...this.mapPhaseToDatabase(phase, projectId),
        created_by: user?.id || null // Allow null in DEV_MODE
      }));

      console.log('Phase data to insert:', phasesData);

      // Insert new phases
      const { error: insertError, data: insertData } = await supabase
        .from('project_phases')
        .insert(phasesData)
        .select();

      if (insertError) {
        console.error('Database error saving phases:', insertError);
        console.error('Failed data:', phasesData);
        throw new Error(`Failed to save phases: ${insertError.message}. Details: ${JSON.stringify(insertError, null, 2)}`);
      }

      console.log('Successfully saved phases:', insertData);

    } catch (error) {
      console.error('Error saving project phases:', error);
      throw error;
    }
  }

  /**
   * Load phases from database
   */
  static async loadProjectPhases(projectId: string): Promise<PhaseData[]> {
    console.log('=== LOADING PHASES FROM DATABASE ===');
    console.log('Project ID:', projectId);
    
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      console.log('Database query result:', { data, error });

      if (error) {
        console.error('Error loading project phases:', error);
        throw error;
      }

      const mappedPhases = (data || []).map(dbPhase => this.mapDatabaseToPhase(dbPhase));
      console.log('Mapped phases:', mappedPhases);
      
      return mappedPhases;
    } catch (error) {
      console.error('Error loading project phases:', error);
      throw error;
    }
  }

  /**
   * Update a single phase
   */
  static async updatePhase(phase: PhaseData, projectId: string): Promise<void> {
    try {
      const phaseData = this.mapPhaseToDatabase(phase, projectId);
      
      const { error } = await supabase
        .from('project_phases')
        .update(phaseData)
        .eq('id', phase.id);

      if (error) {
        console.error('Error updating phase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating phase:', error);
      throw error;
    }
  }

  /**
   * Delete a single phase
   */
  static async deletePhase(phaseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('project_phases')
        .delete()
        .eq('id', phaseId);

      if (error) {
        console.error('Error deleting phase:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting phase:', error);
      throw error;
    }
  }

  // ============= New DTO-based methods =============

  /**
   * Get all phases as DTOs for a project
   */
  static async getPhasesDTOByProject(projectId: string): Promise<PhaseDTO[]> {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching phases:', error);
      throw error;
    }

    return (data || []).map(entity => 
      EntityToDTOMapper.phaseEntityToDTO(entity as unknown as ProjectPhaseEntity)
    );
  }

  /**
   * Get phase summaries (without nested data)
   */
  static async getPhaseSummaries(projectId: string): Promise<PhaseSummaryDTO[]> {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching phase summaries:', error);
      throw error;
    }

    return (data || []).map(entity => 
      EntityToDTOMapper.phaseEntityToSummaryDTO(entity as unknown as ProjectPhaseEntity)
    );
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

    return EntityToDTOMapper.phaseEntityToDTO(data as unknown as ProjectPhaseEntity);
  }

  /**
   * Create a new phase from form DTO
   */
  static async createPhaseFromDTO(projectId: string, formData: PhaseFormDTO): Promise<PhaseDTO> {
    const entity = EntityToDTOMapper.phaseFormToEntity(formData, projectId);
    
    const { data, error } = await supabase
      .from('project_phases')
      .insert(entity as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating phase:', error);
      throw error;
    }

    return EntityToDTOMapper.phaseEntityToDTO(data as unknown as ProjectPhaseEntity);
  }

  /**
   * Update phase from DTO
   */
  static async updatePhaseFromDTO(phaseId: string, updates: Partial<PhaseDTO>): Promise<PhaseDTO> {
    const entityUpdates = updates.steps 
      ? EntityToDTOMapper.phaseDTOToEntity(updates as PhaseDTO)
      : {
          phase_name: updates.phase_name,
          description: updates.description,
          construction_phase: updates.construction_phase,
          construction_stage: updates.construction_stage,
          status: updates.status,
          progress: updates.progress,
          estimated_cost: updates.estimated_cost,
          actual_cost: updates.actual_cost,
          start_date: updates.start_date,
          end_date: updates.end_date,
          order_index: updates.order_index
        };

    const { data, error } = await supabase
      .from('project_phases')
      .update(entityUpdates as any)
      .eq('id', phaseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating phase:', error);
      throw error;
    }

    return EntityToDTOMapper.phaseEntityToDTO(data as unknown as ProjectPhaseEntity);
  }

  /**
   * Update task status within a phase
   */
  static async updateTaskStatus(
    phaseId: string, 
    stepId: string, 
    taskId: string, 
    status: string, 
    progress: number
  ): Promise<PhaseDTO> {
    const phase = await this.getPhaseDTOById(phaseId);
    if (!phase) throw new Error('Phase not found');

    const updatedSteps = phase.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          tasks: step.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, status: status as PhaseStatus, progress };
            }
            return task;
          })
        };
      }
      return step;
    });

    // Recalculate progress
    const stepsWithProgress = updatedSteps.map(step => {
      const totalTasks = step.tasks.length;
      const stepProgress = totalTasks > 0 
        ? Math.round(step.tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
        : 0;
      return { ...step, progress: stepProgress };
    });

    const totalSteps = stepsWithProgress.length;
    const phaseProgress = totalSteps > 0
      ? Math.round(stepsWithProgress.reduce((sum, s) => sum + s.progress, 0) / totalSteps)
      : 0;

    return this.updatePhaseFromDTO(phaseId, {
      ...phase,
      progress: phaseProgress,
      steps: stepsWithProgress
    });
  }

  /**
   * Bulk create phases from referential
   */
  static async createPhasesFromReferential(
    projectId: string, 
    referentialPhases: PhaseFormDTO[]
  ): Promise<PhaseDTO[]> {
    const entities = referentialPhases.map((phase, index) => ({
      ...EntityToDTOMapper.phaseFormToEntity(phase, projectId),
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

    return (data || []).map(entity => 
      EntityToDTOMapper.phaseEntityToDTO(entity as unknown as ProjectPhaseEntity)
    );
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