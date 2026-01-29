/**
 * Service for user administration operations
 * Provides admin-level user management functionality
 */

import { UserProfile } from '@/hooks/hexagonal/useUsersAdminHex';

export interface UserAdminRepository {
  getProfiles(): Promise<UserProfile[]>;
  getUserRoles(userId: string): Promise<{ role_name: string }[]>;
  getUserById(userId: string): Promise<UserProfile | null>;
  updateUserStatus(userId: string, status: { ban_duration: string }): Promise<void>;
}

export class UserAdminService {
  constructor(private adminRepository: UserAdminRepository) {}

  async getUserProfiles(): Promise<UserProfile[]> {
    try {
      // Fetch profiles
      const profilesData = await this.adminRepository.getProfiles();

      if (!profilesData) {
        console.warn('USER_ADMIN_SERVICE_001: No profiles found', {
          code: 'USER_ADMIN_SERVICE_001',
          message: 'Aucun profil utilisateur trouvé',
          stack: new Error().stack
        });
        return [];
      }

      // Fetch roles and email for each user
      const profilesWithRoles = await Promise.all(
        profilesData.map(async (profile) => {
          try {
            // Get user roles
            const rolesData = await this.adminRepository.getUserRoles(profile.id);

            // Get user email from auth.users (requires admin privileges)
            let userEmail: string | undefined = undefined;
            try {
              const userData = await this.adminRepository.getUserById(profile.id);
              userEmail = userData?.email || undefined;
            } catch (emailError) {
              console.warn('USER_ADMIN_SERVICE_002: Failed to get user email', {
                code: 'USER_ADMIN_SERVICE_002',
                message: `Impossible de récupérer l'email pour l'utilisateur ${profile.id}`,
                userId: profile.id,
                technicalError: emailError,
                stack: new Error().stack
              });
            }

            const roles = rolesData?.map((r: { role_name: string }) => r.role_name) || [];
            const primaryRole = roles[0] || 'viewer';

            return {
              ...profile,
              roles,
              primaryRole,
              email: userEmail,
            } as UserProfile;
          } catch (profileError) {
            console.error('USER_ADMIN_SERVICE_003: Failed to process user profile', {
              code: 'USER_ADMIN_SERVICE_003',
              message: `Erreur lors du traitement du profil utilisateur ${profile.id}`,
              userId: profile.id,
              technicalError: profileError,
              stack: new Error().stack
            });
            // Return minimal profile data
            return {
              ...profile,
              roles: ['viewer'],
              primaryRole: 'viewer',
              email: undefined,
            } as UserProfile;
          }
        })
      );

      return profilesWithRoles;
    } catch (error) {
      console.error('USER_ADMIN_SERVICE_004: Failed to fetch user profiles', {
        code: 'USER_ADMIN_SERVICE_004',
        message: 'Échec critique de la récupération des profils utilisateurs',
        technicalError: error,
        stack: new Error().stack
      });
      throw new Error('USER_ADMIN_SERVICE_004: Impossible de charger les profils utilisateurs');
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ userId: string; isActive: boolean }> {
    try {
      await this.adminRepository.updateUserStatus(userId, {
        ban_duration: isActive ? 'none' : '24h',
      });
      
      console.info('USER_ADMIN_SERVICE_005: User status updated successfully', {
        code: 'USER_ADMIN_SERVICE_005',
        message: `Statut utilisateur mis à jour avec succès: ${userId}`,
        userId,
        isActive,
        stack: new Error().stack
      });
      
      return { userId, isActive };
    } catch (error) {
      console.error('USER_ADMIN_SERVICE_006: Failed to update user status', {
        code: 'USER_ADMIN_SERVICE_006',
        message: `Échec de la mise à jour du statut pour l'utilisateur ${userId}`,
        userId,
        isActive,
        technicalError: error,
        stack: new Error().stack
      });
      throw new Error('USER_ADMIN_SERVICE_006: Impossible de modifier le statut utilisateur');
    }
  }
}
