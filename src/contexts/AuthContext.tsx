
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEV_MODE, DEV_USER } from '@/config/constants';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string, nationalId: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string; }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<void>;
  signInWithNationalId: (nationalId: string, password: string) => Promise<void>;
  isDevelopmentMode: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? DEV_USER as unknown as User : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!DEV_MODE);
  const { toast } = useToast();

  useEffect(() => {
    if (DEV_MODE) {
      console.log('🛠️ Development mode active: Authentication is bypassed');
      return;
    }

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (DEV_MODE) {
      toast({
        title: "Mode développement",
        description: "Connexion automatique en mode développement",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur la plateforme Materials Management.",
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string, nationalId: string) => {
    if (DEV_MODE) {
      toast({
        title: "Mode développement",
        description: "Inscription automatique en mode développement",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            national_id: nationalId
          }
        }
      });
      
      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.",
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (DEV_MODE) {
      toast({
        title: "Mode développement",
        description: "Déconnexion simulée en mode développement",
      });
      return;
    }

    try {
      setLoading(true);
      await supabase.auth.signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur est survenue lors de la déconnexion.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (DEV_MODE) {
      toast({
        title: "Mode développement",
        description: "Connexion Google simulée en mode développement",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      
      if (error) {
        toast({
          title: "Erreur de connexion Google",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with phone number
  const signInWithPhone = async (phone: string): Promise<{ success: boolean; error?: string; }> => {
    if (DEV_MODE) {
      toast({
        title: "Mode développement",
        description: "Connexion par téléphone simulée en mode développement",
      });
      return { success: true };
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
      });
      
      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }
      
      toast({
        title: "Code envoyé",
        description: "Un code de vérification a été envoyé à votre numéro de téléphone.",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Phone sign in error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Verify phone OTP
  const verifyPhoneOTP = async (phone: string, token: string) => {
    if (DEV_MODE) {
      toast({
        title: "Mode développement",
        description: "Vérification OTP simulée en mode développement",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      
      if (error) {
        toast({
          title: "Erreur de vérification",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Vérification réussie",
        description: "Vous êtes maintenant connecté.",
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with National ID (custom implementation)
  const signInWithNationalId = async (nationalId: string, password: string) => {
    if (DEV_MODE) {
      toast({
        title: "Mode développement",
        description: "Connexion par ID National simulée en mode développement",
      });
      return;
    }

    try {
      setLoading(true);
      
      // First, find the user with this national ID using a Supabase function or query
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('national_id', nationalId)
        .single();
      
      if (error || !data) {
        toast({
          title: "Erreur de connexion",
          description: "ID National non trouvé ou invalide.",
          variant: "destructive"
        });
        throw new Error("ID National non trouvé");
      }
      
      // Then, get the user's email from auth.users table (this would require a secure server function)
      // For this example, we'll assume the user has already signed up with email+password
      // and we're just matching their national ID to their account
      
      toast({
        title: "ID National vérifié",
        description: "Veuillez vous connecter avec votre email et mot de passe.",
      });
    } catch (error) {
      console.error('National ID sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOTP,
    signInWithNationalId,
    isDevelopmentMode: DEV_MODE
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
