// Repository interface for Document entity
import { Document, DocumentType, DocumentStatus } from '../entities/Document';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';

export interface IDocumentRepository {
  // CRUD operations
  findById(id: string): Promise<Document | null>;
  findAll(): Promise<Document[]>;
  save(document: Document): Promise<void>;
  update(id: string, data: Partial<Document>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByProjectId(projectId: string): Promise<Document[]>;
  findByPhaseId(phaseId: string): Promise<Document[]>;
  findByInspectionId(inspectionId: string): Promise<Document[]>;
  findByPaymentId(paymentId: string): Promise<Document[]>;
  findBySupplierId(supplierId: string): Promise<Document[]>;
  findByType(type: DocumentType): Promise<Document[]>;
  findByStatus(status: DocumentStatus): Promise<Document[]>;
  
  // Tag-based queries
  findByTag(tag: string): Promise<Document[]>;
  findByTags(tags: string[]): Promise<Document[]>;
  getByTags(tags: string[]): Promise<DocumentDTO[]>;
  
  // Search
  search(query: string): Promise<Document[]>;
  
  // Deadline-based queries
  findOverdue(): Promise<Document[]>;
  findDueSoon(days: number): Promise<Document[]>;
  
  // Sharing
  findSharedWithSuppliers(): Promise<Document[]>;
  findInternalOnly(): Promise<Document[]>;
  
  // Statistics
  countByType(projectId: string): Promise<Record<DocumentType, number>>;
  countByStatus(projectId: string): Promise<Record<DocumentStatus, number>>;
  getTotalSize(projectId: string): Promise<number>;
  
  // Additional methods
  findByProjectId(projectId: string): Promise<DocumentDTO[]>;
  findByInspectionId(inspectionId: string): Promise<DocumentDTO[]>;
  findByPaymentId(paymentId: string): Promise<DocumentDTO[]>;
}
