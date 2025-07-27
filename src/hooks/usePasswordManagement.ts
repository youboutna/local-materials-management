
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PasswordServiceFactory } from '@/services/password/PasswordServiceFactory';
import { IPasswordResetRequest, IPasswordUpdateRequest } from '@/interfaces/IPasswordService';

export const usePasswordManagement = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const passwordService = PasswordServiceFactory.getInstance();

  const requestPasswordReset = async (email: string, redirectUrl?: string) => {
    setLoading(true);
    try {
      const request: IPasswordResetRequest = { 
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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string, confirmPassword: string) => {
    setLoading(true);
    try {
      const request: IPasswordUpdateRequest = {
        newPassword,
        confirmPassword
      };

      const result = await passwordService.updatePassword(request);
      
      if (result.success) {
        toast({
          title: "Mot de passe mis à jour",
          description: "Votre mot de passe a été mis à jour avec succès.",
        });
        
        // Sign out and redirect to login
        //await supabase.auth.signOut();
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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const validateResetToken = async (token: string) => {
    setLoading(true);
    try {
      const result = await passwordService.validateResetToken(token);
      return result;
    } catch (error: any) {
      return { valid: false, error: error.message };
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
