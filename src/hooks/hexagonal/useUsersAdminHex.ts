/**
 * Hexagonal hook for user administration
 * Note: Uses direct Supabase calls as admin API requires special privileges
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  national_id: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  roles?: string[];
  primaryRole?: string;
  is_active?: boolean;
  email?: string;
}

export const useUserProfilesHex = (userId: string | undefined, isDevelopmentMode: boolean) => {
  return useQuery({
    queryKey: ['user-profiles', userId],
    queryFn: async (): Promise<UserProfile[]> => {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (!profilesData) return [];

      // Fetch roles and email for each user
      const profilesWithRoles = await Promise.all(
        profilesData.map(async (profile) => {
          // Get user roles
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role_name')
            .eq('user_id', profile.id);

          // Get user email from auth.users (requires admin privileges)
          let userEmail: string | null = null;
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
            userEmail = userData.user?.email || null;
          } catch {
            // Admin API may not be available
          }

          const roles = rolesData?.map((r: any) => r.role_name) || [];
          const primaryRole = roles[0] || 'viewer';

          return {
            ...profile,
            roles,
            primaryRole,
            email: userEmail,
          } as UserProfile;
        })
      );

      return profilesWithRoles;
    },
    enabled: !!userId && !isDevelopmentMode,
  });
};

export const useToggleUserStatusHex = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: newStatus ? 'none' : '24h',
      });
      if (error) throw error;
      return { userId, newStatus };
    },
    onSuccess: ({ userId, newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: 'Succès',
        description: `Le compte a été ${newStatus ? 'activé' : 'désactivé'}.`,
      });
    },
    onError: (error: any) => {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de modifier le statut de l'utilisateur",
        variant: 'destructive',
      });
    },
  });
};
