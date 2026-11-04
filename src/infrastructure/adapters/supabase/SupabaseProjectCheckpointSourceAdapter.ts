import type { IProjectCheckpointSourceRepository } from '@/domain/repositories/IProjectCheckpointSourceRepository';

async function btp(): Promise<any> {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  return btpClient;
}

async function rows(q: PromiseLike<{ data: any; error: any }>): Promise<Record<string, any>[]> {
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export class SupabaseProjectCheckpointSourceAdapter implements IProjectCheckpointSourceRepository {
  async findPhases(projectId: string) {
    return rows((await btp()).from('project_phases').select('*').eq('project_id', projectId).order('created_at'));
  }
  async findInspections(projectId: string) {
    return rows((await btp()).from('inspections').select('*').eq('project_id', projectId).order('date', { ascending: false }));
  }
  async findDocuments(projectId: string) {
    return rows((await btp()).from('documents').select('*').eq('project_id', projectId));
  }
  async findPayments(projectId: string) {
    return rows((await btp()).from('payments').select('*').eq('project_id', projectId).order('payment_date', { ascending: false }));
  }
  async findApprovedInspections(projectId: string, limit: number) {
    return rows((await btp()).from('inspections')
      .select('id, date, status, documents, progress_at_inspection')
      .eq('project_id', projectId).eq('status', 'approved')
      .order('date', { ascending: false }).limit(limit));
  }
  async findDocumentsByTypes(projectId: string, types: string[]) {
    return rows((await btp()).from('documents')
      .select('id, title, document_type, file_url, created_at, status')
      .eq('project_id', projectId).in('document_type', types)
      .order('created_at', { ascending: false }));
  }
  async findMilestones(projectId: string) {
    return rows((await btp()).from('project_milestones').select('id, title, phase_id, order_index').eq('project_id', projectId));
  }
  async findTasks(projectId: string) {
    return rows((await btp()).from('task_assignments').select('id, title, phase_id').eq('project_id', projectId));
  }
  async findProject(projectId: string) {
    const { data, error } = await (await btp()).from('projects').select('*').eq('id', projectId).maybeSingle();
    if (error) throw error;
    return data ?? null;
  }
  async findTaskStatuses(projectId: string) {
    return (await rows((await btp()).from('task_assignments').select('status').eq('project_id', projectId))).map((r) => r.status);
  }
  async findResourceAllocations(projectId: string) {
    const client = await btp();
    const resources = await rows(client.from('project_resources').select('id').eq('project_id', projectId));
    if (resources.length === 0) return [];
    const assignments = await rows(client.from('resource_assignments').select('allocation_percentage').in('resource_id', resources.map((r) => r.id)));
    return assignments.map((a) => Number(a.allocation_percentage) || 0);
  }
  async insertPaymentRequest(row: Record<string, unknown>) {
    const { error } = await (await btp()).from('payments').insert(row);
    if (error) throw error;
  }
}
