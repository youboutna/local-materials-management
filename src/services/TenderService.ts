import { supabase } from "@/integrations/supabase/client";
import { TenderRepository } from './TenderRepository';
import { EntityToDTOMapper } from './EntityToDTOMapper';

export interface TenderDTO {
  id: string;
  title: string;
  description: string;
  project_id?: string | null;
  launch_date?: string | null;
  attribution_date?: string | null;
  selection_mode?: string | null;
  market_type?: string | null;
  financing_source?: string | null;
  project_reference?: string | null;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  created_at: string;
  updated_at: string;
  tender_number?: string | null;
  publication_date?: string | null;
  deadline_date?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  evaluation_criteria?: any;
  eligibility_requirements?: any;
}

export interface TenderCreateDTO {
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  status?: 'draft' | 'published' | 'closed' | 'awarded';
  tender_number?: string;
  publication_date?: string;
  deadline_date?: string;
  budget_min?: number;
  budget_max?: number;
  evaluation_criteria?: any;
  eligibility_requirements?: any;
}

export interface TenderSubmissionDTO {
  id: string;
  tender_id: string;
  supplier_id?: string | null;
  supplier_name: string;
  submission_date: string;
  status: string;
  total_amount?: number | null;
  [key: string]: any;
}

/**
 * Service for managing tenders with DTO pattern
 * Uses repository pattern and DTO mapping
 */
export class TenderService {
  private static repository = new TenderRepository();

  /**
   * Get all tenders
   */
  static async getAllTenders(): Promise<TenderDTO[]> {
    const entities = await this.repository.findAll();
    return entities.map(entity => EntityToDTOMapper.tenderEntityToDTO(entity));
  }

  /**
   * Get tender by ID
   */
  static async getTenderById(id: string): Promise<TenderDTO | null> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as TenderDTO | null;
  }

  /**
   * Create a new tender
   */
  static async createTender(tender: TenderCreateDTO): Promise<TenderDTO> {
    const { data, error } = await supabase
      .from('tenders')
      .insert({
        ...tender,
        status: tender.status || 'draft'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderDTO;
  }

  /**
   * Update tender
   */
  static async updateTender(id: string, updates: Partial<TenderCreateDTO>): Promise<TenderDTO> {
    const { data, error } = await supabase
      .from('tenders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as TenderDTO;
  }

  /**
   * Delete tender
   */
  static async deleteTender(id: string): Promise<void> {
    const { error } = await supabase
      .from('tenders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Get tender submissions
   */
  static async getTenderSubmissions(tenderId: string): Promise<TenderSubmissionDTO[]> {
    const { data, error } = await supabase
      .from('tender_submissions')
      .select('*')
      .eq('tender_id', tenderId)
      .order('submission_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderSubmissionDTO[];
  }

  /**
   * Get tenders by status
   */
  static async getTendersByStatus(status: 'draft' | 'published' | 'closed' | 'awarded'): Promise<TenderDTO[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderDTO[];
  }

  /**
   * Search tenders
   */
  static async searchTenders(searchTerm: string): Promise<TenderDTO[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tender_number.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TenderDTO[];
  }

  /**
   * Get published tenders available for supplier submission (Phase 2 + valid deadline)
   */
  static async getPublishedTendersForSubmission(): Promise<TenderDTO[]> {
    const entities = await this.repository.findPublishedPhase2WithValidDeadline();
    return entities.map(entity => EntityToDTOMapper.tenderEntityToDTO(entity));
  }
}
