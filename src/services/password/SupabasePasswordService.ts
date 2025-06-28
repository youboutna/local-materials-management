
import { supabase } from '@/integrations/supabase/client';
import { IPasswordService, IPasswordResetRequest, IPasswordUpdateRequest } from '@/interfaces/IPasswordService';

export class SupabasePasswordService implements IPasswordService {
  async requestPasswordReset(request: IPasswordResetRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // Use your domain for password reset instead of Supabase's default
      const redirectUrl = request.redirectUrl || `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updatePassword(request: IPasswordUpdateRequest): Promise<{ success: boolean; error?: string }> {
    try {
      if (request.newPassword !== request.confirmPassword) {
        return { success: false, error: 'Les mots de passe ne correspondent pas.' };
      }

      if (request.newPassword.length < 6) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' };
      }

      const { error } = await supabase.auth.updateUser({
        password: request.newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    try {
      // Check if user is authenticated with valid session
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
      return { 
        valid: false, 
        error: error.message 
      };
    }
  }
}
