// @ts-nocheck
/**
 * Supabase Project Adapter
 * Implements IProjectRepository using Supabase
 * Rule #9: DB → Entity → Repository → Service
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { Project } from '@/domain/entities/Project';
import { IProjectRepository, ProjectSummary, ProjectWithRelatedData } from '@/domain/repositories';
import { ProjectTransformer } from '@/dtos/transforms/ProjectTransformer';

/**
 * Normalize project status values to the strict set accepted by the
 * `projects_status_check` constraint in the DB:
 *   'en cours' | 'terminé' | 'en attente' | 'en inspection' | 'suspendu' | 'annulé'
 *
 * Internal code uses richer enums (en_cours_v2, planifie_v2, draft, …) and
 * legacy values (enCours, planifié, planned, …). We collapse them here so
 * the DB write never violates the constraint.
 */
function normalizeStatusForDb(status: unknown): string | undefined {
  if (status === undefined || status === null || status === '') return undefined;
  const raw = String(status).toLowerCase().replace(/[\s_-]/g, '').replace(/v2$/, '');
  const map: Record<string, string> = {
    encours: 'en cours',
    enconstruction: 'en cours',
    attribue: 'en cours',
    attribué: 'en cours',
    planifie: 'en cours',
    planifié: 'en cours',
    planned: 'en cours',
    enconception: 'en cours',
    enretard: 'en cours',
    enreview: 'en inspection',
    eninspection: 'en inspection',
    enattente: 'en attente',
    draft: 'en attente',
    brouillon: 'en attente',
    prequalification: 'en attente',
    termine: 'terminé',
    terminé: 'terminé',
    completed: 'terminé',
    encloture: 'terminé',
    suspendu: 'suspendu',
    annule: 'annulé',
    annulé: 'annulé',
    cancelled: 'annulé',
  };
  return map[raw] ?? 'en attente';
}

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
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SupabaseProjectAdapter.findAll error:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('No projects found in database');
        return [];
      }

      console.log(`Found ${data.length} projects in database`);
      return data.map(row => {
        try {
          return ProjectTransformer.fromSupabase(row as Record<string, unknown>);
        } catch (transformError) {
          console.error('Error transforming project row:', row, transformError);
          throw new Error(`Failed to transform project data: ${transformError instanceof Error ? transformError.message : 'Unknown transformation error'}`);
        }
      });
    } catch (error) {
      console.error('SupabaseProjectAdapter.findAll error:', error);
      throw error;
    }
  }

  async create(projectData: Record<string, unknown>): Promise<Project> {
    const supabaseData = ProjectTransformer.toSupabase(projectData as Partial<Project>) as Record<string, unknown>;
    if ('status' in supabaseData) {
      const normalized = normalizeStatusForDb(supabaseData.status);
      if (normalized) supabaseData.status = normalized;
      else delete supabaseData.status;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(supabaseData)
      .select()
      .single();

    if (error) throw error;
    return ProjectTransformer.fromSupabase(data as Record<string, unknown>);
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    if (!id || id.trim() === '') {
      throw new Error('Invalid project ID provided');
    }

    const entityData = ProjectTransformer.toSupabase(updates as Project) as Record<string, unknown>;
    if ('status' in entityData) {
      const normalized = normalizeStatusForDb(entityData.status);
      if (normalized) entityData.status = normalized;
      else delete entityData.status;
    }

    const { data, error } = await supabase
      .from('projects')
      .update(entityData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return ProjectTransformer.fromSupabase(data as Record<string, unknown>);
  }

  async assignOrganizationToAll(organizationId: string): Promise<number> {
    const { data, error } = await supabase
      .from('projects')
      .update({ organization_id: organizationId } as Record<string, unknown>)
      .not('id', 'is', null)
      .select('id');
    if (error) throw error;
    return data?.length ?? 0;
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
    const empty: ProjectWithRelatedData = {
      project: null, phases: [], tasks: [], risks: [], inspections: [], payments: [],
      documents: [], bankGuarantees: [], insuranceCertificates: [],
      milestones: [], stakeholders: [], resources: [], contacts: [], materials: [],
    };
    if (!id || id.trim() === '') return empty;

    const [
      projectResult, phasesResult, tasksResult, risksResult, inspectionsResult, paymentsResult,
      documentsResult, bankGuaranteesResult, insuranceResult,
      milestonesResult, stakeholdersResult, resourcesResult, contactsResult, materialsResult,
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_phases').select('*').eq('project_id', id).order('order_index'),
      supabase.from('task_assignments').select('*').eq('project_id', id),
      supabase.from('project_risks').select('*').eq('project_id', id),
      supabase.from('inspections').select('*').eq('project_id', id),
      supabase.from('payments').select('*').eq('project_id', id),
      supabase.from('documents').select('*').eq('project_id', id),
      supabase.from('bank_guarantees').select('*').eq('project_id', id),
      supabase.from('insurance_certificates').select('*').eq('project_id', id),
      // ⬇️ Sous-objets manquants jusqu'ici : jalons, parties prenantes, ressources, contacts, matériaux
      supabase.from('project_milestones').select('*').eq('project_id', id),
      supabase.from('project_stakeholders').select('*').eq('project_id', id),
      supabase.from('project_resources').select('*').eq('project_id', id),
      supabase.from('project_contacts').select('*').eq('project_id', id),
      supabase.from('project_materials').select('*').eq('project_id', id),
    ]);

    const milestones = (milestonesResult.data || []).map((row: Record<string, any>) => ({
      id: row.id,
      projectId: row.project_id,
      phaseId: row.phase_id ?? undefined,
      title: row.title ?? row.name ?? 'Jalon',
      description: row.description ?? '',
      targetDate: row.target_date ?? null,
      completionDate: row.completion_date ?? row.completion_date ?? null,
      status: row.status ?? 'pending',
      progress: row.progress ?? row.progress_percentage ?? 0,
      externalRef: row.external_ref ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const stakeholders = (stakeholdersResult.data || []).map((row: Record<string, any>) => ({
      id: row.id,
      projectId: row.project_id,
      stakeholderType: row.stakeholder_type,
      entityType: row.stakeholder_entity_type,
      stakeholderId: row.stakeholder_id ?? row.supplier_id ?? row.employee_id ?? undefined,
      supplierId: row.supplier_id ?? undefined,
      employeeId: row.employee_id ?? undefined,
      organizationId: row.organization_id ?? undefined,
      role: row.stakeholder_type,
      roleDescription: row.role_description ?? '',
      name: row.name ?? row.role_description ?? row.stakeholder_type ?? '',
      isPrimary: row.is_primary ?? false,
      isActive: row.is_active ?? true,
      externalRef: row.external_ref ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const resources = (resourcesResult.data || []).map((row: Record<string, any>) => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      type: row.type,
      quantity: row.quantity ?? undefined,
      unit: row.unit ?? undefined,
      costPerHour: row.cost_per_hour ?? undefined,
      costPerUnit: row.cost_per_unit ?? undefined,
      availability: row.availability ?? 100,
      skills: row.skills ?? [],
      assignedTasks: row.assigned_tasks ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const contacts = (contactsResult.data || []).map((row: Record<string, any>) => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      role: row.role,
      email: row.email ?? '',
      phone: row.phone ?? undefined,
      company: row.company ?? undefined,
      isPrimary: row.is_primary ?? false,
    }));

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
      milestones,
      stakeholders,
      resources,
      contacts,
      materials: materialsResult.data || [],
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
