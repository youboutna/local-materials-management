
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEV_MODE, DEV_USER, getActiveDevRole } from '@/config/constants';

// Get a unique session identifier for this browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('lovable-session-id');
  if (!sessionId) {
    // Create a truly unique session ID with timestamp and random string
    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('lovable-session-id', sessionId);
    console.log('🆔 Created new session ID:', sessionId);
  }
  return sessionId;
};

// Check if this session should be bypassed (anonymous)
const shouldBypassAuth = () => {
  const currentSessionId = getSessionId();
  const adminSessionId = localStorage.getItem('admin-session-id');
  
  console.log('🔍 Session check - Current:', currentSessionId, 'Admin:', adminSessionId);
  
  // If no admin session is set, set this as the admin session
  if (!adminSessionId) {
    localStorage.setItem('admin-session-id', currentSessionId);
    console.log('👑 Set as admin session:', currentSessionId);
    return false; // This session is admin
  }
  
  // If this session is the admin session, don't bypass
  if (currentSessionId === adminSessionId) {
    console.log('✅ Admin session detected');
    return false;
  }
  
  // All other sessions are anonymous
  console.log('👻 Anonymous session detected');
  return true;
};

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
  const activeDevRole = getActiveDevRole();
  const bypassAuth = shouldBypassAuth();
  
  console.log('🔧 AuthProvider - DEV_MODE:', DEV_MODE, 'bypassAuth:', bypassAuth);
  
  // Create a mock session for dev mode
  const createDevSession = (): Session => ({
    access_token: 'dev-access-token',
    refresh_token: 'dev-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: {
      ...DEV_USER,
      user_metadata: {...DEV_USER.user_metadata, role: activeDevRole.role}
    } as unknown as User
  });

  const [user, setUser] = useState<User | null>((DEV_MODE && !bypassAuth) ? 
    {...DEV_USER, user_metadata: {...DEV_USER.user_metadata, role: activeDevRole.role}} as unknown as User 
    : null);
  const [session, setSession] = useState<Session | null>((DEV_MODE && !bypassAuth) ? createDevSession() : null);
  const [loading, setLoading] = useState(!(DEV_MODE || bypassAuth));
  const { toast } = useToast();

  useEffect(() => {
    if (DEV_MODE && bypassAuth) {
      console.log('🛠️ Development mode: Session bypassed - showing anonymous view');
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    if (DEV_MODE && !bypassAuth) {
      console.log('🛠️ Development mode active: Authentication is bypassed');
      console.log(`🛠️ Using role: ${activeDevRole.role}`);
      
      // Set a mock session for Supabase operations
      const mockSession = createDevSession();
      setSession(mockSession);
      setUser(mockSession.user);
      setLoading(false);
      
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
  }, [bypassAuth, activeDevRole]);

  const signIn = async (email: string, password: string) => {
    if (DEV_MODE && bypassAuth) {
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
      });
      return;
    }

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
    if (DEV_MODE && bypassAuth) {
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
      });
      return;
    }

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
    if (DEV_MODE && bypassAuth) {
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
      });
      return;
    }

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
    if (DEV_MODE && bypassAuth) {
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
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
    if (DEV_MODE && bypassAuth) {
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
      });
      return { success: false, error: "Session anonyme" };
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
    if (DEV_MODE && bypassAuth) {
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
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
    if (DEV_MODE && bypassAuth) {
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
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
    signInWithGoogle: async () => {
      if (DEV_MODE && bypassAuth) {
        toast({
          title: "Session anonyme",
          description: "Cette session est configurée en mode anonyme",
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
    },
    signInWithPhone: async (phone: string) => {
      if (DEV_MODE && bypassAuth) {
        toast({
          title: "Session anonyme",
          description: "Cette session est configurée en mode anonyme",
        });
        return { success: false, error: "Session anonyme" };
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
    },
    verifyPhoneOTP: async (phone: string, token: string) => {
      if (DEV_MODE && bypassAuth) {
        toast({
          title: "Session anonyme",
          description: "Cette session est configurée en mode anonyme",
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
    },
    signInWithNationalId: async (nationalId: string, password: string) => {
      if (DEV_MODE && bypassAuth) {
        toast({
          title: "Session anonyme",
          description: "Cette session est configurée en mode anonyme",
        });
        return;
      }
      try {
        setLoading(true);
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
    },
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
