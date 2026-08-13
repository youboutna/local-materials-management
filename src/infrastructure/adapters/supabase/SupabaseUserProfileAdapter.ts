/**
 * SupabaseUserProfileAdapter
 * Adapter pour la table profiles
 * Architecture hexagonale pure - implémentation technique uniquement
 */

import { UserProfile, ProfileStatus } from '@/domain/entities/UserProfile';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { IUserProfileRepository, ProfileSearchCriteria, ProfileStatistics, UpdateProfileData, CreateProfileData } from '@/domain/repositories/IUserProfileRepository';

/**
 * Adapter Supabase pour la gestion des profils utilisateurs
 * Implémente l'interface IUserProfileRepository en utilisant Supabase comme base de données
 */
export class SupabaseUserProfileAdapter implements IUserProfileRepository {
  private generateId(): string {
    return crypto.randomUUID();
  }
  
  async createProfile(profileData: CreateProfileData): Promise<UserProfile> {
    try {
      const now = new Date();
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: profileData.userId, // Use userId as the profile id (foreign key to user_full)
          full_name: profileData.fullName,
          phone: profileData.phone || null,
          national_id: profileData.nationalId || null,
          avatar_url: profileData.avatarUrl || null,
          is_admin: profileData.isAdmin || false,
          role: profileData.isAdmin ? 'admin' : 'agent', // Map to user_role enum values
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        } as Database['public']['Tables']['profiles']['Insert'])
        .select()
        .single();

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_CREATE_ERROR, 'Failed to create profile', error, { profileData }), 
          'SupabaseUserProfileAdapter.createProfile failed'
        );
        throw new AppError(ErrorCode.PROFILE_CREATE_ERROR, 'Failed to create profile');
      }

      return this.mapRowToEntity(data);
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_CREATE_ERROR, 'Unexpected error creating profile', error, { profileData }), 
        'SupabaseUserProfileAdapter.createProfile unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_CREATE_ERROR, 'Unexpected error creating profile');
    }
  }

  async getProfileById(id: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch profile by ID', error, { id }), 
          'SupabaseUserProfileAdapter.getProfileById failed'
        );
        return null;
      }

      return this.mapRowToEntity(data);
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching profile by ID', error, { id }), 
        'SupabaseUserProfileAdapter.getProfileById unexpected error'
      );
      return null;
    }
  }

  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch profile by user ID', error, { userId }), 
          'SupabaseUserProfileAdapter.getProfileByUserId failed'
        );
        return null;
      }

      return this.mapRowToEntity(data);
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching profile by user ID', error, { userId }), 
        'SupabaseUserProfileAdapter.getProfileByUserId unexpected error'
      );
      return null;
    }
  }

  async updateProfile(id: string, updateData: UpdateProfileData): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updateData.fullName,
          phone: updateData.phone || null,
          national_id: updateData.nationalId || null,
          avatar_url: updateData.avatarUrl || null,
          updated_at: new Date().toISOString()
        } as Database['public']['Tables']['profiles']['Update'])
        .eq('id', id)
        .select()
        .single();

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to update profile', error, { id, updateData }), 
          'SupabaseUserProfileAdapter.updateProfile failed'
        );
        throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to update profile');
      }

      return this.mapRowToEntity(data);
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error updating profile', error, { id, updateData }), 
        'SupabaseUserProfileAdapter.updateProfile unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error updating profile');
    }
  }

  async deleteProfile(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_DELETE_ERROR, 'Failed to delete profile', error, { id }), 
          'SupabaseUserProfileAdapter.deleteProfile failed'
        );
        throw new AppError(ErrorCode.PROFILE_DELETE_ERROR, 'Failed to delete profile');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_DELETE_ERROR, 'Unexpected error deleting profile', error, { id }), 
        'SupabaseUserProfileAdapter.deleteProfile unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_DELETE_ERROR, 'Unexpected error deleting profile');
    }
  }

  async searchProfiles(criteria: ProfileSearchCriteria): Promise<UserProfile[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (criteria.fullName) {
        query = query.ilike('full_name', `%${criteria.fullName}%`);
      }
      if (criteria.email) {
        query = query.ilike('email', `%${criteria.email}%`);
      }
      if (criteria.phone) {
        query = query.ilike('phone', `%${criteria.phone}%`);
      }
      if (criteria.nationalId) {
        query = query.ilike('national_id', `%${criteria.nationalId}%`);
      }
      if (criteria.department) {
        query = query.ilike('department', `%${criteria.department}%`);
      }
      if (criteria.position) {
        query = query.ilike('position', `%${criteria.position}%`);
      }
      if (criteria.location) {
        query = query.ilike('location', `%${criteria.location}%`);
      }
      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }
      if (criteria.isAdmin !== undefined) {
        query = query.eq('is_admin', criteria.isAdmin);
      }
      if (criteria.createdAfter) {
        query = query.gte('created_at', criteria.createdAfter.toISOString());
      }
      if (criteria.createdBefore) {
        query = query.lte('created_at', criteria.createdBefore.toISOString());
      }
      if (criteria.lastLoginAfter) {
        query = query.gte('last_login', criteria.lastLoginAfter.toISOString());
      }
      if (criteria.lastLoginBefore) {
        query = query.lte('last_login', criteria.lastLoginBefore.toISOString());
      }

      // Pagination
      if (criteria.limit && criteria.offset) {
        query = query.range(criteria.offset, criteria.offset + criteria.limit - 1);
      } else if (criteria.limit) {
        query = query.limit(criteria.limit);
      } else if (criteria.offset) {
        query = query.range(criteria.offset, 999999); // Large number pour obtenir tout à partir de l'offset
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to search profiles', error, { criteria }), 
          'SupabaseUserProfileAdapter.searchProfiles failed'
        );
        throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to search profiles');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error searching profiles', error, { criteria }), 
        'SupabaseUserProfileAdapter.searchProfiles unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error searching profiles');
    }
  }

  async countProfiles(criteria: Omit<ProfileSearchCriteria, 'limit' | 'offset'>): Promise<number> {
    try {
      let query = supabase
        .from('profiles')
        .select('id', { count: true, head: true });

      // Appliquer les filtres
      if (criteria.fullName) {
        query = query.ilike('full_name', `%${criteria.fullName}%`);
      }
      if (criteria.email) {
        query = query.ilike('email', `%${criteria.email}%`);
      }
      if (criteria.phone) {
        query = query.ilike('phone', `%${criteria.phone}%`);
      }
      if (criteria.nationalId) {
        query = query.ilike('national_id', `%${criteria.nationalId}%`);
      }
      if (criteria.department) {
        query = query.ilike('department', `%${criteria.department}%`);
      }
      if (criteria.position) {
        query = query.ilike('position', `%${criteria.position}%`);
      }
      if (criteria.location) {
        query = query.ilike('location', `%${criteria.location}%`);
      }
      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }
      if (criteria.isAdmin !== undefined) {
        query = query.eq('is_admin', criteria.isAdmin);
      }
      if (criteria.createdAfter) {
        query = query.gte('created_at', criteria.createdAfter.toISOString());
      }
      if (criteria.createdBefore) {
        query = query.lte('created_at', criteria.createdBefore.toISOString());
      }
      if (criteria.lastLoginAfter) {
        query = query.gte('last_login', criteria.lastLoginAfter.toISOString());
      }
      if (criteria.lastLoginBefore) {
        query = query.lte('last_login', criteria.lastLoginBefore.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to count profiles', error, { criteria }), 
          'SupabaseUserProfileAdapter.countProfiles failed'
        );
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error counting profiles', error, { criteria }), 
        'SupabaseUserProfileAdapter.countProfiles unexpected error'
      );
      return 0;
    }
  }

  async updateProfileStatus(id: string, status: ProfileStatus): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', id);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to update profile status', error, { id, status }), 
          'SupabaseUserProfileAdapter.updateProfileStatus failed'
        );
        throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to update profile status');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error updating profile status', error, { id, status }), 
        'SupabaseUserProfileAdapter.updateProfileStatus unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error updating profile status');
    }
  }

  async updateAdminPrivileges(id: string, isAdmin: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', id);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to update admin privileges', error, { id, isAdmin }), 
          'SupabaseUserProfileAdapter.updateAdminPrivileges failed'
        );
        throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to update admin privileges');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error updating admin privileges', error, { id, isAdmin }), 
        'SupabaseUserProfileAdapter.updateAdminPrivileges unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error updating admin privileges');
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to update last login', error, { id }), 
          'SupabaseUserProfileAdapter.updateLastLogin failed'
        );
        throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to update last login');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error updating last login', error, { id }), 
        'SupabaseUserProfileAdapter.updateLastLogin unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error updating last login');
    }
  }

  async profileExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .limit(1);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to check if profile exists', error, { userId }), 
          'SupabaseUserProfileAdapter.profileExists failed'
        );
        return false;
      }

      return data.length > 0;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error checking if profile exists', error, { userId }), 
        'SupabaseUserProfileAdapter.profileExists unexpected error'
      );
      return false;
    }
  }

  async getProfileStatistics(criteria?: Omit<ProfileSearchCriteria, 'limit' | 'offset'>): Promise<ProfileStatistics> {
    try {
      // Récupérer les statistiques des profils
      const { count: totalProfiles, error: totalError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      const { count: activeProfiles, error: activeError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', ProfileStatus.ACTIVE);

      const { count: inactiveProfiles, error: inactiveError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', ProfileStatus.INACTIVE);

      const { count: suspendedProfiles, error: suspendedError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', ProfileStatus.SUSPENDED);

      const { count: pendingVerificationProfiles, error: pendingError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', ProfileStatus.PENDING_VERIFICATION);

      const { count: adminProfiles, error: adminError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin', true);

      // Récupérer les profils par département (depuis la table employees)
      const { data: profilesByDepartment, error: deptError } = await supabase
        .from('employees')
        .select('department')
        .not('department', 'is', null)
        .eq('is_active', true);

      // Récupérer les profils par position (depuis la table employees)
      const { data: profilesByPosition, error: posError } = await supabase
        .from('employees')
        .select('position')
        .not('position', 'is', null)
        .eq('is_active', true);

      // Récupérer les profils par lieu (utiliser une valeur par défaut car location n'existe pas)
      // Note: La table employees n'a pas de colonne location, nous utilisons une valeur statique
      const activeCount = typeof activeProfiles === 'number' ? activeProfiles : 0;
      const profilesByLocation = [{ location: 'Main Office', count: activeCount }];
      const locError = null;

      // Récupérer les inscriptions récentes
      let recentQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (criteria) {
        if (criteria.fullName) recentQuery = recentQuery.ilike('full_name', `%${criteria.fullName}%`);
        if (criteria.status) recentQuery = recentQuery.eq('status', criteria.status);
        if (criteria.isAdmin !== undefined) recentQuery = recentQuery.eq('is_admin', criteria.isAdmin);
      }

      const { data: recentRegistrations, error: recentError } = await recentQuery;

      if (totalError || activeError || inactiveError || suspendedError || pendingError || adminError || deptError || posError || recentError) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to get profile statistics', totalError || activeError || inactiveError || suspendedError || pendingError || adminError || deptError || posError || recentError, { criteria }), 
          'SupabaseUserProfileAdapter.getProfileStatistics failed'
        );
        throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to get profile statistics');
      }

      // Mapper les données
      const profilesByDepartmentMap: Record<string, number> = {};
      if (profilesByDepartment) {
        profilesByDepartment.forEach(item => {
          const dept = item.department;
          if (dept) {
            profilesByDepartmentMap[dept] = (profilesByDepartmentMap[dept] || 0) + 1;
          }
        });
      }

      const profilesByPositionMap: Record<string, number> = {};
      if (profilesByPosition) {
        profilesByPosition.forEach(item => {
          const pos = item.position;
          if (pos) {
            profilesByPositionMap[pos] = (profilesByPositionMap[pos] || 0) + 1;
          }
        });
      }

      const profilesByLocationMap: Record<string, number> = {};
      // Location mapping disabled - location column doesn't exist in profiles table
      // Providing empty object as fallback

      return {
        totalProfiles: totalProfiles || 0,
        activeProfiles: activeProfiles || 0,
        inactiveProfiles: inactiveProfiles || 0,
        suspendedProfiles: suspendedProfiles || 0,
        pendingVerification: pendingVerificationProfiles || 0,
        adminProfiles: adminProfiles || 0,
        profilesByDepartment: profilesByDepartmentMap,
        profilesByPosition: profilesByPositionMap,
        profilesByLocation: profilesByLocationMap,
        recentRegistrations: recentRegistrations?.map(row => this.mapRowToEntity(row))
      };
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error getting profile statistics', error, { criteria }), 
        'SupabaseUserProfileAdapter.getProfileStatistics unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error getting profile statistics');
    }
  }

  async getAdminProfiles(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', true)
        .eq('status', ProfileStatus.ACTIVE)
        .order('created_at', { ascending: false });

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch admin profiles', error), 
          'SupabaseUserProfileAdapter.getAdminProfiles failed'
        );
        throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch admin profiles');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching admin profiles', error), 
        'SupabaseUserProfileAdapter.getAdminProfiles unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching admin profiles');
    }
  }

  async getProfilesByDepartment(department: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('department', department)
        .eq('status', ProfileStatus.ACTIVE)
        .order('full_name', { ascending: true });

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch profiles by department', error, { department }), 
          'SupabaseUserProfileAdapter.getProfilesByDepartment failed'
        );
        throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch profiles by department');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching profiles by department', error, { department }), 
        'SupabaseUserProfileAdapter.getProfilesByDepartment unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching profiles by department');
    }
  }

  async getProfilesByPosition(position: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('position', position)
        .eq('status', ProfileStatus.ACTIVE)
        .order('full_name', { ascending: true });

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch profiles by position', error, { position }), 
          'SupabaseUserProfileAdapter.getProfilesByPosition failed'
        );
        throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch profiles by position');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching profiles by position', error, { position }), 
        'SupabaseUserProfileAdapter.getProfilesByPosition unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching profiles by position');
    }
  }

  async getProfilesByLocation(location: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('location', location)
        .eq('status', ProfileStatus.ACTIVE)
        .order('full_name', { ascending: true });

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch profiles by location', error, { location }), 
          'SupabaseUserProfileAdapter.getProfilesByLocation failed'
        );
        throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to fetch profiles by location');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching profiles by location', error, { location }), 
        'SupabaseUserProfileAdapter.getProfilesByLocation unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error fetching profiles by location');
    }
  }

  async validateProfileData(profileData: UpdateProfileData): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation du nom complet
    if (!profileData.fullName || profileData.fullName.trim() === '') {
      errors.push('Full name is required');
    }

    // Validation du téléphone
    if (profileData.phone && !this.isValidPhoneNumber(profileData.phone)) {
      warnings.push('Invalid phone number format');
    }

    // Validation du numéro d'identité nationale
    if (profileData.nationalId && !this.isValidNationalId(profileData.nationalId)) {
      warnings.push('Invalid national ID format');
    }

    // Validation de l'URL de l'avatar
    if (profileData.avatarUrl && !this.isValidUrl(profileData.avatarUrl)) {
      warnings.push('Invalid avatar URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async exportProfiles(criteria?: ProfileSearchCriteria): Promise<string> {
    try {
      const profiles = await this.searchProfiles(criteria || {});
      
      const headers = [
        'id', 'user_id', 'full_name', 'phone', 'national_id', 'avatar_url', 
        'is_admin', 'status', 'created_at', 'updated_at'
      ];
      const csvContent = [
        headers.join(','),
        ...profiles.map(profile => [
          profile.id,
          profile.userId,
          profile.fullName,
          profile.phone || '',
          profile.nationalId || '',
          profile.avatarUrl || '',
          profile.isAdmin,
          profile.status,
          profile.createdAt.toISOString(),
          profile.updatedAt.toISOString()
        ]).join(',')
      ].join('\n');

      return csvContent;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_EXPORT_ERROR, 'Failed to export profiles', error, { criteria }), 
        'SupabaseUserProfileAdapter.exportProfiles failed'
      );
      throw new AppError(ErrorCode.PROFILE_EXPORT_ERROR, 'Failed to export profiles');
    }
  }

  async importProfiles(csvData: string): Promise<{
    imported: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;

    try {
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        try {
          const profile = UserProfile.create(
            this.generateId(),
            rowData.user_id,
            rowData.full_name,
            rowData.phone || undefined,
            rowData.national_id || undefined
          );
          
          // Mettre à jour les propriétés additionnelles si présentes
          if (rowData.avatar_url) profile.updateAvatarUrl(rowData.avatar_url);
          if (rowData.is_admin === 'true') profile.grantAdminPrivileges();
          if (rowData.department) profile.updateDepartment(rowData.department);
          if (rowData.position) profile.updatePosition(rowData.position);
          if (rowData.location) profile.updateLocation(rowData.location);
          if (rowData.last_login) profile.setLastLoginAt(new Date(rowData.last_login));
          
          await this.saveProfile(profile);
          imported++;
        } catch (error) {
          errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      return { imported, errors };
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_IMPORT_ERROR, 'Failed to import profiles', error), 
        'SupabaseUserProfileAdapter.importProfiles failed'
      );
      return { imported: 0, errors: [{ row: 0, error: 'Failed to parse CSV data' }] };
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          user_id: profile.userId,
          full_name: profile.fullName,
          phone: profile.phone,
          national_id: profile.nationalId,
          avatar_url: profile.avatarUrl,
          is_admin: profile.isAdmin,
          department: profile.department,
          position: profile.position,
          location: profile.location,
          last_login: profile.lastLoginAt ? profile.lastLoginAt.toISOString() : null,
          status: profile.status,
          created_at: profile.createdAt.toISOString(),
          updated_at: profile.updatedAt.toISOString()
        });

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to save profile', error, { profile }), 
          'SupabaseUserProfileAdapter.saveProfile failed'
        );
        throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to save profile');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error saving profile', error, { profile }), 
        'SupabaseUserProfileAdapter.saveProfile unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error saving profile');
    }
  }

  async syncWithAuthData(
    userId: string, 
    authData: {
      email?: string;
      lastLoginAt?: Date;
      metadata?: Record<string, unknown>;
    }
  ): Promise<UserProfile> {
    try {
      // Récupérer le profil existant
      const existingProfile = await this.getProfileByUserId(userId);
      
      if (existingProfile) {
        // Mettre à jour avec les données d'authentification
        const updateData: UpdateProfileData = {};
        
        if (authData.email && authData.email !== existingProfile.email) {
          // Note: Le champ email n'existe pas dans la table profiles
          // On pourrait ajouter ce champ si nécessaire
          updateData.fullName = existingProfile.fullName; // Garder le nom existant
        }
        
        if (authData.lastLoginAt) {
          updateData.lastLogin = authData.lastLoginAt;
        }

        if (Object.keys(updateData).length > 0) {
          return await this.updateProfile(existingProfile.id, updateData);
        }

        return existingProfile;
      } else {
        // Créer un nouveau profil avec les données d'authentification
        return await this.createProfile({
          userId,
          fullName: (authData.metadata?.full_name as string) || 'Unknown User',
          phone: (authData.metadata?.phone as string) || undefined,
          nationalId: (authData.metadata?.national_id as string) || undefined,
          avatarUrl: undefined,
          isAdmin: false,
          status: ProfileStatus.PENDING_VERIFICATION,
          lastLoginAt: authData.lastLoginAt,
          department: undefined,
          position: undefined,
          location: undefined
        });
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_SYNC_ERROR, 'Failed to sync profile with auth data', error, { userId, authData }), 
        'SupabaseUserProfileAdapter.syncWithAuthData failed'
      );
      throw new AppError(ErrorCode.PROFILE_SYNC_ERROR, 'Failed to sync profile with auth data');
    }
  }

  async cleanupInactiveProfiles(since: Date): Promise<number> {
    try {
      // TEMPORARY WORKAROUND: Use existing columns until database migration is applied
      // Once migration is applied, uncomment the code below and remove this workaround
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          // Use role field to indicate inactive status temporarily
          role: 'inactive' as any
        })
        .lt('updated_at', since.toISOString())
        .neq('role', 'inactive');

      /*
      // PROPER CODE (uncomment after running migration):
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: ProfileStatus.INACTIVE 
        })
        .lt('last_login_at', since.toISOString())
        .eq('status', ProfileStatus.ACTIVE);
      */

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Failed to cleanup inactive profiles', error, { since }), 
          'SupabaseUserProfileAdapter.cleanupInactiveProfiles failed'
        );
        return 0;
      }

      return 0; // Supabase ne retourne pas le nombre de lignes affectées dans ce cas
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_UPDATE_ERROR, 'Unexpected error cleaning up inactive profiles', error, { since }), 
        'SupabaseUserProfileAdapter.cleanupInactiveProfiles unexpected error'
      );
      return 0;
    }
  }

  async searchProfilesByText(query: string, limit?: number): Promise<UserProfile[]> {
    try {
      let searchQuery = supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%`)
        .or(`phone.ilike.%${query}%`)
        .or(`national_id.ilike.%${query}%`)
        .or(`department.ilike.%${query}%`)
        .or(`position.ilike.%${query}%`)
        .or(`location.ilike.%${query}%`)
        .eq('status', ProfileStatus.ACTIVE)
        .order('full_name', { ascending: true });

      if (limit) {
        searchQuery = searchQuery.limit(limit);
      }

      const { data, error } = await searchQuery;

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to search profiles by text', error, { query, limit }), 
          'SupabaseUserProfileAdapter.searchProfilesByText failed'
        );
        throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Failed to search profiles by text');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error searching profiles by text', error, { query, limit }), 
        'SupabaseUserProfileAdapter.searchProfilesByText unexpected error'
      );
      throw new AppError(ErrorCode.PROFILE_FETCH_ERROR, 'Unexpected error searching profiles by text');
    }
  }

  async isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('email', email);

      if (excludeId) {
        query = query.not('id', 'eq', excludeId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.VALIDATION_ERROR, 'Failed to check if email is taken', error, { email, excludeId }), 
          'SupabaseUserProfileAdapter.isEmailTaken failed'
        );
        return false;
      }

      return data.length > 0;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.VALIDATION_ERROR, 'Unexpected error checking if email is taken', error, { email, excludeId }), 
        'SupabaseUserProfileAdapter.isEmailTaken unexpected error'
      );
      return false;
    }
  }

  async isPhoneTaken(phone: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone);

      if (excludeId) {
        query = query.not('id', 'eq', excludeId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.VALIDATION_ERROR, 'Failed to check if phone is taken', error, { phone, excludeId }), 
          'SupabaseUserProfileAdapter.isPhoneTaken failed'
        );
        return false;
      }

      return data.length > 0;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.VALIDATION_ERROR, 'Unexpected error checking if phone is taken', error, { phone, excludeId }), 
        'SupabaseUserProfileAdapter.isPhoneTaken unexpected error'
      );
      return false;
    }
  }

  async isNationalIdTaken(nationalId: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('national_id', nationalId);

      if (excludeId) {
        query = query.not('id', 'eq', excludeId);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.VALIDATION_ERROR, 'Failed to check if national ID is taken', error, { nationalId, excludeId }), 
          'SupabaseUserProfileAdapter.isNationalIdTaken failed'
        );
        return false;
      }

      return data.length > 0;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.VALIDATION_ERROR, 'Unexpected error checking if national ID is taken', error, { nationalId, excludeId }), 
        'SupabaseUserProfileAdapter.isNationalIdTaken unexpected error'
      );
      return false;
    }
  }

  // Méthodes de validation privées
  private isValidPhoneNumber(phone: string): boolean {
    // Validation de base pour les numéros de téléphone
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  }

  private isValidNationalId(nationalId: string): boolean {
    // Validation de base pour les numéros d'identité nationale
    return nationalId.length >= 6;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Méthode privée pour mapper les données de la base vers l'entité
  private mapRowToEntity(row: any): UserProfile {
    return new UserProfile(
      row.id,
      row.user_id,
      row.full_name,
      row.phone,
      row.national_id,
      row.avatar_url,
      row.is_admin,
      row.status || ProfileStatus.ACTIVE,
      new Date(row.created_at),
      new Date(row.updated_at),
      row.last_login ? new Date(row.last_login) : undefined,
      row.department,
      row.position,
      row.location
    );
  }
}
