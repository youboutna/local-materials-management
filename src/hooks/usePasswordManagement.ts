import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { AuthService } from '@/application/services/AuthService';
import { getPasswordService, PasswordService } from '@/application/services/PasswordService';
import { PasswordResetRequestDTO, PasswordUpdateRequestDTO } from '@/dtos/entities/PasswordDTO';

interface PasswordError {
  message: string;
  code?: string;
}

export const usePasswordManagement = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const passwordService = getPasswordService();

  const requestPasswordReset = async (email: string, redirectUrl?: string) => {
    setLoading(true);
    try {
      const request: PasswordResetRequestDTO = { 
        email, 
        redirectUrl: redirectUrl || `${window.location.origin}/reset-password`
      };
      
      const result = await passwordService.requestPasswordReset(request);
      
      if (result.success) {
        toast({
          title: "Email envoyé",
          description: "Un lien de réinitialisation a été envoyé à votre adresse email.",
        });
        return { success: true };
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue lors de l'envoi de l'email.",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error: unknown) {
      const err = error as PasswordError;
      toast({
        title: "Erreur",
        description: err.message || "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string, confirmPassword: string) => {
    setLoading(true);
    try {
      const request: PasswordUpdateRequestDTO = {
        newPassword,
        confirmPassword
      };

      const result = await passwordService.updatePassword(request);
      
      if (result.success) {
        toast({
          title: "Mot de passe mis à jour",
          description: "Votre mot de passe a été mis à jour avec succès.",
        });
        
        // Sign out and redirect to login using AuthService
        const authService = new AuthService();
        await authService.logout();
        navigate('/auth');
        
        return { success: true };
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Une erreur est survenue lors de la mise à jour du mot de passe.",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error: unknown) {
      const err = error as PasswordError;
      toast({
        title: "Erreur",
        description: err.message || "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const validateResetToken = async (token: string) => {
    setLoading(true);
    try {
      const result = await passwordService.validateResetToken(token as string);
      return result;
    } catch (error: unknown) {
      const err = error as PasswordError;
      toast({
        title: "Erreur",
        description: err.message || "Une erreur inattendue est survenue.",
        variant: "destructive"
      });
      return { valid: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    requestPasswordReset,
    updatePassword,
    validateResetToken
  };
};
