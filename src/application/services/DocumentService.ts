/**
 * Document Service - Hexagonal Architecture
 * Business logic for document management
 */

import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Document, DocumentStatus as DomainDocumentStatus } from '@/domain/entities/Document';
import { DocumentTransformer } from '@/dtos/transforms/DocumentTransformer';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO, DocumentStatus, DocumentType, DocumentResponseDto } from '@/dtos/entities/DocumentDTO';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

function isDocumentType(type: string): type is DocumentType {
  return Object.values(DocumentType).includes(type as DocumentType);
}

function isDocumentStatus(status: string): status is DocumentStatus {
  return Object.values(DocumentStatus).includes(status as DocumentStatus);
}

// Add status transition validation
function isValidDocumentStatusTransition(current: DocumentStatus, next: DocumentStatus): boolean {
  const validTransitions: Record<DocumentStatus, DocumentStatus[]> = {
    [DocumentStatus.DRAFT]: [DocumentStatus.PENDING_APPROVAL, DocumentStatus.ARCHIVED],
    [DocumentStatus.PENDING_APPROVAL]: [DocumentStatus.APPROVED, DocumentStatus.REJECTED, DocumentStatus.ARCHIVED],
    [DocumentStatus.APPROVED]: [DocumentStatus.ARCHIVED, DocumentStatus.DEPRECATED],
    [DocumentStatus.REJECTED]: [DocumentStatus.DRAFT, DocumentStatus.ARCHIVED],
    [DocumentStatus.ARCHIVED]: [],
    [DocumentStatus.EXPIRED]: [DocumentStatus.ARCHIVED],
    [DocumentStatus.DEPRECATED]: [DocumentStatus.ARCHIVED]
  };
  return validTransitions[current]?.includes(next) ?? false;
}

// Ensure Document entity has required properties
interface RepositoryDocument {
  id: string;
  title: string;
  documentType: DocumentType;
  projectId?: string | null;
  phaseId?: string | null;
  inspectionId?: string | null;
  paymentId?: string | null;
  supplierId?: string | null;
  description?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  mimeType?: string | null;
  status: string;
  isInternalOnly: boolean;
  isSharedWithSuppliers: boolean;
  deadlineDate?: string | null;
  assignedTo?: string | null;
  metadata?: Record<string, unknown> | null;
  category?: string | null;
  subcategory?: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: string | null;
  tags: string[];
}

export class DocumentService {
  private documentRepository: IDocumentRepository;
  private documentTransformer: DocumentTransformer;

  constructor(documentRepository?: IDocumentRepository, documentTransformer?: DocumentTransformer) {
    this.documentRepository = documentRepository || RepositoryFactory.getDocumentRepository();
    this.documentTransformer = documentTransformer || new DocumentTransformer();
  }

  /**
   * Static method for getting project documents (for backward compatibility)
   */
  static async getProjectDocuments(projectId: string): Promise<DocumentDTO[]> {
    const service = new DocumentService();
    return service.getProjectDocuments(projectId);
  }

  // Factory function for getting service instance
  static getDocumentService(): DocumentService {
    return new DocumentService();
  }

  /**
   * Get documents by phase ID
   */
  async getDocumentsByPhase(phaseId: string): Promise<DocumentDTO[]> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      const documents = await this.documentRepository.findByPhaseId(phaseId);
      return documents.map(doc => DocumentTransformer.toDTO(doc));
    } catch (error) {
      console.error('DocumentService.getDocumentsByPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get documents by phase');
    }
  }

  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<DocumentDTO[]> {
    try {
      const documents = await this.documentRepository.findAll();
      return documents.map(doc => DocumentTransformer.toDTO(doc));
    } catch (error) {
      console.error('DocumentService.getAllDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all documents');
    }
  }

  /**
   * Get project documents
   */
  async getProjectDocuments(projectId: string): Promise<DocumentDTO[]> {
    const documents = await this.documentRepository.findByProjectId(projectId);
    return documents.map(doc => DocumentTransformer.toDTO(doc));
  }

  /**
   * Get inspection documents
   */
  async getInspectionDocuments(inspectionId: string): Promise<DocumentDTO[]> {
    try {
      if (!inspectionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Inspection ID is required');
      }

      const documents = await this.documentRepository.findByInspectionId(inspectionId);
      return documents.map(doc => DocumentTransformer.toDTO(doc));
    } catch (error) {
      console.error('DocumentService.getInspectionDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get inspection documents');
    }
  }

  /**
   * Get payment documents
   */
  async getPaymentDocuments(paymentId: string): Promise<DocumentDTO[]> {
    try {
      if (!paymentId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Payment ID is required');
      }

      const documents = await this.documentRepository.findByPaymentId(paymentId);
      return documents.map(doc => DocumentTransformer.toDTO(doc));
    } catch (error) {
      console.error('DocumentService.getPaymentDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment documents');
    }
  }

  /**
   * Get bank guarantee documents
   */
  async getBankGuaranteeDocuments(guaranteeId: string): Promise<DocumentDTO | null> {
    try {
      if (!guaranteeId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Guarantee ID is required');
      }

      // Search for documents with guarantee reference in tags or metadata
      const allDocuments = await this.documentRepository.findAll();
      const document = allDocuments.find(doc => 
        doc.tags?.includes(`guarantee:${guaranteeId}`) ||
        (doc as { metadata?: { guaranteeId?: string } }).metadata?.guaranteeId === guaranteeId
      );
      
      if (!document) return null;
      return DocumentTransformer.toDTO(document);
    } catch (error) {
      console.error('DocumentService.getBankGuaranteeDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get bank guarantee documents');
    }
  }

  /**
   * Get insurance documents
   */
  async getInsuranceDocuments(insuranceId: string): Promise<DocumentDTO | null> {
    try {
      if (!insuranceId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Insurance ID is required');
      }

      // Search for documents with insurance reference in tags or metadata
      const allDocuments = await this.documentRepository.findAll();
      const document = allDocuments.find(doc => 
        doc.tags?.includes(`insurance:${insuranceId}`) ||
        (doc as { metadata?: { insuranceId?: string } }).metadata?.insuranceId === insuranceId
      );
      
      if (!document) return null;
      return DocumentTransformer.toDTO(document);
    } catch (error) {
      console.error('DocumentService.getInsuranceDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get insurance documents');
    }
  }

  /**
   * Get project documents by tags
   */
  async getProjectDocumentsByTags(projectId: string, tags: string[]): Promise<DocumentDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      if (!tags || tags.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tags are required');
      }

      const documents = await this.documentRepository.findByTags(tags);
      return documents
        .filter(doc => doc.projectId === projectId)
        .map(doc => DocumentTransformer.toDTO(doc));
    } catch (error) {
      console.error('DocumentService.getProjectDocumentsByTags failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project documents by tags');
    }
  }

  /**
   * Create document
   */
  async createDocument(data: CreateDocumentDTO): Promise<DocumentDTO> {
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

      const documentEntity = DocumentTransformer.fromCreateDTOToEntity(data);
      await this.documentRepository.save(documentEntity);
      
      return DocumentTransformer.toDTO(documentEntity);
    } catch (error) {
      console.error('DocumentService.createDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create document');
    }
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: UpdateDocumentDTO): Promise<DocumentDTO | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document ID is required');
      }

      const existing = await this.documentRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      const existingStatus = existing.status as unknown as DocumentStatus;
      const newStatus = updates.status as unknown as DocumentStatus;
      
      if (updates.status && !isValidDocumentStatusTransition(existingStatus, newStatus)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR, 
          `Invalid status transition from ${existing.status} to ${updates.status}`
        );
      }

      const updateEntity = DocumentTransformer.fromUpdateDTOToEntity(updates);
      await this.documentRepository.update(id, updateEntity);
      
      const updatedDocument = await this.documentRepository.findById(id);
      
      if (!updatedDocument) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated document');
      }

      return DocumentTransformer.toDTO(updatedDocument);
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
   * Upload document with file
   */
  async uploadDocument(data: { 
    title: string; 
    file: File; 
    type: DocumentType; 
    projectId?: string; 
    description?: string;
  }, uploadedBy: string): Promise<{ url: string; id: string }> {
    try {
      // Create document record with all required fields
      const documentData = {
        name: data.title,
        title: data.title,
        type: data.type,
        documentType: data.type,
        projectId: data.projectId || null,
        phaseId: null,
        inspectionId: null,
        paymentId: null,
        supplierId: null,
        description: data.description || null,
        fileName: data.file.name,
        fileSize: data.file.size,
        fileUrl: null,
        mimeType: data.file.type || null,
        uploadedBy: uploadedBy || null,
        status: DocumentStatus.DRAFT,
        isInternalOnly: false,
        isSharedWithSuppliers: false,
        deadlineDate: null,
        assignedTo: null,
        category: null,
        subcategory: null,
        metadata: null,
        tags: []
      } as unknown as CreateDocumentDTO;

      const createdDoc = await this.createDocument(documentData);
      
      return {
        url: createdDoc.fileUrl || '',
        id: createdDoc.id
      };
    } catch (error) {
      console.error('DocumentService.uploadDocument failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload document');
    }
  }

  // =================== DOCUMENT GENERATION METHODS ===================

  /**
   * Generate project documents summary
   */
  async generateProjectDocumentsSummary(projectId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<DocumentType, number>;
    documentsByStatus: Record<DocumentStatus, number>;
    recentDocuments: DocumentDTO[];
    expiredDocuments: DocumentDTO[];
    pendingApproval: DocumentDTO[];
  }> {
    try {
      const allDocuments = await this.getAllDocuments();
      const projectDocuments = allDocuments.filter(doc => doc.projectId === projectId);
      
      // Count by type
      const documentsByType: Record<DocumentType, number> = {} as any;
      projectDocuments.forEach(doc => {
        documentsByType[doc.documentType] = (documentsByType[doc.documentType] || 0) + 1;
      });
      
      // Count by status
      const documentsByStatus: Record<DocumentStatus, number> = {} as any;
      projectDocuments.forEach(doc => {
        const status = doc.status || 'unknown';
        documentsByStatus[status] = (documentsByStatus[status] || 0) + 1;
      });
      
      // Filter recent documents (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDocuments = projectDocuments
        .filter(doc => doc.createdAt && new Date(doc.createdAt) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 10);
      
      // Filter expired documents
      const expiredDocuments = projectDocuments.filter(doc => 
        doc.status === DocumentStatus.EXPIRED ||
        ((doc as any).validUntil && new Date((doc as any).validUntil) < new Date())
      );
      
      // Filter pending approval
      const pendingApproval = projectDocuments.filter(doc => 
        doc.status === DocumentStatus.PENDING_APPROVAL
      );
      
      return {
        totalDocuments: projectDocuments.length,
        documentsByType,
        documentsByStatus,
        recentDocuments,
        expiredDocuments,
        pendingApproval
      };
    } catch (error) {
      console.error('Error generating project documents summary:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate documents summary');
    }
  }

  /**
   * Generate document metadata for reports
   */
  async generateDocumentMetadata(projectId: string): Promise<{
    documents: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      fileSize: number;
      createdAt: string;
      uploadedBy?: string;
      fileUrl?: string;
      category?: string;
      tags: string[];
    }>;
    totalSize: number;
    lastUpdated: string;
  }> {
    try {
      const projectDocuments = await this.getProjectDocuments(projectId);
      
      const documents = projectDocuments.map(doc => ({
        id: doc.id,
        title: doc.title || '',
        type: doc.documentType as string,
        status: (doc.status || 'unknown') as string,
        fileSize: doc.fileSize || 0,
        createdAt: doc.createdAt || new Date().toISOString(),
        uploadedBy: doc.uploadedBy || undefined,
        fileUrl: doc.fileUrl || undefined,
        category: doc.documentType as string,
        tags: doc.tags || []
      }));
      
      const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
      const lastUpdated = documents.length > 0 
        ? documents.reduce((latest, doc) => 
            new Date(doc.createdAt) > new Date(latest.createdAt) ? doc : latest
          ).createdAt
        : new Date().toISOString();
      
      return {
        documents,
        totalSize,
        lastUpdated
      };
    } catch (error) {
      console.error('Error generating document metadata:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate document metadata');
    }
  }

  /**
   * Generate document compliance report
   */
  async generateComplianceReport(projectId: string): Promise<{
    totalDocuments: number;
    compliantDocuments: number;
    nonCompliantDocuments: number;
    expiredDocuments: number;
    missingDocuments: string[];
    complianceScore: number;
    recommendations: string[];
  }> {
    try {
      const projectDocuments = await this.getProjectDocuments(projectId);
      
      const expiredDocuments = projectDocuments.filter(doc => 
        doc.status === DocumentStatus.EXPIRED ||
        ((doc as any).validUntil && new Date((doc as any).validUntil) < new Date())
      );
      
      const compliantDocuments = projectDocuments.filter(doc => 
        doc.status === DocumentStatus.APPROVED
      );
      
      const nonCompliantDocuments = projectDocuments.filter(doc => 
        doc.status === DocumentStatus.REJECTED ||
        doc.status === DocumentStatus.DRAFT
      );
      
      // Check for required document types
      const requiredTypes = [DocumentType.CONTRACT, DocumentType.PERMIT];
      const existingTypes = new Set(projectDocuments.map(doc => doc.documentType));
      const missingDocuments = requiredTypes.filter(type => !existingTypes.has(type));
      
      const totalDocuments = projectDocuments.length;
      const complianceScore = totalDocuments > 0 ? (compliantDocuments.length / totalDocuments) * 100 : 0;
      
      const recommendations: string[] = [];
      
      if (expiredDocuments.length > 0) {
        recommendations.push(`${expiredDocuments.length} document(s) expiré(s) nécessitent une mise à jour`);
      }
      
      if (missingDocuments.length > 0) {
        recommendations.push(`Documents manquants: ${missingDocuments.join(', ')}`);
      }
      
      if (nonCompliantDocuments.length > 0) {
        recommendations.push(`${nonCompliantDocuments.length} document(s) nécessitent une validation`);
      }
      
      return {
        totalDocuments,
        compliantDocuments: compliantDocuments.length,
        nonCompliantDocuments: nonCompliantDocuments.length,
        expiredDocuments: expiredDocuments.length,
        missingDocuments,
        complianceScore: Math.round(complianceScore),
        recommendations
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate compliance report');
    }
  }

  /**
   * Generate document download package (ZIP)
   */
  async generateDownloadPackage(projectId: string, documentIds?: string[]): Promise<{
    packageUrl: string;
    documentCount: number;
    packageSize: number;
    expiresAt: string;
  }> {
    try {
      // This would integrate with a file storage service to create ZIP packages
      // For now, return a mock implementation
      const documents = documentIds 
        ? await Promise.all(documentIds.map(id => this.getDocumentById(id).then(doc => doc).catch(() => null)))
        : await this.getProjectDocuments(projectId);
      
      const validDocuments = documents.filter((doc): doc is DocumentDTO => doc !== null) as DocumentDTO[];
      
      // Mock implementation - in real scenario, this would:
      // 1. Create ZIP file with all documents
      // 2. Upload to storage
      // 3. Return download URL
      
      return {
        packageUrl: `/api/documents/download/${projectId}`,
        documentCount: validDocuments.length,
        packageSize: validDocuments.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
    } catch (error) {
      console.error('Error generating download package:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate download package');
    }
  }

  /**
   * Get document by ID (helper method)
   */
  private async getDocumentById(id: string): Promise<DocumentDTO | null> {
    try {
      const documents = await this.getAllDocuments();
      return documents.find(doc => doc.id === id) || null;
    } catch (error) {
      console.error('Error getting document by ID:', error);
      return null;
    }
  }

  /**
   * Generate document analytics for dashboard
   */
  async generateDocumentAnalytics(projectId?: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    documentsByStatus: Record<string, number>;
    recentUploads: number;
    storageUsed: number;
    expiringSoon: number;
  }> {
    try {
      const allDocuments = await this.getAllDocuments();
      const documents = projectId 
        ? allDocuments.filter(doc => doc.projectId === projectId)
        : allDocuments;
      
      // Count by type
      const documentsByType: Record<string, number> = {};
      documents.forEach(doc => {
        documentsByType[doc.documentType] = (documentsByType[doc.documentType] || 0) + 1;
      });
      
      // Count by status
      const documentsByStatus: Record<string, number> = {};
      documents.forEach(doc => {
        const status = doc.status || 'unknown';
        documentsByStatus[status] = (documentsByStatus[status] || 0) + 1;
      });
      
      // Recent uploads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentUploads = documents.filter(doc => doc.createdAt && new Date(doc.createdAt) >= sevenDaysAgo).length;
      
      // Storage used
      const storageUsed = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
      
      // Expiring soon (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringSoon = documents.filter(doc => 
        (doc as any).validUntil && 
        new Date((doc as any).validUntil) >= new Date() && 
        new Date((doc as any).validUntil) <= thirtyDaysFromNow
      ).length;
      
      return {
        totalDocuments: documents.length,
        documentsByType,
        documentsByStatus,
        recentUploads,
        storageUsed,
        expiringSoon
      };
    } catch (error) {
      console.error('Error generating document analytics:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate document analytics');
    }
  }
}
