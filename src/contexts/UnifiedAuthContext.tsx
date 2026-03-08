/**
 * Unified Auth Context - Clean Architecture
 * Eliminates spaghetti code by consolidating all auth logic
 */

import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAppConfig, AuthProvider } from '@/config/app';
import { getAuthManager, AuthManagerConfig } from '@/application/services/AuthManager';
import { UnifiedUser, UnifiedSession, UnifiedAuthContextType, AuthUser } from '@/dtos/entities/AuthDTO';

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

// Export the context for use in hooks
export { UnifiedAuthContext };

export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [session, setSession] = useState<UnifiedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProvider, setCurrentProvider] = useState<AuthProvider>('supabase');
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const authManager = getAuthManager();
  const supportedProviders = authManager.getSupportedProviders();

  // Helper function to transform AuthUser to metadata Record
  const transformAuthUserToMetadata = useCallback((authUser: AuthUser): Record<string, unknown> => {
    return {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.full_name,
      phone: authUser.phone,
      national_id: authUser.national_id,
      role: authUser.role,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      user_metadata: authUser.user_metadata
    };
  }, []);

  // Transform Supabase User to Unified User
  const transformUser = useCallback((supabaseUser: User): UnifiedUser => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    full_name: supabaseUser.user_metadata?.full_name,
    phone: supabaseUser.user_metadata?.phone,
    national_id: supabaseUser.user_metadata?.national_id,
    role: supabaseUser.user_metadata?.role,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    metadata: supabaseUser.user_metadata,
    created_at: supabaseUser.created_at,
    updated_at: supabaseUser.updated_at
  }), []);

  // Transform Supabase Session to Unified Session
  const transformSession = useCallback((supabaseSession: Session): UnifiedSession => ({
    user: transformUser(supabaseSession.user!),
    expires_at: supabaseSession.expires_at ? new Date(supabaseSession.expires_at * 1000).toISOString() : undefined,
    provider: currentProvider,
    access_token: supabaseSession.access_token
  }), [currentProvider, transformUser]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session from auth manager
        const sessionResult = await authManager.getCurrentSession();
        const userResult = await authManager.getCurrentUser();
        
        if (sessionResult.session && userResult.user) {
          const unifiedSession = {
            user: {
              id: userResult.user.id,
              email: userResult.user.email || '',
              full_name: userResult.user.full_name,
              phone: userResult.user.phone,
              national_id: userResult.user.national_id,
              role: userResult.user.role,
              avatar_url: undefined, // AuthUser doesn't have avatar_url
              metadata: transformAuthUserToMetadata(userResult.user)
            },
            expires_at: sessionResult.session.expiresAt,
            provider: currentProvider
          };
          
          setSession(unifiedSession);
          setUser(unifiedSession.user);
        } else {
          // Fallback to Supabase if auth manager fails
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const unifiedSession = transformSession(session);
            setSession(unifiedSession);
            setUser(unifiedSession.user);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [currentProvider, transformSession, authManager, transformAuthUserToMetadata]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        console.log('🔄 Auth state changed:', event, supabaseSession?.user?.email || 'no user');
        
        if (supabaseSession?.user) {
          const unifiedSession = transformSession(supabaseSession);
          setSession(unifiedSession);
          setUser(unifiedSession.user);
        } else {
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [transformSession]);

  // Switch provider
  const switchProvider = useCallback(async (config: AuthManagerConfig) => {
    try {
      setLoading(true);
      console.log('🔄 Switching to provider:', config.provider);
      
      await authManager.switchProvider(config);
      setCurrentProvider(config.provider);
      
      // Reload session with new provider
      const sessionResult = await authManager.getCurrentSession();
      const userResult = await authManager.getCurrentUser();
      if (sessionResult.session && userResult.user) {
        const unifiedSession = {
          user: {
            id: userResult.user.id,
            email: userResult.user.email || '',
            full_name: userResult.user.full_name,
            phone: userResult.user.phone,
            national_id: userResult.user.national_id,
            role: userResult.user.role,
            avatar_url: undefined, // AuthUser doesn't have avatar_url
            metadata: transformAuthUserToMetadata(userResult.user)
          },
          expires_at: sessionResult.session.expires_at ? new Date(typeof sessionResult.session.expires_at === 'string' ? parseInt(sessionResult.session.expires_at) : sessionResult.session.expires_at * 1000).toISOString() : undefined,
          provider: config.provider
        };
        
        setSession(unifiedSession);
        setUser(unifiedSession.user);
      }
      
      toast({
        title: t('common.success'),
        description: `Switched to ${config.provider} authentication provider.`,
      });
    } catch (error) {
      console.error('❌ Provider switch error:', error);
      toast({
        title: t('common.error'),
        description: "Failed to switch authentication provider.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [authManager, toast, t, transformAuthUserToMetadata]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
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
  }, [toast, t]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, fullName: string, phone: string, nationalId: string) => {
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
            national_id: nationalId,
            role: 'user' // Default role
          }
        }
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        toast({
          title: t('common.error'),
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      console.log('✅ Sign up successful:', data.user?.email);
      toast({
        title: t('common.success'),
        description: "Compte créé avec succès. Vérifiez votre email.",
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      
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
  }, [toast, t]);

  // Google sign in
  const signInWithGoogle = useCallback(async () => {
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
  }, [toast, t]);

  // Phone sign in
  const signInWithPhone = useCallback(async (phone: string) => {
    try {
      setLoading(true);
      console.log('📱 Attempting phone sign in with:', phone);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
        options: {
          shouldCreateUser: false
        }
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
      
      console.log('✅ Phone OTP sent successfully');
      toast({
        title: t('common.success'),
        description: "Code OTP envoyé à votre téléphone.",
      });
      
      return { success: true };
    } catch (error) {
      console.error('Phone sign in error:', error);
      return { success: false, error: 'Unknown error occurred' };
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Verify phone OTP
  const verifyPhoneOTP = useCallback(async (phone: string, token: string) => {
    try {
      setLoading(true);
      console.log('🔐 Verifying OTP for:', phone);
      
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: token.trim(),
        type: 'sms'
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
  }, [toast, t]);

  // National ID sign in
  const signInWithNationalId = useCallback(async (nationalId: string, password: string) => {
    try {
      setLoading(true);
      console.log('🆔 Attempting national ID sign in...');
      
      // Query profiles table to find user ID associated with national ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
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
      
      // Get the user email using a direct query to the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', profile.id)
        .single();
      
      if (userError || !userData?.email) {
        console.error('❌ User lookup error:', userError);
        toast({
          title: t('common.error'),
          description: "Erreur lors de la récupération de l'email utilisateur.",
          variant: "destructive"
        });
        return;
      }
      
      // Sign in with the found email
      await signIn(userData.email, password);
    } catch (error) {
      console.error('National ID sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signIn, toast, t]);

  const value: UnifiedAuthContextType = {
    // Core auth state
    user,
    session,
    loading,
    isAuthenticated: !!user,
    
    // Provider management
    currentProvider,
    supportedProviders,
    switchProvider: switchProvider as any,
    
    // Auth methods
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOTP,
    signInWithNationalId,
    
    // Development mode
    isDevelopmentMode: false
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
}

