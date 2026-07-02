/**
 * Supabase Adapter for Tender Document Repository
 * Implements ITenderDocumentRepository interface using Supabase
 */

import { TenderDocument, TenderDocumentCategory, TenderDocumentStatus } from '@/domain/entities/TenderDocument';
import { ITenderDocumentRepository } from '@/domain/repositories/ITenderDocumentRepository';
import { TenderDocumentTransformer } from '@/dtos/transforms/TenderDocumentTransformer';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

export class SupabaseTenderDocumentAdapter implements ITenderDocumentRepository {
  
  // Helper method to transform database row to entity
  private rowToEntity(row: any): TenderDocument {
    return TenderDocumentTransformer.toEntity({
      id: row.id,
      project_id: row.project_id,
      document_id: row.document_id,
      category: row.category,
      subcategory: row.subcategory,
      is_required: row.is_required,
      is_submitted: row.is_submitted,
      submission_date: row.submission_date,
      reviewer_notes: row.reviewer_notes,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }

  // Helper method to transform entity to database row
  private entityToRow(entity: TenderDocument): any {
    return {
      id: entity.id,
      project_id: entity.projectId,
      document_id: entity.documentId,
      category: entity.category,
      subcategory: entity.subcategory,
      is_required: entity.isRequired,
      is_submitted: entity.isSubmitted,
      submission_date: entity.submissionDate?.toISOString(),
      reviewer_notes: entity.reviewerNotes,
      status: entity.status,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  async findById(id: string): Promise<TenderDocument | null> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error finding tender document by ID:', error);
        return null;
      }

      return data ? this.rowToEntity(data) : null;
    } catch (error) {
      console.error('Unexpected error finding tender document by ID:', error);
      return null;
    }
  }

  async findAll(): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding all tender documents:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding all tender documents:', error);
      return [];
    }
  }

  async save(tenderDocument: TenderDocument): Promise<TenderDocument> {
    try {
      const row = this.entityToRow(tenderDocument);
      
      const { data, error } = await supabase
        .from('tender_documents')
        .upsert(row)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to save tender document: ${error.message}`);
      }

      return this.rowToEntity(data);
    } catch (error) {
      console.error('Error saving tender document:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<TenderDocument>): Promise<TenderDocument> {
    try {
      // Transform partial entity to database row format
      const updateData: any = {};
      
      if (data.category !== undefined) updateData.category = data.category;
      if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
      if (data.isRequired !== undefined) updateData.is_required = data.isRequired;
      if (data.isSubmitted !== undefined) updateData.is_submitted = data.isSubmitted;
      if (data.submissionDate !== undefined) updateData.submission_date = data.submissionDate.toISOString();
      if (data.reviewerNotes !== undefined) updateData.reviewer_notes = data.reviewerNotes;
      if (data.status !== undefined) updateData.status = data.status;
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from('tender_documents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update tender document: ${error.message}`);
      }

      return this.rowToEntity(result);
    } catch (error) {
      console.error('Error updating tender document:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tender_documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete tender document: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting tender document:', error);
      throw error;
    }
  }

  async findByProjectId(projectId: string): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding tender documents by project ID:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding tender documents by project ID:', error);
      return [];
    }
  }

  async findByDocumentId(documentId: string): Promise<TenderDocument | null> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error) {
        console.error('Error finding tender document by document ID:', error);
        return null;
      }

      return data ? this.rowToEntity(data) : null;
    } catch (error) {
      console.error('Unexpected error finding tender document by document ID:', error);
      return null;
    }
  }

  async findByCategory(category: TenderDocumentCategory): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding tender documents by category:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding tender documents by category:', error);
      return [];
    }
  }

  async findBySubcategory(subcategory: string): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('subcategory', subcategory)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding tender documents by subcategory:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding tender documents by subcategory:', error);
      return [];
    }
  }

  async findByStatus(status: TenderDocumentStatus): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding tender documents by status:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding tender documents by status:', error);
      return [];
    }
  }

  async findRequired(projectId: string): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_required', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding required tender documents:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding required tender documents:', error);
      return [];
    }
  }

  async findSubmitted(projectId: string): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_submitted', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding submitted tender documents:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding submitted tender documents:', error);
      return [];
    }
  }

  async findPending(projectId: string): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['submitted', 'reviewed'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding pending tender documents:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding pending tender documents:', error);
      return [];
    }
  }

  async findOverdue(projectId: string): Promise<TenderDocument[]> {
    try {
      // Find documents that are more than 30 days old and not approved
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('project_id', projectId)
        .lt('created_at', thirtyDaysAgo.toISOString())
        .neq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding overdue tender documents:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding overdue tender documents:', error);
      return [];
    }
  }

  async findByProjectAndCategory(projectId: string, category: TenderDocumentCategory): Promise<TenderDocument[]> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding tender documents by project and category:', error);
        return [];
      }

      return data ? data.map(row => this.rowToEntity(row)) : [];
    } catch (error) {
      console.error('Unexpected error finding tender documents by project and category:', error);
      return [];
    }
  }

  async updateStatus(ids: string[], status: TenderDocumentStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('tender_documents')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .in('id', ids);

      if (error) {
        throw new Error(`Failed to update tender document status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating tender document status:', error);
      throw error;
    }
  }

  async countByProject(projectId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('tender_documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) {
        console.error('Error counting tender documents by project:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Unexpected error counting tender documents by project:', error);
      return 0;
    }
  }

  async countByStatus(projectId: string): Promise<Record<TenderDocumentStatus, number>> {
    try {
      const { data, error } = await supabase
        .from('tender_documents')
        .select('status')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error counting tender documents by status:', error);
        return {
          draft: 0,
          submitted: 0,
          reviewed: 0,
          approved: 0,
          rejected: 0
        };
      }

      const counts = {
        draft: 0,
        submitted: 0,
        reviewed: 0,
        approved: 0,
        rejected: 0
      };

      data?.forEach(item => {
        if (item.status in counts) {
          counts[item.status as TenderDocumentStatus]++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Unexpected error counting tender documents by status:', error);
      return {
        draft: 0,
        submitted: 0,
        reviewed: 0,
        approved: 0,
        rejected: 0
      };
    }
  }
}
