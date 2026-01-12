// Supabase Adapter for Tender Repository
import { supabase } from '@/integrations/supabase/client';
import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { Tender, TenderStatus, SelectionMode, MarketType } from '@/domain/entities/Tender';

export class SupabaseTenderAdapter implements ITenderRepository {
  private mapToEntity(data: any): Tender {
    return new Tender(
      data.id, data.project_id || null, data.title, data.description || null,
      data.tender_number || null, (data.status as TenderStatus) || 'draft',
      (data.selection_mode as SelectionMode) || null, (data.market_type as MarketType) || null,
      data.financing_source || null, data.project_reference || null,
      data.publication_date || null, data.deadline_date || null,
      data.launch_date || null, data.attribution_date || null,
      data.budget_min || null, data.budget_max || null,
      data.evaluation_criteria || [], data.eligibility_requirements || [],
      data.created_at, data.updated_at
    );
  }

  async findById(id: string): Promise<Tender | null> {
    const { data, error } = await supabase.from('tenders').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(tender: Tender): Promise<void> {
    const { error } = await supabase.from('tenders').insert([{
      id: tender.id, title: tender.title, description: tender.description || '',
      tender_number: tender.tenderNumber || '', project_id: tender.projectId,
      status: tender.status, selection_mode: tender.selectionMode,
      market_type: tender.marketType, deadline_date: tender.deadlineDate,
      budget_min: tender.budgetMin, budget_max: tender.budgetMax,
      evaluation_criteria: tender.evaluationCriteria as any,
      eligibility_requirements: tender.eligibilityRequirements
    }]);
    if (error) throw new Error(`Failed to save tender: ${error.message}`);
  }

  async update(id: string, data: Partial<Tender>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.deadlineDate !== undefined) updateData.deadline_date = data.deadlineDate;
    const { error } = await supabase.from('tenders').update(updateData).eq('id', id);
    if (error) throw new Error(`Failed to update tender: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tenders').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete tender: ${error.message}`);
  }

  async findByProjectId(projectId: string): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').eq('project_id', projectId);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByStatus(status: TenderStatus): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').eq('status', status);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findBySelectionMode(mode: SelectionMode): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').eq('selection_mode', mode);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByMarketType(type: MarketType): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').eq('market_type', type);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByTenderNumber(tenderNumber: string): Promise<Tender | null> {
    const { data, error } = await supabase.from('tenders').select('*').eq('tender_number', tenderNumber).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findOpen(): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').in('status', ['published', 'open']);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findAcceptingSubmissions(): Promise<Tender[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('tenders').select('*').in('status', ['published', 'open']).gt('deadline_date', now);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findPublishedBetween(startDate: string, endDate: string): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').gte('publication_date', startDate).lte('publication_date', endDate);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findDeadlineApproaching(days: number): Promise<Tender[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const { data, error } = await supabase.from('tenders').select('*').gte('deadline_date', now.toISOString()).lte('deadline_date', futureDate.toISOString());
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findDeadlinePassed(): Promise<Tender[]> {
    const { data, error } = await supabase.from('tenders').select('*').lt('deadline_date', new Date().toISOString());
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async countByStatus(): Promise<Record<TenderStatus, number>> {
    return { draft: 0, published: 0, open: 0, under_evaluation: 0, awarded: 0, cancelled: 0, closed: 0 };
  }
}
