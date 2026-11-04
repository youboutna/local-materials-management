import type {
  ITenderSubmissionRepository,
  TenderSubmissionActivityLog,
  TenderSubmissionDocumentInsert,
  TenderSubmissionInsert,
  TenderSubmissionStatus,
} from '@/domain/repositories/ITenderSubmissionRepository';

async function btp(): Promise<any> {
  const { btpClient } = await import('@/integrations/supabase/schema-clients');
  return btpClient;
}

export class SupabaseTenderSubmissionAdapter implements ITenderSubmissionRepository {
  async findByTenderAndUser(tenderId: string, userId: string) {
    const { data, error } = await (await btp())
      .from('tender_submissions').select('*')
      .eq('tender_id', tenderId).eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  async findById(submissionId: string) {
    const { data, error } = await (await btp())
      .from('tender_submissions').select('*').eq('id', submissionId).single();
    if (error) throw error;
    return data;
  }

  async findByUser(userId: string) {
    const { data, error } = await (await btp())
      .from('tender_submissions').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async listStatusesByTender(tenderId: string) {
    const { data, error } = await (await btp())
      .from('tender_submissions').select('status').eq('tender_id', tenderId);
    if (error) throw error;
    return (data ?? []).map((r: any) => r.status as string);
  }

  async insert(input: TenderSubmissionInsert) {
    const { data, error } = await (await btp())
      .from('tender_submissions')
      .insert({
        tender_id: input.tenderId,
        user_id: input.userId,
        supplier_name: input.supplierName,
        supplier_email: input.supplierEmail,
        submission_date: input.submissionDate,
        status: input.status,
      })
      .select().single();
    if (error) throw error;
    if (!data) throw new Error('Submission not created');
    return data;
  }

  async delete(submissionId: string) {
    const { error } = await (await btp()).from('tender_submissions').delete().eq('id', submissionId);
    if (error) throw error;
  }

  async updateStatus(submissionId: string, status: TenderSubmissionStatus, reviewComment?: string) {
    const row: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (reviewComment) row.review_comment = reviewComment;
    const { error } = await (await btp()).from('tender_submissions').update(row).eq('id', submissionId);
    if (error) throw error;
  }

  async attachDocument(input: TenderSubmissionDocumentInsert) {
    const client = await btp();
    const { data: document, error: docError } = await client
      .from('documents')
      .insert({
        title: input.fileName,
        description: `${input.subcategory} pour soumission appel d'offres`,
        file_url: input.fileUrl,
        file_name: input.fileName,
        mime_type: input.mimeType,
        file_size: input.fileSize,
        document_type: 'tender',
        uploaded_by: input.uploadedBy,
        metadata: {
          tender_id: input.tenderId,
          submission_id: input.submissionId,
          category: input.category,
          subcategory: input.subcategory,
        },
      })
      .select().single();
    if (docError || !document) throw docError ?? new Error('Document not created');

    const { error: linkError } = await client.from('tender_submission_documents').insert({
      submission_id: input.submissionId,
      document_id: document.id,
      category: input.category,
      subcategory: input.subcategory,
    });
    if (linkError) {
      await client.from('documents').delete().eq('id', document.id);
      throw linkError;
    }
  }

  async findDocuments(submissionId: string) {
    const client = await btp();
    const { data: links, error } = await client
      .from('tender_submission_documents').select('*')
      .eq('submission_id', submissionId).order('created_at', { ascending: false });
    if (error) throw error;
    const ids = (links ?? []).map((l: any) => l.document_id).filter(Boolean);
    if (ids.length === 0) return [];
    const { data: docs, error: docError } = await client
      .from('documents').select('id,title,file_name,file_url,file_size,metadata').in('id', ids);
    if (docError) throw docError;
    const byId = new Map((docs ?? []).map((d: any) => [d.id, d]));
    return (links ?? []).map((l: any) => ({ ...l, document: byId.get(l.document_id) ?? null }));
  }

  async findActivityLogs(submissionId: string): Promise<TenderSubmissionActivityLog[]> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await (supabase as any).rpc('get_submission_activity_logs', { p_submission_id: submissionId });
    if (error) throw error;
    return (data ?? []) as TenderSubmissionActivityLog[];
  }
}
