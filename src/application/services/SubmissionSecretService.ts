/**
 * Submission Secret Service - Hexagonal Architecture
 * Business logic for managing submission secret codes
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ISubmissionSecretRepository } from '@/domain/repositories/ISubmissionSecretRepository';
import {
  SubmissionSecretDTO,
  GenerateSubmissionSecretRequestDTO,
  ValidateSubmissionSecretRequestDTO,
  GetSubmissionSecretsRequestDTO,
  DeactivateSecretRequestDTO,
  DeleteSubmissionSecretRequestDTO,
  RegenerateSecretRequestDTO,
  SecretValidationResultDTO
} from '@/dtos/entities/SubmissionSecretDTO';
import { SubmissionSecretTransformer } from '@/dtos/transforms/SubmissionSecretTransformer';

export class SubmissionSecretService {
  constructor(
    private repository: ISubmissionSecretRepository = RepositoryFactory.getSubmissionSecretRepository()
  ) {}

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

      entity.isActive = false;
      await this.repository.save(entity);
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
