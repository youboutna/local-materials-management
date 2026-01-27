/**
 * Tender Document Entity
 * Represents a document associated with a tender
 */

export type TenderDocumentCategory = "administrative" | "technical" | "financial";
export type TenderDocumentSubcategory =
  | "lettre_soumission"
  | "pouvoir_signature"
  | "acte_groupement"
  | "attestation_impot"
  | "attestation_cnss"
  | "attestation_non_faillite"
  | "renseignement_soumissionnaire"
  | "garantie_soumission";

export type TenderDocumentStatus = "draft" | "submitted" | "reviewed" | "approved" | "rejected";

export class TenderDocument {
  constructor(
    public id: string,
    public projectId: string,
    public documentId: string,
    public category: TenderDocumentCategory,
    public subcategory: TenderDocumentSubcategory,
    public isRequired: boolean = false,
    public isSubmitted: boolean = false,
    public submissionDate?: Date,
    public reviewerNotes?: string,
    public status: TenderDocumentStatus = "draft",
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  // Business logic methods
  submit(): void {
    this.isSubmitted = true;
    this.submissionDate = new Date();
    this.status = "submitted";
    this.updatedAt = new Date();
  }

  approve(notes?: string): void {
    this.status = "approved";
    this.reviewerNotes = notes;
    this.updatedAt = new Date();
  }

  reject(notes: string): void {
    this.status = "rejected";
    this.reviewerNotes = notes;
    this.updatedAt = new Date();
  }

  requestReview(): void {
    this.status = "reviewed";
    this.updatedAt = new Date();
  }

  // Validation methods
  isValid(): boolean {
    return (
      this.id.length > 0 &&
      this.projectId.length > 0 &&
      this.documentId.length > 0 &&
      this.category.length > 0 &&
      this.subcategory.length > 0
    );
  }

  canBeSubmitted(): boolean {
    return this.status === "draft" && !this.isSubmitted;
  }

  canBeReviewed(): boolean {
    return this.status === "submitted";
  }

  canBeApproved(): boolean {
    return this.status === "reviewed";
  }

  canBeRejected(): boolean {
    return this.status === "reviewed" || this.status === "submitted";
  }
}
