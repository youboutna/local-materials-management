
import { supabase } from '@/integrations/supabase/client';
import { IPasswordService } from '@/application/services/IPasswordService';
import { PasswordResetRequestDTO, PasswordUpdateRequestDTO, PasswordValidationResultDTO } from '@/dtos/entities/PasswordDTO';

export class SupabasePasswordService implements IPasswordService {
  async requestPasswordReset(request: PasswordResetRequestDTO): Promise<{ success: boolean; error?: string }> {
    try {
      const redirectUrl = request.redirectUrl || `${window.location.origin}/reset-password`;
      
      console.log('Sending password reset email to:', request.email);
      console.log('Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { success: false, error: error.message };
      }

      console.log('Password reset email sent successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Password reset exception:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePassword(request: PasswordUpdateRequestDTO): Promise<{ success: boolean; error?: string }> {
    try {
      if (request.newPassword !== request.confirmPassword) {
        return { success: false, error: 'Les mots de passe ne correspondent pas.' };
      }

      if (request.newPassword.length < 6) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' };
      }

      console.log('Updating password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: request.newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        return { success: false, error: error.message };
      }

      console.log('Password updated successfully', data);
      return { success: true };
    } catch (error: any) {
      console.error('Password update exception:', error);
      return { success: false, error: error.message };
    }
  }

  async validateResetToken(token: string): Promise<PasswordValidationResultDTO> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        return { 
          valid: true, 
          email: session.user.email || undefined 
        };
      }

      return { 
        valid: false, 
        error: 'Token de réinitialisation invalide ou expiré.' 
      };
    } catch (error: any) {
      console.error('Token validation error:', error);
      return { 
        valid: false, 
        error: error.message 
      };
    }
  }
}