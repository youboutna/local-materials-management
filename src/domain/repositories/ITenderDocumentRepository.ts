/**
 * Repository interface for Tender Document entity
 */

import { TenderDocument, TenderDocumentCategory, TenderDocumentStatus } from '../entities/TenderDocument';

// Read-model row shapes for joined queries (kept snake_case at the
// repository boundary; services/DTOs expose camelCase to consumers).
export interface TenderDocumentJoinedRow {
  id: string;
  tenderId: string;
  documentId: string;
  category: string;
  subcategory?: string;
  isRequired?: boolean;
  reviewerNotes?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  document?: {
    id: string;
    title?: string;
    description?: string;
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
  } | null;
}

export interface TenderStepDocumentRow {
  id: string;
  tenderId: string;
  documentId: string;
  category: string;
  subcategory: string;
  isRequired?: boolean;
  reviewerNotes?: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  document?: {
    id: string;
    title?: string;
    description?: string;
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
  } | null;
  stepInfo?: {
    stepTitle?: string;
    stepNumber?: number;
  };
}

export interface ITenderDocumentRepository {
  // CRUD operations
  findById(id: string): Promise<TenderDocument | null>;
  findAll(): Promise<TenderDocument[]>;
  save(tenderDocument: TenderDocument): Promise<TenderDocument>;
  update(id: string, data: Partial<TenderDocument>): Promise<TenderDocument>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByProjectId(projectId: string): Promise<TenderDocument[]>;
  findByDocumentId(documentId: string): Promise<TenderDocument | null>;
  findByCategory(category: TenderDocumentCategory): Promise<TenderDocument[]>;
  findBySubcategory(subcategory: string): Promise<TenderDocument[]>;
  findByStatus(status: TenderDocumentStatus): Promise<TenderDocument[]>;
  
  // Specific queries
  findRequired(projectId: string): Promise<TenderDocument[]>;
  findSubmitted(projectId: string): Promise<TenderDocument[]>;
  findPending(projectId: string): Promise<TenderDocument[]>;
  findOverdue(projectId: string): Promise<TenderDocument[]>;
  
  // Batch operations
  findByProjectAndCategory(projectId: string, category: TenderDocumentCategory): Promise<TenderDocument[]>;
  updateStatus(ids: string[], status: TenderDocumentStatus): Promise<void>;
  
  // Statistics
  countByProject(projectId: string): Promise<number>;
  countByStatus(projectId: string): Promise<Record<TenderDocumentStatus, number>>;

  // Joined read models (tender-scoped, used by tender document management UI)
  findByTenderIdWithDocument(tenderId: string): Promise<TenderDocumentJoinedRow[]>;
  findStepDocumentsByTenderId(tenderId: string): Promise<TenderStepDocumentRow[]>;
}
