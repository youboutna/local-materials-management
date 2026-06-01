/**
 * Supabase adapter for project_budget_links (public proxy view)
 * Following hexagonal architecture - Infrastructure layer
 */
import { supabase } from '@/integrations/supabase/client';
import type { IProjectBudgetLinkRepository } from '@/domain/repositories/IProjectBudgetLinkRepository';
import type {
  ProjectBudgetLinkDTO,
  CreateProjectBudgetLinkDTO,
  UpdateProjectBudgetLinkDTO,
} from '@/dtos/entities/ProjectBudgetLinkDTO';
import { ProjectBudgetLinkTransformer } from '@/dtos/transforms/ProjectBudgetLinkTransformer';

const TABLE = 'project_budget_links';

export class SupabaseProjectBudgetLinkAdapter implements IProjectBudgetLinkRepository {
  async findByProjectId(projectId: string): Promise<ProjectBudgetLinkDTO[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[BudgetLinkAdapter] findByProjectId', error);
      return [];
    }
    return (data || []).map((row: any) => ProjectBudgetLinkTransformer.rowToDTO(row));
  }

  async create(dto: CreateProjectBudgetLinkDTO): Promise<ProjectBudgetLinkDTO> {
    const { data: auth } = await supabase.auth.getUser();
    const payload = ProjectBudgetLinkTransformer.createToSupabase(dto, auth.user?.id ?? null);
    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`BudgetLink create failed: ${error.message}`);
    }
    return ProjectBudgetLinkTransformer.rowToDTO(data as any);
  }

  async update(id: string, dto: UpdateProjectBudgetLinkDTO): Promise<ProjectBudgetLinkDTO> {
    const payload = ProjectBudgetLinkTransformer.updateToSupabase(dto);
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`BudgetLink update failed: ${error.message}`);
    }
    return ProjectBudgetLinkTransformer.rowToDTO(data as any);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) {
      throw new Error(`BudgetLink delete failed: ${error.message}`);
    }
  }
}
