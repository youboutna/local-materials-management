import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { keycloak, initKeycloak, getUserInfo } from '@/integrations/keycloak/keycloak';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Initialize Keycloak
  useEffect(() => {
    const init = async () => {
      try {
        const authenticated = await initKeycloak();
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
              // Create new user profile
              const { data: newUser, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: crypto.randomUUID(), // Generate a UUID
                  full_name: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim(),
                  phone: '',
                  national_id: keycloakId,
                  // Map Keycloak admin role to patient for new users as default in our system
                  role: userInfo.roles.includes('admin') ? 'patient' : 'patient',
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
                  // Keep the existing role or default to patient if needed
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

  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout();
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
