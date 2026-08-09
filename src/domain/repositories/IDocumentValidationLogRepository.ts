/**
 * IDocumentValidationLogRepository — port de persistance des journaux de
 * validation documentaire (aucune dépendance infrastructure ici).
 */
import type {
  CreateDocumentValidationLogDTO,
  DocumentValidationLogDTO,
} from '@/dtos/entities/DocumentValidationLogDTO';

export interface IDocumentValidationLogRepository {
  listBySubmission(submissionId: string): Promise<DocumentValidationLogDTO[]>;
  listByDocument(documentId: string, submissionId: string): Promise<DocumentValidationLogDTO[]>;
  create(dto: CreateDocumentValidationLogDTO): Promise<DocumentValidationLogDTO>;
  deleteByDocument(documentId: string, submissionId: string): Promise<void>;
}
