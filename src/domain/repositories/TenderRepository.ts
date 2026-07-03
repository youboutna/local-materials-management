import { supabase } from '@/integrations/supabase/client';
// Repository pattern for Tender CRUD operations

// Use raw DB types instead of camelCase DTOs for direct Supabase access
type TenderRow = Record<string, unknown> & { id: string; created_at: string; updated_at: string };
type TenderSubmissionRow = Record<string, unknown> & { id: string };

export class TenderRepository {
  // ============= Tender CRUD =============
  
  async findById(id: string): Promise<TenderRow | null> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as TenderRow | null;
  }

  async findAll(): Promise<TenderRow[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderRow[];
  }

  async findByStatus(status: 'draft' | 'published' | 'closed' | 'awarded'): Promise<TenderRow[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderRow[];
  }

  async search(searchTerm: string): Promise<TenderRow[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tender_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderRow[];
  }

  async findPublishedPhase2WithValidDeadline(): Promise<TenderRow[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('status', 'published')
      .eq('current_phase', 2)
      .gte('deadline_date', new Date().toISOString())
      .order('deadline_date', { ascending: true });
    
    if (error) throw error;
    return (data || []) as TenderRow[];
  }

  async create(tenderData: Record<string, unknown>): Promise<TenderRow> {
    const { data, error } = await supabase
      .from('tenders')
      .insert(tenderData as any)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderRow;
  }

  async update(id: string, tenderData: Record<string, unknown>): Promise<TenderRow> {
    const { data, error } = await supabase
      .from('tenders')
      .update(tenderData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ============= Tender Submissions =============

  async findSubmissionsByTenderId(tenderId: string): Promise<TenderSubmissionRow[]> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .select('*')
      .eq('tender_id', tenderId)
      .order('submission_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderSubmissionRow[];
  }

  async findSubmissionById(id: string): Promise<TenderSubmissionRow | null> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as TenderSubmissionRow | null;
  }

  async createSubmission(submissionData: {
    tender_id: string;
    user_id: string;
    supplier_name?: string | null;
    supplier_email?: string | null;
    status?: string;
    submission_date?: string;
  }): Promise<TenderSubmissionRow> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .insert(submissionData)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderSubmissionRow;
  }

  async updateSubmission(id: string, submissionData: Record<string, unknown>): Promise<TenderSubmissionRow> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .update(submissionData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderSubmissionRow;
  }

  async deleteSubmission(id: string): Promise<void> {
    const { error } = await supabase
      .from('tender_submissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}
