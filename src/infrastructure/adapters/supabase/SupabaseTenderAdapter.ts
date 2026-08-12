// Supabase Adapter for Tender Repository
// Uses TenderTransformer for full snake_case ↔ camelCase round-trip.
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { Tender, TenderStatus, SelectionMode, MarketType } from '@/domain/entities/Tender';
import { TenderTransformer } from '@/dtos/transforms/TenderTransformer';

export class SupabaseTenderAdapter implements ITenderRepository {
  private mapToEntity(data: any): Tender {
    const entity = TenderTransformer.fromSupabase(data);
    // Enrich with columns not carried by the Tender domain class, so the
    // UI layer (which reads camelCase) can round-trip them without loss.
    Object.assign(entity as any, {
      submissionDeadline: data.submission_deadline ?? data.deadline_date ?? null,
      evaluationDeadline: data.evaluation_deadline ?? null,
      estimatedValue: data.estimated_value ?? null,
      currentPhase: data.current_phase ?? null,
      currentStage: data.current_stage ?? null,
      procurementType: data.procurement_type ?? null,
    });
    return entity;
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

  async update(id: string, data: Partial<Tender> | Record<string, any>): Promise<void> {
    // Accept either a Partial<Tender> (camelCase) or a raw snake_case DB row.
    // camelCase → snake_case mapping (limited to Tender entity fields).
    const camelToSnake: Record<string, string> = {
      title: 'title',
      description: 'description',
      tenderNumber: 'tender_number',
      status: 'status',
      selectionMode: 'selection_mode',
      marketType: 'market_type',
      financingSource: 'financing_source',
      projectId: 'project_id',
      projectReference: 'project_reference',
      publicationDate: 'publication_date',
      deadlineDate: 'deadline_date',
      launchDate: 'launch_date',
      attributionDate: 'attribution_date',
      budgetMin: 'budget_min',
      budgetMax: 'budget_max',
      evaluationCriteria: 'evaluation_criteria',
      eligibilityRequirements: 'eligibility_requirements',
      submissionDeadline: 'submission_deadline',
      evaluationDeadline: 'evaluation_deadline',
      currentPhase: 'current_phase',
      currentStage: 'current_stage',
      procurementType: 'procurement_type',
      estimatedValue: 'estimated_value',
    };

    const updatePayload: Record<string, any> = {};
    for (const [k, v] of Object.entries(data as Record<string, any>)) {
      if (v === undefined) continue;
      // Snake_case key → pass through directly
      if (k.includes('_')) {
        updatePayload[k] = v;
      } else if (camelToSnake[k]) {
        updatePayload[camelToSnake[k]] = v;
      }
    }

    if (Object.keys(updatePayload).length === 0) return;
    updatePayload.updated_at = new Date().toISOString();
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
