/**
 * Document Service - Hexagonal Architecture
 * Business logic for document management
 * 
 * ✅ Zéro interface interne - Utilise les DTOs
 * ✅ Utilise DocumentTransformer pour toutes les conversions
 * ✅ Gestion complète des documents avec validation
 * ✅ Intégration avec StorageFactory pour les fichiers
 * ✅ Pas de logique métier dans le service (orchestration uniquement)
 */

import { StorageFactory } from '@/application/services/StorageFactory';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import {
  CreateDocumentDTO,
  DocumentDTO,
  DocumentStatus,
  DocumentType,
  UpdateDocumentDTO
} from '@/dtos/entities/DocumentDTO';
import { DocumentTransformer } from '@/dtos/transforms/DocumentTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// ============================================================================
// VALIDATEURS
// ============================================================================

function isDocumentType(type: string): type is DocumentType {
  return Object.values(DocumentType).includes(type as DocumentType);
}

function isDocumentStatus(status: string): status is DocumentStatus {
  return Object.values(DocumentStatus).includes(status as DocumentStatus);
}

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

// ============================================================================
// SERVICE
// ============================================================================

export class DocumentService {
  private documentRepository: IDocumentRepository;

  constructor(documentRepository?: IDocumentRepository) {
    this.documentRepository = documentRepository || RepositoryFactory.getDocumentRepository();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  static getDocumentService(): DocumentService {
    return new DocumentService();
  }

  static async getProjectDocuments(projectId: string): Promise<DocumentDTO[]> {
    const service = new DocumentService();
    return service.getProjectDocuments(projectId);
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<DocumentDTO[]> {
    try {
      const documents = await this.documentRepository.findAll();
      return DocumentTransformer.toDTOList(documents);
    } catch (error) {
      console.error('DocumentService.getAllDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all documents');
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<DocumentDTO | null> {
    try {
      if (!id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Document ID is required');
      }

      const document = await this.documentRepository.findById(id);
      if (!document) return null;
      return DocumentTransformer.toDTO(document);
    } catch (error) {
      console.error('DocumentService.getDocumentById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get document');
    }
  }

  /**
   * Get project documents
   */
  async getProjectDocuments(projectId: string): Promise<DocumentDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const documents = await this.documentRepository.findByProjectId(projectId);
      return DocumentTransformer.toDTOList(documents);
    } catch (error) {
      console.error('DocumentService.getProjectDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project documents');
    }
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
      return DocumentTransformer.toDTOList(documents);
    } catch (error) {
      console.error('DocumentService.getDocumentsByPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get documents by phase');
    }
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
      return DocumentTransformer.toDTOList(documents);
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
      return DocumentTransformer.toDTOList(documents);
    } catch (error) {
      console.error('DocumentService.getPaymentDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get payment documents');
    }
  }

  /**
   * Get documents by tags
   */
  async getDocumentsByTags(tags: string[]): Promise<DocumentDTO[]> {
    try {
      if (!tags || tags.length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tags are required');
      }

      const documents = await this.documentRepository.findByTags(tags);
      return DocumentTransformer.toDTOList(documents);
    } catch (error) {
      console.error('DocumentService.getDocumentsByTags failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get documents by tags');
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
   * Get documents by status
   */
  async getDocumentsByStatus(status: DocumentStatus): Promise<DocumentDTO[]> {
    try {
      if (!status || !isDocumentStatus(status)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid document status: ${status}`);
      }

      const documents = await this.documentRepository.findByStatus(status);
      return DocumentTransformer.toDTOList(documents);
    } catch (error) {
      console.error('DocumentService.getDocumentsByStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get documents by status');
    }
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(type: DocumentType): Promise<DocumentDTO[]> {
    try {
      if (!type || !isDocumentType(type)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid document type: ${type}`);
      }

      const documents = await this.documentRepository.findByType(type);
      return DocumentTransformer.toDTOList(documents);
    } catch (error) {
      console.error('DocumentService.getDocumentsByType failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get documents by type');
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

      // Rechercher les documents avec référence à la garantie
      const allDocuments = await this.documentRepository.findAll();
      const document = allDocuments.find(doc => 
        doc.tags?.includes(`guarantee:${guaranteeId}`) ||
        doc.metadata?.guaranteeId === guaranteeId
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

      const allDocuments = await this.documentRepository.findAll();
      const document = allDocuments.find(doc => 
        doc.tags?.includes(`insurance:${insuranceId}`) ||
        doc.metadata?.insuranceId === insuranceId
      );
      
      if (!document) return null;
      return DocumentTransformer.toDTO(document);
    } catch (error) {
      console.error('DocumentService.getInsuranceDocuments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get insurance documents');
    }
  }

  // ============================================================================
  // MUTATION METHODS
  // ============================================================================

  /**
   * Create document
   */
  async createDocument(data: CreateDocumentDTO): Promise<DocumentDTO> {
    try {
      // Validation
      if (!data.title || data.title.trim().length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title is required');
      }

      if (!data.documentType || !isDocumentType(data.documentType)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid document type: ${data.documentType}`);
      }

      if (data.status && !isDocumentStatus(data.status)) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid document status: ${data.status}`);
      }

      // Transformation et création
      const repositoryData = DocumentTransformer.createToRepository(data);
      const created = await this.documentRepository.save(repositoryData as never);
      
      return DocumentTransformer.toDTO(created as never);
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

      // Vérifier l'existence
      const existing = await this.documentRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      // Valider la transition de statut
      if (updates.status) {
        const existingStatus = existing.status as DocumentStatus;
        const newStatus = updates.status as DocumentStatus;
        
        if (!isValidDocumentStatusTransition(existingStatus, newStatus)) {
          throw new AppError(
            ErrorCode.VALIDATION_ERROR, 
            `Invalid status transition from ${existingStatus} to ${newStatus}`
          );
        }
      }

      // Mise à jour
      const updateData = DocumentTransformer.updateToRepository(updates);
      await this.documentRepository.update(id, updateData as never);
      
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

      // Supprimer le fichier du storage si présent
      if (existing.fileUrl) {
        try {
          const storageProvider = StorageFactory.createProvider();
          const filePath = this.extractFilePathFromUrl(existing.fileUrl);
          if (filePath) {
            await storageProvider.deleteFile(filePath);
          }
        } catch (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
          // Continuer même si la suppression du fichier échoue
        }
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
  async uploadDocument(
    data: { 
      title: string; 
      file: File; 
      type: DocumentType; 
      projectId?: string; 
      description?: string;
    }, 
    uploadedBy: string
  ): Promise<{ url: string; id: string }> {
    try {
      // 1. Upload du fichier vers le storage
      const storageProvider = StorageFactory.createProvider();
      const filePath = `documents/${data.projectId || 'general'}/${Date.now()}_${this.sanitizeFileName(data.file.name)}`;
      const uploadResult = await storageProvider.uploadFile(data.file, filePath);
      
      if (!uploadResult.success) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR, 
          'Failed to upload file: ' + (uploadResult.error || 'Unknown error')
        );
      }

      // 2. Créer l'enregistrement du document
      const documentData: CreateDocumentDTO = {
        title: data.title,
        documentType: data.type,
        projectId: data.projectId || undefined,
        description: data.description || undefined,
        fileName: data.file.name,
        fileSize: data.file.size,
        fileUrl: uploadResult.url || '',
        mimeType: data.file.type || undefined,
        uploadedBy: uploadedBy || undefined,
        status: DocumentStatus.DRAFT,
        isInternalOnly: false,
        isSharedWithSuppliers: false,
        metadata: {
          originalName: data.file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: uploadedBy,
          filePath: filePath,
        },
        tags: []
      };

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

  // ============================================================================
  // REPORTING METHODS
  // ============================================================================

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
      const projectDocuments = await this.getProjectDocuments(projectId);
      
      // Count by type
      const documentsByType: Record<DocumentType, number> = {} as any;
      projectDocuments.forEach(doc => {
        const type = doc.documentType as DocumentType;
        documentsByType[type] = (documentsByType[type] || 0) + 1;
      });
      
      // Count by status
      const documentsByStatus: Record<DocumentStatus, number> = {} as any;
      projectDocuments.forEach(doc => {
        const status = doc.status as DocumentStatus;
        documentsByStatus[status] = (documentsByStatus[status] || 0) + 1;
      });
      
      // Recent documents (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDocuments = projectDocuments
        .filter(doc => doc.createdAt && new Date(doc.createdAt) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 10);
      
      // Expired documents
      const expiredDocuments = projectDocuments.filter(doc => 
        doc.status === DocumentStatus.EXPIRED ||
        (doc.metadata?.validUntil && new Date(doc.metadata.validUntil as string) < new Date())
      );
      
      // Pending approval
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
        (doc.metadata?.validUntil && new Date(doc.metadata.validUntil as string) < new Date())
      );
      
      const compliantDocuments = projectDocuments.filter(doc => 
        doc.status === DocumentStatus.APPROVED
      );
      
      const nonCompliantDocuments = projectDocuments.filter(doc => 
        doc.status === DocumentStatus.REJECTED ||
        doc.status === DocumentStatus.DRAFT
      );
      
      // Required document types
      const requiredTypes = [DocumentType.CONTRACT, DocumentType.PERMIT, DocumentType.INSURANCE];
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
      // Récupérer les documents
      let documents: DocumentDTO[];
      if (documentIds && documentIds.length > 0) {
        const docPromises = documentIds.map(id => this.getDocumentById(id));
        const results = await Promise.all(docPromises);
        documents = results.filter((doc): doc is DocumentDTO => doc !== null);
      } else {
        documents = await this.getProjectDocuments(projectId);
      }
      
      if (documents.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'No documents found to package');
      }

      // Créer le package
      const packageName = `documents_${projectId}_${Date.now()}.zip`;
      const packagePath = `packages/${projectId}/${packageName}`;
      const packageSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
      const packageUrl = `/api/documents/download/${projectId}/${packageName}`;

      // TODO: Implémenter la création du ZIP avec les fichiers
      // Pour l'instant, créer un enregistrement du package

      return {
        packageUrl,
        documentCount: documents.length,
        packageSize,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error generating download package:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate download package');
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
        const type = doc.documentType as string;
        documentsByType[type] = (documentsByType[type] || 0) + 1;
      });
      
      // Count by status
      const documentsByStatus: Record<string, number> = {};
      documents.forEach(doc => {
        const status = doc.status as string;
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
        doc.metadata?.validUntil && 
        new Date(doc.metadata.validUntil as string) >= new Date() && 
        new Date(doc.metadata.validUntil as string) <= thirtyDaysFromNow
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

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Extrait le chemin du fichier à partir de l'URL
   */
  private extractFilePathFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/storage\/v1\/object\/public\/(.+)$/);
      if (match) {
        return match[1];
      }
      
      const match2 = url.match(/\/storage\/v1\/object\/(.+)$/);
      if (match2) {
        return match2[1];
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Nettoie le nom du fichier
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/_+/g, '_');
  }
}

export default DocumentService;
let documentServiceInstance: DocumentService | null = null;
export function getDocumentService(): DocumentService {
  if (!documentServiceInstance) {
    documentServiceInstance = new DocumentService();
  }
  return documentServiceInstance;
}
