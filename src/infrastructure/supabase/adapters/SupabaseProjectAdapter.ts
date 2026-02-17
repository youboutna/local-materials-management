/**
 * Supabase Project Adapter
 * Implements IProjectRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/domain/entities';
import { IProjectRepository, ProjectSummary, ProjectWithRelatedData } from '@/domain/repositories';

// Import transformer for proper field mapping
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';

// Define database row types for better type safety
interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  budget: number;
  start_date: string | null;
  end_date: string | null; // Supabase uses null, not undefined
  location: string;
  coordinates_latitude: number | null;
  coordinates_longitude: number | null;
  team_size: number;
  thumbnail: string | null;
  financing_source: string | null;
  main_contractor: string | null;
  currency: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Additional fields...
  [key: string]: unknown;
}

interface PhaseRow {
  id: string;
  progress?: number;
  [key: string]: unknown;
}

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

  async create(projectData: Record<string, unknown>): Promise<Project> {
    // Use transformer to convert to Supabase format
    const supabaseData = ProjectTransformer.toSupabase(projectData as Partial<Project>);

    const { data, error } = await supabase
      .from('projects')
      .insert(supabaseData)
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

    // Use transformer to convert updates to Supabase format
    const entityData = ProjectTransformer.toSupabase(updates as Project);

    const { data, error } = await supabase
      .from('projects')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(entityData as any) // Cast to any for Supabase operations
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

    const totalProgress = phases.reduce((sum: number, phase: PhaseRow) => 
      sum + (phase.progress || 0), 0
    );
    const averageProgress = totalProgress / phases.length;
    const roundedProgress = Math.round(averageProgress);

    await this.updateProgress(id, roundedProgress);
    return roundedProgress;
  }

  // ============= Private Mappers =============

  private mapToProject(data: ProjectRow): Project {
    // Use transformer to convert from Supabase format to Domain Entity
    return ProjectTransformer.fromSupabase(data);
  }
}
