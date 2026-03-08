/**
 * Tender Document Entity
 * Represents a document associated with a tender
 * Following hexagonal architecture: Props interface + create() factory
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

export interface TenderDocumentProps {
  id: string;
  projectId: string;
  documentId: string;
  category: TenderDocumentCategory;
  subcategory: TenderDocumentSubcategory;
  isRequired?: boolean;
  isSubmitted?: boolean;
  submissionDate?: Date;
  reviewerNotes?: string;
  status?: TenderDocumentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TenderDocument {
  public readonly id: string;
  public readonly projectId: string;
  public readonly documentId: string;
  public readonly category: TenderDocumentCategory;
  public readonly subcategory: TenderDocumentSubcategory;
  public readonly isRequired: boolean;
  public readonly isSubmitted: boolean;
  public readonly submissionDate?: Date;
  public readonly reviewerNotes?: string;
  public readonly status: TenderDocumentStatus;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: Required<Pick<TenderDocumentProps, 'id' | 'projectId' | 'documentId' | 'category' | 'subcategory'>> & Partial<TenderDocumentProps>) {
    this.id = props.id;
    this.projectId = props.projectId;
    this.documentId = props.documentId;
    this.category = props.category;
    this.subcategory = props.subcategory;
    this.isRequired = props.isRequired ?? false;
    this.isSubmitted = props.isSubmitted ?? false;
    this.submissionDate = props.submissionDate;
    this.reviewerNotes = props.reviewerNotes;
    this.status = props.status ?? "draft";
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  // ============= Factory Method =============
  static create(props: TenderDocumentProps): TenderDocument {
    return new TenderDocument(props);
  }

  // ============= Business Logic =============
  withStatus(newStatus: TenderDocumentStatus, notes?: string): TenderDocument {
    return TenderDocument.create({
      ...this.toProps(),
      status: newStatus,
      reviewerNotes: notes ?? this.reviewerNotes,
      updatedAt: new Date()
    });
  }

  submit(): TenderDocument {
    return TenderDocument.create({
      ...this.toProps(),
      isSubmitted: true,
      submissionDate: new Date(),
      status: "submitted",
      updatedAt: new Date()
    });
  }

  approve(notes?: string): TenderDocument {
    return this.withStatus("approved", notes);
  }

  reject(notes: string): TenderDocument {
    return this.withStatus("rejected", notes);
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

  private toProps(): TenderDocumentProps {
    return {
      id: this.id,
      projectId: this.projectId,
      documentId: this.documentId,
      category: this.category,
      subcategory: this.subcategory,
      isRequired: this.isRequired,
      isSubmitted: this.isSubmitted,
      submissionDate: this.submissionDate,
      reviewerNotes: this.reviewerNotes,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}