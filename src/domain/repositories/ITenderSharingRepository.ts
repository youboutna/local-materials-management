/**
 * ITenderSharingRepository - Domain Repository Interface
 * Defines contract for tender sharing data access operations
 * Following hexagonal architecture principles
 */

import { TenderSharingSecretDTO } from '@/dtos/entities/TenderDTO';;

export interface ITenderSharingRepository {
  /**
   * Generate a unique secret code for tender sharing
   */
  generateSecretCode(): Promise<string>;

  /**
   * Create a new sharing secret for tender documents
   */
  createSharingSecret(dto: CreateSharingSecretDTO): Promise<TenderSharingSecretDTO>;

  /**
   * Get sharing secret by ID
   */
  getSharingSecretById(id: string): Promise<TenderSharingSecretDTO | null>;

  /**
   * Update sharing secret
   */
  updateSharingSecret(id: string, dto: Partial<TenderSharingSecretDTO>): Promise<TenderSharingSecretDTO>;

  /**
   * Delete sharing secret
   */
  deleteSharingSecret(id: string): Promise<void>;

  /**
   * Get sharing secrets by tender ID
   */
  getSharingSecretsByTenderId(tenderId: string): Promise<TenderSharingSecretDTO[]>;

  /**
   * Validate secret code
   */
  validateSecret(secretCode: string): Promise<ValidateSecretResponseDTO>;

  /**
   * Revoke sharing secret
   */
  revokeSecret(secretId: string): Promise<void>;

  /**
   * Increment access count for secret
   */
  incrementAccessCount(secretId: string): Promise<void>;

  /**
   * Create access log entry
   */
  createAccessLog(dto: CreateAccessLogDTO): Promise<AccessLogDTO>;

  /**
   * Get access logs by secret code
   */
  getAccessLogsBySecretCode(secretCode: string): Promise<AccessLogDTO[]>;

  /**
   * Get access statistics for tender
   */
  getAccessStatistics(tenderId: string): Promise<{
    uniqueSuppliers: number;
    totalAccesses: number;
    activeSecrets: number;
  }>;
}
