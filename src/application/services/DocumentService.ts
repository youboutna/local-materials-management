/**
 * Document Service
 * Implements business logic for document management
 * Following hexagonal architecture principles
 */

import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Document, DocumentType } from '@/domain/entities/Document';
import { DocumentMapper, DocumentResponseDto, CreateDocumentRequestDto, UpdateDocumentRequestDto } from '@/infrastructure/transformers/DocumentMapper';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Export DTOs for external use
export { DocumentResponseDto, CreateDocumentRequestDto, UpdateDocumentRequestDto };

export class DocumentService {
  constructor(private documentRepository: IDocumentRepository) {}

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
      
      // Transform Supabase data array to domain entities
      return DocumentMapper.toDomainArray(supabaseData);
    } catch (error) {
      console.error('DocumentService.getDocumentsByProject failed:', error);
      throw error;
    }
  }

  /**
   * Get all documents - returns domain entities
   */
  async getAllDocuments(): Promise<Document[]> {
    try {
      const supabaseData = await this.documentRepository.findAll();
      
      // Transform Supabase data array to domain entities
      return DocumentMapper.toDomainArray(supabaseData);
    } catch (error) {
      console.error('DocumentService.getAllDocuments failed:', error);
      throw error;
    }
  }

  /**
   * Get documents by type - returns domain entities
   */
  async getDocumentsByType(type: DocumentType): Promise<Document[]> {
    try {
      const supabaseData = await this.documentRepository.findByType(type);
      
      // Transform Supabase data array to domain entities
      return DocumentMapper.toDomainArray(supabaseData);
    } catch (error) {
      console.error('DocumentService.getDocumentsByType failed:', error);
      throw error;
    }
  }

  /**
   * Get documents with complex query - returns domain entities
   */
  async getDocumentsByQuery(query: any): Promise<Document[]> {
    try {
      // For now, use findAll - could be enhanced with complex queries
      const supabaseData = await this.documentRepository.findAll();
      
      // Transform Supabase data array to domain entities
      return DocumentMapper.toDomainArray(supabaseData);
    } catch (error) {
      console.error('DocumentService.getDocumentsByQuery failed:', error);
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
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete document');
    }
  }

  /**
   * Update document using domain entity
   */
  async updateDocument(id: string, updateData: Partial<Document>): Promise<Document> {
    try {
      await this.documentRepository.update(id, updateData);
      
      // Get updated document and return as domain entity
      const updated = await this.documentRepository.findById(id);
      if (!updated) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }
      
      return DocumentMapper.toDomain(updated);
    } catch (error) {
      console.error('DocumentService.updateDocument failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update document');
    }
  }

  /**
   * Upload document with file handling
   */
  async uploadDocument(requestDto: CreateDocumentRequestDto, uploadedBy: string): Promise<DocumentResponseDto> {
    try {
      // Transform request DTO to domain entity
      const documentEntity = DocumentMapper.toDomainFromCreateDto(requestDto, uploadedBy);
      
      // Create document via service
      const createdDocument = await this.createDocument(documentEntity);
      
      // Transform domain entity to response DTO
      return DocumentMapper.toResponseDto(createdDocument);
    } catch (error) {
      console.error('DocumentService.uploadDocument failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload document');
    }
  }
}
