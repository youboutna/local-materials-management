/**
 * Password Data Transfer Objects
 */

export interface PasswordResetRequestDTO {
  email: string;
  redirectUrl?: string;
}

export interface PasswordUpdateRequestDTO {
  userId: string;
  newPassword: string;
  confirmPassword: string;
  resetToken?: string;
}