/**
 * ITenderSubmissionRepository - Domain Repository Interface
 * Hexagonal Architecture - Port for tender submission operations
 * Defines contract for tender submission data access
 * 
 * Following Rule #1: Arrow Flow
 * Service → Repository Interface → Adapter → Database
 */

import { UpdateTenderSubmissionDTO } from '@/dtos/entities/TenderDTO';;

export interface ITenderSubmissionRepository {
  /**
   * Create a new tender submission
   * @param submission - Submission data to create
   * @returns Created submission with ID
   */
  createSubmission(submission: CreateTenderSubmissionDTO): Promise<TenderSubmissionDTO>;

  /**
   * Get submission by ID
   * @param id - Submission ID
   * @returns Submission or null if not found
   */
  getSubmissionById(id: string): Promise<TenderSubmissionDTO | null>;

  /**
   * Update submission
   * @param id - Submission ID
   * @param submission - Updated submission data
   * @returns Updated submission
   */
  updateSubmission(id: string, submission: UpdateTenderSubmissionDTO): Promise<TenderSubmissionDTO>;

  /**
   * Delete submission
   * @param id - Submission ID
   */
  deleteSubmission(id: string): Promise<void>;

  /**
   * Get all submissions for a tender
   * @param tenderId - Tender ID
   * @returns Array of submissions
   */
  getSubmissionsByTenderId(tenderId: string): Promise<TenderSubmissionDTO[]>;

  /**
   * Get all submissions by user
   * @param userId - User ID
   * @returns Array of submissions
   */
  getSubmissionsByUserId(userId: string): Promise<TenderSubmissionDTO[]>;

  /**
   * Get submission count for a tender
   * @param tenderId - Tender ID
   * @returns Number of submissions
   */
  getSubmissionCountByTenderId(tenderId: string): Promise<number>;

  /**
   * Get submission statistics by tender
   * @param tenderId - Tender ID
   * @returns Array of status counts
   */
  getSubmissionStatsByTenderId(tenderId: string): Promise<{ status: string; count: number }[]>;

  /**
   * Get submission by secret code
   * @param secretCode - Secret access code
   * @returns Submission or null if not found
   */
  getTenderSubmissionBySecretCode(secretCode: string): Promise<TenderSubmissionDTO | null>;

  /**
   * Get submissions by tender and user (for duplicate checking)
   * @param tenderId - Tender ID
   * @param userId - User ID
   * @returns Array of submissions (should be 0 or 1)
   */
  getSubmissionsByTenderIdAndUserId(tenderId: string, userId: string): Promise<TenderSubmissionDTO[]>;
}
