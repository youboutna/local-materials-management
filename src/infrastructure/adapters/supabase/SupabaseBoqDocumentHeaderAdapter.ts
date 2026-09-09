/**
 * src/infrastructure/adapters/SupabaseBoqDocumentHeaderAdapter.ts
 * Implémentation Supabase du repository des en-têtes documentaires BOQ
 *
 * ⚠️ INFRASTRUCTURE — Seul endroit qui connaît Supabase
 * ✅ Table : btp.boq_document_headers (schéma btp via VITE_BTP_SCHEMA)
 */
import { IBoqDocumentHeaderRepository } from '@/domain/repositories/IBoqDocumentHeaderRepository';
import { DocumentHeaderDTO } from '@/dtos/boq/DocumentHeaderDTO';
import { DocumentHeaderDBRow, DocumentHeaderTransformer } from '@/dtos/transforms/DocumentHeaderTransformer';
import { BTP_SCHEMA, getSchemaClient } from '@/integrations/supabase/schema-clients';

export class SupabaseBoqDocumentHeaderAdapter implements IBoqDocumentHeaderRepository {
  // Le préfixe de schéma est porté UNE SEULE FOIS par le client (`getSchemaClient`).
  // Les noms de table restent donc nus, comme dans tous les autres adaptateurs BTP.
  private readonly client = getSchemaClient(BTP_SCHEMA) as any;
  private readonly table = 'boq_document_headers';

  async save(documentId: string, header: DocumentHeaderDTO, userId?: string): Promise<DocumentHeaderDTO> {
    const dbRow = DocumentHeaderTransformer.toDBRow(documentId, header, userId);
    const { data: existing, error: existingError } = await this.client
      .from(this.table)
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Failed to read existing BOQ document header: ${existingError.message}`);
    }

    // Une édition des parties documentaires ne doit jamais réinitialiser le
    // workflow, la signature ou l'audit déjà enregistrés.
    const preserved = existing
      ? {
          workflow_stage: existing.workflow_stage,
          validation_status: existing.validation_status,
          validation_comment: existing.validation_comment,
          signed_by: existing.signed_by,
          signed_at: existing.signed_at,
          signature_role: existing.signature_role,
          source_document_id: existing.source_document_id,
          source_document_type: existing.source_document_type,
          next_document_id: existing.next_document_id,
          next_document_type: existing.next_document_type,
          stages_history: existing.stages_history,
          workflow_instance_id: existing.workflow_instance_id,
          metadata: existing.metadata,
          deleted_at: existing.deleted_at,
          created_by: existing.created_by,
        }
      : {};

    const { data: result, error } = await this.client
      .from(this.table)
      .upsert({ ...dbRow, ...preserved }, { onConflict: 'document_id' })
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
    const { data, error } = await this.client
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
    const { data, error } = await this.client
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
    const { data: existing, error: fetchError } = await this.client
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

    const { error } = await this.client
      .from(this.table)
      .update(updates)
      .eq('document_id', documentId);

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Update workflow error:', error);
      throw new Error(`Failed to update workflow stage: ${error.message}`);
    }
  }

  async updateSignature(documentId: string, signedBy: string, signedAt: string, role: string): Promise<void> {
    const { data: existing, error: fetchError } = await this.client
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

    const { error } = await this.client
      .from(this.table)
      .update(updates)
      .eq('document_id', documentId);

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Update signature error:', error);
      throw new Error(`Failed to update signature: ${error.message}`);
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    if (!documentId) throw new Error('Document ID is required');
    const { error } = await this.client
      .from(this.table)
      .delete()
      .eq('document_id', documentId);

    if (error) {
      console.error('[SupabaseBoqDocumentHeaderAdapter] Delete error:', error);
      throw new Error(`Failed to delete BOQ document header: ${error.message}`);
    }
  }
}