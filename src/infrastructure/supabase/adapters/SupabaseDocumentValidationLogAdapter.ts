/**
 * SupabaseDocumentValidationLogAdapter — adaptateur unique pour les journaux de
 * validation documentaire. Lecture via la fonction sécurisée
 * `get_validation_logs`, écriture via la vue publique miroir de
 * `btp.document_validation_logs`.
 */
import { supabase } from '@/integrations/supabase/client';
import type { IDocumentValidationLogRepository } from '@/domain/repositories/IDocumentValidationLogRepository';
import type {
  CreateDocumentValidationLogDTO,
  DocumentValidationLogDTO,
} from '@/dtos/entities/DocumentValidationLogDTO';

const TABLE = 'document_validation_logs';

type Row = {
  id?: string | null;
  document_id?: string | null;
  submission_id?: string | null;
  is_valid?: boolean | null;
  errors?: unknown;
  warnings?: unknown;
  validated_at?: string | null;
  created_at?: string | null;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

const toDTO = (row: Row): DocumentValidationLogDTO => ({
  id: row.id ?? '',
  documentId: row.document_id ?? '',
  submissionId: row.submission_id ?? '',
  isValid: row.is_valid ?? false,
  errors: toStringArray(row.errors),
  warnings: toStringArray(row.warnings),
  validatedAt: row.validated_at ?? row.created_at ?? new Date().toISOString(),
  createdAt: row.created_at ?? new Date().toISOString(),
});

export class SupabaseDocumentValidationLogAdapter implements IDocumentValidationLogRepository {
  async listBySubmission(submissionId: string): Promise<DocumentValidationLogDTO[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_validation_logs', {
      p_submission_id: submissionId,
    });
    if (!error && Array.isArray(data)) return (data as Row[]).map(toDTO);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallback = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('submission_id', submissionId)
      .order('validated_at', { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    return ((fallback.data ?? []) as Row[]).map(toDTO);
  }

  async listByDocument(documentId: string, submissionId: string): Promise<DocumentValidationLogDTO[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select('*')
      .eq('document_id', documentId)
      .eq('submission_id', submissionId)
      .order('validated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Row[]).map(toDTO);
  }

  async create(dto: CreateDocumentValidationLogDTO): Promise<DocumentValidationLogDTO> {
    const payload = {
      document_id: dto.documentId,
      submission_id: dto.submissionId,
      is_valid: dto.isValid,
      errors: dto.errors ?? [],
      warnings: dto.warnings ?? [],
      validated_at: dto.validatedAt ?? new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .insert(payload)
      .select('*')
      .maybeSingle();
    if (error) throw new Error(error.message);
    return toDTO((data ?? payload) as Row);
  }

  async deleteByDocument(documentId: string, submissionId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from(TABLE)
      .delete()
      .eq('document_id', documentId)
      .eq('submission_id', submissionId);
    if (error) throw new Error(error.message);
  }
}
