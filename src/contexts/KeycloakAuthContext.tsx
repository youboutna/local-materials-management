
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { DEV_MODE, DEV_CONFIG } from '@/config/constants';
import { UserService } from '@/application/services/UserService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

const userService = getUserService();

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  national_id: string;
  role: string;
  avatar_url: string | null;
}

interface KeycloakAuthContextProps {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  user: any;
  isAuthenticated: boolean;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  createProfile: (fullName: string, phoneNumber: string, nationalId: string) => Promise<void>;
}

const KeycloakAuthContext = createContext<KeycloakAuthContextProps | undefined>(undefined);

export const KeycloakAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAuthenticated = !!user;
  const { t } = useLanguage();

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    // DEV_MODE profile hydration: only when a real DEV session exists (user
    // signed in via LocalAuthAdapter). We build the profile from the session's
    // user metadata — never from DEV_USER directly — so signed-out state stays
    // truly signed-out.
    if (DEV_MODE && user?.id) {
      if (DEV_CONFIG.mockApiDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, DEV_CONFIG.mockApiDelay));
      }

      const devProfile: Profile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Utilisateur DEV',
        phone: user.user_metadata?.phone || '',
        national_id: user.user_metadata?.national_id || '',
        role: user.user_metadata?.role || 'user',
        avatar_url: user.user_metadata?.avatar_url || null,
      };

      setProfile(devProfile);
      setLoading(false);
      return;
    }

    if (!user?.id) {
      console.warn('User ID is missing.');
      setLoading(false);
      return;
    }

    try {
      const dbUser = await userService.getUserById(user.id);

      if (dbUser) {
        setProfile({
          id: dbUser.id,
          full_name: dbUser.fullName || dbUser.name,
          phone: dbUser.phone || '',
          national_id: user.user_metadata?.national_id || '',
          role: dbUser.role,
          avatar_url: dbUser.avatar || null,
        });
      } else {
        // No profile record found yet — fall back to auth metadata
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Utilisateur',
          phone: user.user_metadata?.phone || '',
          national_id: user.user_metadata?.national_id || '',
          role: user.user_metadata?.role || 'user',
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (fullName: string, phoneNumber: string, nationalId: string) => {
    setLoading(true);
    setError(null);

    if (!user?.id) {
      console.warn('User ID is missing.');
      setLoading(false);
      return;
    }

    try {
      const existing = await userService.getUserById(user.id);
      const updated = existing
        ? await userService.updateUser(user.id, {
            fullName,
            phone: phoneNumber,
          } as any)
        : await userService.createUser({
            name: fullName,
            email: user.email || '',
            phone: phoneNumber,
            role: 'user' as any,
            image: '',
            workspaceIds: [],
            fullName,
          } as any);

      setProfile({
        id: user.id,
        full_name: (updated as any).fullName || fullName,
        phone: phoneNumber,
        national_id: nationalId,
        role: 'user',
        avatar_url: null,
      });
      toast({
        title: t('common.success'),
        description: "Profil créé avec succès.",
      });
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create profile.');
      toast({
        title: t('common.error'),
        description: "Échec de la création du profil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (fullName: string) => {
    setLoading(true);
    setError(null);

    if (!user?.id) {
      console.warn('User ID is missing.');
      setLoading(false);
      return;
    }

    try {
      await userService.updateProfile(user.id, { fullName });

      if (profile) {
        const updatedProfile = { ...profile, full_name: fullName };
        setProfile(updatedProfile);
        toast({
          title: t('common.success'),
          description: "Profil mis à jour avec succès.",
        });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile.');
      toast({
        title: t('common.error'),
        description: "Échec de la mise à jour du profil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    signOut();
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    }
  }, [isAuthenticated, user]);

  const value: KeycloakAuthContextProps = {
    profile,
    loading,
    error,
    user,
    isAuthenticated,
    logout,
    fetchProfile,
    updateProfile,
    createProfile,
  };

  return (
    <KeycloakAuthContext.Provider value={value}>
      {children}
    </KeycloakAuthContext.Provider>
  );
};

export const useKeycloakAuth = () => {
  const context = useContext(KeycloakAuthContext);
  if (context === undefined) {
    throw new Error('useKeycloakAuth must be used within a KeycloakAuthProvider');
  }
  return context;
};
