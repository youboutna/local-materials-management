// Domain Entity: Document
// Pure business logic without infrastructure concerns

export type DocumentType = 
  | 'contract'
  | 'invoice'
  | 'report'
  | 'plan'
  | 'permit'
  | 'pv'
  | 'photo'
  | 'certificate'
  | 'specification'
  | 'correspondence'
  | 'other';

export type DocumentStatus = 
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export class Document {
  constructor(
    public readonly id: string,
    public readonly projectId: string | null,
    public readonly phaseId: string | null,
    public readonly inspectionId: string | null,
    public readonly paymentId: string | null,
    public readonly supplierId: string | null,
    public readonly title: string,
    public readonly description: string | null,
    public readonly documentType: DocumentType,
    public readonly status: DocumentStatus,
    public readonly fileName: string | null,
    public readonly fileUrl: string | null,
    public readonly fileSize: number | null,
    public readonly mimeType: string | null,
    public readonly tags: string[],
    public readonly isInternalOnly: boolean,
    public readonly isSharedWithSuppliers: boolean,
    public readonly deadlineDate: string | null,
    public readonly assignedTo: string | null,
    public readonly uploadedBy: string | null,
    public readonly createdAt: string,
    public readonly updatedAt: string,
    public readonly metadata: Record<string, unknown> | null = null
  ) {}

  // Business logic
  isApproved(): boolean {
    return this.status === 'approved';
  }

  isPending(): boolean {
    return this.status === 'pending_review';
  }

  isOverdue(): boolean {
    if (!this.deadlineDate || this.isApproved()) return false;
    return new Date() > new Date(this.deadlineDate);
  }

  canBeShared(): boolean {
    return !this.isInternalOnly && this.status === 'approved';
  }

  getFileSizeFormatted(): string {
    if (!this.fileSize) return 'N/A';
    
    const kb = this.fileSize / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  }

  getFileExtension(): string | null {
    if (!this.fileName) return null;
    const parts = this.fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
  }

  isImage(): boolean {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return !!this.mimeType && imageTypes.includes(this.mimeType);
  }

  isPdf(): boolean {
    return this.mimeType === 'application/pdf';
  }

  // Factory method
  static create(params: {
    id: string;
    projectId?: string;
    phaseId?: string;
    title: string;
    description?: string;
    documentType: DocumentType;
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
    uploadedBy?: string;
    metadata?: Record<string, unknown> | null;
  }): Document {
    return new Document(
      params.id,
      params.projectId || null,
      params.phaseId || null,
      null,
      null,
      null,
      params.title,
      params.description || null,
      params.documentType,
      'draft',
      params.fileName || null,
      params.fileUrl || null,
      params.fileSize || null,
      params.mimeType || null,
      [],
      false,
      false,
      null,
      null,
      params.uploadedBy || null,
      new Date().toISOString(),
      new Date().toISOString(),
      params.metadata ?? null
    );
  }
}
