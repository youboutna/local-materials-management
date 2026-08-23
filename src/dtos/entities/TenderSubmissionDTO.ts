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
  tenderId: string;
  userId: string;
  supplierName: string;
  supplierEmail: string;
  submissionDate?: string;
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
  tenderId: string;
  userId: string;
  supplierName: string;
  supplierEmail: string;
  submissionDate?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  documents?: UploadedDocument[];
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  isPublic?: boolean;
  submissionSecret?: string;
  submissionHash?: string;
}

export type TenderSubmissionStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';
