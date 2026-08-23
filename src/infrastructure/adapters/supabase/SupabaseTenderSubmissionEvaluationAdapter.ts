// ============================================================
// src/infrastructure/adapters/supabase/SupabaseTenderSubmissionEvaluationAdapter.ts
// ============================================================
/**
 * Supabase Tender Submission Evaluation Adapter (Infrastructure)
 * Encapsule les accès directs à `tender_submissions` pour l'évaluation
 * (lecture des soumissions d'un AO + mise à jour scores/notes/statut).
 * Table en snake_case ; le service applicatif expose des DTO camelCase.
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

export interface DBTenderSubmissionEvaluationUpdate {
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected';
  administrative_score?: number;
  technical_score?: number;
  financial_score?: number;
  total_score?: number;
  evaluator_notes?: string;
  reviewer_id?: string;
  reviewed_at?: string;
}

export class SupabaseTenderSubmissionEvaluationAdapter {
  static async getSubmissionsForTender(tenderId: string) {
    const { data, error } = await supabase
      .from('tender_submissions')
      .select(`
        *,
        submission_documents:tender_submission_documents(
          *,
          document:documents(*)
        )
      `)
      .eq('tender_id', tenderId)
      .order('submission_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateEvaluation(submissionId: string, update: DBTenderSubmissionEvaluationUpdate) {
    const { data, error } = await supabase
      .from('tender_submissions')
      .update(update)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
