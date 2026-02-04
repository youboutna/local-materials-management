/**
 * Password Data Transfer Objects
 */

export interface PasswordResetRequestDTO {
  email: string;
  redirectUrl?: string;
}

export interface PasswordUpdateRequestDTO {
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordValidationResultDTO {
  valid: boolean;
  email?: string;
  error?: string;
}
