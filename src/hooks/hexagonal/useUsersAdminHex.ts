/**
 * Hexagonal hook for user administration
 * Provides admin-level user management through UserAdminService
 */
import { UserAdminService } from '@/application/services/UserAdminService';
import { toast } from '@/hooks/use-toast';
import { UserAdminAdapter } from '@/infrastructure/adapters/supabase/UserAdminAdapter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const adminService = new UserAdminService(new UserAdminAdapter());
  
  return useQuery({
    queryKey: ['user-profiles', userId],
    queryFn: async (): Promise<UserProfile[]> => {
      try {
        console.info('USE_USERS_ADMIN_HEX_001: Fetching user profiles', {
          code: 'USE_USERS_ADMIN_HEX_001',
          message: 'Début de la récupération des profils utilisateurs',
          userId,
          isDevelopmentMode,
          stack: new Error().stack
        });
        
        const profiles = await adminService.getUserProfiles();
        
        console.info('USE_USERS_ADMIN_HEX_002: User profiles fetched successfully', {
          code: 'USE_USERS_ADMIN_HEX_002',
          message: `${profiles.length} profils utilisateurs récupérés avec succès`,
          userId,
          profilesCount: profiles.length,
          stack: new Error().stack
        });
        
        return profiles;
      } catch (error) {
        console.error('USE_USERS_ADMIN_HEX_003: Failed to fetch user profiles', {
          code: 'USE_USERS_ADMIN_HEX_003',
          message: 'Échec de la récupération des profils utilisateurs dans le hook',
          userId,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    enabled: !!userId && !isDevelopmentMode,
  });
};

export const useToggleUserStatusHex = () => {
  const queryClient = useQueryClient();
  const adminService = new UserAdminService(new UserAdminAdapter());
  
  return useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: boolean }) => {
      try {
        console.info('USE_USERS_ADMIN_HEX_005: Toggling user status', {
          code: 'USE_USERS_ADMIN_HEX_005',
          message: `Basculement du statut utilisateur: ${userId} -> ${newStatus ? 'actif' : 'inactif'}`,
          userId,
          newStatus,
          stack: new Error().stack
        });
        
        const result = await adminService.toggleUserStatus(userId, newStatus);
        
        console.info('USE_USERS_ADMIN_HEX_006: User status toggled successfully', {
          code: 'USE_USERS_ADMIN_HEX_006',
          message: `Statut utilisateur basculé avec succès: ${userId}`,
          userId,
          isActive: result.isActive,
          stack: new Error().stack
        });
        
        return result;
      } catch (error) {
        console.error('USE_USERS_ADMIN_HEX_007: Failed to toggle user status', {
          code: 'USE_USERS_ADMIN_HEX_007',
          message: 'Échec du basculement du statut utilisateur dans le hook',
          userId,
          newStatus,
          technicalError: error,
          stack: new Error().stack
        });
        throw error;
      }
    },
    onSuccess: ({ userId, isActive }) => {
      console.info('USE_USERS_ADMIN_HEX_008: User status toggle success', {
        code: 'USE_USERS_ADMIN_HEX_008',
        message: `Succès du basculement du statut utilisateur: ${userId}`,
        userId,
        isActive,
        stack: new Error().stack
      });
      
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: 'Succès',
        description: `Le compte a été ${isActive ? 'activé' : 'désactivé'}.`,
      });
    },
    onError: (error: unknown) => {
      console.error('USE_USERS_ADMIN_HEX_009: User status toggle error', {
        code: 'USE_USERS_ADMIN_HEX_009',
        message: 'Erreur lors du basculement du statut utilisateur',
        technicalError: error,
        stack: new Error().stack
      });
      
      toast({
        title: 'Erreur',
        description: "Impossible de modifier le statut de l'utilisateur",
        variant: 'destructive',
      });
    },
  });
};
