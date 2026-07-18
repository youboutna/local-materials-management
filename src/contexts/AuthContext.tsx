import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';
import { ReactNode } from 'react';
import { AuthContext } from './auth-context';
import { DEV_MODE, DEV_USERS } from '@/config/constants';
import { LocalAuthAdapter } from '@/infrastructure/local/LocalAuthAdapter';
import type { AuthSession as DomainAuthSession } from '@/domain/repositories/IAuthRepository';

// Lazy singleton — only used in DEV_MODE. Reads/writes localStorage 'dev_session'.
const devAdapter = DEV_MODE ? new LocalAuthAdapter() : null;

// Map a snake_case AuthSession from the adapter to a Supabase-shaped User/Session
// so downstream code that expects @supabase/supabase-js types keeps working.
function toSupabaseShape(dom: DomainAuthSession): { user: User; session: Session } {
  const roleValue = dom.user.role || 'user';
  const supaUser = {
    id: dom.user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: dom.user.email,
    phone: dom.user.phone,
    created_at: dom.user.created_at ?? new Date().toISOString(),
    updated_at: dom.user.updated_at ?? new Date().toISOString(),
    app_metadata: { provider: 'dev', role: roleValue },
    user_metadata: {
      full_name: dom.user.full_name,
      role: roleValue,
      phone: dom.user.phone,
      national_id: dom.user.national_id,
    },
  } as unknown as User;
  const expiresAtSec = Math.floor(new Date(dom.expires_at).getTime() / 1000);
  const supaSession = {
    access_token: dom.access_token,
    refresh_token: dom.refresh_token,
    token_type: 'bearer',
    expires_in: Math.max(0, expiresAtSec - Math.floor(Date.now() / 1000)),
    expires_at: expiresAtSec,
    user: supaUser,
  } as unknown as Session;
  return { user: supaUser, session: supaSession };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  const restoreDevSession = useCallback(async () => {
    if (!devAdapter) return;
    const { session: domSession } = await devAdapter.getCurrentSession();
    if (!domSession) {
      setUser(null);
      setSession(null);
    } else {
      const { user: u, session: s } = toSupabaseShape(domSession);
      setUser(u);
      setSession(s);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (DEV_MODE) {
      console.log('🛠️ DEV_MODE=true — AuthContext uses LocalAuthAdapter (DEV_USERS)');
      void restoreDevSession();
      const handler = () => void restoreDevSession();
      window.addEventListener('dev-role-changed', handler);
      return () => window.removeEventListener('dev-role-changed', handler);
    }
    console.log('🔧 Setting up auth state listener...');

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting session:', error);
      } else {
        console.log('✅ Initial session:', session?.user?.email || 'no session');
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [restoreDevSession]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // DEV_MODE: validate credentials locally against DEV_USERS.
      if (DEV_MODE && devAdapter) {
        const { session: domSession, error } = await devAdapter.signIn({
          email: email.trim(),
          password,
        });
        if (error || !domSession) {
          toast({
            title: t('common.error'),
            description: 'Email ou mot de passe incorrect. Vérifiez vos identifiants.',
            variant: 'destructive',
          });
          throw error ?? new Error('Invalid login credentials');
        }
        const { user: u, session: s } = toSupabaseShape(domSession);
        setUser(u);
        setSession(s);
        toast({ title: t('common.success'), description: 'Bienvenue sur la plateforme.' });
        return;
      }

      console.log('🔐 Attempting to sign in with:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        let errorMessage = error.message;
        
        if (error.message === 'Invalid login credentials') {
          errorMessage = "Email ou mot de passe incorrect. Vérifiez vos identifiants.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter.";
        }
        
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('✅ Sign in successful:', data.user?.email);
      toast({
        title: t('common.success'),
        description: "Bienvenue sur la plateforme.",
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const signUp = async (email: string, password: string, fullName: string, phone: string, nationalId: string) => {
    try {
      setLoading(true);
      console.log('📝 Attempting to sign up with:', email);
      
      const { data, error } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            national_id: nationalId
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        let errorMessage = error.message;
        
        if (error.message.includes('User already registered')) {
          errorMessage = "Un compte existe déjà avec cette adresse email.";
        } else if (error.message.includes('Password should be at least 6 characters')) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
        }
        
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('✅ Sign up successful:', data.user?.email);
      
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: t('common.success'),
          description: "Veuillez vérifier votre email pour confirmer votre compte.",
        });
      } else {
        toast({
          title: t('common.success'),
          description: "Votre compte a été créé avec succès.",
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out...');

      if (DEV_MODE && devAdapter) {
        await devAdapter.signOut();
        setUser(null);
        setSession(null);
        toast({ title: t('common.success'), description: 'Vous avez été déconnecté avec succès.' });
        return;
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        toast({
          title: t('common.error'),
          description: "Une erreur est survenue lors de la déconnexion.",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('✅ Sign out successful');
      toast({
        title: t('common.success'),
        description: "Vous avez été déconnecté avec succès.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log('🔍 Attempting Google sign in...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('❌ Google sign in error:', error);
        toast({
          title: t('common.error'),
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

  const signInWithPhone = async (phone: string): Promise<{ success: boolean; error?: string; }> => {
    try {
      setLoading(true);
      console.log('📱 Attempting phone sign in...');
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone,
      });
      
      if (error) {
        console.error('❌ Phone sign in error:', error);
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }
      
      toast({
        title: t('common.success'),
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

  const verifyPhoneOTP = async (phone: string, token: string) => {
    try {
      setLoading(true);
      console.log('🔢 Verifying phone OTP...');
      
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      
      if (error) {
        console.error('❌ OTP verification error:', error);
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: t('common.success'),
        description: "Vous êtes maintenant connecté.",
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithNationalId = async (nationalId: string, password: string) => {
    try {
      setLoading(true);
      console.log('🆔 Attempting national ID sign in...');
      
      // Query profiles table to find email associated with national ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('national_id', nationalId)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ Profile lookup error:', profileError);
        throw profileError;
      }
      
      if (!profile) {
        toast({
          title: t('common.error'),
          description: "Aucun compte associé à cet ID national.",
          variant: "destructive"
        });
        return;
      }
      
      // Get user email from auth.users table would require a function
      // For now, suggest user to use email login
      toast({
        title: t('common.success'),
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
