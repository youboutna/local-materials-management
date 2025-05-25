
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { keycloak, initKeycloak, getUserInfo } from '@/integrations/keycloak/keycloak';
import { useToast } from '@/hooks/use-toast';
import { DEV_MODE } from '@/config/constants';

// Get a unique session identifier for this browser session - use same logic as AuthContext
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('lovable-session-id');
  if (!sessionId) {
    // Create a truly unique session ID with timestamp and random string
    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('lovable-session-id', sessionId);
    console.log('🆔 Keycloak: Created new session ID:', sessionId);
  }
  return sessionId;
};

// Check if this session should be bypassed (anonymous) - use same logic as AuthContext
const shouldBypassAuth = () => {
  const currentSessionId = getSessionId();
  const adminSessionId = localStorage.getItem('admin-session-id');
  
  console.log('🔍 Keycloak session check - Current:', currentSessionId, 'Admin:', adminSessionId);
  
  // If no admin session is set, set this as the admin session
  if (!adminSessionId) {
    localStorage.setItem('admin-session-id', currentSessionId);
    console.log('👑 Keycloak: Set as admin session:', currentSessionId);
    return false; // This session is admin
  }
  
  // If this session is the admin session, don't bypass
  if (currentSessionId === adminSessionId) {
    console.log('✅ Keycloak: Admin session detected');
    return false;
  }
  
  // All other sessions are anonymous
  console.log('👻 Keycloak: Anonymous session detected');
  return true;
};

interface KeycloakUser {
  id?: string;
  keycloakId: string;
  username: string;
  email?: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
}

type KeycloakAuthContextType = {
  user: KeycloakUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
};

const KeycloakAuthContext = createContext<KeycloakAuthContextType | undefined>(undefined);

export function KeycloakAuthProvider({ children }: { children: ReactNode }) {
  const bypassAuth = shouldBypassAuth();
  
  console.log('🔧 KeycloakAuthProvider - DEV_MODE:', DEV_MODE, 'bypassAuth:', bypassAuth);
  
  const [user, setUser] = useState<KeycloakUser | null>(null);
  const [loading, setLoading] = useState(!(DEV_MODE || bypassAuth));
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_MODE && !bypassAuth);
  const { toast } = useToast();

  // Initialize Keycloak
  useEffect(() => {
    // Skip Keycloak initialization in development mode or for bypassed sessions
    if (DEV_MODE && bypassAuth) {
      console.log('🛠️ Development mode: Session bypassed - Keycloak authentication disabled');
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    if (DEV_MODE && !bypassAuth) {
      console.log('🛠️ Development mode active: Keycloak authentication is bypassed');
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        // Add error handling with timeouts to prevent hanging
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error("Keycloak initialization timed out")), 10000);
        });
        
        const authenticated = await Promise.race([
          initKeycloak(),
          timeoutPromise
        ]) as boolean;
        
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const userInfo = getUserInfo();
          
          // Create or update user in Supabase
          if (keycloak.tokenParsed?.sub) {
            const keycloakId = keycloak.tokenParsed.sub;
            
            // Check if user exists in Supabase
            const { data: existingUser, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('national_id', keycloakId)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
              console.error('Error fetching user:', fetchError);
            }

            if (!existingUser) {
              // Create new user profile - use inspector as default role
              const { data: newUser, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: crypto.randomUUID(), // Generate a UUID
                  full_name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim(),
                  phone: '',
                  national_id: keycloakId,
                  // Use inspector as default role for new users
                  role: 'inspector' as any,
                  avatar_url: null,
                })
                .select()
                .single();

              if (createError) {
                console.error('Error creating user:', createError);
                toast({
                  title: 'Erreur',
                  description: 'Impossible de créer le profil utilisateur',
                  variant: 'destructive'
                });
              } else {
                setUser({
                  id: newUser.id,
                  keycloakId,
                  username: userInfo.username || '',
                  email: userInfo.email,
                  roles: userInfo.roles,
                  firstName: userInfo.firstName,
                  lastName: userInfo.lastName,
                });
              }
            } else {
              // User exists, update their profile with latest Keycloak info
              const { error: updateError } = await supabase
                .from('profiles')
                .update({
                  full_name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim(),
                  // Keep the existing role or default to inspector if needed
                })
                .eq('national_id', keycloakId);

              if (updateError) {
                console.error('Error updating user:', updateError);
              }

              setUser({
                id: existingUser.id,
                keycloakId,
                username: userInfo.username || '',
                email: userInfo.email,
                roles: userInfo.roles,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error initializing Keycloak:', error);
        toast({
          title: 'Erreur d\'authentification',
          description: 'Impossible de se connecter au service d\'authentification',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [toast, bypassAuth]);

  // Safe login function
  const login = () => {
    if (DEV_MODE && bypassAuth) {
      console.log('🛠️ Session anonyme: Login action bloqué');
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
      });
      return;
    }

    if (DEV_MODE && !bypassAuth) {
      console.log('🛠️ Development mode: Login action simulated');
      // Directly set authenticated in dev mode
      setIsAuthenticated(true);
      setUser({
        id: 'dev-user-id',
        keycloakId: 'dev-keycloak-id',
        username: 'dev-user',
        email: 'dev@example.com',
        roles: ['director'],
        firstName: 'Dev',
        lastName: 'User'
      });
      return;
    }
    
    try {
      keycloak.login();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Erreur de connexion',
        description: 'Impossible de se connecter au service d\'authentification',
        variant: 'destructive'
      });
    }
  };

  // Safe logout function
  const logout = () => {
    if (DEV_MODE && bypassAuth) {
      console.log('🛠️ Session anonyme: Logout action bloqué');
      toast({
        title: "Session anonyme",
        description: "Cette session est configurée en mode anonyme",
      });
      return;
    }

    if (DEV_MODE && !bypassAuth) {
      console.log('🛠️ Development mode: Logout action simulated');
      setIsAuthenticated(false);
      setUser(null);
      // In dev mode, redirect to auth page directly
      window.location.href = '/auth';
      return;
    }
    
    try {
      keycloak.logout();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Erreur de déconnexion',
        description: 'Impossible de se déconnecter du service d\'authentification',
        variant: 'destructive'
      });
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout
  };

  return <KeycloakAuthContext.Provider value={value}>{children}</KeycloakAuthContext.Provider>;
}

export function useKeycloakAuth() {
  const context = useContext(KeycloakAuthContext);
  if (context === undefined) {
    throw new Error('useKeycloakAuth must be used within a KeycloakAuthProvider');
  }
  return context;
}
