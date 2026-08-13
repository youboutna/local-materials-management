/**
 * Document Domain Entity
 * Pure business logic without infrastructure concerns
 * 
 * Architecture Hexagonale - DOMAINE PUR
 * ✅ Pas de dépendance vers les DTOs
 * ✅ Pas d'imports externes
 * ✅ Logique métier pure
 * ✅ Types purs (enum, string, Date)
 * ✅ Méthodes de sérialisation pour le transformer
 */

// ============================================================================
// TYPES PURS (pas de DTOs)
// ============================================================================

/**
 * Document type enumeration - Valeurs métier pures
 */
export enum DocumentType {
  CONTRACT = 'contract',
  PLAN = 'plan',
  SPECIFICATION = 'specification',
  REPORT = 'report',
  CERTIFICATE = 'certificate',
  PERMIT = 'permit',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  MANUAL = 'manual',
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  DRAWING = 'drawing',
  PHOTO = 'photo',
  VIDEO = 'video',
  BLUEPRINT = 'blueprint',
  SCHEMA = 'schema',
  CHECKLIST = 'checklist',
  FORM = 'form',
  TEMPLATE = 'template',
  PV = 'pv',
  SERVICE_REPORT = 'service_report',
  TENDER_DOCUMENT = 'tender_document',
  SUPPORTING_DOCUMENT = 'supporting_document',
  CORRESPONDENCE = 'correspondence',
  INSURANCE = 'insurance',
  WARRANTY = 'warranty',
  BANK_GUARANTEE = 'bank_guarantee',
  OTHER = 'other'
}

/**
 * Document status enumeration - Valeurs métier pures
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  /** Alias métier utilisé par l'UI / l'enum DB `document_status` */
  PENDING_REVIEW = 'pending_review',

  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
  DEPRECATED = 'deprecated'
}

/**
 * Document priority enumeration - Valeurs métier pures
 */
export enum DocumentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// ============================================================================
// ENTITÉ DOCUMENT
// ============================================================================

export class Document {
  // ============= PRIVATE FIELDS =============
  
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
  private _priority: DocumentPriority;
  private _fileName: string | null;
  private _fileUrl: string | null;
  private _fileSize: number | null;
  private _mimeType: string | null;
  private _tags: string[];
  private _isInternalOnly: boolean;
  private _isSharedWithSuppliers: boolean;
  private _deadlineDate: Date | null;
  private _assignedTo: string | null;
  private _uploadedBy: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _metadata: Record<string, unknown> | null;

  // ============= CONSTRUCTOR =============

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
    priority: DocumentPriority,
    fileName: string | null,
    fileUrl: string | null,
    fileSize: number | null,
    mimeType: string | null,
    tags: string[],
    isInternalOnly: boolean,
    isSharedWithSuppliers: boolean,
    deadlineDate: Date | null,
    assignedTo: string | null,
    uploadedBy: string | null,
    createdAt: Date,
    updatedAt: Date,
    metadata: Record<string, unknown> | null = null
  ) {
    this._id = id;
    this._projectId = projectId;
    this._phaseId = phaseId;
    this._inspectionId = inspectionId;
    this._paymentId = paymentId;
    this._supplierId = supplierId;
    this._title = title;
    this._description = description;
    this._documentType = documentType;
    this._status = status;
    this._priority = priority;
    this._fileName = fileName;
    this._fileUrl = fileUrl;
    this._fileSize = fileSize;
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

  // ============= GETTERS =============

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
  get priority(): DocumentPriority { return this._priority; }
  get fileName(): string | null { return this._fileName; }
  get fileUrl(): string | null { return this._fileUrl; }
  get fileSize(): number | null { return this._fileSize; }
  get mimeType(): string | null { return this._mimeType; }
  get tags(): string[] { return this._tags; }
  get isInternalOnly(): boolean { return this._isInternalOnly; }
  get isSharedWithSuppliers(): boolean { return this._isSharedWithSuppliers; }
  get deadlineDate(): Date | null { return this._deadlineDate; }
  get assignedTo(): string | null { return this._assignedTo; }
  get uploadedBy(): string | null { return this._uploadedBy; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get metadata(): Record<string, unknown> | null { return this._metadata; }

  // ============= COMPUTED PROPERTIES =============

  get displayName(): string {
    return this._title || `Document-${this._id}`;
  }

  get fileExtension(): string | null {
    if (!this._fileName) return null;
    const parts = this._fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
  }

  get tagCount(): number {
    return this._tags.length;
  }

  get isOverdue(): boolean {
    if (!this._deadlineDate) return false;
    if (this.isApproved() || this.isArchived()) return false;
    return new Date() > this._deadlineDate;
  }

  get isLargeFile(): boolean {
    return this._fileSize !== null && this._fileSize > 10 * 1024 * 1024; // 10MB
  }

  get isAccessibleToSuppliers(): boolean {
    return this._isSharedWithSuppliers && !this._isInternalOnly;
  }

  get isExpired(): boolean {
    return this._status === DocumentStatus.EXPIRED || this.isOverdue;
  }

  get isUrgent(): boolean {
    return this._priority === DocumentPriority.URGENT;
  }

  // ============= BUSINESS LOGIC METHODS =============

  /**
   * Vérifie si le document est approuvé
   */
  isApproved(): boolean {
    return this._status === DocumentStatus.APPROVED;
  }

  /**
   * Vérifie si le document est en attente de validation
   */
  isPending(): boolean {
    return this._status === DocumentStatus.PENDING_APPROVAL || 
           this._status === DocumentStatus.DRAFT;
  }

  /**
   * Vérifie si le document est rejeté
   */
  isRejected(): boolean {
    return this._status === DocumentStatus.REJECTED;
  }

  /**
   * Vérifie si le document est archivé
   */
  isArchived(): boolean {
    return this._status === DocumentStatus.ARCHIVED;
  }

  /**
   * Vérifie si le document est un brouillon
   */
  isDraft(): boolean {
    return this._status === DocumentStatus.DRAFT;
  }

  /**
   * Vérifie si le document est déprécié
   */
  isDeprecated(): boolean {
    return this._status === DocumentStatus.DEPRECATED;
  }

  /**
   * Vérifie si le document peut être partagé avec les fournisseurs
   */
  canShareWithSuppliers(): boolean {
    return !this._isInternalOnly && 
           this._status === DocumentStatus.APPROVED &&
           this._isSharedWithSuppliers;
  }

  /**
   * Vérifie si le document a des fichiers joints
   */
  hasFile(): boolean {
    return !!(this._fileUrl && this._fileName);
  }

  /**
   * Vérifie si le document est confidentiel
   */
  isConfidential(): boolean {
    return this._isInternalOnly && !this._isSharedWithSuppliers;
  }

  /**
   * Vérifie si le document est public
   */
  isPublic(): boolean {
    return !this._isInternalOnly && this._isSharedWithSuppliers;
  }

  /**
   * Obtient la taille du fichier en format lisible
   */
  getFileSizeFormatted(): string {
    if (this._fileSize === null) return 'N/A';
    
    const size = this._fileSize;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * Obtient le nombre de jours restants avant l'échéance
   */
  getDaysUntilDeadline(): number | null {
    if (!this._deadlineDate) return null;
    const now = new Date();
    const diff = this._deadlineDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ============= SETTERS WITH VALIDATION =============

  set title(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Document title is required');
    }
    if (value.length > 200) {
      throw new Error('Document title must be less than 200 characters');
    }
    this._title = value.trim();
    this._updatedAt = new Date();
  }

  set description(value: string | null) {
    this._description = value;
    this._updatedAt = new Date();
  }

  set status(value: DocumentStatus) {
    if (!Object.values(DocumentStatus).includes(value)) {
      throw new Error(`Invalid document status: ${value}`);
    }
    this._status = value;
    this._updatedAt = new Date();
  }

  set priority(value: DocumentPriority) {
    if (!Object.values(DocumentPriority).includes(value)) {
      throw new Error(`Invalid document priority: ${value}`);
    }
    this._priority = value;
    this._updatedAt = new Date();
  }

  set tags(value: string[]) {
    this._tags = value || [];
    this._updatedAt = new Date();
  }

  set deadlineDate(value: Date | null) {
    if (value && value < new Date()) {
      throw new Error('Deadline date cannot be in the past');
    }
    this._deadlineDate = value;
    this._updatedAt = new Date();
  }

  set assignedTo(value: string | null) {
    this._assignedTo = value;
    this._updatedAt = new Date();
  }

  set isInternalOnly(value: boolean) {
    this._isInternalOnly = value;
    this._updatedAt = new Date();
  }

  set isSharedWithSuppliers(value: boolean) {
    this._isSharedWithSuppliers = value;
    this._updatedAt = new Date();
  }

  set metadata(value: Record<string, unknown> | null) {
    this._metadata = value;
    this._updatedAt = new Date();
  }

  // ============= IMMUTABLE METHODS =============

  /**
   * Crée une nouvelle instance avec un statut modifié
   */
  withStatus(newStatus: DocumentStatus): Document {
    if (!Object.values(DocumentStatus).includes(newStatus)) {
      throw new Error(`Invalid document status: ${newStatus}`);
    }
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
      this._priority,
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
      new Date(),
      this._metadata
    );
  }

  /**
   * Crée une nouvelle instance avec une priorité modifiée
   */
  withPriority(newPriority: DocumentPriority): Document {
    if (!Object.values(DocumentPriority).includes(newPriority)) {
      throw new Error(`Invalid document priority: ${newPriority}`);
    }
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
      this._status,
      newPriority,
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
      new Date(),
      this._metadata
    );
  }

  /**
   * Crée une nouvelle instance avec des métadonnées mises à jour
   */
  withMetadata(metadata: Record<string, unknown>): Document {
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
      this._status,
      this._priority,
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
      new Date(),
      metadata
    );
  }

  /**
   * Crée une nouvelle instance avec des tags mis à jour
   */
  withTags(tags: string[]): Document {
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
      this._status,
      this._priority,
      this._fileName,
      this._fileUrl,
      this._fileSize,
      this._mimeType,
      tags,
      this._isInternalOnly,
      this._isSharedWithSuppliers,
      this._deadlineDate,
      this._assignedTo,
      this._uploadedBy,
      this._createdAt,
      new Date(),
      this._metadata
    );
  }

  /**
   * Crée une nouvelle instance avec une date d'échéance mise à jour
   */
  withDeadline(deadlineDate: Date | null): Document {
    if (deadlineDate && deadlineDate < new Date()) {
      throw new Error('Deadline date cannot be in the past');
    }
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
      this._status,
      this._priority,
      this._fileName,
      this._fileUrl,
      this._fileSize,
      this._mimeType,
      this._tags,
      this._isInternalOnly,
      this._isSharedWithSuppliers,
      deadlineDate,
      this._assignedTo,
      this._uploadedBy,
      this._createdAt,
      new Date(),
      this._metadata
    );
  }

  // ============= FACTORY METHODS =============

  /**
   * Crée un nouveau document avec les valeurs par défaut
   */
  static create(params: {
    id: string;
    title: string;
    projectId?: string;
    phaseId?: string;
    documentType?: DocumentType;
    description?: string;
    tags?: string[];
    uploadedBy?: string;
    priority?: DocumentPriority;
  }): Document {
    const now = new Date();
    
    return new Document(
      params.id,
      params.projectId || null,
      params.phaseId || null,
      null, // inspectionId
      null, // paymentId
      null, // supplierId
      params.title,
      params.description || null,
      params.documentType || DocumentType.OTHER,
      DocumentStatus.DRAFT,
      params.priority || DocumentPriority.MEDIUM,
      null, // fileName
      null, // fileUrl
      null, // fileSize
      null, // mimeType
      params.tags || [],
      false, // isInternalOnly
      false, // isSharedWithSuppliers
      null, // deadlineDate
      null, // assignedTo
      params.uploadedBy || null,
      now, // createdAt
      now, // updatedAt
      null // metadata
    );
  }

  /**
   * Crée un document à partir d'un fichier
   */
  static fromFile(params: {
    id: string;
    title: string;
    file: File;
    projectId?: string;
    phaseId?: string;
    documentType?: DocumentType;
    description?: string;
    uploadedBy?: string;
    priority?: DocumentPriority;
  }): Document {
    const now = new Date();
    const documentType = params.documentType || DocumentType.OTHER;
    
    return new Document(
      params.id,
      params.projectId || null,
      params.phaseId || null,
      null,
      null,
      null,
      params.title,
      params.description || null,
      documentType,
      DocumentStatus.DRAFT,
      params.priority || DocumentPriority.MEDIUM,
      params.file.name,
      null, // fileUrl (à définir après upload)
      params.file.size,
      params.file.type || null,
      [], // tags
      false,
      false,
      null,
      null,
      params.uploadedBy || null,
      now,
      now,
      {
        originalName: params.file.name,
        fileType: params.file.type,
        uploadedAt: now.toISOString(),
      }
    );
  }

  /**
   * Crée un document approuvé (pour les cas d'usage rapides)
   */
  static createApproved(params: {
    id: string;
    title: string;
    projectId?: string;
    phaseId?: string;
    documentType?: DocumentType;
    description?: string;
    fileUrl: string;
    fileName: string;
    uploadedBy?: string;
  }): Document {
    const now = new Date();
    
    return new Document(
      params.id,
      params.projectId || null,
      params.phaseId || null,
      null,
      null,
      null,
      params.title,
      params.description || null,
      params.documentType || DocumentType.OTHER,
      DocumentStatus.APPROVED,
      DocumentPriority.MEDIUM,
      params.fileName,
      params.fileUrl,
      null, // fileSize
      null, // mimeType
      [],
      false,
      false,
      null,
      null,
      params.uploadedBy || null,
      now,
      now,
      {
        approvedAt: now.toISOString(),
        approvedBy: 'system',
      }
    );
  }

  // ============= SERIALIZATION METHODS (pour le transformer) =============

  /**
   * Convertit l'entité en objet pour le repository (snake_case)
   * Utilisé par le DocumentTransformer
   */
  toRepository(): Record<string, unknown> {
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
      priority: this._priority,
      file_name: this._fileName,
      file_url: this._fileUrl,
      file_size: this._fileSize,
      mime_type: this._mimeType,
      tags: this._tags,
      is_internal_only: this._isInternalOnly,
      is_shared_with_suppliers: this._isSharedWithSuppliers,
      deadline_date: this._deadlineDate ? this._deadlineDate.toISOString() : null,
      assigned_to: this._assignedTo,
      uploaded_by: this._uploadedBy,
      created_at: this._createdAt.toISOString(),
      updated_at: this._updatedAt.toISOString(),
      metadata: this._metadata
    };
  }

  /**
   * Convertit l'entité en objet pour l'API (camelCase)
   * Utilisé par le DocumentTransformer
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      projectId: this._projectId,
      phaseId: this._phaseId,
      inspectionId: this._inspectionId,
      paymentId: this._paymentId,
      supplierId: this._supplierId,
      title: this._title,
      description: this._description,
      documentType: this._documentType,
      status: this._status,
      priority: this._priority,
      fileName: this._fileName,
      fileUrl: this._fileUrl,
      fileSize: this._fileSize,
      mimeType: this._mimeType,
      tags: this._tags,
      isInternalOnly: this._isInternalOnly,
      isSharedWithSuppliers: this._isSharedWithSuppliers,
      deadlineDate: this._deadlineDate ? this._deadlineDate.toISOString() : null,
      assignedTo: this._assignedTo,
      uploadedBy: this._uploadedBy,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      metadata: this._metadata,
      // Computed properties
      displayName: this.displayName,
      fileExtension: this.fileExtension,
      isOverdue: this.isOverdue,
      isLargeFile: this.isLargeFile,
      isAccessibleToSuppliers: this.isAccessibleToSuppliers,
      isExpired: this.isExpired,
      isUrgent: this.isUrgent,
      fileSizeFormatted: this.getFileSizeFormatted(),
      daysUntilDeadline: this.getDaysUntilDeadline(),
    };
  }

  // ============= VALIDATION METHODS =============

  /**
   * Valide l'état du document
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this._title || this._title.trim().length === 0) {
      errors.push('Document title is required');
    }

    if (this._title && this._title.length > 200) {
      errors.push('Document title must be less than 200 characters');
    }

    if (this._deadlineDate && this._deadlineDate < new Date()) {
      errors.push('Deadline date cannot be in the past');
    }

    if (this._fileSize !== null && this._fileSize < 0) {
      errors.push('File size must be positive');
    }

    if (this._fileSize !== null && this._fileSize > 100 * 1024 * 1024) {
      errors.push('File size cannot exceed 100MB');
    }

    if (!Object.values(DocumentType).includes(this._documentType)) {
      errors.push(`Invalid document type: ${this._documentType}`);
    }

    if (!Object.values(DocumentStatus).includes(this._status)) {
      errors.push(`Invalid document status: ${this._status}`);
    }

    if (!Object.values(DocumentPriority).includes(this._priority)) {
      errors.push(`Invalid document priority: ${this._priority}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Vérifie si le document peut être soumis pour approbation
   */
  canSubmitForApproval(): boolean {
    const validation = this.validate();
    if (!validation.isValid) return false;
    
    return this._status === DocumentStatus.DRAFT && 
           this.hasFile() &&
           !this.isConfidential();
  }

  /**
   * Vérifie si le document peut être archivé
   */
  canArchive(): boolean {
    return this._status === DocumentStatus.APPROVED || 
           this._status === DocumentStatus.EXPIRED ||
           this._status === DocumentStatus.DEPRECATED;
  }

  /**
   * Vérifie si le document peut être restauré
   */
  canRestore(): boolean {
    return this._status === DocumentStatus.ARCHIVED;
  }
}

export default Document;