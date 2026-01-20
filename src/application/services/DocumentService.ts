/**
 * Document Service
 * Implements business logic for document management
 * Following hexagonal architecture principles
 */

import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Document, DocumentType } from '@/domain/entities/Document';
import { DocumentMapper, DocumentResponseDto, CreateDocumentRequestDto, UpdateDocumentRequestDto } from '@/infrastructure/transformers/DocumentMapper';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Export DTOs for external use
export { DocumentResponseDto, CreateDocumentRequestDto, UpdateDocumentRequestDto };

export class DocumentService {
  private documentRepository: IDocumentRepository;

  constructor() {
    this.documentRepository = RepositoryFactory.getDocumentRepository();
  }

  /**
   * Create document using domain entity
   */
  async createDocument(document: Document): Promise<Document> {
    try {
      await this.documentRepository.save(document);
      return document;
    } catch (error) {
      console.error('DocumentService.createDocument failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create document');
    }
  }

  /**
   * Get document by ID - returns domain entity
   */
  async getDocumentById(id: string): Promise<Document | null> {
    try {
      const supabaseData = await this.documentRepository.findById(id);
      if (!supabaseData) return null;
      
      // Transform Supabase data to domain entity
      return DocumentMapper.toDomain(supabaseData);
    } catch (error) {
      console.error('DocumentService.getDocumentById failed:', error);
      throw error;
    }
  }

  /**
   * Get documents by project - returns domain entities
   */
  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    try {
      const supabaseData = await this.documentRepository.findByProjectId(projectId);
      return supabaseData.map(doc => DocumentMapper.toDomain(doc));
    } catch (error) {
      console.error('DocumentService.getDocumentsByProject failed:', error);
      throw error;
    }
  }

  /**
   * Get project documents - for backward compatibility
   */
  async getProjectDocuments(projectId: string): Promise<any[]> {
    try {
      console.log('Getting project documents:', projectId);
      // Implementation would go here with repository pattern
      // return await this.documentRepository.findByProjectId(projectId);
      return [];
    } catch (error) {
      console.error('Error getting project documents:', error);
      return [];
    }
  }

  /**
   * Get inspection documents
   */
  async getInspectionDocuments(inspectionId: string): Promise<any[]> {
    try {
      console.log('Getting inspection documents:', inspectionId);
      // Implementation would go here with repository pattern
      return [];
    } catch (error) {
      console.error('Error getting inspection documents:', error);
      return [];
    }
  }

  /**
   * Get payment documents
   */
  async getPaymentDocuments(paymentId: string): Promise<any[]> {
    try {
      console.log('Getting payment documents:', paymentId);
      // Implementation would go here with repository pattern
      return [];
    } catch (error) {
      console.error('Error getting payment documents:', error);
      return [];
    }
  }

  /**
   * Get bank guarantee project
   */
  async getBankGuaranteeProject(guaranteeId: string): Promise<any> {
    try {
      console.log('Getting bank guarantee project:', guaranteeId);
      // Implementation would go here with repository pattern
      return null;
    } catch (error) {
      console.error('Error getting bank guarantee project:', error);
      return null;
    }
  }

  /**
   * Get insurance project
   */
  async getInsuranceProject(insuranceId: string): Promise<any> {
    try {
      console.log('Getting insurance project:', insuranceId);
      // Implementation would go here with repository pattern
      return null;
    } catch (error) {
      console.error('Error getting insurance project:', error);
      return null;
    }
  }

  /**
   * Get project documents by tags
   */
  async getProjectDocumentsByTags(projectId: string, tags: string[]): Promise<any[]> {
    try {
      console.log('Getting project documents by tags:', projectId, tags);
      // Implementation would go here with repository pattern
      return [];
    } catch (error) {
      console.error('Error getting project documents by tags:', error);
      return [];
    }
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    try {
      const existingDoc = await this.getDocumentById(id);
      if (!existingDoc) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      const updatedDoc = { ...existingDoc, ...updates };
      await this.documentRepository.update(id, updatedDoc);
      return updatedDoc;
    } catch (error) {
      console.error('DocumentService.updateDocument failed:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await this.documentRepository.delete(id);
    } catch (error) {
      console.error('DocumentService.deleteDocument failed:', error);
      throw error;
    }
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(type: DocumentType): Promise<Document[]> {
    try {
      const supabaseData = await this.documentRepository.findByType(type);
      return supabaseData.map(doc => DocumentMapper.toDomain(doc));
    } catch (error) {
      console.error('DocumentService.getDocumentsByType failed:', error);
      throw error;
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(query: string, projectId?: string): Promise<Document[]> {
    try {
      const supabaseData = await this.documentRepository.search(query, projectId);
      return supabaseData.map(doc => DocumentMapper.toDomain(doc));
    } catch (error) {
      console.error('DocumentService.searchDocuments failed:', error);
      throw error;
    }
  }

  /**
   * Static method for backward compatibility
   */
  static async getProjectDocuments(projectId: string): Promise<any[]> {
    const service = new DocumentService();
    return service.getProjectDocuments(projectId);
  }

  /**
   * Static method for backward compatibility
   */
  static async getInspectionDocuments(inspectionId: string): Promise<any[]> {
    const service = new DocumentService();
    return service.getInspectionDocuments(inspectionId);
  }

  /**
   * Static method for backward compatibility
   */
  static async getPaymentDocuments(paymentId: string): Promise<any[]> {
    const service = new DocumentService();
    return service.getPaymentDocuments(paymentId);
  }

  /**
   * Static method for backward compatibility
   */
  static async getBankGuaranteeProject(guaranteeId: string): Promise<any> {
    const service = new DocumentService();
    return service.getBankGuaranteeProject(guaranteeId);
  }

  /**
   * Static method for backward compatibility
   */
  static async getInsuranceProject(insuranceId: string): Promise<any> {
    const service = new DocumentService();
    return service.getInsuranceProject(insuranceId);
  }

  /**
   * Static method for backward compatibility
   */
  static async getProjectDocumentsByTags(projectId: string, tags: string[]): Promise<any[]> {
    const service = new DocumentService();
    return service.getProjectDocumentsByTags(projectId, tags);
  }
}
