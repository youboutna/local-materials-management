/**
 * Supabase adapter for project_strategy_links (public proxy view)
 */
import { supabase } from '@/integrations/supabase/client';
import type { IProjectStrategyLinkRepository } from '@/domain/repositories/IProjectStrategyLinkRepository';
import type {
  ProjectStrategyLinkDTO,
  CreateProjectStrategyLinkDTO,
  UpdateProjectStrategyLinkDTO,
} from '@/dtos/entities/ProjectStrategyLinkDTO';
import { ProjectStrategyLinkTransformer } from '@/dtos/transforms/ProjectStrategyLinkTransformer';

const TABLE = 'project_strategy_links' as any;

export class SupabaseProjectStrategyLinkAdapter implements IProjectStrategyLinkRepository {
  async findByProjectId(projectId: string): Promise<ProjectStrategyLinkDTO[]> {
    const { data, error } = await (supabase as any).from(TABLE)
      .select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) { console.error('[StrategyLinkAdapter] findByProjectId', error); return []; }
    return (data || []).map((r: any) => ProjectStrategyLinkTransformer.rowToDTO(r));
  }

  async create(dto: CreateProjectStrategyLinkDTO): Promise<ProjectStrategyLinkDTO> {
    const { data: auth } = await supabase.auth.getUser();
    const payload = ProjectStrategyLinkTransformer.createToSupabase(dto, auth.user?.id ?? null);
    const { data, error } = await (supabase as any).from(TABLE).insert(payload).select('*').single();
    if (error) throw new Error(`StrategyLink create failed: ${error.message}`);
    return ProjectStrategyLinkTransformer.rowToDTO(data);
  }

  async update(id: string, dto: UpdateProjectStrategyLinkDTO): Promise<ProjectStrategyLinkDTO> {
    const payload = ProjectStrategyLinkTransformer.updateToSupabase(dto);
    const { data, error } = await (supabase as any).from(TABLE).update(payload).eq('id', id).select('*').single();
    if (error) throw new Error(`StrategyLink update failed: ${error.message}`);
    return ProjectStrategyLinkTransformer.rowToDTO(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any).from(TABLE).delete().eq('id', id);
    if (error) throw new Error(`StrategyLink delete failed: ${error.message}`);
  }
}
