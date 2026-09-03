/**
 * src/domain/repositories/IBoqDocumentHeaderRepository.ts
 * Port pour la persistance des en-têtes documentaires BOQ
 *
 * ⚠️ DOMAINE — Interface pure, pas d'implémentation technique
 */
import { DocumentHeaderDTO } from '@/dtos/boq/DocumentHeaderDTO';

export interface IBoqDocumentHeaderRepository {
  save(documentId: string, header: DocumentHeaderDTO, userId?: string): Promise<DocumentHeaderDTO>;
  findByDocumentId(documentId: string): Promise<DocumentHeaderDTO | null>;
  findById(id: string): Promise<DocumentHeaderDTO | null>;
  updateWorkflowStage(documentId: string, stage: string): Promise<void>;
  updateSignature(documentId: string, signedBy: string, signedAt: string, role: string): Promise<void>;
  deleteByDocumentId(documentId: string): Promise<void>;
}