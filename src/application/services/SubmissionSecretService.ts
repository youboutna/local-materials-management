/**
 * Submission Secret Service - Hexagonal Architecture
 * Business logic for managing submission secret codes
 */

import { ISubmissionSecretRepository } from '@/domain/repositories/ISubmissionSecretRepository';
import { SubmissionSecretDTO } from '@/dtos/entities/TenderDTO';;
import { SubmissionSecretTransformer } from '@/dtos/transforms/SubmissionSecretTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class SubmissionSecretService {
  constructor(
    private repository: ISubmissionSecretRepository = RepositoryFactory.getTenderSharingRepository() as any
  ) {}

  // ============= STATIC METHODS FOR BACKWARD COMPATIBILITY =============
  
  /**
   * Static: Get submission by ID
   */
  static async getSubmissionById(submissionId: string): Promise<any> {
    const service = new SubmissionSecretService();
    return service.getSubmissionById(submissionId);
  }

  /**
   * Static: Regenerate secret for a submission
   */
  static async regenerateSecret(submissionId: string): Promise<SubmissionSecretDTO> {
    const service = new SubmissionSecretService();
    return service.regenerateSecret({ secretId: submissionId, submissionId });
  }

  /**
   * Static: Check if secret is still valid
   */
  static isSecretValid(submission: any): SecretValidationResultDTO {
    // Handle both DTO format and raw database format
    const dto: SubmissionSecretDTO = {
      id: submission.id || '',
      submissionId: submission.submissionId || submission.submission_id || '',
      secretCode: submission.secretCode || submission.secret_code || '',
      expiresAt: submission.expiresAt || submission.secret_expires_at,
      isActive: submission.isActive ?? submission.is_secret_active ?? true,
      accessCount: submission.accessCount ?? submission.secret_access_count ?? 0,
      maxAccess: submission.maxAccess ?? submission.max_secret_access ?? 10,
      createdAt: submission.createdAt || submission.created_at || '',
      updatedAt: submission.updatedAt || submission.updated_at || ''
    };
    
    const service = new SubmissionSecretService();
    return service.isSecretValid(dto);
  }

  /**
   * Static: Validate a secret code
   */
  static async validateSecret(secretCode: string): Promise<{ is_valid: boolean; submission_id?: string; tender_id?: string; supplier_name?: string; message: string }> {
    const service = new SubmissionSecretService();
    const result = await service.validateSubmissionSecret({ secretCode });
    
    if (!result) {
      return { is_valid: false, message: 'Code secret invalide' };
    }
    
    const validation = service.isSecretValid(result);
    if (!validation.valid) {
      return { is_valid: false, message: validation.reason || 'Code expiré ou désactivé' };
    }
    
    return {
      is_valid: true,
      submission_id: result.submissionId,
      message: 'Accès autorisé'
    };
  }

  /**
   * Static: Log access to a submission
   */
  static async logAccess(data: { submission_id: string; action_type: string; accessed_sections: string[]; user_agent?: string; metadata?: any }): Promise<void> {
    console.log('Access logged:', data);
    // In a full implementation, this would save to an audit log table
  }

  /**
   * Static: Create a submission secret
   */
  static async createSubmissionSecret(data: { submission_id: string; expires_at: string; max_access: number }): Promise<SubmissionSecretDTO> {
    const service = new SubmissionSecretService();
    return service.generateSubmissionSecret({
      submissionId: data.submission_id,
      maxAccess: data.max_access,
      expiresAt: data.expires_at
    });
  }

  /**
   * Static: Get default expiration date
   */
  static getDefaultExpirationDate(days: number = 30): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }

  /**
   * Static: Deactivate a secret
   */
  static async deactivateSecret(submissionId: string): Promise<void> {
    const service = new SubmissionSecretService();
    return service.deactivateSecret({ secretId: submissionId });
  }

  // ============= END STATIC METHODS =============

  /**
   * Generate a secret code for a submission
   */
  async generateSubmissionSecret(request: GenerateSubmissionSecretRequestDTO): Promise<SubmissionSecretDTO> {
    try {
      if (!request.submissionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submission ID is required');
      }

      const secretCode = this.generateRandomCode(6);
      const entity = SubmissionSecretTransformer.fromCreateDTO({
        submissionId: request.submissionId,
        maxAccess: request.maxAccess,
        expiresAt: request.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }, secretCode);

      const savedEntity = await this.repository.save(entity);
      return SubmissionSecretTransformer.toDTO(savedEntity);
    } catch (error) {
      console.error('SubmissionSecretService.generateSubmissionSecret failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate submission secret');
    }
  }

  /**
   * Validate and retrieve a submission by secret code
   */
  async validateSubmissionSecret(request: ValidateSubmissionSecretRequestDTO): Promise<SubmissionSecretDTO | null> {
    try {
      if (!request.secretCode) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Secret code is required');
      }

      const entity = await this.repository.findBySecretCode(request.secretCode);
      if (!entity) {
        return null;
      }

      return SubmissionSecretTransformer.toDTO(entity);
    } catch (error) {
      console.error('SubmissionSecretService.validateSubmissionSecret failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to validate submission secret');
    }
  }

  /**
   * Get submission secrets for a submission
   */
  async getSubmissionSecrets(request: GetSubmissionSecretsRequestDTO): Promise<SubmissionSecretDTO[]> {
    try {
      if (!request.submissionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submission ID is required');
      }

      const entities = await this.repository.findBySubmissionId(request.submissionId);
      return entities.map(entity => SubmissionSecretTransformer.toDTO(entity));
    } catch (error) {
      console.error('SubmissionSecretService.getSubmissionSecrets failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get submission secrets');
    }
  }

  /**
   * Get submission by ID (returns the latest secret for the submission)
   */
  async getSubmissionById(submissionId: string): Promise<SubmissionSecretDTO | null> {
    try {
      if (!submissionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submission ID is required');
      }

      const entities = await this.getSubmissionSecrets({ submissionId });
      return entities.length > 0 ? entities[0] : null;
    } catch (error) {
      console.error('SubmissionSecretService.getSubmissionById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get submission by ID');
    }
  }

  /**
   * Deactivate a submission secret
   */
  async deactivateSecret(request: DeactivateSecretRequestDTO): Promise<void> {
    try {
      if (!request.secretId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Secret ID is required');
      }

      const entity = await this.repository.findById(request.secretId);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Secret not found');
      }

      const deactivated = entity.deactivate();
      await this.repository.save(deactivated);
    } catch (error) {
      console.error('SubmissionSecretService.deactivateSecret failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to deactivate secret');
    }
  }

  /**
   * Delete a submission secret
   */
  async deleteSubmissionSecret(request: DeleteSubmissionSecretRequestDTO): Promise<void> {
    try {
      if (!request.secretId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Secret ID is required');
      }

      const entity = await this.repository.findById(request.secretId);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Secret not found');
      }

      await this.repository.delete(entity);
    } catch (error) {
      console.error('SubmissionSecretService.deleteSubmissionSecret failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete submission secret');
    }
  }

  /**
   * Generate a random alphanumeric code
   */
  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clean up expired secrets
   */
  async cleanupExpiredSecrets(): Promise<number> {
    try {
      const expiredEntities = await this.repository.findExpired();
      await Promise.all(expiredEntities.map(entity => this.repository.delete(entity)));
      return expiredEntities.length;
    } catch (error) {
      console.error('SubmissionSecretService.cleanupExpiredSecrets failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to cleanup expired secrets');
    }
  }

  /**
   * Get active secrets count for a submission
   */
  async getActiveSecretsCount(submissionId: string): Promise<number> {
    try {
      if (!submissionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submission ID is required');
      }

      const entities = await this.repository.findBySubmissionId(submissionId);
      return entities.filter(entity => entity.isActive).length;
    } catch (error) {
      console.error('SubmissionSecretService.getActiveSecretsCount failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get active secrets count');
    }
  }

  /**
   * Regenerate secret for a submission
   */
  async regenerateSecret(request: RegenerateSecretRequestDTO): Promise<SubmissionSecretDTO> {
    try {
      if (!request.submissionId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Submission ID is required');
      }

      const newSecret = await this.generateSubmissionSecret({ submissionId: request.submissionId });
      await this.deactivateSecret({ secretId: request.secretId });
      return newSecret;
    } catch (error) {
      console.error('SubmissionSecretService.regenerateSecret failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to regenerate secret');
    }
  }

  /**
   * Check if secret is still valid (client-side check)
   */
  isSecretValid(submission: SubmissionSecretDTO): SecretValidationResultDTO {
    if (!submission.isActive) {
      return { valid: false, reason: 'Code disabled' };
    }

    if (submission.expiresAt) {
      const expiryDate = new Date(submission.expiresAt);
      if (expiryDate < new Date()) {
        return { valid: false, reason: 'Code expired' };
      }
    }

    if (submission.maxAccess && 
        submission.accessCount >= submission.maxAccess) {
      return { valid: false, reason: 'Access limit reached' };
    }

    return { valid: true };
  }
}
