/**
 * Document Domain Transformer
 * Transforms between domain entities and DTOs for documents
 * Following hexagonal architecture principles
 */

import { DocumentDTO } from '@/dtos/entities/DocumentDTO';

// Domain entity for documents
export interface Document {
  id: string;
  name: string;
  type: string;
  url?: string;
  size?: number;
  mimeType?: string;
  projectId?: string;
  inspectionId?: string;
  taskId?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
  tags?: string[];
  version?: number;
  isPublic?: boolean;
  downloadCount?: number;
  lastAccessedAt?: string;
  expiresAt?: string;
}

export class DocumentDomainTransformer {
  /**
   * Transform domain entity to DTO
   */
  static toDTO(document: Document): DocumentDTO {
    return {
      id: document.id,
      name: document.name,
      type: document.type,
      url: document.url,
      size: document.size,
      mime_type: document.mimeType,
      project_id: document.projectId,
      inspection_id: document.inspectionId,
      task_id: document.taskId,
      uploaded_by: document.uploadedBy,
      uploaded_at: document.uploadedAt,
      created_at: document.createdAt,
      updated_at: document.updatedAt,
      metadata: document.metadata,
      tags: document.tags,
      version: document.version,
      is_public: document.isPublic,
      download_count: document.downloadCount,
      last_accessed_at: document.lastAccessedAt,
      expires_at: document.expiresAt
    };
  }

  /**
   * Transform DTO to domain entity
   */
  static toEntity(dto: DocumentDTO): Document {
    return {
      id: dto.id,
      name: dto.name,
      type: dto.type,
      url: dto.url,
      size: dto.size,
      mimeType: dto.mime_type,
      projectId: dto.project_id,
      inspectionId: dto.inspection_id,
      taskId: dto.task_id,
      uploadedBy: dto.uploaded_by,
      uploadedAt: dto.uploaded_at,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      metadata: dto.metadata,
      tags: dto.tags,
      version: dto.version,
      isPublic: dto.is_public,
      downloadCount: dto.download_count,
      lastAccessedAt: dto.last_accessed_at,
      expiresAt: dto.expires_at
    };
  }

  /**
   * Transform database row to domain entity
   */
  static toEntityFromDatabaseRow(row: any): Document {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      url: row.url,
      size: row.size,
      mimeType: row.mime_type,
      projectId: row.project_id,
      inspectionId: row.inspection_id,
      taskId: row.task_id,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      tags: row.tags ? JSON.parse(row.tags) : [],
      version: row.version,
      isPublic: row.is_public,
      downloadCount: row.download_count,
      lastAccessedAt: row.last_accessed_at,
      expiresAt: row.expires_at
    };
  }

  /**
   * Transform domain entity to database row
   */
  static toDatabaseRow(document: Document): any {
    return {
      id: document.id,
      name: document.name,
      type: document.type,
      url: document.url,
      size: document.size,
      mime_type: document.mimeType,
      project_id: document.projectId,
      inspection_id: document.inspectionId,
      task_id: document.taskId,
      uploaded_by: document.uploadedBy,
      uploaded_at: document.uploadedAt,
      created_at: document.createdAt,
      updated_at: document.updatedAt,
      metadata: document.metadata ? JSON.stringify(document.metadata) : null,
      tags: document.tags && document.tags.length > 0 ? JSON.stringify(document.tags) : null,
      version: document.version,
      is_public: document.isPublic,
      download_count: document.downloadCount,
      last_accessed_at: document.lastAccessedAt,
      expires_at: document.expiresAt
    };
  }

  /**
   * Transform array of domain entities to DTOs
   */
  static toDTOs(documents: Document[]): DocumentDTO[] {
    return documents.map(doc => DocumentDomainTransformer.toDTO(doc));
  }

  /**
   * Transform array of DTOs to domain entities
   */
  static toEntities(dtos: DocumentDTO[]): Document[] {
    return dtos.map(dto => DocumentDomainTransformer.toEntity(dto));
  }

  /**
   * Transform array of database rows to domain entities
   */
  static toEntitiesFromDatabaseRows(rows: any[]): Document[] {
    return rows.map(row => DocumentDomainTransformer.toEntityFromDatabaseRow(row));
  }

  /**
   * Create document entity from file upload
   */
  static createFromFile(file: File, metadata?: Partial<Document>): Document {
    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      version: 1,
      isPublic: false,
      downloadCount: 0,
      ...metadata
    };
  }

  /**
   * Update document entity with new data
   */
  static updateDocument(document: Document, updates: Partial<Document>): Document {
    return {
      ...document,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (document.version || 1) + 1
    };
  }

  /**
   * Check if document is expired
   */
  static isExpired(document: Document): boolean {
    if (!document.expiresAt) return false;
    return new Date(document.expiresAt) < new Date();
  }

  /**
   * Get file extension from document name
   */
  static getFileExtension(document: Document): string {
    const name = document.name;
    const lastDot = name.lastIndexOf('.');
    return lastDot !== -1 ? name.substring(lastDot + 1).toLowerCase() : '';
  }

  /**
   * Get file category from MIME type or extension
   */
  static getFileCategory(document: Document): 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other' {
    const mimeType = document.mimeType?.toLowerCase();
    const extension = DocumentDomainTransformer.getFileExtension(document);

    if (mimeType?.startsWith('image/')) return 'image';
    if (mimeType?.startsWith('video/')) return 'video';
    if (mimeType?.startsWith('audio/')) return 'audio';
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

    if (imageExtensions.includes(extension)) return 'image';
    if (documentExtensions.includes(extension)) return 'document';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (archiveExtensions.includes(extension)) return 'archive';
    
    return 'other';
  }

  /**
   * Calculate document compliance score
   */
  static calculateCompliance(document: Document): number {
    let complianceScore = 100; // Start with perfect score

    // Deduct points for expired documents
    if (DocumentDomainTransformer.isExpired(document)) {
      complianceScore -= 30;
    }

    // Deduct points for missing required metadata
    if (!document.projectId) complianceScore -= 10;
    if (!document.uploadedBy) complianceScore -= 10;
    if (!document.metadata) complianceScore -= 5;

    // Deduct points for old documents (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (new Date(document.createdAt) < oneYearAgo) {
      complianceScore -= 15;
    }

    // Ensure score doesn't go below 0
    return Math.max(0, complianceScore);
  }
}
