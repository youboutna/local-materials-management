/**
 * Tender Submission Data Transfer Object
 * Centralized DTO for tender submissions following hexagonal architecture
 */

import { BaseEntityDTO } from "../shared";


/**
 * Interface for uploaded documents in tender submissions
 */
export interface UploadedDocument {
  file: File;
  category: 'administrative' | 'technical' | 'financial';
  subcategory: string;
}

/**
 * Interface for creating tender submissions
 */
export interface CreateTenderSubmissionDTO extends BaseEntityDTO {
  tender_id: string;
  user_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date?: string;
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected';
  documents?: UploadedDocument[];
}

/**
 * Interface for updating tender submissions
 */
export interface UpdateTenderSubmissionDTO {
  id?: string;
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected';
  documents?: UploadedDocument[];
}

/**
 * Main TenderSubmissionDTO interface
 */
export interface TenderSubmissionDTO extends BaseEntityDTO {
  id: string;
  tender_id: string;
  user_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  documents?: UploadedDocument[];
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  is_public?: boolean;
  submission_secret?: string;
  submission_hash?: string;
}

export type TenderSubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
