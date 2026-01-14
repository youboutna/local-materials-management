/**
 * Hexagonal hook for authentication operations
 * Encapsulates Supabase auth calls
 */
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
}

export const useLoginHex = () => {
  return useMutation({
    mutationFn: async ({ email, password }: LoginData) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });
    },
    onError: (error: any) => {
      const message = error.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect."
        : error.message;
      toast({
        title: "Erreur de connexion",
        description: message,
        variant: "destructive",
      });
    },
  });
};

export const useRegisterHex = () => {
  return useMutation({
    mutationFn: async ({ email, password, fullName, phone, nationalId }: RegisterData) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            national_id: nationalId,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Inscription réussie",
          description: "Veuillez vérifier votre email pour confirmer votre compte.",
        });
      } else {
        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé avec succès.",
        });
      }
    },
    onError: (error: any) => {
      let errorMessage = error.message;
      if (error.message.includes("User already registered")) {
        errorMessage = "Un compte existe déjà avec cette adresse email.";
      } else if (error.message.includes("Password should be at least 6 characters")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
      }
      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

export const useLogoutHex = () => {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté.",
      });
    },
  });
};
