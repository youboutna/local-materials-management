/**
 * Tender document upload UI types — canonical home
 * (moved out of TenderDocumentUploadForm.tsx).
 */
export type TenderCategory = "administrative" | "technical" | "financial";
export type TenderSubcategory =
  | "lettre_soumission"
  | "pouvoir_signature"
  | "acte_groupement"
  | "attestation_impot"
  | "attestation_cnss"
  | "attestation_non_faillite"
  | "renseignement_soumissionnaire"
  | "garantie_soumission";

export type DocumentType =
  | "inspection_report"
  | "location_photo"
  | "project_report"
  | "contract"
  | "supplier_info"
  | "task_assignment"
  | "employee_record"
  | "tender";

export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived";

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  category: TenderCategory;
  subcategory?: TenderSubcategory;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  projectId?: string;
  tenderId?: string;
  notes?: string;
}
