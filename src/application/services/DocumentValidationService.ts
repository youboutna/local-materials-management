/**
 * Document Validation Service - Hexagonal Architecture
 * Business logic for document validation and verification
 * 
 * ✅ Utilise les DTOs pour les données
 * ✅ Injection de dépendances via constructeur
 * ✅ Gestion des erreurs avec AppError
 * ✅ Pas de supabase direct dans le service (utilisation du repository)
 * ✅ Séparation des responsabilités
 */

import { DocumentDTO, DocumentStatus } from '@/dtos/entities/DocumentDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { DocumentService } from './DocumentService';
import { NotificationService } from './NotificationService';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    fileSize: number;
    mimeType: string;
    fileName: string;
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
  validationType: 'fileSize' | 'mimeType' | 'content' | 'format' | 'compliance';
  parameters: Record<string, unknown>;
}

export interface ValidationLog {
  id: string;
  documentId: string;
  submissionId: string;
  validationType: string;
  result: ValidationResult;
  validatedAt: string;
  validatedBy?: string;
  processingTimeMs: number;
}

// ============================================================================
// SERVICE
// ============================================================================

export class DocumentValidationService {
  private notificationService: NotificationService;
  private documentService: DocumentService;

  constructor(
    notificationService?: NotificationService,
    documentService?: DocumentService
  ) {
    this.notificationService = notificationService || new NotificationService(
      RepositoryFactory.getNotificationRepository()
    );
    this.documentService = documentService || new DocumentService(
      RepositoryFactory.getDocumentRepository()
    );
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  static getDocumentValidationService(): DocumentValidationService {
    return new DocumentValidationService();
  }

  // ============================================================================
  // CORE VALIDATION
  // ============================================================================

  /**
   * Validate a document
   */
  async validateDocument(request: DocumentValidationRequest): Promise<ValidationResult> {
    try {
      this.validateValidationRequest(request);

      // Get document
      const document = await this.documentService.getDocumentById(request.documentId);
      if (!document) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      // Run validation
      const result = this.performValidation(document, request);

      // Log validation result
      await this.logValidationResult(request.documentId, request.submissionId, result);

      // Send notification if validation fails
      if (!result.isValid) {
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

    const validationPromises = documents.map(async (doc) => {
      try {
        const result = await this.validateDocument(doc);
        return { documentId: doc.documentId, result, error: null };
      } catch (error) {
        console.error(`Error validating document ${doc.documentId}:`, error);
        return {
          documentId: doc.documentId,
          result: {
            isValid: false,
            errors: ['Erreur lors de la validation'],
            warnings: [],
            metadata: {
              fileSize: 0,
              mimeType: 'unknown',
              fileName: 'unknown'
            }
          },
          error: error as Error
        };
      }
    });

    const validationResults = await Promise.all(validationPromises);

    validationResults.forEach(({ documentId, result }) => {
      results[documentId] = result;
    });

    await this.sendBatchValidationSummary(documents, results);

    return results;
  }

  /**
   * Re-run validation for a document
   */
  async revalidateDocument(documentId: string, submissionId: string): Promise<ValidationResult> {
    try {
      await this.clearValidationLogs(documentId, submissionId);
      return await this.validateDocument({
        documentId,
        submissionId,
        validationType: 'advanced'
      });
    } catch (error) {
      console.error('Error revalidating document:', error);
      throw error instanceof AppError ? error : new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Erreur lors de la revalidation du document'
      );
    }
  }

  // ============================================================================
  // VALIDATION LOGS
  // ============================================================================

  /**
   * Get validation logs for a submission
   */
  async getValidationLogs(submissionId: string): Promise<ValidationLog[]> {
    try {
      if (!submissionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submission ID is required');
      }

      // TODO: Implémenter la récupération des logs via repository
      // Pour l'instant, retourner un tableau vide
      return [];
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
      const valid = logs.filter(log => log.result.isValid).length;
      const invalid = total - valid;
      const warnings = logs.reduce((sum, log) => sum + log.result.warnings.length, 0);
      
      const averageProcessingTime = logs.length > 0
        ? logs.reduce((sum, log) => sum + log.processingTimeMs, 0) / logs.length
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

  // ============================================================================
  // VALIDATION RULES
  // ============================================================================

  /**
   * Get available validation rules
   */
  async getValidationRules(category?: string): Promise<ValidationRule[]> {
    try {
      const rules: ValidationRule[] = [
        {
          id: 'file_size_limit',
          name: 'Taille de fichier maximale',
          description: 'Vérifie que la taille du fichier ne dépasse pas la limite autorisée',
          category: 'basic',
          required: true,
          validationType: 'fileSize',
          parameters: { maxSizeMb: 50 }
        },
        {
          id: 'allowed_mime_types',
          name: 'Types de fichiers autorisés',
          description: 'Vérifie que le type MIME est dans la liste des types autorisés',
          category: 'basic',
          required: true,
          validationType: 'mimeType',
          parameters: { 
            allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          }
        },
        {
          id: 'content_scan',
          name: 'Analyse de contenu',
          description: 'Analyse le contenu du document pour détecter des problèmes',
          category: 'advanced',
          required: false,
          validationType: 'content',
          parameters: { scanForViruses: true, checkWatermarks: true }
        },
        {
          id: 'format_compliance',
          name: 'Conformité du format',
          description: 'Vérifie que le document respecte les normes de format requises',
          category: 'compliance',
          required: true,
          validationType: 'format',
          parameters: { pdfVersion: '1.4+', minDpi: 300 }
        }
      ];

      return category 
        ? rules.filter(rule => rule.category === category)
        : rules;
    } catch (error) {
      console.error('Error fetching validation rules:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Erreur lors de la récupération des règles de validation'
      );
    }
  }

  // ============================================================================
  // PRIVATE VALIDATION METHODS
  // ============================================================================

  /**
   * Perform validation on a document
   */
  private performValidation(
    document: DocumentDTO,
    request: DocumentValidationRequest
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. File size validation
    if (document.fileSize !== null && document.fileSize > 50 * 1024 * 1024) {
      errors.push('La taille du fichier dépasse la limite de 50MB');
    }

    // 2. MIME type validation
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (document.mimeType && !allowedMimeTypes.includes(document.mimeType)) {
      errors.push(`Type de fichier non autorisé: ${document.mimeType}`);
    }

    // 3. File name validation
    if (!document.fileName) {
      warnings.push('Le nom du fichier est manquant');
    }

    // 4. Status validation
    if (document.status === DocumentStatus.EXPIRED) {
      warnings.push('Le document est expiré');
    }

    // 5. Category validation
    if (request.expectedCategory && document.metadata?.category !== request.expectedCategory) {
      warnings.push(`Catégorie attendue: ${request.expectedCategory}, reçue: ${document.metadata?.category || 'non spécifiée'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        fileSize: document.fileSize || 0,
        mimeType: document.mimeType || 'unknown',
        fileName: document.fileName || 'unknown'
      }
    };
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

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Log validation result
   */
  private async logValidationResult(
    documentId: string,
    submissionId: string,
    result: ValidationResult
  ): Promise<void> {
    try {
      // TODO: Implémenter via repository
      console.log('Validation logged:', { documentId, submissionId, result });
    } catch (error) {
      console.error('Error logging validation result:', error);
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
        recipient_id: 'system',
        title: 'Échec de validation de document',
        message: `Le document ${request.documentId} a échoué la validation avec ${result.errors.length} erreur(s)`,
        type: 'warning',
        related_id: request.submissionId,
        metadata: {
          documentId: request.documentId,
          submissionId: request.submissionId,
          errors: result.errors,
          warnings: result.warnings
        }
      });
    } catch (error) {
      console.error('Error sending validation failure notification:', error);
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
      const validDocuments = Object.values(results).filter(r => r.isValid).length;
      const invalidDocuments = totalDocuments - validDocuments;

      if (invalidDocuments > 0) {
        await this.notificationService.createNotification({
          recipient_id: 'system',
          title: 'Résumé de validation de documents',
          message: `${validDocuments}/${totalDocuments} documents validés avec succès. ${invalidDocuments} document(s) ont échoué.`,
          type: 'info',
          related_id: requests[0]?.submissionId,
          metadata: {
            totalDocuments: totalDocuments,
            validDocuments: validDocuments,
            invalidDocuments: invalidDocuments,
            submissionId: requests[0]?.submissionId
          }
        });
      }
    } catch (error) {
      console.error('Error sending batch validation summary:', error);
    }
  }

  /**
   * Clear validation logs for a document
   */
  private async clearValidationLogs(documentId: string, submissionId: string): Promise<void> {
    try {
      // TODO: Implémenter via repository
      console.log('Validation logs cleared:', { documentId, submissionId });
    } catch (error) {
      console.error('Error clearing validation logs:', error);
    }
  }
}

// ============================================================================
// STATIC METHODS FOR BACKWARD COMPATIBILITY
// ============================================================================

export const DocumentValidationServiceStatic = {
  async validateDocument(
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
  },

  async validateMultipleDocuments(
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
  },

  async getValidationLogs(submissionId: string): Promise<ValidationLog[]> {
    const service = new DocumentValidationService();
    return service.getValidationLogs(submissionId);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default DocumentValidationService;

// Re-export types
export type { ValidationLog as DocValidationLog, DocumentValidationRequest as DocValidationRequest, ValidationRule as DocValidationRule };
