/**
 * Repository interface for Tender Document entity
 */

import { TenderDocument, TenderDocumentCategory, TenderDocumentStatus } from '../entities/TenderDocument';

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
}
