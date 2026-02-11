/**
 * Password Service - Hexagonal Architecture
 * Business logic for password management with proper error handling
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { IPasswordRepository } from '@/domain/repositories/IPasswordRepository';
import { IPasswordService } from './IPasswordService';
import {
  PasswordResetRequestDTO,
  PasswordUpdateRequestDTO,
  PasswordValidationResultDTO
} from '@/dtos/entities/PasswordDTO';

/**
 * Service for managing password operations with hexagonal architecture
 */
export class PasswordService implements IPasswordService {
  private passwordRepository: IPasswordRepository;

  constructor() {
    this.passwordRepository = RepositoryFactory.getPasswordRepository();
  }

  /**
   * Request password reset for user
   */
  async requestPasswordReset(request: PasswordResetRequestDTO): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate request data
      this.validatePasswordResetRequest(request);

      // Check if user exists
      const user = await this.passwordRepository.findUserByEmail(request.email);
      if (!user) {
        // For security, don't reveal if email exists
        return { success: true };
      }

      // Generate reset token and send email
      const resetToken = this.generateResetToken();
      const redirectUrl = request.redirectUrl || `${window.location.origin}/reset-password`;
      
      await this.passwordRepository.createPasswordReset({
        userId: user.id,
        email: request.email,
        token: resetToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        redirectUrl
      });

      // Send reset email
      await this.passwordRepository.sendPasswordResetEmail({
        email: request.email,
        token: resetToken,
        redirectUrl
      });

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
      // Validate request data
      this.validatePasswordUpdateRequest(request);

      // Validate reset token if provided
      if (request.resetToken) {
        const validation = await this.validateResetToken(request.resetToken);
        if (!validation.valid) {
          return { success: false, error: validation.error || 'Invalid reset token' };
        }
      }

      // Update password
      const hashedPassword = await this.hashPassword(request.newPassword);
      await this.passwordRepository.updateUserPassword({
        userId: request.userId,
        password: hashedPassword
      });

      // Invalidate all existing sessions
      await this.passwordRepository.invalidateUserSessions(request.userId);

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
   * Validate password reset token
   */
  async validateResetToken(token: string): Promise<PasswordValidationResultDTO> {
    try {
      if (!token || token.trim() === '') {
        return { 
          valid: false, 
          error: 'Reset token is required' 
        };
      }

      // Find reset token in database
      const resetRequest = await this.passwordRepository.findPasswordResetByToken(token);
      
      if (!resetRequest) {
        return { 
          valid: false, 
          error: 'Invalid or expired reset token' 
        };
      }

      // Check if token has expired
      if (new Date() > new Date(resetRequest.expiresAt)) {
        // Clean up expired token
        await this.passwordRepository.deletePasswordReset(token);
        return { 
          valid: false, 
          error: 'Reset token has expired' 
        };
      }

      return { 
        valid: true, 
        email: resetRequest.email 
      };
    } catch (error) {
      console.error('Error validating reset token:', error);
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to validate reset token',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate inputs
      if (!userId || userId.trim() === '') {
        return { success: false, error: 'User ID is required' };
      }

      if (!currentPassword || currentPassword.trim() === '') {
        return { success: false, error: 'Current password is required' };
      }

      if (!newPassword || newPassword.trim() === '') {
        return { success: false, error: 'New password is required' };
      }

      // Validate new password
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Verify current password
      const isValidCurrentPassword = await this.passwordRepository.verifyUserPassword(userId, currentPassword);
      if (!isValidCurrentPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update password
      const hashedPassword = await this.hashPassword(newPassword);
      await this.passwordRepository.updateUserPassword({
        userId,
        password: hashedPassword
      });

      // Invalidate all existing sessions except current
      await this.passwordRepository.invalidateUserSessions(userId);

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

  /**
   * Validate password reset request
   */
  private validatePasswordResetRequest(request: PasswordResetRequestDTO): void {
    if (!request.email || request.email.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid email format');
    }
  }

  /**
   * Validate password update request
   */
  private validatePasswordUpdateRequest(request: PasswordUpdateRequestDTO): void {
    if (!request.userId || request.userId.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
    }

    if (!request.newPassword || request.newPassword.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'New password is required');
    }

    if (request.newPassword !== request.confirmPassword) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Passwords do not match');
    }

    // Validate password strength
    const passwordValidation = this.validatePasswordStrength(request.newPassword);
    if (!passwordValidation.isValid) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, passwordValidation.error || 'Password does not meet requirements');
    }
  }

  /**
   * Validate password strength
   */
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

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one special character' };
    }

    return { isValid: true };
  }

  /**
   * Generate secure reset token
   */
  private generateResetToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash password using secure method
   */
  private async hashPassword(password: string): Promise<string> {
    // In a real implementation, use bcrypt or similar
    // For now, return a simple hash (NOT SECURE FOR PRODUCTION)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
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
