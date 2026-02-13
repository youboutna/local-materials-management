// Domain Entity: Inspection
// Pure business logic without infrastructure concerns

export enum InspectionStatus {
  Approved = "Approved",
  RequiresChanges = "RequiresChanges",
  Rejected = "Rejected",
  Pending = "Pending",
  Completed = "Completed",
  InProgress = "InProgress",
  Scheduled = "Scheduled",
  Cancelled = "Cancelled",
  Requested = "Requested",
}

export interface Inspector {
  id?: string;
  name: string;
  agency: string;
}

export interface Document {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  size?: number;
  mimeType?: string;
  // Legacy snake_case aliases
  uploaded_at?: string;
  uploaded_by?: string;
}

export class Inspection {
  private _id: string;
  private _date: string;
  private _status: InspectionStatus;
  private _inspector: Inspector;
  private _progressAtInspection: number;
  private _comments?: string;
  private _documents?: Document[];
  private _createdAt: Date;
  private _updatedAt: Date;
  // DB-backed fields (Rule #9: If in DB → add everywhere)
  private _projectId?: string;
  private _phaseId?: string;
  private _stepId?: string;
  private _completedAt?: string;
  private _completedBy?: string;
  private _progress?: number;
  private _paymentType?: string;

  constructor(
    id: string,
    date: string,
    status: InspectionStatus,
    inspector: Inspector,
    progressAtInspection: number,
    comments?: string,
    documents?: Document[],
    createdAt?: Date,
    updatedAt?: Date,
    projectId?: string,
    phaseId?: string,
    stepId?: string,
    completedAt?: string,
    completedBy?: string,
    progress?: number,
    paymentType?: string,
  ) {
    this._id = this.validateId(id);
    this._date = this.validateDate(date);
    this._status = status;
    this._inspector = inspector;
    this._progressAtInspection = this.validateProgress(progressAtInspection);
    this._comments = comments;
    this._documents = documents || [];
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
    this._projectId = projectId;
    this._phaseId = phaseId;
    this._stepId = stepId;
    this._completedAt = completedAt;
    this._completedBy = completedBy;
    this._progress = progress;
    this._paymentType = paymentType;
  }

  // Validation methods
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Inspection ID is required');
    }
    return id;
  }

  private validateDate(date: string): string {
    if (!date || date.trim().length === 0) {
      throw new Error('Inspection date is required');
    }
    return date;
  }

  private validateProgress(progress: number): number {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    return progress;
  }

  // Public getters
  get id(): string { return this._id; }
  get date(): string { return this._date; }
  get status(): InspectionStatus { return this._status; }
  get inspector(): Inspector { return this._inspector; }
  get progressAtInspection(): number { return this._progressAtInspection; }
  get comments(): string | undefined { return this._comments; }
  get documents(): Document[] { return this._documents || []; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get projectId(): string | undefined { return this._projectId; }
  get phaseId(): string | undefined { return this._phaseId; }
  get stepId(): string | undefined { return this._stepId; }
  get completedAt(): string | undefined { return this._completedAt; }
  get completedBy(): string | undefined { return this._completedBy; }
  get progress(): number | undefined { return this._progress; }
  get paymentType(): string | undefined { return this._paymentType; }

  // Setters for mutable fields
  set progress(value: number | undefined) { this._progress = value; }

  // Business logic methods
  approve(): void {
    this._status = InspectionStatus.Approved;
    this._updatedAt = new Date();
  }

  reject(): void {
    this._status = InspectionStatus.Rejected;
    this._updatedAt = new Date();
  }

  requestChanges(): void {
    this._status = InspectionStatus.RequiresChanges;
    this._updatedAt = new Date();
  }

  isApproved(): boolean { return this._status === InspectionStatus.Approved; }
  isRejected(): boolean { return this._status === InspectionStatus.Rejected; }
  isPending(): boolean { return this._status === InspectionStatus.Pending; }

  getFormattedStatus(): string {
    const statusMap: Record<string, string> = {
      [InspectionStatus.Approved]: '✅ Approuvé',
      [InspectionStatus.RequiresChanges]: '🔄 Modifications requises',
      [InspectionStatus.Rejected]: '❌ Rejeté',
      [InspectionStatus.Pending]: '⏳ En attente',
      [InspectionStatus.Completed]: '✅ Terminé',
      [InspectionStatus.InProgress]: '🔄 En cours',
      [InspectionStatus.Scheduled]: '📅 Planifié',
      [InspectionStatus.Cancelled]: '❌ Annulé',
      [InspectionStatus.Requested]: '📝 Demandé',
    };
    return statusMap[this._status] || this._status;
  }

  isFinished(): boolean {
    return [InspectionStatus.Completed, InspectionStatus.Approved, InspectionStatus.Rejected, InspectionStatus.Cancelled]
      .includes(this._status);
  }

  requiresDocuments(): boolean {
    return this.status === InspectionStatus.RequiresChanges || this.status === InspectionStatus.Approved;
  }

  getRequiredDocumentTypes(): string[] {
    return ['pv_service_fait', 'photos', 'geolocation', 'rapport_inspection'];
  }

  hasAllRequiredDocuments(): boolean {
    const required = this.getRequiredDocumentTypes();
    return required.every(type => this.documents.some(doc => doc.type === type));
  }

  // Factory method
  static create(params: {
    id: string;
    projectId?: string;
    phaseId?: string;
    stepId?: string;
    inspector: string | Inspector;
    date: string;
    comments?: string;
    status?: InspectionStatus | string;
    progressAtInspection?: number;
    progress?: number;
    completedAt?: string;
    completedBy?: string;
    paymentType?: string;
  }): Inspection {
    const inspectorObj: Inspector = typeof params.inspector === 'string'
      ? { name: params.inspector, agency: '' }
      : params.inspector;

    const statusEnum = typeof params.status === 'string'
      ? Inspection.mapStringToStatus(params.status)
      : (params.status || InspectionStatus.Requested);

    return new Inspection(
      params.id,
      params.date,
      statusEnum,
      inspectorObj,
      params.progressAtInspection || 0,
      params.comments,
      [],
      new Date(),
      new Date(),
      params.projectId,
      params.phaseId,
      params.stepId,
      params.completedAt,
      params.completedBy,
      params.progress || params.progressAtInspection || 0,
      params.paymentType,
    );
  }

  /**
   * Map string status to InspectionStatus enum
   */
  static mapStringToStatus(status: string): InspectionStatus {
    const map: Record<string, InspectionStatus> = {
      'approved': InspectionStatus.Approved,
      'Approved': InspectionStatus.Approved,
      'rejected': InspectionStatus.Rejected,
      'Rejected': InspectionStatus.Rejected,
      'requires_changes': InspectionStatus.RequiresChanges,
      'RequiresChanges': InspectionStatus.RequiresChanges,
      'pending': InspectionStatus.Pending,
      'Pending': InspectionStatus.Pending,
      'completed': InspectionStatus.Completed,
      'Completed': InspectionStatus.Completed,
      'in_progress': InspectionStatus.InProgress,
      'InProgress': InspectionStatus.InProgress,
      'scheduled': InspectionStatus.Scheduled,
      'Scheduled': InspectionStatus.Scheduled,
      'cancelled': InspectionStatus.Cancelled,
      'Cancelled': InspectionStatus.Cancelled,
      'requested': InspectionStatus.Requested,
      'Requested': InspectionStatus.Requested,
    };
    return map[status] || InspectionStatus.Pending;
  }
}
