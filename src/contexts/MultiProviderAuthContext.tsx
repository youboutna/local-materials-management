/**
 * Multi-Provider Auth Context
 * Enhanced AuthContext with dynamic provider switching support
 * Integrates with AuthManager for true multi-provider functionality
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { getAuthManager, AuthManagerConfig } from '@/application/services/AuthManager';
import { AuthProvider } from '@/config/app';
import { AuthUser, AuthSession, LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';

type MultiProviderAuthContextType = {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  currentProvider: AuthProvider;
  supportedProviders: Array<{ value: AuthProvider; label: string; description: string }>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string, nationalId: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string; }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<void>;
  signInWithNationalId: (nationalId: string, password: string) => Promise<void>;
  switchProvider: (config: AuthManagerConfig) => Promise<void>;
  isProviderAvailable: (provider: AuthProvider) => boolean;
  isDevelopmentMode: boolean;
};

const MultiProviderAuthContext = createContext<MultiProviderAuthContextType | undefined>(undefined);

export function MultiProviderAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProvider, setCurrentProvider] = useState<AuthProvider>('supabase');
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const authManager = getAuthManager();
  const supportedProviders = authManager.getSupportedProviders();

  const loadInitialSession = useCallback(async () => {
    try {
      const result = await authManager.getCurrentSession();
      
      if (result.error) {
        console.error('❌ Error loading initial session:', result.error);
      } else {
        console.log('✅ Initial session loaded:', result.session?.user?.email || 'no session');
        setSession(result.session);
        setUser(result.session?.user || null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading initial session:', error);
      setLoading(false);
    }
  }, [authManager]);

  useEffect(() => {
    console.log('🔧 Setting up multi-provider auth state listener...');
    
    // Initialize with current provider
    setCurrentProvider(authManager.getConfig().provider);
    
    // Load initial session
    loadInitialSession();
  }, [authManager, loadInitialSession]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting to sign in with:', email);
      
      const result = await authManager.signIn({ email: email.trim(), password });
      
      if (result.error) {
        console.error('❌ Sign in error:', result.error);
        let errorMessage = result.error.message;
        
        if (result.error.message === 'Invalid login credentials') {
          errorMessage = "Email ou mot de passe incorrect. Vérifiez vos identifiants.";
        } else if (result.error.message.includes('Email not confirmed')) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter.";
        }
        
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive"
        });
        throw result.error;
      }
      
      if (result.session) {
        setSession(result.session);
        setUser(result.session.user);
        console.log('✅ Sign in successful:', result.session.user.email);
        toast({
          title: t('common.success'),
          description: "Bienvenue sur la plateforme.",
        });
      }
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
      
      const result = await authManager.signUp({ 
        email: email.trim(), 
        password,
        full_name: fullName,
        phone,
        national_id: nationalId
      });
      
      if (result.error) {
        console.error('❌ Sign up error:', result.error);
        let errorMessage = result.error.message;
        
        if (result.error.message.includes('User already registered')) {
          errorMessage = "Un compte existe déjà avec cette adresse email.";
        } else if (result.error.message.includes('Password should be at least 6 characters')) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
        }
        
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive"
        });
        throw result.error;
      }
      
      if (result.user) {
        setUser(result.user);
        console.log('✅ Sign up successful:', result.user.email);
        
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
      
      const result = await authManager.signOut();
      
      if (result.error) {
        console.error('❌ Sign out error:', result.error);
        toast({
          title: t('common.error'),
          description: "Une erreur est survenue lors de la déconnexion.",
          variant: "destructive"
        });
        throw result.error;
      }
      
      setSession(null);
      setUser(null);
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
      
      // TODO: Implement Google OAuth based on current provider
      // For now, this is a placeholder
      toast({
        title: t('common.info'),
        description: "Google sign in will be available in the next update.",
      });
      
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
      
      // TODO: Implement phone authentication based on current provider
      // For now, this is a placeholder
      toast({
        title: t('common.info'),
        description: "Phone sign in will be available in the next update.",
      });
      
      return { success: false, error: 'Not yet implemented' };
    } catch (error: unknown) {
      console.error('Phone sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOTP = async (phone: string, token: string) => {
    try {
      setLoading(true);
      console.log('🔢 Verifying phone OTP...');
      
      // TODO: Implement OTP verification based on current provider
      // For now, this is a placeholder
      toast({
        title: t('common.info'),
        description: "OTP verification will be available in the next update.",
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
      
      // TODO: Implement national ID authentication based on current provider
      // For now, this is a placeholder
      toast({
        title: t('common.info'),
        description: "National ID sign in will be available in the next update.",
      });
      
    } catch (error) {
      console.error('National ID sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchProvider = async (config: AuthManagerConfig) => {
    try {
      setLoading(true);
      console.log('🔄 Switching to provider:', config.provider);
      
      await authManager.switchProvider(config);
      setCurrentProvider(config.provider);
      
      // Reload session with new provider
      await loadInitialSession();
      
      toast({
        title: t('common.success'),
        description: `Switched to ${config.provider} authentication provider.`,
      });
    } catch (error) {
      console.error('Error switching provider:', error);
      toast({
        title: t('common.error'),
        description: "Failed to switch authentication provider.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isProviderAvailable = (provider: AuthProvider): boolean => {
    return authManager.isProviderAvailable(provider);
  };

  const value: MultiProviderAuthContextType = {
    user,
    session,
    loading,
    currentProvider,
    supportedProviders,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOTP,
    signInWithNationalId,
    switchProvider,
    isProviderAvailable,
    isDevelopmentMode: false
  };

  return (
    <MultiProviderAuthContext.Provider value={value}>
      {children}
    </MultiProviderAuthContext.Provider>
  );
}

export { MultiProviderAuthProvider, MultiProviderAuthContext };
