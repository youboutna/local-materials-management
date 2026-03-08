// @ts-nocheck
/**
 * LocalStorage Document Adapter
 * Implements IDocumentRepository using LocalStorage for DEV_MODE
 * Architecture Hexagonale : [UI] → [Hook] → [Factory] → [Adapter] → [Service] → [Transformers] → [Entities] → [Persistence]
 */

import { 
  IDocumentRepository, 
  Document, 
  DocumentType, 
  DocumentStatus 
} from '@/domain/repositories/IDocumentRepository';
import { DocumentService } from '@/application/services/DocumentService';
import { DocumentMapper } from '@/infrastructure/transformers/DocumentMapper';
import { allDocumentsData, MockDocument } from '@/data/mockData';

// Convert MockDocument to Document format via DocumentService (architecture hexagonale)
const mockDocuments: Document[] = allDocumentsData.map((mock: MockDocument) => {
  // Utiliser DocumentService pour la conversion Mock → Entity → DTO
  const documentEntity = DocumentMapper.toDomainFromMock(mock);
  return DocumentMapper.toResponseDto(documentEntity);
});

export class LocalStorageDocumentAdapter implements IDocumentRepository {
  
  async findById(id: string): Promise<Document | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    const document = documents.find(doc => doc.id === id);
    
    return document || null;
  }

  async findAll(): Promise<Document[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    return documents;
  }

  async save(document: Document): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    const existingIndex = documents.findIndex(doc => doc.id === document.id);
    
    if (existingIndex >= 0) {
      documents[existingIndex] = document;
    } else {
      documents.push(document);
    }
    
    this.saveDocumentsToStorage(documents);
    
    console.log(`[DEV_MODE] Saved document ${document.id}`);
  }

  async update(id: string, data: Partial<Document>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    const documentIndex = documents.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    documents[documentIndex] = {
      ...documents[documentIndex],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    this.saveDocumentsToStorage(documents);
    
    console.log(`[DEV_MODE] Updated document ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    const documentIndex = documents.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    documents.splice(documentIndex, 1);
    this.saveDocumentsToStorage(documents);
    
    console.log(`[DEV_MODE] Deleted document ${id}`);
  }

  async findByProject(projectId: string): Promise<Document[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    return documents.filter(doc => doc.project_id === projectId);
  }

  async findBySupplier(supplierId: string): Promise<Document[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    return documents.filter(doc => doc.supplier_id === supplierId);
  }

  async findByInspection(inspectionId: string): Promise<Document[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    return documents.filter(doc => doc.inspection_id === inspectionId);
  }

  async findByType(type: DocumentType): Promise<Document[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    return documents.filter(doc => doc.document_type === type);
  }

  async findByStatus(status: DocumentStatus): Promise<Document[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    return documents.filter(doc => doc.status === status);
  }

  async search(query: string): Promise<Document[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const documents = this.getDocumentsFromStorage();
    const searchLower = query.toLowerCase();
    
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchLower) ||
      doc.description?.toLowerCase().includes(searchLower)
    );
  }

  // ============= Utility Methods =============

  private getDocumentsFromStorage(): Document[] {
    if (typeof window === 'undefined') return mockDocuments;
    
    const stored = localStorage.getItem('dev_documents');
    return stored ? JSON.parse(stored) : mockDocuments;
  }

  private saveDocumentsToStorage(documents: Document[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_documents', JSON.stringify(documents));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_documents')) {
      localStorage.setItem('dev_documents', JSON.stringify(mockDocuments));
    }
    
    console.log('[DEV_MODE] LocalStorage documents initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_documents');
    
    console.log('[DEV_MODE] LocalStorage documents cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Document[] {
    return this.getDocumentsFromStorage();
  }
}
