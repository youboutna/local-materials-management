/**
 * Document Transformer/Mapper
 * Maps between Supabase data, Domain entities, and DTOs
 * Following hexagonal architecture principles
 */

import { Document, DocumentType, DocumentStatus } from '@/domain/entities/Document';

// 1. ENTITÉ DU DOMAINE (Pure métier) - déjà existante dans src/domain/entities/Document.ts

// 2. DTOs d'API (Adapter Layer)
export class DocumentResponseDto {
  constructor(
    public id: string,
    public title: string,
    public description?: string,
    public type: DocumentType,
    public status: DocumentStatus,
    public fileName?: string,
    public fileUrl?: string,
    public fileSize?: number,
    public projectId?: string,
    public assignedTo?: string,
    public deadlineDate?: string,
    public tags: string[],
    public isInternalOnly: boolean,
    public isSharedWithSuppliers: boolean,
    public uploadedBy?: string,
    public createdAt: string,
    public updatedAt: string
  ) {}
}

export class CreateDocumentRequestDto {
  constructor(
    public title: string,
    public description?: string,
    public type: DocumentType,
    public projectId?: string,
    public assignedTo?: string,
    public deadlineDate?: string,
    public tags?: string[],
    public file?: any // Express.Multer.File
  ) {}
}

export class UpdateDocumentRequestDto {
  constructor(
    public title?: string,
    public description?: string,
    public type?: DocumentType,
    public status?: DocumentStatus,
    public assignedTo?: string,
    public deadlineDate?: string,
    public tags?: string[]
  ) {}
}

// 3. TRANSFORMER/MAPPER (Adapter Layer)
export class DocumentMapper {
  /**
   * Transforme les données brutes Supabase vers l'entité du domaine
   */
  static toDomain(supabaseDocument: any): Document {
    return new Document(
      supabaseDocument.id,
      supabaseDocument.project_id,
      supabaseDocument.phase_id,
      supabaseDocument.inspection_id,
      supabaseDocument.payment_id,
      supabaseDocument.supplier_id,
      supabaseDocument.title, // Transformation des données brutes
      supabaseDocument.description,
      supabaseDocument.document_type as DocumentType,
      supabaseDocument.status as DocumentStatus,
      supabaseDocument.file_name,
      supabaseDocument.file_url,
      supabaseDocument.file_size,
      supabaseDocument.mime_type,
      supabaseDocument.tags || [],
      supabaseDocument.is_internal_only || false,
      supabaseDocument.is_shared_with_suppliers || false,
      supabaseDocument.deadline_date,
      supabaseDocument.assigned_to,
      supabaseDocument.uploaded_by,
      supabaseDocument.created_at,
      supabaseDocument.updated_at
    );
  }

  /**
   * Transforme l'entité du domaine vers le DTO de réponse API
   */
  static toResponseDto(document: Document): DocumentResponseDto {
    return new DocumentResponseDto(
      document.id,
      document.title,
      document.description,
      document.documentType,
      document.status,
      document.fileName,
      document.fileUrl,
      document.fileSize,
      document.projectId,
      document.assignedTo,
      document.deadlineDate,
      document.tags,
      document.isInternalOnly,
      document.isSharedWithSuppliers,
      document.uploadedBy,
      document.createdAt,
      document.updatedAt
    );
  }

  /**
   * Transforme le DTO de requête vers l'entité du domaine
   */
  static toDomainFromCreateDto(requestDto: CreateDocumentRequestDto, uploadedBy: string): Document {
    return new Document(
      crypto.randomUUID(), // ID généré
      requestDto.projectId || null,
      null, // phaseId
      null, // inspectionId
      null, // paymentId
      null, // supplierId
      requestDto.title,
      requestDto.description || null,
      requestDto.type,
      'draft' as DocumentStatus, // Statut initial
      requestDto.file?.originalname || null,
      null, // fileUrl - sera généré après upload
      requestDto.file?.size || null,
      requestDto.file?.mimetype || null,
      requestDto.tags || [],
      false, // isInternalOnly
      false, // isSharedWithSuppliers
      requestDto.deadlineDate || null,
      requestDto.assignedTo || null,
      uploadedBy,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  /**
   * Transforme le DTO de mise à jour vers les données partielles de l'entité
   */
  static toUpdateData(requestDto: UpdateDocumentRequestDto): Partial<Document> {
    return {
      title: requestDto.title,
      description: requestDto.description,
      documentType: requestDto.type,
      status: requestDto.status,
      assignedTo: requestDto.assignedTo,
      deadlineDate: requestDto.deadlineDate,
      tags: requestDto.tags,
      updatedAt: new Date().toISOString()
    } as Partial<Document>;
  }

  /**
   * Transforme un tableau de données Supabase vers les entités du domaine
   */
  static toDomainArray(supabaseDocuments: any[]): Document[] {
    return supabaseDocuments.map(doc => DocumentMapper.toDomain(doc));
  }

  /**
   * Transforme un tableau d'entités du domaine vers les DTOs de réponse
   */
  static toResponseDtoArray(documents: Document[]): DocumentResponseDto[] {
    return documents.map(doc => DocumentMapper.toResponseDto(doc));
  }
}
