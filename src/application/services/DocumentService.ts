/**
 * Document Service - Hexagonal Architecture
 * Business logic for document management
 */

import { Document as DocumentEntity, DocumentType } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { DocumentTransformer } from '@/dtos/transforms/DocumentTransformer';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO } from '@/dtos/entities/DocumentDTO';
import { DocumentResponseDto } from '@/dtos/entities/DocumentResponseDto';

// Ensure Document entity has required properties
interface RepositoryDocument {
  id: string;
  title: string;
  documentType: DocumentType;
  projectId?: string;
  phaseId?: string;
  inspectionId?: string;
  paymentId?: string;
  supplierId?: string;
  description?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl: string;
  mimeType?: string;
  status: string;
  isInternalOnly: boolean;
  isSharedWithSuppliers: boolean;
  deadlineDate?: string;
  assignedTo?: string;
  metadata: Record<string, unknown>;
  category?: string;
  subcategory?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: string;
  tags: string[];
}

// Service DTOs for data exchange
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
    private documentTransformer: DocumentTransformer = new DocumentTransformer()
  ) {}

  /**
   * Get documents by phase ID
   */
  async getDocumentsByPhase(phaseId: string): Promise<DocumentResponseDto[]> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const documents = await this.documentRepository.findAll() as RepositoryDocument[];
      const phaseDocuments = documents.filter(doc => 
        doc.phaseId === phaseId
      );
      
      return phaseDocuments.map(doc => this.documentTransformer.toResponseDto(doc));
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
      const documents = await this.documentRepository.findAll() as RepositoryDocument[];
      return documents.map(doc => this.documentTransformer.toResponseDto(doc));
    } catch (error) {
      console.error('DocumentService.getAllDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all documents');
    }
  }

  /**
   * Get project documents
   */
  static async getProjectDocuments(projectId: string): Promise<DocumentDTO[]> {
    const repo = RepositoryFactory.getDocumentRepository();
    const documents = await repo.findByProjectId(projectId) as RepositoryDocument[];
    return documents.map(doc => ({
      ...doc,
      category: doc.category || 'general',
      subcategory: doc.subcategory || null
    }));
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
  async createDocument(data: CreateDocumentDTO): Promise<DocumentResponseDto> {
    try {
      if (!data.title || !data.documentType) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title and document type are required');
      }

      const documentEntity = this.documentTransformer.fromCreateDto(data);
      const createdDocument = await this.documentRepository.save(documentEntity);
      
      return this.documentTransformer.toResponseDto(createdDocument);
    } catch (error) {
      console.error('DocumentService.createDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create document');
    }
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: UpdateDocumentDTO): Promise<DocumentResponseDto | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document ID is required');
      }

      const existing = await this.documentRepository.findById(id) as RepositoryDocument | null;
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      const updateEntity = this.documentTransformer.fromUpdateDto(updates);
      await this.documentRepository.update(id, updateEntity);
      
      const updatedDocument = await this.documentRepository.findById(id) as RepositoryDocument | null;
      
      if (!updatedDocument) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated document');
      }

      return this.documentTransformer.toResponseDto(updatedDocument);
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

      const existing = await this.documentRepository.findById(id) as RepositoryDocument | null;
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      await this.documentRepository.delete(id);
    } catch (error) {
      console.error('DocumentService.deleteDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete document');
    }
  }
}
