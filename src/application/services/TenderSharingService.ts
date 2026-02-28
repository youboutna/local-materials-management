// Service for secure tender document sharing with ACID principles
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ITenderSharingRepository } from '@/domain/repositories';
import { 
  TenderSharingSecretDTO, 
  CreateSharingSecretDTO, 
  CreateAccessLogDTO, 
  ValidateSecretResponseDTO 
} from '@/dtos/entities/tender-sharing-dto';

/**
 * Service for managing secure tender document sharing
 * Implements hexagonal architecture with repository pattern
 */
export class TenderSharingService {
  private static getRepository(): ITenderSharingRepository {
    return RepositoryFactory.getTenderSharingRepository();
  }

  /**
   * Generate a unique secret code for tender sharing
   */
  static async generateSecretCode(): Promise<string> {
    return await this.getRepository().generateSecretCode();
  }

  /**
   * Create a new sharing secret for tender documents
   * ACID compliant transaction
   */
  static async createSharingSecret(
    dto: CreateSharingSecretDTO
  ): Promise<TenderSharingSecretDTO> {
    return await this.getRepository().createSharingSecret(dto);
  }

  /**
   * Validate a secret code and check access permissions
   */
  static async validateSecret(
    secretCode: string,
    supplierEmail: string
  ): Promise<ValidateSecretResponseDTO> {
    return await this.getRepository().validateSecret(secretCode);
  }

  /**
   * Log access to shared documents
   */
  static async logAccess(dto: CreateAccessLogDTO): Promise<void> {
    await this.getRepository().createAccessLog(dto);
  }

  /**
   * Get access logs for a secret
   */
  static async getAccessLogs(secretCode: string): Promise<unknown[]> {
    return await this.getRepository().getAccessLogsBySecretCode(secretCode);
  }

  /**
   * Get active sharing secrets for a tender
   */
  static async getTenderSharingSecrets(tenderId: string): Promise<TenderSharingSecretDTO[]> {
    return await this.getRepository().getSharingSecretsByTenderId(tenderId);
  }

  /**
   * Revoke a sharing secret
   */
  static async revokeSecret(secretId: string): Promise<void> {
    await this.getRepository().revokeSecret(secretId);
  }

  /**
   * Update access count for a secret
   */
  static async incrementAccessCount(secretId: string): Promise<void> {
    await this.getRepository().incrementAccessCount(secretId);
  }

  /**
   * Get sharing statistics for a tender
   */
  static async getSharingStats(tenderId: string): Promise<{
    uniqueSuppliers: number;
    totalAccesses: number;
    activeSecrets: number;
  }> {
    return await this.getRepository().getAccessStatistics(tenderId);
  }
}
