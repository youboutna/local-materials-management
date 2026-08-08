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
    return SubmissionSecret.create({
      id: dto.id,
      submissionId: dto.submissionId,
      secretCode: dto.secretCode,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      isActive: dto.isActive,
      accessCount: dto.accessCount,
      maxAccess: dto.maxAccess,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    });
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
