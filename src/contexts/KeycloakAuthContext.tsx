
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { DEV_MODE, DEV_USER, DEV_CONFIG } from '@/config/constants';

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

    // In development mode, use DEV_USER profile
    if (DEV_MODE) {
      if (DEV_CONFIG.mockApiDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, DEV_CONFIG.mockApiDelay));
      }
      
      const devProfile: Profile = {
        id: DEV_USER.id,
        full_name: DEV_USER.user_metadata?.full_name || 'Développeur Test',
        phone: DEV_USER.user_metadata?.phone || '',
        national_id: DEV_USER.user_metadata?.national_id || '',
        role: DEV_USER.user_metadata?.role || 'admin',
        avatar_url: (DEV_USER.user_metadata as any)?.avatar_url || null,
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
      // For now, create a mock profile based on user metadata
      // In production, this would fetch from the database
      const mockProfile: Profile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Utilisateur',
        phone: user.user_metadata?.phone || '',
        national_id: user.user_metadata?.national_id || '',
        role: user.user_metadata?.role || 'user',
        avatar_url: user.user_metadata?.avatar_url || null,
      };

      setProfile(mockProfile);
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
      // For now, create a mock profile
      // In production, this would check for existing profiles and create in database
      const mockProfile: Profile = {
        id: user.id,
        full_name: fullName,
        phone: phoneNumber,
        national_id: nationalId,
        role: 'user',
        avatar_url: null,
      };

      setProfile(mockProfile);
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
      // For now, update the mock profile
      // In production, this would update the database
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
