
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { keycloak, initKeycloak, getUserInfo } from '@/integrations/keycloak/keycloak';
import { useToast } from '@/hooks/use-toast';
import { DEV_MODE } from '@/config/constants';

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
  const [user, setUser] = useState<KeycloakUser | null>(null);
  const [loading, setLoading] = useState(!DEV_MODE); // Don't show loading in dev mode
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_MODE); // Auto-authenticated in dev mode
  const { toast } = useToast();

  // Initialize Keycloak
  useEffect(() => {
    // Skip Keycloak initialization in development mode
    if (DEV_MODE) {
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
  }, [toast]);

  // Safe login function
  const login = () => {
    if (DEV_MODE) {
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
    if (DEV_MODE) {
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
