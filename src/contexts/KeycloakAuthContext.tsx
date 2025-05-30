
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    if (!user?.id) {
      console.warn('User ID is missing.');
      setLoading(false);
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData as any);
      } else {
        console.log('No profile found, attempting to create...');
        setProfile(null);
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
      // Check if a profile with the national_id already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('national_id', nationalId)
        .maybeSingle();

      if (existingProfile) {
        toast({
          title: "Erreur",
          description: "Un profil avec ce numéro d'identification existe déjà.",
          variant: "destructive",
        });
        setError('Profile with this national ID already exists.');
        return;
      }

      // If no profile exists, proceed to create a new one
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          phone: phoneNumber,
          national_id: nationalId,
          role: 'user',
          avatar_url: null,
        } as any)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (newProfile && (newProfile as any).id) {
        setProfile(newProfile as any);
        toast({
          title: "Profil créé",
          description: "Votre profil a été créé avec succès.",
        });
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le profil. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
      setError('Failed to create profile.');
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
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
        } as any)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (updatedProfile && (updatedProfile as any).id) {
        setProfile(updatedProfile as any);
        toast({
          title: "Profil mis à jour",
          description: "Votre profil a été mis à jour avec succès.",
        });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, user]);

  const value: KeycloakAuthContextProps = {
    profile,
    loading,
    error,
    user,
    isAuthenticated,
    logout: signOut,
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
