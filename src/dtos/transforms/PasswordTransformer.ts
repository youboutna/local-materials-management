/**
 * Password Transformer
 * Handles conversion between password entities and DTOs
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

export class PasswordTransformer {
  static toResetRequestDTO(email: string, redirectUrl?: string): PasswordResetRequestDTO {
    return {
      email,
      redirectUrl
    };
  }

  static toUpdateRequestDTO(newPassword: string, confirmPassword: string): PasswordUpdateRequestDTO {
    return {
      newPassword,
      confirmPassword
    };
  }

  static toValidationResultDTO(valid: boolean, email?: string, error?: string): PasswordValidationResultDTO {
    return {
      valid,
      email,
      error
    };
  }
}
