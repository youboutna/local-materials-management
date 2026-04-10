// @ts-nocheck
/**
 * Supabase Project Adapter
 * Implements IProjectRepository using Supabase
 * Rule #9: DB → Entity → Repository → Service
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { Project } from '@/domain/entities';
import { IProjectRepository, ProjectSummary, ProjectWithRelatedData } from '@/domain/repositories';
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';

export class SupabaseProjectAdapter implements IProjectRepository {
  // ============= CRUD Operations =============

  async findById(id: string): Promise<Project | null> {
    if (!id || id.trim() === '') return null;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return ProjectTransformer.fromSupabase(data as Record<string, unknown>);
  }

  async findAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => ProjectTransformer.fromSupabase(row as Record<string, unknown>));
  }

  async create(projectData: Record<string, unknown>): Promise<Project> {
    const supabaseData = ProjectTransformer.toSupabase(projectData as Partial<Project>);

    const { data, error } = await supabase
      .from('projects')
      .insert(supabaseData as Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;
    return ProjectTransformer.fromSupabase(data as Record<string, unknown>);
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    if (!id || id.trim() === '') {
      throw new Error('Invalid project ID provided');
    }

    const entityData = ProjectTransformer.toSupabase(updates as Project);

    const { data, error } = await supabase
      .from('projects')
      .update(entityData as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return ProjectTransformer.fromSupabase(data as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
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
    return (data || []).map(row => ProjectTransformer.fromSupabase(row as Record<string, unknown>));
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
    return (data || []).map(row => ProjectTransformer.fromSupabase(row as Record<string, unknown>));
  }

  async findWithRelatedData(id: string): Promise<ProjectWithRelatedData> {
    if (!id || id.trim() === '') {
      return { project: null, phases: [], tasks: [], risks: [], inspections: [], payments: [], documents: [], bankGuarantees: [], insuranceCertificates: [] };
    }

    const [projectResult, phasesResult, tasksResult, risksResult, inspectionsResult, paymentsResult, documentsResult, bankGuaranteesResult, insuranceResult] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_phases').select('*').eq('project_id', id).order('order_index'),
      supabase.from('task_assignments').select('*').eq('project_id', id),
      supabase.from('project_risks').select('*').eq('project_id', id),
      supabase.from('inspections').select('*').eq('project_id', id),
      supabase.from('payments').select('*').eq('project_id', id),
      supabase.from('documents').select('*').eq('project_id', id),
      supabase.from('bank_guarantees').select('*').eq('project_id', id),
      supabase.from('insurance_certificates').select('*').eq('project_id', id),
    ]);

    return {
      project: projectResult.data ? ProjectTransformer.fromSupabase(projectResult.data as Record<string, unknown>) : null,
      phases: phasesResult.data || [],
      tasks: tasksResult.data || [],
      risks: risksResult.data || [],
      inspections: inspectionsResult.data || [],
      payments: paymentsResult.data || [],
      documents: documentsResult.data || [],
      bankGuarantees: bankGuaranteesResult.data || [],
      insuranceCertificates: insuranceResult.data || [],
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

    const phases = related.phases;
    if (phases.length === 0) return 0;

    const totalProgress = phases.reduce((sum: number, phase: Record<string, unknown>) =>
      sum + ((phase.progress as number) || 0), 0
    );
    const averageProgress = totalProgress / phases.length;
    const roundedProgress = Math.round(averageProgress);

    await this.updateProgress(id, roundedProgress);
    return roundedProgress;
  }
}
