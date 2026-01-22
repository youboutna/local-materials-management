/**
 * Tender Submission Entity
 * Represents a tender submission in the domain layer
 */

export class TenderSubmission {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly tenderId: string,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly submissionDate: Date,
    public readonly supplierEmail: string | null,
    public readonly supplierName: string | null,
    public readonly administrativeScore: number | null,
    public readonly technicalScore: number | null,
    public readonly financialScore: number | null,
    public readonly totalScore: number | null,
    public readonly updatedAt: Date | null,
    public readonly userId: string
  ) {}

  // ============= Business Logic =============
  
  isActive(): boolean {
    return this.status === 'active';
  }
  
  isDraft(): boolean {
    return this.status === 'draft';
  }
  
  isSubmitted(): boolean {
    return this.status === 'submitted';
  }
  
  isUnderReview(): boolean {
    return this.status === 'under_review';
  }
  
  isCompleted(): boolean {
    return this.status === 'completed';
  }
  
  getCalculatedTotalScore(): number {
    const admin = this.administrativeScore || 0;
    const tech = this.technicalScore || 0;
    const fin = this.financialScore || 0;
    return admin * 0.3 + tech * 0.4 + fin * 0.3;
  }
  
  // ============= Factory Methods =============
  
  static create(data: Partial<TenderSubmission>): TenderSubmission {
    return new TenderSubmission(
      data.id || crypto.randomUUID(),
      data.projectId || '',
      data.tenderId || '',
      data.status || 'draft',
      data.createdAt || new Date(),
      data.submissionDate || new Date(),
      data.supplierEmail || null,
      data.supplierName || null,
      data.administrativeScore || null,
      data.technicalScore || null,
      data.financialScore || null,
      data.totalScore || null,
      data.updatedAt || null,
      data.userId || ''
    );
  }
}
