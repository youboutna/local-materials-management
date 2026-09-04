/**
 * src/infrastructure/adapters/SupabaseBoqDocumentHeaderAdapter.ts
 * Implémentation Supabase du repository des en-têtes documentaires BOQ
 *
 * ⚠️ INFRASTRUCTURE — Seul endroit qui connaît Supabase
 */
import { IBoqDocumentHeaderRepository } from '@/domain/repositories/IBoqDocumentHeaderRepository';
import { DocumentHeaderDTO } from '@/dtos/boq/DocumentHeaderDTO';
import { DocumentHeaderTransformer, DocumentHeaderDBRow } from '@/dtos/transforms/DocumentHeaderTransformer';
import { BTP_SCHEMA, getSchemaClient } from '@/integrations/supabase/schema-clients';

/** Schéma BTP lu depuis `.env` (fallback `btp`). */
const BTP_SCHEMA_FROM_ENV = import.meta.env.VITE_BTP_SCHEMA || 'btp';

/** Table hébergée dans le schéma `btp` (absente des types générés `public`). */
type UntypedTable = { from: (table: string) => any };
const db = () => getSchemaClient(BTP_SCHEMA_FROM_ENV) as unknown as UntypedTable;

export class SupabaseBoqDocumentHeaderAdapter implements IBoqDocumentHeaderRepository {
  private readonly table = `${BTP_SCHEMA_FROM_ENV}.boq_document_headers`;

  async save(documentId: string, header: DocumentHeaderDTO, userId?: string): Promise<DocumentHeaderDTO> {
    const dbRow = DocumentHeaderTransformer.toDBRow(documentId, header, userId);

    const { data: result, error } = await db()
      .from(this.table)
      .upsert(dbRow, { onConflict: 'document_id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save BOQ document header: ${error.message}`);
    }

    if (!result) {
      throw new Error('No data returned from save operation');
    }

    return DocumentHeaderTransformer.fromDBRow(result as unknown as DocumentHeaderDBRow);
  }

  async findByDocumentId(documentId: string): Promise<DocumentHeaderDTO | null> {
    const { data, error } = await db()
      .from(this.table)
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find BOQ document header: ${error.message}`);
    }

    if (!data) return null;

    return DocumentHeaderTransformer.fromDBRow(data as unknown as DocumentHeaderDBRow);
  }

  async findById(id: string): Promise<DocumentHeaderDTO | null> {
    const { data, error } = await db()
      .from(this.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find BOQ document header: ${error.message}`);
    }

    if (!data) return null;

    return DocumentHeaderTransformer.fromDBRow(data as unknown as DocumentHeaderDBRow);
  }

  async updateWorkflowStage(documentId: string, stage: string): Promise<void> {
    const { data: existing, error: fetchError } = await db()
      .from(this.table)
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (fetchError) {
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

    const { error } = await db()
      .from(this.table)
      .update(updates)
      .eq('document_id', documentId);

    if (error) {
      throw new Error(`Failed to update workflow stage: ${error.message}`);
    }
  }

  async updateSignature(documentId: string, signedBy: string, signedAt: string, role: string): Promise<void> {
    const { data: existing, error: fetchError } = await db()
      .from(this.table)
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (fetchError) {
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

    const { error } = await db()
      .from(this.table)
      .update(updates)
      .eq('document_id', documentId);

    if (error) {
      throw new Error(`Failed to update signature: ${error.message}`);
    }
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    const { error } = await db()
      .from(this.table)
      .delete()
      .eq('document_id', documentId);

    if (error) {
      throw new Error(`Failed to delete BOQ document header: ${error.message}`);
    }
  }
}