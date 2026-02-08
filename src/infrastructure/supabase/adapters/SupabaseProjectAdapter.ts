/**
 * Supabase Project Adapter
 * Implements IProjectRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/domain/entities';
import { IProjectRepository, ProjectSummary, ProjectWithRelatedData } from '@/domain/repositories';

export class SupabaseProjectAdapter implements IProjectRepository {
  // ============= CRUD Operations =============

  async findById(id: string): Promise<Project | null> {
    // Validate ID to prevent invalid UUID queries
    if (!id || id.trim() === '') {
      return null;
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapToProject(data);
  }

  async findAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToProject);
  }

  async create(project: Partial<Project>): Promise<Project> {
    const entityData = this.mapToEntity(project);

    const { data, error } = await supabase
      .from('projects')
      .insert(entityData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToProject(data);
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    // Validate ID to prevent invalid UUID queries
    if (!id || id.trim() === '') {
      throw new Error('Invalid project ID provided');
    }

    const entityData = this.mapToEntity(updates);

    const { data, error } = await supabase
      .from('projects')
      .update(entityData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapToProject(data);
  }

  async delete(id: string): Promise<void> {
    // Validate ID to prevent invalid UUID queries
    if (!id || id.trim() === '') {
      throw new Error('Invalid project ID provided');
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============= Specialized Queries =============

  async findForBreadcrumb(id: string): Promise<{ id: string; title: string } | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return { id: data.id, title: data.title };
  }

  async findActiveProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'en cours')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(this.mapToProject);
  }

  async findOverdueProjects(): Promise<Project[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .neq('status', 'terminé')
      .lt('end_date', today)
      .order('end_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToProject);
  }

  async findWithRelatedData(id: string): Promise<ProjectWithRelatedData> {
    // Validate ID to prevent invalid UUID queries
    if (!id || id.trim() === '') {
      return {
        project: null,
        phases: [],
        tasks: [],
        risks: [],
        inspections: [],
        payments: [],
      };
    }

    const [
      projectResult,
      phasesResult,
      tasksResult,
      risksResult,
      inspectionsResult,
      paymentsResult
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_phases').select('*').eq('project_id', id).order('order_index'),
      supabase.from('task_assignments').select('*').eq('project_id', id),
      supabase.from('project_risks').select('*').eq('project_id', id),
      supabase.from('inspections').select('*').eq('project_id', id),
      supabase.from('payments').select('*').eq('project_id', id),
    ]);

    return {
      project: projectResult.data ? this.mapToProject(projectResult.data) : null,
      phases: phasesResult.data || [],
      tasks: tasksResult.data || [],
      risks: risksResult.data || [],
      inspections: inspectionsResult.data || [],
      payments: paymentsResult.data || [],
    };
  }

  async findSummary(id: string): Promise<ProjectSummary | null> {
    const related = await this.findWithRelatedData(id);
    if (!related.project) return null;

    return {
      id: related.project.id,
      title: related.project.title,
      status: related.project.status,
      progress: related.project.progress,
      phasesCount: related.phases.length,
      tasksCount: related.tasks.length,
      inspectionsCount: related.inspections.length,
      paymentsCount: related.payments.length,
    };
  }

  // ============= Progress Management =============

  async updateProgress(id: string, progress: number): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ progress: Math.round(progress) })
      .eq('id', id);

    if (error) throw error;
  }

  async synchronizeProgress(id: string): Promise<number> {
    const related = await this.findWithRelatedData(id);
    if (!related.project) return 0;

    // Calculate progress based on phases
    const phases = related.phases;
    if (phases.length === 0) return 0;

    const totalProgress = phases.reduce((sum: number, phase: any) => 
      sum + (phase.progress || 0), 0
    );
    const averageProgress = totalProgress / phases.length;
    const roundedProgress = Math.round(averageProgress);

    await this.updateProgress(id, roundedProgress);
    return roundedProgress;
  }

  // ============= Private Mappers =============

  private mapToProject(data: any): Project {
    return Project.create({
      id: data.id,
      title: data.title,
      description: data.description || '',
      status: data.status,
      progress: data.progress || 0,
      budget: data.budget || 0,
      startDate: data.start_date ? new Date(data.start_date) : null,
      endDate: data.end_date ? new Date(data.end_date) : null,
      location: data.location,
      coordinates: data.coordinates_latitude && data.coordinates_longitude ? {
        latitude: data.coordinates_latitude,
        longitude: data.coordinates_longitude,
      } : undefined,
      teamSize: data.team_size,
      thumbnail: data.thumbnail,
      financingSource: data.financing_source,
      marketType: data.market_type,
      selectionMode: data.selection_mode,
      projectReferenceNumber: data.project_reference,
      mainContractor: data.main_contractor,
      allowsInitialPayment: data.allows_initial_payment,
      initialAdvancePercentage: data.initial_payment_percentage,
      currentPhase: data.current_phase,
      currentStage: data.current_stage,
    });
  }

  private mapToEntity(project: Partial<Project>): Record<string, unknown> {
    const entity: Record<string, unknown> = {};

    if (project.title !== undefined) entity.title = project.title;
    if (project.description !== undefined) entity.description = project.description;
    if (project.status !== undefined) entity.status = project.status;
    if (project.progress !== undefined) entity.progress = project.progress;
    if (project.budget !== undefined) entity.budget = project.budget;
    if (project.startDate !== undefined) {
      entity.start_date = project.startDate instanceof Date 
        ? project.startDate.toISOString().split('T')[0] 
        : project.startDate;
    }
    if (project.endDate !== undefined) {
      entity.end_date = project.endDate instanceof Date 
        ? project.endDate.toISOString().split('T')[0] 
        : project.endDate;
    }
    if (project.location !== undefined) entity.location = project.location;
    if (project.coordinates !== undefined) {
      entity.coordinates_latitude = project.coordinates?.latitude;
      entity.coordinates_longitude = project.coordinates?.longitude;
    }
    if (project.teamSize !== undefined) entity.team_size = project.teamSize;
    if (project.thumbnail !== undefined) entity.thumbnail = project.thumbnail;
    if (project.financingSource !== undefined) entity.financing_source = project.financingSource;
    if (project.marketType !== undefined) entity.market_type = project.marketType;
    if (project.selectionMode !== undefined) entity.selection_mode = project.selectionMode;
    if (project.projectReferenceNumber !== undefined) entity.project_reference = project.projectReferenceNumber;
    if (project.mainContractor !== undefined) entity.main_contractor = typeof project.mainContractor === 'string' ? project.mainContractor : project.mainContractor?.name;
    if (project.allowsInitialPayment !== undefined) entity.allows_initial_payment = project.allowsInitialPayment;
    if (project.currentPhase !== undefined) entity.current_phase = project.currentPhase;
    if (project.currentStage !== undefined) entity.current_stage = project.currentStage;

    return entity;
  }
}
