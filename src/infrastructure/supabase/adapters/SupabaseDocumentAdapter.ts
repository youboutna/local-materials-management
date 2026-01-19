// Supabase Adapter for Document Repository - Fixed for DB schema
import { supabase } from '@/integrations/supabase/client';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Document, DocumentType, DocumentStatus } from '@/domain/entities/Document';

export class SupabaseDocumentAdapter implements IDocumentRepository {
  private mapToEntity(data: any): Document {
    const typeMap: Record<string, DocumentType> = {
      'contract': 'contract', 'inspection_report': 'pv', 'location_photo': 'photo',
      'project_report': 'report', 'tender': 'specification', 'employee_record': 'other',
      'supplier_catalog': 'specification', 'supplier_info': 'other', 'task_assignment': 'other'
    };
    const statusMap: Record<string, DocumentStatus> = {
      'pending': 'pending_review', 'validated': 'approved', 'rejected': 'rejected', 'archived': 'archived', 'draft': 'draft'
    };
    return new Document(
      data.id, data.project_id || null, data.phase_id || null, data.inspection_id || null,
      data.payment_id || null, data.supplier_id || null, data.title, data.description || null,
      typeMap[data.document_type] || 'other', statusMap[data.status] || 'draft',
      data.file_name || null, data.file_url || null, data.file_size || null, data.mime_type || null,
      data.tags || [], data.is_internal_only ?? false, data.is_shared_with_suppliers ?? false,
      data.deadline_date || null, data.assigned_to || null, data.uploaded_by || null,
      data.created_at, data.updated_at
    );
  }

  async findById(id: string): Promise<Document | null> {
    const { data, error } = await supabase.from('documents').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async save(document: Document): Promise<void> {
    const dbType = document.documentType === 'pv' ? 'inspection_report' : document.documentType === 'photo' ? 'location_photo' : 'project_report';
    const dbStatus = document.status === 'approved' ? 'validated' : document.status === 'pending_review' ? 'pending' : document.status;
    const { error } = await supabase.from('documents').insert([{
      id: document.id, title: document.title, description: document.description,
      document_type: dbType as any, status: dbStatus as any, file_url: document.fileUrl,
      file_name: document.fileName, file_size: document.fileSize, mime_type: document.mimeType,
      project_id: document.projectId, phase_id: document.phaseId, inspection_id: document.inspectionId,
      payment_id: document.paymentId, supplier_id: document.supplierId, uploaded_by: document.uploadedBy,
      tags: document.tags, is_internal_only: document.isInternalOnly, is_shared_with_suppliers: document.isSharedWithSuppliers
    }]);
    if (error) throw new Error(`Failed to save document: ${error.message}`);
  }

  async update(id: string, data: Partial<Document>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.status !== undefined) updateData.status = data.status === 'approved' ? 'validated' : data.status === 'pending_review' ? 'pending' : data.status;
    if (data.tags !== undefined) updateData.tags = data.tags;
    const { error } = await supabase.from('documents').update(updateData).eq('id', id);
    if (error) throw new Error(`Failed to update document: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  }

  async findByProjectId(projectId: string): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').eq('project_id', projectId);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByPhaseId(phaseId: string): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').eq('phase_id', phaseId);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByInspectionId(inspectionId: string): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').eq('inspection_id', inspectionId);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByPaymentId(paymentId: string): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').eq('payment_id', paymentId);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findBySupplierId(supplierId: string): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').eq('supplier_id', supplierId);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByType(type: DocumentType): Promise<Document[]> {
    const dbType = type === 'pv' ? 'inspection_report' : type === 'photo' ? 'location_photo' : 'project_report';
    const { data, error } = await supabase.from('documents').select('*').eq('document_type', dbType);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByStatus(status: DocumentStatus): Promise<Document[]> {
    const statusMapToDb: Record<DocumentStatus, string> = {
      'approved': 'approved', 'pending_review': 'pending_review', 'rejected': 'rejected', 'archived': 'archived', 'draft': 'draft'
    };
    const dbStatus = statusMapToDb[status] || status;
    const { data, error } = await supabase.from('documents').select('*').eq('status', dbStatus as any);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByTag(tag: string): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').contains('tags', [tag]);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByTags(tags: string[]): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').overlaps('tags', tags);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async search(query: string): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findOverdue(): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').lt('deadline_date', new Date().toISOString()).neq('status', 'approved');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findDueSoon(days: number): Promise<Document[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const { data, error } = await supabase.from('documents').select('*').gte('deadline_date', now.toISOString()).lte('deadline_date', futureDate.toISOString());
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findSharedWithSuppliers(): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').eq('is_shared_with_suppliers', true);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findInternalOnly(): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').eq('is_internal_only', true);
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async countByType(projectId: string): Promise<Record<DocumentType, number>> { return {} as Record<DocumentType, number>; }
  async countByStatus(projectId: string): Promise<Record<DocumentStatus, number>> { return {} as Record<DocumentStatus, number>; }
  async getTotalSize(projectId: string): Promise<number> { return 0; }
}
