// @ts-nocheck
/**
 * Supabase Compliance Adapter
 * Implements the compliance repository interface using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { IComplianceRepository } from '@/domain/repositories/IComplianceRepository';
import { ComplianceItem, ComplianceDocument, ComplianceNote, ComplianceAuditEntry } from '@/domain/entities/Compliance';
import { ComplianceTransformer } from '@/dtos/transforms/ComplianceTransformer';

export class SupabaseComplianceAdapter implements IComplianceRepository {
  // Main compliance operations
  async findById(id: string): Promise<ComplianceItem | null> {
    const { data, error } = await supabase
      .from('compliance_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error finding compliance item by id:', error);
      return null;
    }

    return data ? ComplianceTransformer.fromSupabase(data) : null;
  }

  async findByProject(projectId: string): Promise<ComplianceItem[]> {
    const { data, error } = await supabase
      .from('compliance_items')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding compliance items by project:', error);
      return [];
    }

    return data?.map(item => ComplianceTransformer.fromSupabase(item)) || [];
  }

  async findByFilter(filter: {
    projectId?: string;
    type?: string;
    status?: string;
    priority?: string;
    responsible?: string;
    deadline?: string;
    riskLevel?: string;
    mitigationRequired?: boolean;
  }): Promise<ComplianceItem[]> {
    let query = supabase
      .from('compliance_items')
      .select('*');

    if (filter.projectId) {
      query = query.eq('project_id', filter.projectId);
    }
    if (filter.type) {
      query = query.eq('type', filter.type);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.priority) {
      query = query.eq('priority', filter.priority);
    }
    if (filter.responsible) {
      query = query.eq('responsible', filter.responsible);
    }
    if (filter.deadline) {
      query = query.eq('deadline', filter.deadline);
    }
    if (filter.mitigationRequired !== undefined) {
      query = query.eq('mitigation_required', filter.mitigationRequired);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding compliance items by filter:', error);
      return [];
    }

    return data?.map(item => ComplianceTransformer.fromSupabase(item)) || [];
  }

  async save(entity: ComplianceItem): Promise<ComplianceItem> {
    const dbRow = ComplianceTransformer.toSupabase(entity);
    const { data, error } = await supabase
      .from('compliance_items')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error saving compliance item:', error);
      throw new Error(`Failed to save compliance item: ${error.message}`);
    }

    return ComplianceTransformer.fromSupabase(data);
  }

  async update(id: string, entity: ComplianceItem): Promise<ComplianceItem> {
    const dbRow = ComplianceTransformer.toSupabase(entity);
    const { data, error } = await supabase
      .from('compliance_items')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating compliance item:', error);
      throw new Error(`Failed to update compliance item: ${error.message}`);
    }

    return ComplianceTransformer.fromSupabase(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting compliance item:', error);
      throw new Error(`Failed to delete compliance item: ${error.message}`);
    }
  }

  // Document operations
  async findDocumentsByComplianceItem(complianceItemId: string): Promise<ComplianceDocument[]> {
    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('compliance_item_id', complianceItemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding compliance documents:', error);
      return [];
    }

    return data?.map(doc => ComplianceTransformer.documentFromSupabase(doc)) || [];
  }

  async saveDocument(document: ComplianceDocument): Promise<ComplianceDocument> {
    const dbRow = ComplianceTransformer.documentToSupabase(document);
    const { data, error } = await supabase
      .from('compliance_documents')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error saving compliance document:', error);
      throw new Error(`Failed to save compliance document: ${error.message}`);
    }

    return ComplianceTransformer.documentFromSupabase(data);
  }

  async updateDocument(id: string, document: Partial<ComplianceDocument>): Promise<ComplianceDocument> {
    const existingDoc = await this.findDocumentById(id);
    if (!existingDoc) {
      throw new Error(`Compliance document with id ${id} not found`);
    }

    const updatedDoc = existingDoc.update(document);
    const dbRow = ComplianceTransformer.documentToSupabase(updatedDoc);
    const { data, error } = await supabase
      .from('compliance_documents')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating compliance document:', error);
      throw new Error(`Failed to update compliance document: ${error.message}`);
    }

    return ComplianceTransformer.documentFromSupabase(data);
  }

  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting compliance document:', error);
      throw new Error(`Failed to delete compliance document: ${error.message}`);
    }
  }

  private async findDocumentById(id: string): Promise<ComplianceDocument | null> {
    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error finding document by id:', error);
      return null;
    }

    return data ? ComplianceTransformer.documentFromSupabase(data) : null;
  }

  // Note operations
  async findNotesByComplianceItem(complianceItemId: string): Promise<ComplianceNote[]> {
    const { data, error } = await supabase
      .from('compliance_notes')
      .select('*')
      .eq('compliance_item_id', complianceItemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding compliance notes:', error);
      return [];
    }

    return data?.map(note => ComplianceTransformer.noteFromSupabase(note)) || [];
  }

  async saveNote(note: ComplianceNote): Promise<ComplianceNote> {
    const dbRow = ComplianceTransformer.noteToSupabase(note);
    const { data, error } = await supabase
      .from('compliance_notes')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error saving compliance note:', error);
      throw new Error(`Failed to save compliance note: ${error.message}`);
    }

    return ComplianceTransformer.noteFromSupabase(data);
  }

  async updateNote(id: string, note: Partial<ComplianceNote>): Promise<ComplianceNote> {
    const existingNote = await this.findNoteById(id);
    if (!existingNote) {
      throw new Error(`Compliance note with id ${id} not found`);
    }

    const updatedNote = existingNote.update(note);
    const dbRow = ComplianceTransformer.noteToSupabase(updatedNote);
    const { data, error } = await supabase
      .from('compliance_notes')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating compliance note:', error);
      throw new Error(`Failed to update compliance note: ${error.message}`);
    }

    return ComplianceTransformer.noteFromSupabase(data);
  }

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting compliance note:', error);
      throw new Error(`Failed to delete compliance note: ${error.message}`);
    }
  }

  private async findNoteById(id: string): Promise<ComplianceNote | null> {
    const { data, error } = await supabase
      .from('compliance_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error finding note by id:', error);
      return null;
    }

    return data ? ComplianceTransformer.noteFromSupabase(data) : null;
  }

  // Audit operations
  async saveAuditEntry(auditEntry: ComplianceAuditEntry): Promise<ComplianceAuditEntry> {
    const dbRow = ComplianceTransformer.auditToSupabase(auditEntry);
    const { data, error } = await supabase
      .from('compliance_audit_log')
      .insert(dbRow)
      .select()
      .single();

    if (error) {
      console.error('Error saving audit entry:', error);
      throw new Error(`Failed to save audit entry: ${error.message}`);
    }

    return ComplianceTransformer.auditFromSupabase(data);
  }

  async findAuditByComplianceItem(complianceItemId: string): Promise<ComplianceAuditEntry[]> {
    const { data, error } = await supabase
      .from('compliance_audit_log')
      .select('*')
      .eq('compliance_item_id', complianceItemId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error finding audit entries:', error);
      return [];
    }

    return data?.map(audit => ComplianceTransformer.auditFromSupabase(audit)) || [];
  }

  // Statistics operations
  async getComplianceStatistics(projectId: string): Promise<{
    totalItems: number;
    approvedItems: number;
    pendingItems: number;
    inProgressItems: number;
    rejectedItems: number;
    criticalItems: number;
    overdueItems: number;
  }> {
    const items = await this.findByProject({ projectId });
    
    const totalItems = items.length;
    const approvedItems = items.filter(item => item.status === 'approved').length;
    const pendingItems = items.filter(item => item.status === 'pending').length;
    const inProgressItems = items.filter(item => item.status === 'in_progress').length;
    const rejectedItems = items.filter(item => item.status === 'rejected').length;
    const criticalItems = items.filter(item => item.priority === 'critical').length;
    const overdueItems = items.filter(item => item.isOverdue()).length;

    return {
      totalItems,
      approvedItems,
      pendingItems,
      inProgressItems,
      rejectedItems,
      criticalItems,
      overdueItems
    };
  }
}
