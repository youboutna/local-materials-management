/**
 * Submission Secret Data Transfer Objects
 * Centralized for hexagonal architecture
 */

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

export interfId: string;
}

export interface RegenerateSecretRequestDTO {
  secretId: string;
  submissionId: string;
}

export interface