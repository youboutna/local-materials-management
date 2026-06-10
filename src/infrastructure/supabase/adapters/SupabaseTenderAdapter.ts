// Supabase Adapter for Tender Repository
// Uses TenderTransformer for full snake_case ↔ camelCase round-trip.
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { Tender, TenderStatus, SelectionMode, MarketType } from '@/domain/entities/Tender';
import { TenderTransformer } from '@/dtos/transforms/TenderTransformer';

export class SupabaseTenderAdapter implements ITenderRepository {
  private mapToEntity(data: any): Tender {
    return TenderTransformer.fromSupabase(data);
  }

  async findById(id: string): Promise<Tender | null> {
    const { data, error } = await supabase.from('tenders').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async save(tender: Tender | Record<string, any>): Promise<Tender | null> {
    // Accept either a domain entity or a raw partial row from the UI layer.
    const raw: Record<string, any> = (tender as any)?.id !== undefined && (tender as any)?.title !== undefined && typeof (tender as any).isOpen === 'function'
      ? TenderTransformer.toSupabase(tender as Tender)
      : { ...(tender as Record<string, any>) };

    // Strip id when null/undefined so Postgres uses the DEFAULT gen_random_uuid().
    if (raw.id === null || raw.id === undefined || raw.id === '') delete raw.id;
    // Strip empty timestamps to let DB defaults populate them.
    if (!raw.created_at) delete raw.created_at;
    if (!raw.updated_at) delete raw.updated_at;
    if (!raw.status) raw.status = 'draft';

    const { data, error } = await supabase.from('tenders').insert([raw]).select().single();
    if (error) throw new Error(`Failed to save tender: ${error.message}`);
    return data ? this.mapToEntity(data) : null;
  }

  async update(id: string, data: Partial<Tender>): Promise<void> {
    // Translate the partial domain entity into a partial DB row.
    const updatePayload: Record<string, any> = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.tenderNumber !== undefined) updatePayload.tender_number = data.tenderNumber;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.selectionMode !== undefined) updatePayload.selection_mode = data.selectionMode;
    if (data.marketType !== undefined) updatePayload.market_type = data.marketType;
    if (data.financingSource !== undefined) updatePayload.financing_source = data.financingSource;
    if (data.projectReference !== undefined) updatePayload.project_reference = data.projectReference;
    if (data.publicationDate !== undefined) updatePayload.publication_date = data.publicationDate;
    if (data.deadlineDate !== undefined) updatePayload.deadline_date = data.deadlineDate;
    if (data.launchDate !== undefined) updatePayload.launch_date = data.launchDate;
    if (data.attributionDate !== undefined) updatePayload.attribution_date = data.attributionDate;
    if (data.budgetMin !== undefined) updatePayload.budget_min = data.budgetMin;
    if (data.budgetMax !== undefined) updatePayload.budget_max = data.budgetMax;
    if (data.evaluationCriteria !== undefined) updatePayload.evaluation_criteria = data.evaluationCriteria;
    if (data.eligibilityRequirements !== undefined) updatePayload.eligibility_requirements = data.eligibilityRequirements;

    if (Object.keys(updatePayload).length === 0) return;
    const { error } = await supabase.from('tenders').update(updatePayload).eq('id', id);
    if (error) throw new Error(`Failed to update tender: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tenders').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete tender: ${error.message}`);
  }

  async findByProjectId(projectId: string): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').eq('project_id', projectId);
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByStatus(status: TenderStatus): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').eq('status', status);
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findBySelectionMode(mode: SelectionMode): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').eq('selection_mode', mode);
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByMarketType(type: MarketType): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').eq('market_type', type);
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findByTenderNumber(tenderNumber: string): Promise<Tender | null> {
    const { data, error } = await supabase.from('tenders').select('*').eq('tender_number', tenderNumber).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findOpen(): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').in('status', ['published', 'open']);
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findAcceptingSubmissions(): Promise<Tender[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('tenders').select('*').in('status', ['published', 'open']).gt('deadline_date', now);
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findPublishedBetween(startDate: string, endDate: string): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').gte('publication_date', startDate).lte('publication_date', endDate);
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findDeadlineApproaching(days: number): Promise<Tender[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const { data, error } = await supabase.from('tenders').select('*').gte('deadline_date', now.toISOString()).lte('deadline_date', futureDate.toISOString());
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async findDeadlinePassed(): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').lt('deadline_date', new Date().toISOString());
    if (error || !data) return [];
    return data.map((d: any) => this.mapToEntity(d));
  }

  async countByStatus(): Promise<Record<TenderStatus, number>> {
    return { draft: 0, published: 0, open: 0, under_evaluation: 0, awarded: 0, cancelled: 0, closed: 0 };
  }
}
