/**
 * Tender Submission Document Entity
 * Represents a document attached to a tender submission in the domain layer
 */

export class TenderSubmissionDocument {
  constructor(
    public readonly id: string,
    public readonly category: string,
    public readonly createdAt: Date,
    public readonly documentId: string,
    public readonly isRequired: boolean | null,
    public readonly subcategory: string | null,
    public readonly submissionId: string
  ) {}

  // ============= Business Logic =============
  
  isRequiredDocument(): boolean {
    return this.isRequired === true;
  }
  
  isOptionalDocument(): boolean {
    return this.isRequired !== true;
  }
  
  getCategoryType(): 'required' | 'optional' {
    return this.isRequired ? 'required' : 'optional';
  }
  
  // ============= Factory Methods =============
  
  static create(data: Partial<TenderSubmissionDocument>): TenderSubmissionDocument {
    return new TenderSubmissionDocument(
      data.id || crypto.randomUUID(),
      data.category || '',
      data.createdAt || new Date(),
      data.documentId || '',
      data.isRequired || null,
      data.subcategory || null,
      data.submissionId || ''
    );
  }
}
