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
  | 'cancelled';

export interface InspectionDocument {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadedAt?: string;
}

export class Inspection {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly phaseId: string | null,
    public readonly stepId: string | null,
    public readonly inspector: string,
    public readonly date: string,
    public readonly status: InspectionStatus,
    public readonly progressAtInspection: number,
    public readonly comments: string | null,
    public readonly documents: InspectionDocument[],
    public readonly createdAt: string,
    public readonly updatedAt: string
  ) {}

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
    return ['requested', 'scheduled', 'in_progress'].includes(this.status);
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
  }): Inspection {
    return new Inspection(
      params.id,
      params.projectId,
      params.phaseId || null,
      params.stepId || null,
      params.inspector,
      params.date,
      'requested',
      0,
      params.comments || null,
      [],
      new Date().toISOString(),
      new Date().toISOString()
    );
  }
}
