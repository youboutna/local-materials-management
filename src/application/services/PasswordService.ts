/**
 * Password Service - Hexagonal Architecture
 * Business logic for password management with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { PasswordValidationResultDTO } from '@/dtos/entities/PaymentValidationDTO';;
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for managing password operations with hexagonal architecture
 * Uses Supabase Auth directly for password operations
 */
export class PasswordService {
  /**
   * Request password reset for user
   */
  async requestPasswordReset(request: PasswordResetRequestDTO): Promise<{ success: boolean; error?: string }> {
    try {
      this.validatePasswordResetRequest(request);

      const redirectUrl = request.redirectUrl || `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: redirectUrl
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to request password reset',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update user password
   */
  async updatePassword(request: PasswordUpdateRequestDTO): Promise<{ success: boolean; error?: string }> {
    try {
      this.validatePasswordUpdateRequest(request);

      if (request.resetToken) {
        // Use reset token flow - user already has session from email link
        const { error } = await supabase.auth.updateUser({
          password: request.newPassword
        });

        if (error) {
          return { success: false, error: error.message };
        }
      } else if (request.userId) {
        // Direct password update for authenticated user
        const { error } = await supabase.auth.updateUser({
          password: request.newPassword
        });

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        return { success: false, error: 'User ID or reset token is required' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update password',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!userId || userId.trim() === '') {
        return { success: false, error: 'User ID is required' };
      }

      if (!currentPassword || currentPassword.trim() === '') {
        return { success: false, error: 'Current password is required' };
      }

      if (!newPassword || newPassword.trim() === '') {
        return { success: false, error: 'New password is required' };
      }

      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to change password',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  private validatePasswordResetRequest(request: PasswordResetRequestDTO): void {
    if (!request.email || request.email.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid email format');
    }
  }

  private validatePasswordUpdateRequest(request: PasswordUpdateRequestDTO): void {
    if (!request.newPassword || request.newPassword.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'New password is required');
    }

    if (request.newPassword !== request.confirmPassword) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Passwords do not match');
    }

    const passwordValidation = this.validatePasswordStrength(request.newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, passwordValidation.error || 'Password does not meet requirements');
    }
  }

  private validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }

    if (!/\d/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one number' };
    }

    return { isValid: true };
  }
}

// Factory function for service instance
let passwordServiceInstance: PasswordService | null = null;

export function getPasswordService(): PasswordService {
  if (!passwordServiceInstance) {
    passwordServiceInstance = new PasswordService();
  }
  return passwordServiceInstance;
}
