// Domain Entity: Inspection
// Pure business logic without infrastructure concerns

export enum InspectionStatus {
  Approved = "Approved",
  RequiresChanges = "RequiresChanges",
  Rejected = "Rejected",
  Pending = "Pending",
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
}

export class Inspection {
  // Private fields for encapsulation
  private _id: string;
  private _date: string;
  private _status: InspectionStatus;
  private _inspector: Inspector;
  private _progressAtInspection: number;
  private _comments?: string;
  private _documents?: Document[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    date: string,
    status: InspectionStatus,
    inspector: Inspector,
    progressAtInspection: number,
    comments?: string,
    documents?: Document[],
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this._id = this.validateId(id);
    this._date = this.validateDate(date);
    this._status = this.validateStatus(status);
    this._inspector = this.validateInspector(inspector);
    this._progressAtInspection = this.validateProgress(progressAtInspection);
    this._comments = comments;
    this._documents = documents || [];
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
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

  private validateStatus(status: InspectionStatus): InspectionStatus {
    const validStatuses = Object.values(InspectionStatus);
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid inspection status: ${status}`);
    }
    return status;
  }

  private validateInspector(inspector: Inspector): Inspector {
    if (!inspector || !inspector.name || inspector.name.trim().length === 0) {
      throw new Error('Inspector name is required');
    }
    return inspector;
  }

  private validateProgress(progress: number): number {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    return progress;
  }

  // Public getters
  get id(): string {
    return this._id;
  }

  get date(): string {
    return this._date;
  }

  get status(): InspectionStatus {
    return this._status;
  }

  get inspector(): Inspector {
    return this._inspector;
  }

  get progressAtInspection(): number {
    return this._progressAtInspection;
  }

  get comments(): string | undefined {
    return this._comments;
  }

  get documents(): Document[] {
    return this._documents;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

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

  isApproved(): boolean {
    return this._status === InspectionStatus.Approved;
  }

  isRejected(): boolean {
    return this._status === InspectionStatus.Rejected;
  }

  isPending(): boolean {
    return this._status === InspectionStatus.Pending;
  }

  getFormattedStatus(): string {
    const statusMap = {
      [InspectionStatus.Approved]: '✅ Approuvé',
      [InspectionStatus.RequiresChanges]: '🔄 Modifications requises',
      [InspectionStatus.Rejected]: '❌ Rejeté',
      [InspectionStatus.Pending]: '⏳ En attente'
    };
    return statusMap[this._status];
  }

  isFinished(): boolean {
    return ['completed', 'approved', 'rejected', 'cancelled'].includes(this.status.toString().toLowerCase());
  }

  requiresDocuments(): boolean {
    return this.status === InspectionStatus.RequiresChanges || this.status === InspectionStatus.Approved;
  }

  getRequiredDocumentTypes(): string[] {
    return [
      'pv_service_fait',
      'photos',
      'geolocation',
      'rapport_inspection'
    ];
  }

  hasAllRequiredDocuments(): boolean {
    const required = this.getRequiredDocumentTypes();
    return required.every(type => 
      this.documents.some(doc => doc.type === type)
    );
  }

  // Factory method
  static create(params: {
    id: string;
    projectId: string;
    phaseId?: string;
    stepId?: string;
    inspector: string;
    date: string;
    comments?: string;
    status?: InspectionStatus;
    progressAtInspection?: number;
    progress?: number;
    completedAt?: string;
    completedBy?: string;
  }): Inspection {
    return new Inspection(
      params.id,
      params.projectId,
      params.phaseId || null,
      params.stepId || null,
      params.inspector,
      params.date,
      params.status || 'requested',
      params.progressAtInspection || 0,
      params.comments || null,
      [],
      new Date().toISOString(),
      new Date().toISOString(),
      params.completedAt || null,
      params.completedBy || null,
      params.progress || params.progressAtInspection || 0
    );
  }
}
