/**
 * Document Service - Hexagonal Architecture
 * Business logic for document management
 */

import { Document, DocumentType } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { DocumentDomainTransformer } from '@/dtos/transforms/DocumentDomainTransformer';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Service DTOs for data exchange
export interface DocumentResponseDto {
  id: string;
  title: string;
  type: DocumentType;
  projectId?: string;
  fileUrl?: string;
  status?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequestDto {
  title: string;
  type: DocumentType;
  projectId?: string;
  description?: string;
  fileUrl?: string;
}

export interface UpdateDocumentRequestDto {
  title?: string;
  description?: string;
  status?: string;
}

export interface DocumentSearchDto {
  query: string;
  projectId?: string;
  tags?: string[];
  documentType?: DocumentType;
  status?: string;
}

export class DocumentService {
  constructor(
    private documentRepository: IDocumentRepository = RepositoryFactory.getDocumentRepository(),
    private documentTransformer: DocumentDomainTransformer = new DocumentDomainTransformer()
  ) {}

  /**
   * Get documents by phase ID
   */
  async getDocumentsByPhase(phaseId: string): Promise<{ data: any[] }> {
    try {
      // For now, return mock data as the repository doesn't have this method yet
      // TODO: Implement proper phase-based document retrieval
      console.warn('DocumentService.getDocumentsByPhase: Using mock data');
      
      return {
        data: [
          {
            id: 'mock-document-1',
            document_type: 'inspection',
            phase_id: phaseId
          }
        ]
      };
    } catch (error) {
      console.error('DocumentService.getDocumentsByPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get documents by phase');
    }
  }

  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<DocumentResponseDto[]> {
    try {
      const documents = await this.documentRepository.findAll();
      return documents.map(doc => this.mapToDTO(doc));
    } catch (error) {
      console.error('DocumentService.getAllDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all documents');
    }
  }

  /**
   * Get project documents
   */
  async getProjectDocuments(projectId: string): Promise<DocumentResponseDto[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const documents = await this.documentRepository.findByProjectId(projectId);
      return documents.map(doc => this.mapToDTO(doc));
    } catch (error) {
      console.error('DocumentService.getProjectDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project documents');
    }
  }

  /**
   * Get inspection documents
   */
  async getInspectionDocuments(inspectionId: string): Promise<DocumentResponseDto[]> {
    try {
      if (!inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      // For now, return empty array as inspection-specific repository is not available
      // TODO: Implement proper inspection document retrieval when inspection repository is available
      console.warn('DocumentService.getInspectionDocuments: Inspection-specific repository not available');
      return [];
    } catch (error) {
      console.error('DocumentService.getInspectionDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection documents');
    }
  }

  /**
   * Get payment documents
   */
  async getPaymentDocuments(paymentId: string): Promise<DocumentResponseDto[]> {
    try {
      if (!paymentId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID is required');
      }

      // For now, return empty array as payment-specific repository is not available
      // TODO: Implement proper payment document retrieval when payment repository is available
      console.warn('DocumentService.getPaymentDocuments: Payment-specific repository not available');
      return [];
    } catch (error) {
      console.error('DocumentService.getPaymentDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment documents');
    }
  }

  /**
   * Get bank guarantee project
   */
  async getBankGuaranteeProject(guaranteeId: string): Promise<DocumentResponseDto | null> {
    try {
      if (!guaranteeId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Guarantee ID is required');
      }

      // For now, return null as bank guarantee-specific repository is not available
      // TODO: Implement proper bank guarantee document retrieval when bank guarantee repository is available
      console.warn('DocumentService.getBankGuaranteeProject: Bank guarantee-specific repository not available');
      return null;
    } catch (error) {
      console.error('DocumentService.getBankGuaranteeProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get bank guarantee project');
    }
  }

  /**
   * Get insurance project
   */
  async getInsuranceProject(insuranceId: string): Promise<DocumentResponseDto | null> {
    try {
      if (!insuranceId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Insurance ID is required');
      }

      // For now, return null as insurance-specific repository is not available
      // TODO: Implement proper insurance document retrieval when insurance repository is available
      console.warn('DocumentService.getInsuranceProject: Insurance-specific repository not available');
      return null;
    } catch (error) {
      console.error('DocumentService.getInsuranceProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get insurance project');
    }
  }

  /**
   * Get project documents by tags
   */
  async getProjectDocumentsByTags(projectId: string, tags: string[]): Promise<DocumentResponseDto[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      if (!tags || tags.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tags are required');
      }

      // For now, return empty array as tag-based repository is not available
      // TODO: Implement proper tag-based document retrieval when repository supports it
      console.warn('DocumentService.getProjectDocumentsByTags: Tag-based repository not available');
      return [];
    } catch (error) {
      console.error('DocumentService.getProjectDocumentsByTags failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project documents by tags');
    }
  }

  /**
   * Create document
   */
  async createDocument(data: CreateDocumentRequestDto): Promise<DocumentResponseDto> {
    try {
      // Validate required fields
      if (!data.title || !data.type) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title and document type are required');
      }

      // Create entity from DTO
      const documentEntity = this.mapToEntity(data);
      
      // For now, return mock data as create method is not available in repository
      // TODO: Implement proper document creation when repository supports it
      console.warn('DocumentService.createDocument: Create method not available in repository');
      
      const mockDocument = {
        ...documentEntity,
        id: `doc_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return this.mapToDTO(mockDocument);
    } catch (error) {
      console.error('DocumentService.createDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create document');
    }
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: UpdateDocumentRequestDto): Promise<DocumentResponseDto | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document ID is required');
      }

      const existing = await this.documentRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      // Create update entity
      const updateEntity = this.mapToUpdateEntity(updates);
      
      // Update through repository
      await this.documentRepository.update(id, updateEntity);
      
      // Get updated document
      const updatedDocument = await this.documentRepository.findById(id);
      
      if (!updatedDocument) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated document');
      }

      return this.mapToDTO(updatedDocument);
    } catch (error) {
      console.error('DocumentService.updateDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update document');
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document ID is required');
      }

      const existing = await this.documentRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      await this.documentRepository.delete(id);
    } catch (error) {
      console.error('DocumentService.deleteDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete document');
    }
  }

  /**
   * Map repository result to DTO
   */
  private mapToDTO(repositoryResult: Document | Record<string, unknown>): DocumentResponseDto {
    const result = repositoryResult as Record<string, unknown>;
    
    return {
      id: (result.id as string) || '',
      title: (result.title as string) || '',
      type: (result.type as DocumentType) || 'other',
      projectId: result.projectId as string,
      fileUrl: result.fileUrl as string,
      status: result.status as string,
      expiryDate: result.expiryDate as string,
      createdAt: (result.createdAt as string) || new Date().toISOString(),
      updatedAt: (result.updatedAt as string) || new Date().toISOString()
    };
  }

  /**
   * Map DTO to entity
   */
  private mapToEntity(dto: CreateDocumentRequestDto): Record<string, unknown> {
    return {
      title: dto.title,
      type: dto.type,
      projectId: dto.projectId,
      description: dto.description,
      fileUrl: dto.fileUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Map update DTO to entity
   */
  private mapToUpdateEntity(dto: UpdateDocumentRequestDto): Record<string, unknown> {
    return {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      updatedAt: new Date().toISOString()
    };
  }
}
