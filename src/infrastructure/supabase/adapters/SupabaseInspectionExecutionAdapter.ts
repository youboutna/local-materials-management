/**
 * Supabase Inspection Execution Adapter
 * Implements IInspectionExecutionRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { IInspectionExecutionRepository, InspectionDocument } from '@/domain/repositories/IInspectionExecutionRepository';

export class SupabaseInspectionExecutionAdapter implements IInspectionExecutionRepository {
  // ============= Document Management =============

  async uploadDocuments(inspectionId: string, documents: File[]): Promise<InspectionDocument[]> {
    const uploadedDocs: InspectionDocument[] = [];
    
    for (const file of documents) {
      const filePath = `inspections/${inspectionId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('project-documents').getPublicUrl(filePath);
      
      uploadedDocs.push({
        name: file.name,
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      });
    }

    return uploadedDocs;
  }

  async createDocumentRecords(inspectionId: string, documents: InspectionDocument[]): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    for (const doc of documents) {
      const file = documents.find(d => d.name === doc.name);
      
      const { error: insertError } = await supabase.from('documents').insert({
        title: `Service Fait - ${doc.name}`,
        file_name: doc.name,
        file_url: doc.url,
        file_size: file?.size,
        mime_type: file?.type,
        document_type: 'inspection_validation' as const,
        project_id: inspectionId,
        inspection_id: inspectionId,
        uploaded_by: userId,
        status: 'approved' as const,
        metadata: { 
          progress: parseInt(doc.uploadedAt), 
          validation_type: 'service_fait' 
        }
      } as any);

      if (insertError) throw insertError;
    }
  }

  // ============= Inspection Management =============

  async updateInspection(inspectionId: string, status: string, progress?: number, comments?: string): Promise<void> {
    const { error } = await supabase
      .from('inspections')
      .update({
        status,
        progress_at_inspection: progress,
        comments
      })
      .eq('id', inspectionId);

    if (error) throw error;
  }

  async getInspectionById(inspectionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (error) throw error;
    return data;
  }
}
