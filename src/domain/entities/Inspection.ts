// Domain Entity: Inspection
// Pure business logic without infrastructure concerns

export type InspectionStatus = 
  | 'requested' 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'approved' 
  | 'rejected' 
  | 'requires_changes' 
  | 'cancelled'
  | 'pending';

export interface InspectionDocument {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  size?: number;
  mimeType?: string;
  inspectionId?: string;
}

export class Inspection {
  public readonly id: string;
  public readonly projectId: string;
  public readonly phaseId: string | null;
  public readonly stepId: string | null;
  public readonly inspector: string;
  public readonly date: string;
  public readonly status: InspectionStatus;
  public readonly progressAtInspection: number;
  public readonly progress: number;
  public readonly comments: string | null;
  public readonly documents: InspectionDocument[];
  public readonly createdAt: string;
  public readonly updatedAt: string;
  public readonly completedAt: string | null;
  public readonly completedBy: string | null;

  constructor(
    id: string,
    projectId: string,
    phaseId: string | null,
    stepId: string | null,
    inspector: string,
    date: string,
    status: InspectionStatus,
    progressAtInspection: number,
    comments: string | null,
    documents: InspectionDocument[],
    createdAt: string,
    updatedAt: string,
    completedAt?: string | null,
    completedBy?: string | null,
    progress?: number
  ) {
    this.id = id;
    this.projectId = projectId;
    this.phaseId = phaseId;
    this.stepId = stepId;
    this.inspector = inspector;
    this.date = date;
    this.status = status;
    this.progressAtInspection = progressAtInspection;
    this.progress = progress ?? progressAtInspection;
    this.comments = comments;
    this.documents = documents;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.completedAt = completedAt ?? null;
    this.completedBy = completedBy ?? null;
  }

  // Business logic
  canBeScheduled(): boolean {
    return this.status === 'requested';
  }

  canStart(): boolean {
    return this.status === 'scheduled';
  }

  canComplete(): boolean {
    return this.status === 'in_progress';
  }

  canApprove(): boolean {
    return this.status === 'completed';
  }

  isActive(): boolean {
    return ['requested', 'scheduled', 'in_progress', 'pending'].includes(this.status);
  }

  isFinished(): boolean {
    return ['completed', 'approved', 'rejected', 'cancelled'].includes(this.status);
  }

  requiresDocuments(): boolean {
    return this.status === 'in_progress' || this.status === 'completed';
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
