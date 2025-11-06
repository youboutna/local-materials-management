import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    file_size: number;
    mime_type: string;
    file_name: string;
  };
}

export class DocumentValidationService {
  /**
   * Validate a document using the server-side edge function
   */
  static async validateDocument(
    documentId: string,
    submissionId: string,
    expectedCategory?: string
  ): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-document', {
        body: {
          document_id: documentId,
          submission_id: submissionId,
          expected_category: expectedCategory
        }
      });

      if (error) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Erreur lors de la validation: ${error.message}`
        );
      }

      return data as ValidationResult;
    } catch (error) {
      console.error('Error validating document:', error);
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Erreur lors de la validation du document'
      );
    }
  }

  /**
   * Validate multiple documents
   */
  static async validateMultipleDocuments(
    documents: Array<{ documentId: string; submissionId: string; category?: string }>
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    for (const doc of documents) {
      try {
        const result = await this.validateDocument(
          doc.documentId,
          doc.submissionId,
          doc.category
        );
        results[doc.documentId] = result;
      } catch (error) {
        console.error(`Error validating document ${doc.documentId}:`, error);
        results[doc.documentId] = {
          is_valid: false,
          errors: ['Erreur lors de la validation'],
          warnings: [],
          metadata: {
            file_size: 0,
            mime_type: 'unknown',
            file_name: 'unknown'
          }
        };
      }
    }

    return results;
  }

  /**
   * Get validation logs for a submission
   */
  static async getValidationLogs(submissionId: string) {
    try {
      // Direct query with type suppression
      const { data, error } = await (supabase as any)
        .from('document_validation_logs')
        .select('*')
        .eq('submission_id', submissionId)
        .order('validated_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching validation logs:', error);
      throw new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la récupération des logs de validation'
      );
    }
  }
}
