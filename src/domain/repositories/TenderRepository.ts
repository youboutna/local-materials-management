import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';
// Repository pattern for Tender CRUD operations

// Use raw DB types instead of camelCase DTOs for direct Supabase access
type TenderRow = Record<string, unknown> & { id: string; created_at: string; updated_at: string };
type TenderSubmissionRow = Record<string, unknown> & { id: string };

export class TenderRepository {
  // ============= Tender CRUD =============
  
  async findById(id: string): Promise<TenderRow | null> {
    const { data, error } = await btpClient.from('tenders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as TenderRow | null;
  }

  async findAll(): Promise<TenderRow[]> {
    const { data, error } = await btpClient.from('tenders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderRow[];
  }

  async findByStatus(status: 'draft' | 'published' | 'closed' | 'awarded'): Promise<TenderRow[]> {
    const { data, error } = await btpClient.from('tenders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderRow[];
  }

  async search(searchTerm: string): Promise<TenderRow[]> {
    const { data, error } = await btpClient.from('tenders')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tender_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderRow[];
  }

  async findPublishedPhase2WithValidDeadline(): Promise<TenderRow[]> {
    const { data, error } = await btpClient.from('tenders')
      .select('*')
      .eq('status', 'published')
      .eq('current_phase', 2)
      .gte('deadline_date', new Date().toISOString())
      .order('deadline_date', { ascending: true });
    
    if (error) throw error;
    return (data || []) as TenderRow[];
  }

  async create(tenderData: Record<string, unknown>): Promise<TenderRow> {
    const { data, error } = await btpClient.from('tenders')
      .insert(tenderData as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderRow;
  }

  async update(id: string, tenderData: Record<string, unknown>): Promise<TenderRow> {
    const { data, error } = await btpClient.from('tenders')
      .update(tenderData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await btpClient.from('tenders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ============= Tender Submissions =============

  async findSubmissionsByTenderId(tenderId: string): Promise<TenderSubmissionRow[]> {
    const { data, error } = await btpClient.from('tender_submissions')
      .select('*')
      .eq('tender_id', tenderId)
      .order('submission_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderSubmissionRow[];
  }

  async findSubmissionById(id: string): Promise<TenderSubmissionRow | null> {
    const { data, error } = await btpClient.from('tender_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as TenderSubmissionRow | null;
  }

  async createSubmission(submissionData: {
    tenderId: string;
    userId: string;
    supplierName?: string | null;
    supplierEmail?: string | null;
    status?: string;
    submissionDate?: string;
  }): Promise<TenderSubmissionRow> {
    const { data, error } = await btpClient.from('tender_submissions')
      .insert({
        tender_id: submissionData.tenderId,
        user_id: submissionData.userId,
        supplier_name: submissionData.supplierName ?? null,
        supplier_email: submissionData.supplierEmail ?? null,
        status: submissionData.status,
        submission_date: submissionData.submissionDate,
      } as never)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderSubmissionRow;
  }

  async updateSubmission(id: string, submissionData: Record<string, unknown>): Promise<TenderSubmissionRow> {
    const { data, error } = await btpClient.from('tender_submissions')
      .update(submissionData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderSubmissionRow;
  }

  async deleteSubmission(id: string): Promise<void> {
    const { error } = await btpClient.from('tender_submissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}
