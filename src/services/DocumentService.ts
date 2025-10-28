import { supabase } from "@/integrations/supabase/client";

export interface DocumentCreateDTO {
  title: string;
  description?: string;
  document_type: any;
  file_name: string;
  mime_type: string;
  file_size: number;
  project_id: string;
  status: 'draft' | 'active' | 'archived';
}

/**
 * Service for managing project documents with DTO pattern
 * Provides abstraction layer over Supabase
 */
export class DocumentService {
  /**
   * Create a new document record
   */
  static async createDocument(document: DocumentCreateDTO): Promise<any> {
    const { data, error } = await supabase
      .from('documents')
      .insert(document as any)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get documents by project ID
   */
  static async getProjectDocuments(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Update document
   */
  static async updateDocument(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Delete document
   */
  static async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}
