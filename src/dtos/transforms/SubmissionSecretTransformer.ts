/**
 * Submission Secret Transformer
 * Handles conversion between internal and DTO formats
 */

import { SubmissionSecretDTO, GenerateSubmissionSecretRequestDTO } from '@/dtos/entities/SubmissionSecretDTO';
import { SubmissionSecret } from '@/domain/entities/SubmissionSecret';

export class SubmissionSecretTransformer {
  static toDTO(entity: SubmissionSecret): SubmissionSecretDTO {
    return {
      id: entity.id,
      submissionId: entity.submissionId,
      secretCode: entity.secretCode,
      expiresAt: entity.expiresAt?.toISOString(),
      isActive: entity.isActive,
      accessCount: entity.accessCount,
      maxAccess: entity.maxAccess,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  static toEntity(dto: SubmissionSecretDTO): SubmissionSecret {
    return new SubmissionSecret(
      dto.id,
      dto.submissionId,
      dto.secretCode,
      dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      dto.isActive,
      dto.accessCount,
      dto.maxAccess,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static fromCreateDTO(dto: GenerateSubmissionSecretRequestDTO, secretCode: string): Partial<SubmissionSecret> {
    return {
      submissionId: dto.submissionId,
      secretCode,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      maxAccess: dto.maxAccess || 1,
      isActive: true,
      accessCount: 0
    };
  }
}
