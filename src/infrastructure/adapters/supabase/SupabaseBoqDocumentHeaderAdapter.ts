/**
 * src/infrastructure/adapters/SupabaseBoqDocumentHeaderAdapter.ts
 * Implémentation Supabase du repository des en-têtes documentaires BOQ
 *
 * ⚠️ INFRASTRUCTURE — Seul endroit qui connaît Supabase
 * ✅ Table : btp.boq_document_headers (schéma btp via btpClient)
 */
import { IBoqDocumentHeaderRepository } from '@/domain/repositories/IBoqDocumentHeaderRepository';
import { DocumentHeaderDTO } from '@/dtos/boq/DocumentHeaderDTO';
import { DocumentHeaderDBRow, DocumentHeaderTransformer } from '@/dtos/transforms/DocumentHeaderTransformer';
import { btpClient } from '@/integrations/supabase/schema-clients';

export class SupabaseBoqDocumentHeaderAdapter implements IBoqDocumentHeaderRepository {
  private readonly table = 'boq_document_headers';

  async save(documentId: string, header: DocumentHeaderDTO, userId?: string): Promise<DocumentHeaderDTO> {
    const dbRow = DocumentHeaderTransformer.toDBRow(documentId, header, userId);

    const { data: result, error } = await btpClient
      .from(this.table)
      .upsert(dbRow, { onConflict: 'document_id' })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Save error:', error);
      throw new Error(`Failed to save BOQ document header: ${error.message}`);
    }

    if (!result) {
      throw new Error('No data returned from save operation');
    }

    return DocumentHeaderTransformer.fromDBRow(result as unknown as DocumentHeaderDBRow);
  }

  async findByDocumentId(documentId: string): Promise<DocumentHeaderDTO | null> {
    const { data, error } = await btpClient
      .from(this.table)
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Find error:', error);
      throw new Error(`Failed to find BOQ document header: ${error.message}`);
    }

    if (!data) return null;

    return DocumentHeaderTransformer.fromDBRow(data as unknown as DocumentHeaderDBRow);
  }

  async findById(id: string): Promise<DocumentHeaderDTO | null> {
    const { data, error } = await btpClient
      .from(this.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] FindById error:', error);
      throw new Error(`Failed to find BOQ document header: ${error.message}`);
    }

    if (!data) return null;

    return DocumentHeaderTransformer.fromDBRow(data as unknown as DocumentHeaderDBRow);
  }

  async updateWorkflowStage(documentId: string, stage: string): Promise<void> {
    const { data: existing, error: fetchError } = await btpClient
      .from(this.table)
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (fetchError) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Fetch for update error:', fetchError);
      throw new Error(`Failed to fetch existing header: ${fetchError.message}`);
    }

    if (!existing) {
      throw new Error(`Document header not found for documentId: ${documentId}`);
    }

    const row = existing as unknown as DocumentHeaderDBRow;
    const updates = DocumentHeaderTransformer.updateWorkflowInDBRow(row, {
      workflowStage: stage,
      addStage: { stage, by: 'system' },
    });

    const { error } = await btpClient
      .from(this.table)
      .update(updates)
      .eq('document_id', documentId);

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Update workflow error:', error);
      throw new Error(`Failed to update workflow stage: ${error.message}`);
    }
  }

  async updateSignature(documentId: string, signedBy: string, signedAt: string, role: string): Promise<void> {
    const { data: existing, error: fetchError } = await btpClient
      .from(this.table)
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (fetchError) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Fetch for signature error:', fetchError);
      throw new Error(`Failed to fetch existing header: ${fetchError.message}`);
    }

    if (!existing) {
      throw new Error(`Document header not found for documentId: ${documentId}`);
    }

    const row = existing as unknown as DocumentHeaderDBRow;
    const updates = DocumentHeaderTransformer.updateWorkflowInDBRow(row, {
      signedBy,
      signedAt,
      signatureRole: role,
      addStage: { stage: 'signed', by: signedBy },
    });

    const { error } = await btpClient
      .from(this.table)
      .update(updates)
      .eq('document_id', documentId);

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Update signature error:', error);
      throw new Error(`Failed to update signature: ${error.message}`);
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    const { error } = await btpClient
      .from(this.table)
      .delete()
      .eq('document_id', documentId);

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Delete error:', error);
      throw new Error(`Failed to delete BOQ document header: ${error.message}`);
    }
  }
}