/**
 * Submission Secret Data Transfer Objects
 * Centralized for hexagonal architecture
 */

export interface SubmissionSecretDTO {
  id: string;
  submissionId: string;
  secretCode: string;
  expiresAt?: string;
  isActive: boolean;
  accessCount: number;
  maxAccess: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateSubmissionSecretRequestDTO {
  submissionId: string;
  maxAccess?: number;
  expiresAt?: string;
}

export interface ValidateSubmissionSecretRequestDTO {
  secretCode: string;
}

export interface GetSubmissionSecretsRequestDTO {
  submissionId: string;
}

export interface DeactivateSecretRequestDTO {
  secretId: string;
}

export interface DeleteSubmissionSecretRequestDTO {
  secretId: string;
}

export interface RegenerateSecretRequestDTO {
  secretId: string;
  submissionId: string;
}

export interface SecretValidationResultDTO {
  valid: boolean;
  reason?: string;
}
