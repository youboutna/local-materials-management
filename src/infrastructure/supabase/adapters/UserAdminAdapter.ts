// @ts-nocheck
/**
 * Supabase adapter for user administration operations
 * Implements admin-level user management functionality
 */

import { supabase } from '@/integrations/supabase/client';
import type { UserAdminRepository } from '@/application/services/UserAdminService';

export class UserAdminAdapter implements UserAdminRepository {
  async getProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('USER_ADMIN_ADAPTER_001: Failed to fetch profiles', {
          code: 'USER_ADMIN_ADAPTER_001',
          message: 'Échec de la récupération des profils utilisateurs',
          technicalError: error,
          stack: new Error().stack
        });
        throw new Error('USER_ADMIN_ADAPTER_001: Impossible de charger les profils utilisateurs');
      }
      return data || [];
    } catch (err) {
      console.error('USER_ADMIN_ADAPTER_002: Unexpected error in getProfiles', {
        code: 'USER_ADMIN_ADAPTER_002',
        message: 'Erreur inattendue lors de la récupération des profils',
        error: err,
        stack: new Error().stack
      });
      throw err;
    }
  }

  async getUserRoles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', userId);

      if (error) {
        console.error('USER_ADMIN_ADAPTER_003: Failed to fetch user roles', {
          code: 'USER_ADMIN_ADAPTER_003',
          message: `Échec de la récupération des rôles pour l'utilisateur ${userId}`,
          userId,
          technicalError: error,
          stack: new Error().stack
        });
        throw new Error('USER_ADMIN_ADAPTER_003: Impossible de charger les rôles utilisateur');
      }
      return data || [];
    } catch (err) {
      console.error('USER_ADMIN_ADAPTER_004: Unexpected error in getUserRoles', {
        code: 'USER_ADMIN_ADAPTER_004',
        message: 'Erreur inattendue lors de la récupération des rôles utilisateur',
        userId,
        error: err,
        stack: new Error().stack
      });
      throw err;
    }
  }

  async getUserById(userId: string) {
    try {
      let userData;
      try {
        const { data } = await supabase.auth.admin.getUserById(userId);
        userData = data;
      } catch (adminError) {
        console.warn('USER_ADMIN_ADAPTER_005: Admin API not available', {
          code: 'USER_ADMIN_ADAPTER_005',
          message: "L'API admin n'est pas disponible pour cet utilisateur",
          userId,
          technicalError: adminError,
          stack: new Error().stack
        });
        userData = { user: null };
      }
      return userData;
    } catch (err) {
      console.error('USER_ADMIN_ADAPTER_006: Unexpected error in getUserById', {
        code: 'USER_ADMIN_ADAPTER_006',
        message: 'Erreur inattendue lors de la récupération de l utilisateur par ID',
        userId,
        error: err,
        stack: new Error().stack
      });
      throw err;
    }
  }

  async updateUserStatus(userId: string, status: { ban_duration: string }) {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, status);
      if (error) {
        console.error('USER_ADMIN_ADAPTER_007: Failed to update user status', {
          code: 'USER_ADMIN_ADAPTER_007',
          message: `Échec de la mise à jour du statut pour l'utilisateur ${userId}`,
          userId,
          status,
          technicalError: error,
          stack: new Error().stack
        });
        throw new Error('USER_ADMIN_ADAPTER_007: Impossible de modifier le statut utilisateur');
      }
    } catch (err) {
      console.error('USER_ADMIN_ADAPTER_008: Unexpected error in updateUserStatus', {
        code: 'USER_ADMIN_ADAPTER_008',
        message: 'Erreur inattendue lors de la mise à jour du statut utilisateur',
        userId,
        status,
        error: err,
        stack: new Error().stack
      });
      throw err;
    }
  }
}
