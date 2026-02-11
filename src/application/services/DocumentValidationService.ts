/**
 * Document Validation Service - Hexagonal Architecture
 * Business logic for document validation and verification
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { supabase } from '@/integrations/supabase/client';
import type { ExtendedSupabaseClient } from '@/types/supabase-helpers';
import { NotificationService } from './NotificationService';
import { DocumentService } from './DocumentService';

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

export interface DocumentValidationRequest {
  documentId: string;
  submissionId: string;
  expectedCategory?: string;
  validationType?: 'basic' | 'advanced' | 'compliance';
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  required: boolean;
  validationType: 'file_size' | 'mime_type' | 'content' | 'format' | 'compliance';
  parameters: Record<string, any>;
}

export interface ValidationLog {
  id: string;
  document_id: string;
  submission_id: string;
  validation_type: string;
  result: ValidationResult;
  validated_at: string;
  validated_by?: string;
  processing_time_ms: number;
}

export class DocumentValidationService {
  private notificationService: NotificationService;
  private documentService: DocumentService;

  constructor(
    notificationService?: NotificationService,
    documentService?: DocumentService
  ) {
    this.notificationService = notificationService || new NotificationService();
    this.documentService = documentService || new DocumentService();
  }

  /**
   * Validate a document using the server-side edge function
   */
  async validateDocument(request: DocumentValidationRequest): Promise<ValidationResult> {
    try {
      this.validateValidationRequest(request);

      // Get document metadata for validation
      const document = await this.documentService.getDocumentById(request.documentId);
      if (!document) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      // Call validation edge function
      const { data, error } = await supabase.functions.invoke('validate-document', {
        body: {
          document_id: request.documentId,
          submission_id: request.submissionId,
          expected_category: request.expectedCategory,
          validation_type: request.validationType || 'basic',
          file_metadata: {
            file_size: document.fileSize,
            mime_type: document.mimeType,
            file_name: document.fileName
          }
        }
      });

      if (error) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Erreur lors de la validation: ${error.message}`
        );
      }

      const result = data as ValidationResult;

      // Log validation result
      await this.logValidationResult(request.documentId, request.submissionId, result);

      // Send notification if validation fails
      if (!result.is_valid) {
        await this.sendValidationFailureNotification(request, result);
      }

      return result;
    } catch (error) {
      console.error('Error validating document:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Erreur lors de la validation du document'
      );
    }
  }

  /**
   * Validate multiple documents in batch
   */
  async validateMultipleDocuments(
    documents: DocumentValidationRequest[]
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    // Process documents in parallel for better performance
    const validationPromises = documents.map(async (doc) => {
      try {
        const result = await this.validateDocument(doc);
        return { documentId: doc.documentId, result, error: null };
      } catch (error) {
        console.error(`Error validating document ${doc.documentId}:`, error);
        return {
          documentId: doc.documentId,
          result: {
            is_valid: false,
            errors: ['Erreur lors de la validation'],
            warnings: [],
            metadata: {
              file_size: 0,
              mime_type: 'unknown',
              file_name: 'unknown'
            }
          },
          error: error as Error
        };
      }
    });

    const validationResults = await Promise.all(validationPromises);

    // Compile results
    validationResults.forEach(({ documentId, result }) => {
      results[documentId] = result;
    });

    // Send batch validation summary notification
    await this.sendBatchValidationSummary(documents, results);

    return results;
  }

  /**
   * Get validation logs for a submission
   */
  async getValidationLogs(submissionId: string): Promise<ValidationLog[]> {
    try {
      if (!submissionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submission ID is required');
      }

      // Direct query with type suppression
      const { data, error } = await (supabase as ExtendedSupabaseClient)
        .from('document_validation_logs')
        .select('*')
        .eq('submission_id', submissionId)
        .order('validated_at', { ascending: false });

      if (error) throw error;
      
      return data as ValidationLog[] || [];
    } catch (error) {
      console.error('Error fetching validation logs:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.DATABASE_ERROR,
        'Erreur lors de la récupération des logs de validation'
      );
    }
  }

  /**
   * Get validation statistics for a submission
   */
  async getValidationStatistics(submissionId: string): Promise<{
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
    averageProcessingTime: number;
  }> {
    try {
      const logs = await this.getValidationLogs(submissionId);
      
      const total = logs.length;
      const valid = logs.filter(log => log.result.is_valid).length;
      const invalid = total - valid;
      const warnings = logs.reduce((sum, log) => sum + log.result.warnings.length, 0);
      
      const averageProcessingTime = logs.length > 0
        ? logs.reduce((sum, log) => sum + log.processing_time_ms, 0) / logs.length
        : 0;

      return {
        total,
        valid,
        invalid,
        warnings,
        averageProcessingTime
      };
    } catch (error) {
      console.error('Error calculating validation statistics:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Erreur lors du calcul des statistiques de validation'
      );
    }
  }

  /**
   * Get available validation rules
   */
  async getValidationRules(category?: string): Promise<ValidationRule[]> {
    try {
      // This would typically come from a configuration table or API
      // For now, return some common validation rules
      const rules: ValidationRule[] = [
        {
          id: 'file_size_limit',
          name: 'Taille de fichier maximale',
          description: 'Vérifie que la taille du fichier ne dépasse pas la limite autorisée',
          category: 'basic',
          required: true,
          validationType: 'file_size',
          parameters: { max_size_mb: 50 }
        },
        {
          id: 'allowed_mime_types',
          name: 'Types de fichiers autorisés',
          description: 'Vérifie que le type MIME est dans la liste des types autorisés',
          category: 'basic',
          required: true,
          validationType: 'mime_type',
          parameters: { 
            allowed_types: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          }
        },
        {
          id: 'content_scan',
          name: 'Analyse de contenu',
          description: 'Analyse le contenu du document pour détecter des problèmes',
          category: 'advanced',
          required: false,
          validationType: 'content',
          parameters: { scan_for_viruses: true, check_watermarks: true }
        },
        {
          id: 'format_compliance',
          name: 'Conformité du format',
          description: 'Vérifie que le document respecte les normes de format requises',
          category: 'compliance',
          required: true,
          validationType: 'format',
          parameters: { pdf_version: '1.4+', min_dpi: 300 }
        }
      ];

      return category 
        ? rules.filter(rule => rule.category === category)
        : rules;
    } catch (error) {
      console.error('Error fetching validation rules:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Erreur lors de la récupération des règles de validation'
      );
    }
  }

  /**
   * Re-run validation for a document
   */
  async revalidateDocument(documentId: string, submissionId: string): Promise<ValidationResult> {
    try {
      // Clear previous validation logs for this document
      await this.clearValidationLogs(documentId, submissionId);
      
      // Run validation again
      return await this.validateDocument({
        documentId,
        submissionId,
        validationType: 'comprehensive'
      });
    } catch (error) {
      console.error('Error revalidating document:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Erreur lors de la revalidation du document'
      );
    }
  }

  /**
   * Validate validation request parameters
   */
  private validateValidationRequest(request: DocumentValidationRequest): void {
    if (!request.documentId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document ID is required');
    }

    if (!request.submissionId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submission ID is required');
    }

    const validValidationTypes = ['basic', 'advanced', 'compliance'];
    if (request.validationType && !validValidationTypes.includes(request.validationType)) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `Invalid validation type. Must be one of: ${validValidationTypes.join(', ')}`
      );
    }
  }

  /**
   * Log validation result to database
   */
  private async logValidationResult(
    documentId: string,
    submissionId: string,
    result: ValidationResult
  ): Promise<void> {
    try {
      const logEntry = {
        document_id: documentId,
        submission_id: submissionId,
        validation_type: 'edge_function',
        result: result,
        validated_at: new Date().toISOString(),
        processing_time_ms: 0 // Would be calculated from actual processing time
      };

      await supabase
        .from('document_validation_logs')
        .insert(logEntry);
    } catch (error) {
      console.error('Error logging validation result:', error);
      // Don't throw error here as it's not critical for the main validation flow
    }
  }

  /**
   * Send notification for validation failure
   */
  private async sendValidationFailureNotification(
    request: DocumentValidationRequest,
    result: ValidationResult
  ): Promise<void> {
    try {
      await this.notificationService.createNotification({
        recipient_id: 'system', // Will be resolved to actual users
        title: 'Échec de validation de document',
        message: `Le document ${request.documentId} a échoué la validation avec ${result.errors.length} erreur(s)`,
        type: 'validation_failure',
        related_id: request.submissionId,
        metadata: {
          document_id: request.documentId,
          submission_id: request.submissionId,
          errors: result.errors,
          warnings: result.warnings
        }
      });
    } catch (error) {
      console.error('Error sending validation failure notification:', error);
      // Don't throw error here as it's not critical for the main validation flow
    }
  }

  /**
   * Send batch validation summary notification
   */
  private async sendBatchValidationSummary(
    requests: DocumentValidationRequest[],
    results: Record<string, ValidationResult>
  ): Promise<void> {
    try {
      const totalDocuments = requests.length;
      const validDocuments = Object.values(results).filter(r => r.is_valid).length;
      const invalidDocuments = totalDocuments - validDocuments;

      if (invalidDocuments > 0) {
        await this.notificationService.createNotification({
          recipient_id: 'system', // Will be resolved to actual users
          title: 'Résumé de validation de documents',
          message: `${validDocuments}/${totalDocuments} documents validés avec succès. ${invalidDocuments} document(s) ont échoué.`,
          type: 'batch_validation_summary',
          related_id: requests[0]?.submissionId,
          metadata: {
            total_documents: totalDocuments,
            valid_documents: validDocuments,
            invalid_documents: invalidDocuments,
            submission_id: requests[0]?.submissionId
          }
        });
      }
    } catch (error) {
      console.error('Error sending batch validation summary:', error);
      // Don't throw error here as it's not critical for the main validation flow
    }
  }

  /**
   * Clear validation logs for a document
   */
  private async clearValidationLogs(documentId: string, submissionId: string): Promise<void> {
    try {
      await supabase
        .from('document_validation_logs')
        .delete()
        .eq('document_id', documentId)
        .eq('submission_id', submissionId);
    } catch (error) {
      console.error('Error clearing validation logs:', error);
      // Don't throw error here as it's not critical for the main validation flow
    }
  }

  // Factory function for getting service instance
  static getDocumentValidationService(): DocumentValidationService {
    return new DocumentValidationService();
  }

  // Static methods for backward compatibility
  static async validateDocument(
    documentId: string,
    submissionId: string,
    expectedCategory?: string
  ): Promise<ValidationResult> {
    const service = new DocumentValidationService();
    return service.validateDocument({
      documentId,
      submissionId,
      expectedCategory,
      validationType: 'basic'
    });
  }

  static async validateMultipleDocuments(
    documents: Array<{ documentId: string; submissionId: string; category?: string }>
  ): Promise<Record<string, ValidationResult>> {
    const service = new DocumentValidationService();
    const requests = documents.map(doc => ({
      documentId: doc.documentId,
      submissionId: doc.submissionId,
      expectedCategory: doc.category,
      validationType: 'basic' as const
    }));
    return service.validateMultipleDocuments(requests);
  }

  static async getValidationLogs(submissionId: string): Promise<any[]> {
    const service = new DocumentValidationService();
    return service.getValidationLogs(submissionId);
  }
}

// Export types for consumers
export type {
  DocumentValidationRequest,
  ValidationRule,
  ValidationLog
};
