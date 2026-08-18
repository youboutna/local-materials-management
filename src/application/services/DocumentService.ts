/**
 * Document Service - Hexagonal Architecture
 * Handles document operations with proper repository pattern
 * Inclut les méthodes de liaison avec les paiements (link/replace)
 * et la méthode getAllDocuments pour récupérer tous les documents
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { Document } from '@/domain/entities/Document';
import { DocumentTransformer } from '@/dtos/transforms/DocumentTransformer';
import { DocumentDTO, CreateDocumentDTO, UpdateDocumentDTO } from '@/dtos/entities/DocumentDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { getStorageService } from './StorageService';

export class DocumentService {
  private documentRepository: IDocumentRepository;

  constructor(repository?: IDocumentRepository) {
    this.documentRepository = repository || RepositoryFactory.getDocumentRepository();
  }

  /**
   * Récupère tous les documents (pour l'administration / les tableaux de bord)
   */
  async getAllDocuments(): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findAll();
      return entities.map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.getAllDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch documents');
    }
  }

  /**
   * Créer un document avec upload de fichier
   */
  async createDocument(data: CreateDocumentDTO): Promise<DocumentDTO> {
    try {
      let fileUrl = data.fileUrl;
      let fileName = data.fileName;
      let fileSize = data.fileSize;
      let mimeType = data.mimeType;

      if (data.file) {
        const storageService = getStorageService();
        const uploadResult = await storageService.uploadFile({
          bucket: 'documents',
          path: `documents/${Date.now()}-${data.file.name}`,
          file: data.file,
        });
        if (!uploadResult) {
          throw new AppError(ErrorCode.INTERNAL_ERROR, 'Upload failed');
        }
        fileUrl = uploadResult.publicUrl;
        fileName = data.file.name;
        fileSize = data.file.size;
        mimeType = data.file.type;
      }

      const entity = Document.create({
        id: crypto.randomUUID(),
        title: data.title || fileName || 'Document',
        description: data.description ?? undefined,
        fileUrl: fileUrl ?? undefined,
        fileName: fileName ?? undefined,
        fileSize: fileSize ?? undefined,
        mimeType: mimeType ?? undefined,
        documentType: data.documentType as any,
        status: (data.status || 'draft') as any,
        projectId: data.projectId ?? undefined,
        phaseId: data.phaseId ?? undefined,
        inspectionId: data.inspectionId ?? undefined,
        paymentId: data.paymentId ?? undefined,
        supplierId: data.supplierId ?? undefined,
        uploadedBy: data.uploadedBy ?? undefined,
        metadata: data.metadata ?? undefined,
        tags: data.tags,
        isInternalOnly: data.isInternalOnly,
        isSharedWithSuppliers: data.isSharedWithSuppliers,
        accessLevel: data.accessLevel,
        approvalStatus: data.approvalStatus,
      });

      await this.documentRepository.save(entity);
      return DocumentTransformer.toDTO(entity);
    } catch (error) {
      console.error('DocumentService.createDocument failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create document');
    }
  }

  /**
   * Récupérer un document par ID
   */
  async getDocumentById(id: string): Promise<DocumentDTO | null> {
    try {
      const entity = await this.documentRepository.findById(id);
      return entity ? DocumentTransformer.toDTO(entity) : null;
    } catch (error) {
      console.error('DocumentService.getDocumentById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch document');
    }
  }

  /**
   * Récupérer les documents d'un projet
   */
  async getProjectDocuments(projectId: string): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findByProjectId(projectId);
      return entities.map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.getProjectDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch project documents');
    }
  }

  /**
   * Récupérer les documents d'une phase
   */
  async getPhaseDocuments(phaseId: string): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findByPhaseId(phaseId);
      return entities.map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.getPhaseDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch phase documents');
    }
  }

  /**
   * Récupérer les documents d'une inspection
   */
  async getInspectionDocuments(inspectionId: string): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findByInspectionId(inspectionId);
      return entities.map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.getInspectionDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch inspection documents');
    }
  }

  /**
   * Récupérer les documents d'un fournisseur
   */
  async getSupplierDocuments(supplierId: string): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findBySupplierId(supplierId);
      return entities.map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.getSupplierDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch supplier documents');
    }
  }

  /**
   * Récupérer les documents d'un paiement
   */
  async getDocumentsByPaymentId(paymentId: string): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findByPaymentId(paymentId);
      return entities.map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.getDocumentsByPaymentId failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch payment documents');
    }
  }

  /**
   * Récupérer les documents par statut
   */
  async getDocumentsByStatus(status: string): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findByStatus(status as any);
      return entities.map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.getDocumentsByStatus failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch documents by status');
    }
  }

  /**
   * Mettre à jour un document
   */
  async updateDocument(id: string, data: UpdateDocumentDTO): Promise<DocumentDTO> {
    try {
      const existing = await this.documentRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      const updateData: Partial<Document> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.documentType !== undefined) updateData.documentType = data.documentType as any;
      if (data.status !== undefined) updateData.status = data.status as any;
      if (data.approvalStatus !== undefined) (updateData as any).approvalStatus = data.approvalStatus;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.isInternalOnly !== undefined) updateData.isInternalOnly = data.isInternalOnly;
      if (data.isSharedWithSuppliers !== undefined) updateData.isSharedWithSuppliers = data.isSharedWithSuppliers;
      if (data.accessLevel !== undefined) (updateData as any).accessLevel = data.accessLevel;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;

      await this.documentRepository.update(id, updateData);
      const updated = await this.documentRepository.findById(id);
      if (!updated) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found after update');
      }
      return DocumentTransformer.toDTO(updated);
    } catch (error) {
      console.error('DocumentService.updateDocument failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update document');
    }
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const existing = await this.documentRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }
      await this.documentRepository.delete(id);
    } catch (error) {
      console.error('DocumentService.deleteDocument failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete document');
    }
  }


  /**
   * Alias pour récupérer les documents d'une phase (compatibilité)
   */
  async getDocumentsByPhase(phaseId: string): Promise<DocumentDTO[]> {
    return this.getPhaseDocuments(phaseId);
  }

  /**
   * Recherche de documents par terme et type
   */
  async searchDocuments(searchTerm: string, documentType?: string): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findAll();
      const term = (searchTerm || '').toLowerCase();
      return entities
        .filter((entity) => {
          const matchesTerm = !term ||
            entity.title.toLowerCase().includes(term) ||
            (entity.description || '').toLowerCase().includes(term);
          const matchesType = !documentType || entity.documentType === documentType;
          return matchesTerm && matchesType;
        })
        .map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.searchDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search documents');
    }
  }

  /**
   * Récupère les documents d'un appel d'offres partagés avec les fournisseurs
   */
  async getSharedTenderDocuments(tenderId: string): Promise<DocumentDTO[]> {
    try {
      const entities = await this.documentRepository.findAll();
      return entities
        .filter((entity) => entity.isSharedWithSuppliers && (entity.tags.includes(tenderId) || entity.projectId === tenderId))
        .map(DocumentTransformer.toDTO);
    } catch (error) {
      console.error('DocumentService.getSharedTenderDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch shared tender documents');
    }
  }

  /**
   * Génère un résumé des documents d'un projet
   */
  async generateProjectDocumentsSummary(projectId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    documents: DocumentDTO[];
  }> {
    const documents = await this.getProjectDocuments(projectId);
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const doc of documents) {
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
      byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;
    }
    return { total: documents.length, byStatus, byType, documents };
  }

  /**
   * Génère les métadonnées de documents pour un projet (rapports)
   */
  async generateDocumentMetadata(projectId: string): Promise<{
    projectId: string;
    documentCount: number;
    generatedAt: string;
  }> {
    const documents = await this.getProjectDocuments(projectId);
    return {
      projectId,
      documentCount: documents.length,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Génère un rapport de conformité documentaire pour un projet
   */
  async generateComplianceReport(projectId: string): Promise<{
    projectId: string;
    totalDocuments: number;
    approvedDocuments: number;
    pendingDocuments: number;
    complianceRate: number;
  }> {
    const documents = await this.getProjectDocuments(projectId);
    const approvedDocuments = documents.filter((d) => d.status === 'approved').length;
    const pendingDocuments = documents.filter((d) => d.status === 'pending_approval' || d.status === 'pending_review').length;
    const complianceRate = documents.length > 0 ? (approvedDocuments / documents.length) * 100 : 0;
    return {
      projectId,
      totalDocuments: documents.length,
      approvedDocuments,
      pendingDocuments,
      complianceRate,
    };
  }

  /**
   * Génère un package de téléchargement pour un ensemble de documents
   */
  async generateDownloadPackage(projectId: string, documentIds?: string[]): Promise<{
    projectId: string;
    documentCount: number;
    documents: DocumentDTO[];
  }> {
    const allDocuments = await this.getProjectDocuments(projectId);
    const documents = documentIds && documentIds.length > 0
      ? allDocuments.filter((doc) => documentIds.includes(doc.id))
      : allDocuments;
    return {
      projectId,
      documentCount: documents.length,
      documents,
    };
  }

  /**
   * Génère des statistiques analytiques sur les documents (dashboard)
   */
  async generateDocumentAnalytics(projectId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const documents = projectId ? await this.getProjectDocuments(projectId) : await this.getAllDocuments();
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const doc of documents) {
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
      byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;
    }
    return { total: documents.length, byStatus, byType };
  }

  // ============================================================
  // MÉTHODES DOCUMENT-PAIEMENT (link / replace)
  // ============================================================

  /**
   * Lie des documents à un paiement (met à jour payment_id)
   */
  async linkDocumentsToPayment(paymentId: string, documentIds: string[]): Promise<void> {
    try {
      for (const docId of documentIds) {
        await this.documentRepository.update(docId, { paymentId: paymentId } as any);
      }
    } catch (error) {
      console.error('DocumentService.linkDocumentsToPayment failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to link documents to payment');
    }
  }

  /**
   * Remplace tous les documents liés à un paiement par une nouvelle liste
   */
  async replacePaymentDocuments(paymentId: string, documentIds: string[]): Promise<void> {
    try {
      // 1. Récupérer les documents actuels du paiement
      const currentDocs = await this.getDocumentsByPaymentId(paymentId);

      // 2. Délier les anciens documents (payment_id = null)
      for (const doc of currentDocs) {
        await this.documentRepository.update(doc.id, { paymentId: null } as any);
      }

      // 3. Lier les nouveaux documents
      await this.linkDocumentsToPayment(paymentId, documentIds);
    } catch (error) {
      console.error('DocumentService.replacePaymentDocuments failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to replace payment documents');
    }
  }

  /**
   * Télécharger un document (fichier binaire)
   */
  async downloadDocument(id: string): Promise<Blob> {
    try {
      const doc = await this.documentRepository.findById(id);
      if (!doc) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }
      const storageService = getStorageService();
      const blob = await storageService.downloadFile({ bucket: 'documents', path: doc.fileUrl || '' });
      return blob;
    } catch (error) {
      console.error('DocumentService.downloadDocument failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to download document');
    }
  }
}

let documentServiceInstance: DocumentService | null = null;
export function getDocumentService(): DocumentService {
  if (!documentServiceInstance) {
    documentServiceInstance = new DocumentService();
  }
  return documentServiceInstance;
}