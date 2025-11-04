// Repository pattern for Tender CRUD operations
import { supabase } from '@/integrations/supabase/client';
import { TenderEntity, TenderSubmissionEntity } from '@/types/tender.entity';

export class TenderRepository {
  // ============= Tender CRUD =============
  
  /**
   * Find tender by ID
   */
  async findById(id: string): Promise<TenderEntity | null> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as TenderEntity | null;
  }

  /**
   * Find all tenders
   */
  async findAll(): Promise<TenderEntity[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderEntity[];
  }

  /**
   * Find tenders by status
   */
  async findByStatus(status: 'draft' | 'published' | 'closed' | 'awarded'): Promise<TenderEntity[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderEntity[];
  }

  /**
   * Search tenders
   */
  async search(searchTerm: string): Promise<TenderEntity[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tender_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderEntity[];
  }

  /**
   * Find published tenders in phase 2 with valid deadline
   */
  async findPublishedPhase2WithValidDeadline(): Promise<TenderEntity[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('status', 'published')
      .eq('current_phase', 2)
      .gte('deadline_date', new Date().toISOString())
      .order('deadline_date', { ascending: true });
    
    if (error) throw error;
    return (data || []) as TenderEntity[];
  }

  /**
   * Create tender
   */
  async create(tenderData: Omit<TenderEntity, 'id' | 'created_at' | 'updated_at'>): Promise<TenderEntity> {
    const { data, error } = await supabase
      .from('tenders')
      .insert(tenderData)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderEntity;
  }

  /**
   * Update tender
   */
  async update(id: string, tenderData: Partial<TenderEntity>): Promise<TenderEntity> {
    const { data, error } = await supabase
      .from('tenders')
      .update(tenderData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderEntity;
  }

  /**
   * Delete tender
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ============= Tender Submissions =============

  /**
   * Find submissions for a tender
   */
  async findSubmissionsByTenderId(tenderId: string): Promise<TenderSubmissionEntity[]> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .select('*')
      .eq('tender_id', tenderId)
      .order('submission_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderSubmissionEntity[];
  }

  /**
   * Find submission by ID
   */
  async findSubmissionById(id: string): Promise<TenderSubmissionEntity | null> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as TenderSubmissionEntity | null;
  }

  /**
   * Create tender submission
   */
  async createSubmission(submissionData: {
    tender_id: string;
    user_id: string;
    supplier_name?: string | null;
    supplier_email?: string | null;
    status?: string;
    submission_date?: string;
  }): Promise<TenderSubmissionEntity> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .insert(submissionData)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderSubmissionEntity;
  }

  /**
   * Update tender submission
   */
  async updateSubmission(id: string, submissionData: Partial<TenderSubmissionEntity>): Promise<TenderSubmissionEntity> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .update(submissionData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderSubmissionEntity;
  }

  /**
   * Delete tender submission
   */
  async deleteSubmission(id: string): Promise<void> {
    const { error } = await supabase
      .from('tender_submissions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}
