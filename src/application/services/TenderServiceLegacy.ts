/**
 * TenderServiceLegacy - In-memory implementation
 * Uses local storage while database schema is aligned
 */

import { supabase } from '@/integrations/supabase/client';

export interface TenderDTO {
  id: string;
  title: string;
  description: string;
  project_id?: string | null;
  tender_number: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  market_type?: string;
  financing_source?: string;
  budget_min?: number;
  budget_max?: number;
  publication_date?: string;
  deadline_date?: string;
  opening_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenderCreateDTO {
  title: string;
  description: string;
  project_id?: string | null;
  tender_number?: string;
  status?: 'draft' | 'published' | 'closed' | 'awarded';
  market_type?: string;
  financing_source?: string;
  budget_min?: number;
  budget_max?: number;
  publication_date?: string;
  deadline_date?: string;
  opening_date?: string;
}

export interface TenderSubmissionDTO {
  id: string;
  tender_id: string;
  supplier_id: string;
  status: string;
  submitted_at: string;
  documents?: any[];
}

// In-memory store
const tendersStore = new Map<string, TenderDTO>();
const submissionsStore = new Map<string, TenderSubmissionDTO[]>();

export class TenderServiceLegacy {
  /**
   * Get all tenders
   */
  static async getAllTenders(): Promise<TenderDTO[]> {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TenderDTO[];
    } catch (error) {
      console.error('Error getting all tenders:', error);
      throw new Error(`Failed to get all tenders: ${(error as Error).message}`);
    }
  }

  /**
   * Get tender by ID
   */
  static async getTenderById(id: string): Promise<TenderDTO | null> {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as TenderDTO;
    } catch (error) {
      console.error('Error getting tender by ID:', error);
      throw new Error(`Failed to get tender by ID: ${(error as Error).message}`);
    }
  }

  /**
   * Create a new tender
   */
  static async createTender(tender: TenderCreateDTO): Promise<TenderDTO> {
    try {
      const tenderNumber = tender.tender_number || `AO-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('tenders')
        .insert({
          ...tender,
          tender_number: tenderNumber,
          status: tender.status || 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      return data as TenderDTO;
    } catch (error) {
      console.error('Error creating tender:', error);
      throw new Error(`Failed to create tender: ${(error as Error).message}`);
    }
  }

  /**
   * Update tender
   */
  static async updateTender(id: string, updates: Partial<TenderCreateDTO>): Promise<TenderDTO> {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TenderDTO;
    } catch (error) {
      console.error('Error updating tender:', error);
      throw new Error(`Failed to update tender: ${(error as Error).message}`);
    }
  }

  /**
   * Delete tender
   */
  static async deleteTender(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting tender:', error);
      throw new Error(`Failed to delete tender: ${(error as Error).message}`);
    }
  }

  /**
   * Get tender submissions
   */
  static async getTenderSubmissions(tenderId: string): Promise<TenderSubmissionDTO[]> {
    try {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select('*')
        .eq('tender_id', tenderId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      // Map database rows to DTO, handling missing fields
      return (data || []).map((row: any) => ({
        id: row.id,
        tender_id: row.tender_id,
        supplier_id: row.supplier_id || row.user_id || '',
        status: row.status || 'pending',
        submitted_at: row.submitted_at || row.created_at,
        documents: row.documents || []
      }));
    } catch (error) {
      console.error('Error getting tender submissions:', error);
      throw new Error(`Failed to get tender submissions: ${(error as Error).message}`);
    }
  }

  /**
   * Get tenders by status
   */
  static async getTendersByStatus(status: 'draft' | 'published' | 'closed' | 'awarded'): Promise<TenderDTO[]> {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TenderDTO[];
    } catch (error) {
      console.error('Error getting tenders by status:', error);
      throw new Error(`Failed to get tenders by status: ${(error as Error).message}`);
    }
  }

  /**
   * Search tenders
   */
  static async searchTenders(searchTerm: string): Promise<TenderDTO[]> {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tender_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TenderDTO[];
    } catch (error) {
      console.error('Error searching tenders:', error);
      throw new Error(`Failed to search tenders: ${(error as Error).message}`);
    }
  }

  /**
   * Get published tenders available for submission
   */
  static async getPublishedTendersForSubmission(): Promise<TenderDTO[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', 'published')
        .gte('deadline_date', now)
        .order('deadline_date', { ascending: true });

      if (error) throw error;
      return (data || []) as TenderDTO[];
    } catch (error) {
      console.error('Error getting published tenders for submission:', error);
      throw new Error(`Failed to get published tenders for submission: ${(error as Error).message}`);
    }
  }

  /**
   * Get tenders by project
   */
  static async getTendersByProject(projectId: string): Promise<TenderDTO[]> {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TenderDTO[];
    } catch (error) {
      console.error('Error getting tenders by project:', error);
      throw new Error(`Failed to get tenders by project: ${(error as Error).message}`);
    }
  }

  /**
   * Get tender statistics
   */
  static async getTenderStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byMarketType: Record<string, number>;
    byFinancingSource: Record<string, number>;
    publishedThisMonth: number;
    closingThisMonth: number;
  }> {
    try {
      const tenders = await this.getAllTenders();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const byStatus: Record<string, number> = {};
      const byMarketType: Record<string, number> = {};
      const byFinancingSource: Record<string, number> = {};
      let publishedThisMonth = 0;
      let closingThisMonth = 0;

      tenders.forEach(tender => {
        // By status
        byStatus[tender.status] = (byStatus[tender.status] || 0) + 1;

        // By market type
        if (tender.market_type) {
          byMarketType[tender.market_type] = (byMarketType[tender.market_type] || 0) + 1;
        }

        // By financing source
        if (tender.financing_source) {
          byFinancingSource[tender.financing_source] = (byFinancingSource[tender.financing_source] || 0) + 1;
        }

        // Published this month
        if (tender.publication_date) {
          const pubDate = new Date(tender.publication_date);
          if (pubDate >= startOfMonth && pubDate <= endOfMonth) {
            publishedThisMonth++;
          }
        }

        // Closing this month
        if (tender.deadline_date) {
          const deadlineDate = new Date(tender.deadline_date);
          if (deadlineDate >= startOfMonth && deadlineDate <= endOfMonth) {
            closingThisMonth++;
          }
        }
      });

      return {
        total: tenders.length,
        byStatus,
        byMarketType,
        byFinancingSource,
        publishedThisMonth,
        closingThisMonth
      };
    } catch (error) {
      console.error('Error getting tender stats:', error);
      throw new Error(`Failed to get tender stats: ${(error as Error).message}`);
    }
  }

  /**
   * Validate tender data
   */
  static validateTenderData(data: TenderCreateDTO | Partial<TenderCreateDTO>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Tender title is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Tender description is required');
    }

    if (data.deadline_date && isNaN(new Date(data.deadline_date).getTime())) {
      errors.push('Invalid deadline date format');
    }

    if (data.publication_date && isNaN(new Date(data.publication_date).getTime())) {
      errors.push('Invalid publication date format');
    }

    if (data.budget_min && data.budget_max && data.budget_min > data.budget_max) {
      errors.push('Minimum budget cannot be greater than maximum budget');
    }

    if (data.status && !['draft', 'published', 'closed', 'awarded'].includes(data.status)) {
      errors.push('Status must be one of: draft, published, closed, awarded');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
