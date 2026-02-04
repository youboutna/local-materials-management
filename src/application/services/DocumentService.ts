/**
 * Document Service - Hexagonal Architecture
 * Business logic for document management
 */

import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { DocumentTransformer } from '@/dtos/transforms/DocumentTransformer';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO, DocumentResponseDto, DocumentStatus, DocumentType } from '@/dtos/entities/DocumentDTO';

function isDocumentType(type: string): type is DocumentType {
  return Object.values(DocumentType).includes(type as DocumentType);
}

function isDocumentStatus(status: string): status is DocumentStatus {
  return Object.values(DocumentStatus).includes(status as DocumentStatus);
}

// Add status transition validation
function isValidDocumentStatusTransition(current: DocumentStatus, next: DocumentStatus): boolean {
  const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
    [DocumentStatus.DRAFT]: [DocumentStatus.PENDING_REVIEW, DocumentStatus.ARCHIVED],
    [DocumentStatus.PENDING_REVIEW]: [DocumentStatus.APPROVED, DocumentStatus.REJECTED, DocumentStatus.ARCHIVED],
    [DocumentStatus.APPROVED]: [DocumentStatus.PUBLISHED, DocumentStatus.ARCHIVED],
    [DocumentStatus.REJECTED]: [DocumentStatus.DRAFT, DocumentStatus.ARCHIVED],
    [DocumentStatus.PUBLISHED]: [DocumentStatus.ARCHIVED],
    [DocumentStatus.ARCHIVED]: []
  };
  return validTransitions[current].includes(next);
}

export class DocumentService {
  constructor(
    private documentRepository: IDocumentRepository,
    private documentTransformer: DocumentTransformer
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
  async getProjectDocuments(projectId: string): Promise<DocumentDTO[]> {
    const documents = await this.documentRepository.findByProjectId(projectId) as RepositoryDocument[];
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

      const documents = await this.documentRepository.findByInspectionId(inspectionId);
      return documents.map(doc => {
        return new DocumentResponseDto(
          doc.id,
          doc.title || '',
          doc.description || undefined,
          doc.documentType,
          doc.status as DocumentStatus,
          doc.fileName || undefined,
          doc.fileUrl || undefined,
          doc.fileSize || undefined,
          doc.projectId || undefined,
          doc.assignedTo || undefined,
          doc.deadlineDate || undefined,
          doc.tags,
          doc.isInternalOnly,
          doc.isSharedWithSuppliers,
          doc.uploadedBy || undefined,
          doc.createdAt,
          doc.updatedAt
        );
      });
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

      const documents = await this.documentRepository.findByPaymentId(paymentId);
      return documents.map(doc => {
        return new DocumentResponseDto(
          doc.id,
          doc.title || '',
          doc.description || undefined,
          doc.documentType,
          doc.status as DocumentStatus,
          doc.fileName || undefined,
          doc.fileUrl || undefined,
          doc.fileSize || undefined,
          doc.projectId || undefined,
          doc.assignedTo || undefined,
          doc.deadlineDate || undefined,
          doc.tags,
          doc.isInternalOnly,
          doc.isSharedWithSuppliers,
          doc.uploadedBy || undefined,
          doc.createdAt,
          doc.updatedAt
        );
      });
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

      const document = await this.documentRepository.findByGuaranteeId(guaranteeId);
      if (!document) return null;

      return new DocumentResponseDto(
        document.id,
        document.title || '',
        document.description || undefined,
        document.documentType,
        document.status as DocumentStatus,
        document.fileName || undefined,
        document.fileUrl || undefined,
        document.fileSize || undefined,
        document.projectId || undefined,
        document.assignedTo || undefined,
        document.deadlineDate || undefined,
        document.tags,
        document.isInternalOnly,
        document.isSharedWithSuppliers,
        document.uploadedBy || undefined,
        document.createdAt,
        document.updatedAt
      );
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

      const document = await this.documentRepository.findByInsuranceId(insuranceId);
      if (!document) return null;

      return new DocumentResponseDto(
        document.id,
        document.title || '',
        document.description || undefined,
        document.documentType,
        document.status as DocumentStatus,
        document.fileName || undefined,
        document.fileUrl || undefined,
        document.fileSize || undefined,
        document.projectId || undefined,
        document.assignedTo || undefined,
        document.deadlineDate || undefined,
        document.tags,
        document.isInternalOnly,
        document.isSharedWithSuppliers,
        document.uploadedBy || undefined,
        document.createdAt,
        document.updatedAt
      );
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
      if (!data.title || data.title.trim().length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title is required');
      }

      if (!data.documentType || !isDocumentType(data.documentType)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid document type: ${data.documentType}`);
      }

      if (data.status && !isDocumentStatus(data.status)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid document status: ${data.status}`);
      }

      // Validate document type/status combinations
      if (data.status === DocumentStatus.PUBLISHED && data.documentType === DocumentType.PHOTO) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Photos cannot be published directly - must be approved first'
        );
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

      if (updates.status && !isValidDocumentStatusTransition(existing.status as DocumentStatus, updates.status as DocumentStatus)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR, 
          `Invalid status transition from ${existing.status} to ${updates.status}`
        );
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
