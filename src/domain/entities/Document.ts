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
  // Private fields for encapsulation
  private _id: string;
  private _projectId: string | null;
  private _phaseId: string | null;
  private _inspectionId: string | null;
  private _paymentId: string | null;
  private _supplierId: string | null;
  private _title: string;
  private _description: string | null;
  private _documentType: DocumentType;
  private _status: DocumentStatus;
  private _fileName: string | null;
  private _fileUrl: string | null;
  private _fileSize: number | null;
  private _mimeType: string | null;
  private _tags: string[];
  private _isInternalOnly: boolean;
  private _isSharedWithSuppliers: boolean;
  private _deadlineDate: string | null;
  private _assignedTo: string | null;
  private _uploadedBy: string | null;
  private _createdAt: string;
  private _updatedAt: string;
  private _metadata: Record<string, unknown> | null;

  constructor(
    id: string,
    projectId: string | null,
    phaseId: string | null,
    inspectionId: string | null,
    paymentId: string | null,
    supplierId: string | null,
    title: string,
    description: string | null,
    documentType: DocumentType,
    status: DocumentStatus,
    fileName: string | null,
    fileUrl: string | null,
    fileSize: number | null,
    mimeType: string | null,
    tags: string[],
    isInternalOnly: boolean,
    isSharedWithSuppliers: boolean,
    deadlineDate: string | null,
    assignedTo: string | null,
    uploadedBy: string | null,
    createdAt: string,
    updatedAt: string,
    metadata: Record<string, unknown> | null = null
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._projectId = projectId;
    this._phaseId = phaseId;
    this._inspectionId = inspectionId;
    this._paymentId = paymentId;
    this._supplierId = supplierId;
    this._title = this.validateTitle(title);
    this._description = description;
    this._documentType = this.validateDocumentType(documentType);
    this._status = this.validateStatus(status);
    this._fileName = fileName;
    this._fileUrl = fileUrl;
    this._fileSize = this.validateFileSize(fileSize);
    this._mimeType = mimeType;
    this._tags = tags || [];
    this._isInternalOnly = isInternalOnly;
    this._isSharedWithSuppliers = isSharedWithSuppliers;
    this._deadlineDate = deadlineDate;
    this._assignedTo = assignedTo;
    this._uploadedBy = uploadedBy;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._metadata = metadata;
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get projectId(): string | null { return this._projectId; }
  get phaseId(): string | null { return this._phaseId; }
  get inspectionId(): string | null { return this._inspectionId; }
  get paymentId(): string | null { return this._paymentId; }
  get supplierId(): string | null { return this._supplierId; }
  get title(): string { return this._title; }
  get description(): string | null { return this._description; }
  get documentType(): DocumentType { return this._documentType; }
  get status(): DocumentStatus { return this._status; }
  get fileName(): string | null { return this._fileName; }
  get fileUrl(): string | null { return this._fileUrl; }
  get fileSize(): number | null { return this._fileSize; }
  get mimeType(): string | null { return this._mimeType; }
  get tags(): string[] { return this._tags; }
  get isInternalOnly(): boolean { return this._isInternalOnly; }
  get isSharedWithSuppliers(): boolean { return this._isSharedWithSuppliers; }
  get deadlineDate(): string | null { return this._deadlineDate; }
  get assignedTo(): string | null { return this._assignedTo; }
  get uploadedBy(): string | null { return this._uploadedBy; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }
  get metadata(): Record<string, unknown> | null { return this._metadata; }

  // ============= Getters with Business Logic =============
  get displayName(): string {
    return this._title || `Document-${this._id}`;
  }

  getFileExtension(): string | null {
    if (!this._fileName) return null;
    const parts = this._fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
  }

  getTagsCount(): number {
    return this._tags.length;
  }

  // ============= Setters with Validation =============
  set title(value: string) { 
    this._title = this.validateTitle(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set description(value: string | null) { 
    this._description = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set status(value: DocumentStatus) { 
    this._status = this.validateStatus(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set tags(value: string[]) { 
    this._tags = value || []; 
    this._updatedAt = new Date().toISOString();
  }
  
  set deadlineDate(value: string | null) { 
    this._deadlineDate = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set assignedTo(value: string | null) { 
    this._assignedTo = value; 
    this._updatedAt = new Date().toISOString();
  }

  // ============= Business Logic Methods =============
  isApproved(): boolean {
    return this._status === 'approved';
  }

  isPending(): boolean {
    return this._status === 'pending_review';
  }

  isOverdue(): boolean {
    if (!this._deadlineDate || this.isApproved()) return false;
    return new Date() > new Date(this._deadlineDate);
  }

  isAccessibleToSuppliers(): boolean {
    return this._isSharedWithSuppliers && !this._isInternalOnly;
  }

  isLargeFile(): boolean {
    return this._fileSize !== null && this._fileSize > 10 * 1024 * 1024; // 10MB
  }

  // ============= Immutability Methods =============
  withStatus(newStatus: DocumentStatus): Document {
    return new Document(
      this._id,
      this._projectId,
      this._phaseId,
      this._inspectionId,
      this._paymentId,
      this._supplierId,
      this._title,
      this._description,
      this._documentType,
      newStatus,
      this._fileName,
      this._fileUrl,
      this._fileSize,
      this._mimeType,
      this._tags,
      this._isInternalOnly,
      this._isSharedWithSuppliers,
      this._deadlineDate,
      this._assignedTo,
      this._uploadedBy,
      this._createdAt,
      new Date().toISOString(),
      this._metadata
    );
  }

  // ============= Factory Methods =============
  static create(params: {
    id: string;
    title: string;
    projectId?: string;
    phaseId?: string;
    documentType?: DocumentType;
    description?: string;
    tags?: string[];
  }): Document {
    return new Document(
      params.id,
      params.projectId || null,
      params.phaseId || null,
      null, // inspectionId
      null, // paymentId
      null, // supplierId
      params.title,
      params.description || null,
      params.documentType || 'other',
      'draft',
      null, // fileName
      null, // fileUrl
      null, // fileSize
      null, // mimeType
      params.tags || [],
      false, // isInternalOnly
      false, // isSharedWithSuppliers
      null, // deadlineDate
      null, // assignedTo
      null, // uploadedBy
      new Date().toISOString(),
      new Date().toISOString(),
      null // metadata
    );
  }

  // ============= Data Transformation Methods =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      project_id: this._projectId,
      phase_id: this._phaseId,
      inspection_id: this._inspectionId,
      payment_id: this._paymentId,
      supplier_id: this._supplierId,
      title: this._title,
      description: this._description,
      document_type: this._documentType,
      status: this._status,
      file_name: this._fileName,
      file_url: this._fileUrl,
      file_size: this._fileSize,
      mime_type: this._mimeType,
      tags: this._tags,
      is_internal_only: this._isInternalOnly,
      is_shared_with_suppliers: this._isSharedWithSuppliers,
      deadline_date: this._deadlineDate,
      assigned_to: this._assignedTo,
      uploaded_by: this._uploadedBy,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      metadata: this._metadata
    };
  }

  // ============= Validation Methods =============
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Document ID is required');
    }
    return id.trim();
  }

  private validateTitle(title: string): string {
    if (!title || title.trim().length === 0) {
      throw new Error('Document title is required');
    }
    if (title.length > 200) {
      throw new Error('Document title must be less than 200 characters');
    }
    return title.trim();
  }

  private validateDocumentType(type: DocumentType): DocumentType {
    const validTypes: DocumentType[] = [
      'contract', 'invoice', 'report', 'plan', 'permit', 'pv', 
      'photo', 'certificate', 'specification', 'correspondence', 'other'
    ];
    
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }
    return type;
  }

  private validateStatus(status: DocumentStatus): DocumentStatus {
    const validStatuses: DocumentStatus[] = [
      'draft', 'pending_review', 'approved', 'rejected', 'archived'
    ];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid document status: ${status}`);
    }
    return status;
  }

  private validateFileSize(size: number | null): number | null {
    if (size === null) return null;
    if (size < 0) {
      throw new Error('File size must be positive');
    }
    if (size > 100 * 1024 * 1024) { // 100MB
      throw new Error('File size seems too large (max 100MB)');
    }
    return size;
  }
}
