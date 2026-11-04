import type { ITenderCatalogRepository } from '@/domain/repositories/ITenderCatalogRepository';

async function btp(): Promise<any> {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  return btpClient;
}

async function one(q: PromiseLike<{ data: any; error: any }>) {
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export class SupabaseTenderCatalogAdapter implements ITenderCatalogRepository {
  async findLotsByTender(tenderId: string) {
    return (await one((await btp()).from('tender_lots').select('*').eq('tender_id', tenderId).order('number', { ascending: true }))) ?? [];
  }
  async insertLot(row: Record<string, unknown>) {
    return one((await btp()).from('tender_lots').insert(row).select().single());
  }
  async updateLot(id: string, row: Record<string, unknown>) {
    return one((await btp()).from('tender_lots').update(row).eq('id', id).select().single());
  }
  async deleteLot(id: string) {
    await one((await btp()).from('tender_lots').delete().eq('id', id));
  }
  async findSubmissionsByLot(lotId: string) {
    return (await one((await btp()).from('tender_submissions').select('*').eq('lot_id', lotId).order('submission_date', { ascending: false }))) ?? [];
  }
  async findOpenTenders(statuses: string[]) {
    return (await one((await btp()).from('tenders')
      .select('id, title, description, status, deadline_date, publication_date, market_type, budget_max, project_reference')
      .in('status', statuses)
      .order('deadline_date', { ascending: true, nullsFirst: false }))) ?? [];
  }
  async findPublicTenderById(id: string) {
    return (await one((await btp()).from('tenders')
      .select('id, title, description, status, deadline_date, market_type, budget_max, project_reference')
      .eq('id', id).maybeSingle())) ?? null;
  }
  async insertTenders(rows: Record<string, unknown>[]) {
    const data = await one((await btp()).from('tenders').insert(rows).select('id'));
    return data?.length ?? 0;
  }
  async findTenderProjectId(tenderId: string) {
    const data = await one((await btp()).from('tenders').select('project_id').eq('id', tenderId).maybeSingle());
    return data?.project_id ?? null;
  }
  async findSharedDocuments(tenderId: string, projectId: string | null, allowedIds?: string[]) {
    let query = (await btp()).from('documents')
      .select('id, title, description, file_url, document_type')
      .eq('is_shared_with_suppliers', true);
    query = projectId
      ? query.or(`metadata->>tender_id.eq.${tenderId},project_id.eq.${projectId}`)
      : query.eq('metadata->>tender_id', tenderId);
    if (allowedIds && allowedIds.length > 0) query = query.in('id', allowedIds);
    return (await one(query)) ?? [];
  }
}
