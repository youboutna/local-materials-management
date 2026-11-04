/**
 * Port de persistance des soumissions d'appels d'offres (btp.tender_submissions,
 * liens tender_submission_documents, documents archivés et journal d'activité).
 */
export type TenderSubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface TenderSubmissionInsert {
  tenderId: string;
  userId: string;
  supplierName: string;
  supplierEmail: string;
  submissionDate: string;
  status: TenderSubmissionStatus;
}

export interface TenderSubmissionDocumentInsert {
  submissionId: string;
  tenderId: string;
  uploadedBy: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  subcategory: string;
}

export interface TenderSubmissionActivityLog {
  id: string;
  submission_id: string;
  action: string;
  details: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface ITenderSubmissionRepository {
  findByTenderAndUser(tenderId: string, userId: string): Promise<Record<string, any> | null>;
  findById(submissionId: string): Promise<Record<string, any>>;
  findByUser(userId: string): Promise<Record<string, any>[]>;
  listStatusesByTender(tenderId: string): Promise<string[]>;
  insert(input: TenderSubmissionInsert): Promise<Record<string, any>>;
  delete(submissionId: string): Promise<void>;
  updateStatus(submissionId: string, status: TenderSubmissionStatus, reviewComment?: string): Promise<void>;
  /** Archive le document et le relie à la soumission. */
  attachDocument(input: TenderSubmissionDocumentInsert): Promise<void>;
  findDocuments(submissionId: string): Promise<Array<Record<string, any>>>;
  findActivityLogs(submissionId: string): Promise<TenderSubmissionActivityLog[]>;
}
