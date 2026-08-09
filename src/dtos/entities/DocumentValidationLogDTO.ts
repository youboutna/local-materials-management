/**
 * DocumentValidationLogDTO — journal de validation documentaire (camelCase).
 * Table cible : btp.document_validation_logs (vue publique miroir).
 */

export interface DocumentValidationLogDTO {
  id: string;
  documentId: string;
  submissionId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string;
  createdAt: string;
}

export interface CreateDocumentValidationLogDTO {
  documentId: string;
  submissionId: string;
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  validatedAt?: string;
}
