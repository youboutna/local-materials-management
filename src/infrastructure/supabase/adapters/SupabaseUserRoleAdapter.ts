/**
 * SupabaseUserRoleAdapter
 * Adapter pour la table user_roles
 * Architecture hexagonale pure - implémentation technique uniquement
 */

import { UserRoleEntity, SomelecRole, UserRoleStatus } from '@/domain/entities/User';
import { IUserRoleRepository, AssignRoleOptions, RoleSearchCriteria, RoleStatistics } from '@/domain/repositories/IUserRoleRepository';
import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorLogger, ErrorCode } from '@/utils/errorHandling';
import { PostgrestError } from '@supabase/supabase-js';

export class SupabaseUserRoleAdapter implements IUserRoleRepository {
  
  async assignRole(
    userId: string,
    roleName: SomelecRole,
    options?: AssignRoleOptions
  ): Promise<UserRoleEntity> {
    try {
      const now = new Date();
      
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_name: roleName,
          assigned_at: now.toISOString(),
          assigned_by: options?.assignedBy || null
        })
        .select()
        .single();

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.ROLE_ASSIGNMENT_ERROR, 'Failed to assign role', error, { 
            userId, 
            roleName 
          }), 
          'SupabaseUserRoleAdapter.assignRole failed'
        );
        throw new AppError(ErrorCode.ROLE_ASSIGNMENT_ERROR, 'Failed to assign role');
      }

      return this.mapRowToEntity(data);
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.ROLE_ASSIGNMENT_ERROR, 'Unexpected error in role assignment', error, { 
          userId, 
          roleName 
        }), 
        'SupabaseUserRoleAdapter.assignRole unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_ASSIGNMENT_ERROR, 'Unexpected error assigning role');
    }
  }

  async revokeRole(userId: string, roleName: string, revokedBy?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({
          assigned_at: null, // Clear assignment to indicate revocation
          assigned_by: revokedBy || null
        })
        .eq('user_id', userId)
        .eq('role_name', roleName);

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Database query failed'), 'SupabaseUserRoleAdapter.revokeRole failed');
        throw new AppError(ErrorCode.ROLE_REVOCATION_ERROR, 'Failed to revoke role');
      }
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.revokeRole unexpected error');
      throw new AppError(ErrorCode.ROLE_REVOCATION_ERROR, 'Unexpected error revoking role');
    }
  }

  async getUserRoles(userId: string): Promise<UserRoleEntity[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to fetch user roles'), 'SupabaseUserRoleAdapter.getUserRoles failed');
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to fetch user roles');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.getUserRoles unexpected error');
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error fetching user roles');
    }
  }

  async getActiveUserRoles(userId: string): Promise<UserRoleEntity[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .not('assigned_at', 'is', null)
        .order('assigned_at', { ascending: false });

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to fetch active user roles'), 'SupabaseUserRoleAdapter.getActiveUserRoles failed');
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to fetch active user roles');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.getActiveUserRoles unexpected error');
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error fetching active user roles');
    }
  }

  async hasRole(userId: string, roleName: SomelecRole): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_name', roleName)
        .not('assigned_at', 'is', null)
        .limit(1);

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to check user role'), 'SupabaseUserRoleAdapter.hasRole failed');
        return false;
      }

      return data.length > 0;
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.hasRole unexpected error');
      return false;
    }
  }

  async hasAnyRole(userId: string, roleNames: SomelecRole[]): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .in('role_name', roleNames)
        .not('assigned_at', 'is', null)
        .limit(1);

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Database query failed'), 'SupabaseUserRoleAdapter.hasAnyRole failed');
        return false;
      }

      return data.length > 0;
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.hasAnyRole unexpected error');
      return false;
    }
  }

  async getUsersByRole(roleName: SomelecRole, includeInactive = false): Promise<UserRoleEntity[]> {
    try {
      let query = supabase
        .from('user_roles')
        .select('*')
        .eq('role_name', roleName)
        .order('assigned_at', { ascending: false });

      if (!includeInactive) {
        query = query
          .not('assigned_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to fetch users by role'), 'SupabaseUserRoleAdapter.getUsersByRole failed');
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to fetch users by role');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.getUsersByRole unexpected error');
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error fetching users by role');
    }
  }

  async searchRoles(criteria: RoleSearchCriteria): Promise<UserRoleEntity[]> {
    try {
      let query = supabase
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false });

      // Appliquer les filtres
      if (criteria.userId) {
        query = query.eq('user_id', criteria.userId);
      }
      if (criteria.roleName) {
        query = query.eq('role_name', criteria.roleName);
      }
      if (criteria.status) {
        // Since status column doesn't exist, we interpret status as active/inactive based on assigned_at
        if (criteria.status === UserRoleStatus.ACTIVE) {
          query = query.not('assigned_at', 'is', null);
        } else if (criteria.status === UserRoleStatus.REVOKED) {
          query = query.is('assigned_at', null);
        }
      }
      if (criteria.assignedBy) {
        query = query.eq('assigned_by', criteria.assignedBy);
      }
      if (criteria.assignedAfter) {
        query = query.gte('assigned_at', criteria.assignedAfter.toISOString());
      }
      if (criteria.assignedBefore) {
        query = query.lte('assigned_at', criteria.assignedBefore.toISOString());
      }
      if (criteria.expiresAfter) {
        // Since expires_at doesn't exist, use assigned_at as expiry approximation
        query = query.gte('assigned_at', criteria.expiresAfter.toISOString());
      }
      if (criteria.expiresBefore) {
        // Since expires_at doesn't exist, use assigned_at as expiry approximation
        query = query.lte('assigned_at', criteria.expiresBefore.toISOString());
      }

      // Pagination
      if (criteria.limit && criteria.offset) {
        query = query.range(criteria.offset, criteria.offset + criteria.limit - 1);
      } else if (criteria.limit) {
        query = query.limit(criteria.limit);
      } else if (criteria.offset) {
        query = query.range(criteria.offset, 999999); // Large number to get all from offset
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to search roles'), 'SupabaseUserRoleAdapter.searchRoles failed');
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to search roles');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.searchRoles unexpected error');
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error searching roles');
    }
  }

  async countRoles(criteria: Omit<RoleSearchCriteria, 'limit' | 'offset'>): Promise<number> {
    try {
      let query = supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true });

      // Appliquer les filtres
      if (criteria.userId) {
        query = query.eq('user_id', criteria.userId);
      }
      if (criteria.roleName) {
        query = query.eq('role_name', criteria.roleName);
      }
      if (criteria.status) {
        // Since status column doesn't exist, we interpret status as active/inactive based on assigned_at
        if (criteria.status === UserRoleStatus.ACTIVE) {
          query = query.not('assigned_at', 'is', null);
        } else if (criteria.status === UserRoleStatus.REVOKED) {
          query = query.is('assigned_at', null);
        }
      }
      if (criteria.assignedBy) {
        query = query.eq('assigned_by', criteria.assignedBy);
      }
      if (criteria.assignedAfter) {
        query = query.gte('assigned_at', criteria.assignedAfter.toISOString());
      }
      if (criteria.assignedBefore) {
        query = query.lte('assigned_at', criteria.assignedBefore.toISOString());
      }
      if (criteria.expiresAfter) {
        // Since expires_at doesn't exist, use assigned_at as expiry approximation
        query = query.gte('assigned_at', criteria.expiresAfter.toISOString());
      }
      if (criteria.expiresBefore) {
        // Since expires_at doesn't exist, use assigned_at as expiry approximation
        query = query.lte('assigned_at', criteria.expiresBefore.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to count roles'), 'SupabaseUserRoleAdapter.countRoles failed');
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.countRoles unexpected error');
      return 0;
    }
  }

  async updateRoleStatus(roleId: string, status: UserRoleStatus): Promise<void> {
    try {
      // Since status column doesn't exist, we use assigned_at to represent status
      // ACTIVE = assigned_at is not null, REVOKED = assigned_at is null
      const updateData = status === UserRoleStatus.ACTIVE 
        ? { assigned_at: new Date().toISOString() }
        : { assigned_at: null };
        
      const { error } = await supabase
        .from('user_roles')
        .update(updateData)
        .eq('id', roleId);

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to update role status'), 'SupabaseUserRoleAdapter.updateRoleStatus failed');
        throw new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Failed to update role status');
      }
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.updateRoleStatus unexpected error');
      throw new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Unexpected error updating role status');
    }
  }

  async extendRoleExpiry(roleId: string, newExpiryDate: Date): Promise<void> {
    try {
      // Since the table doesn't have expires_at column, we use assigned_at 
      // to store the expiry/extension date as a workaround
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          assigned_at: newExpiryDate.toISOString()
        })
        .eq('id', roleId);

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to extend role expiry'), 'SupabaseUserRoleAdapter.extendRoleExpiry failed');
        throw new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Failed to extend role expiry');
      }
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.extendRoleExpiry unexpected error');
      throw new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Unexpected error extending role expiry');
    }
  }

  async getRoleStatistics(criteria?: Omit<RoleSearchCriteria, 'limit' | 'offset'>): Promise<RoleStatistics> {
    try {
      // Récupérer les statistiques de base
      const { data: totalRoles, error: totalError } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true }) as { data: { count: number } | null, error: PostgrestError | null };

      const { data: activeRoles, error: activeError } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .not('assigned_at', 'is', null) as { data: { count: number } | null, error: PostgrestError | null };

      const { data: expiredRoles, error: expiredError } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .lt('assigned_at', new Date().toISOString()) as { data: { count: number } | null, error: PostgrestError | null };

      const { data: revokedRoles, error: revokedError } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .is('assigned_at', null) as { data: { count: number } | null, error: PostgrestError | null };

      // Récupérer les rôles par type
      const { data: rolesByType, error: typeError } = await supabase
        .from('user_roles')
        .select('role_name')
        .not('assigned_at', 'is', null);

      // Récupérer les assignations récentes
      let recentQuery = supabase
        .from('user_roles')
        .select('*')
        .order('assigned_at', { ascending: false })
        .limit(5);

      if (criteria) {
        if (criteria.userId) recentQuery = recentQuery.eq('user_id', criteria.userId);
        if (criteria.roleName) recentQuery = recentQuery.eq('role_name', criteria.roleName);
        if (criteria.status) recentQuery = recentQuery.eq('status', criteria.status);
      }

      const { data: recentAssignments, error: recentError } = await recentQuery;

      if (totalError || activeError || expiredError || revokedError || typeError || recentError) {
        const combinedError = totalError || activeError || expiredError || revokedError || typeError || recentError;
        ErrorLogger.log(new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to get role statistics', combinedError, { criteria }), 'SupabaseUserRoleAdapter.getRoleStatistics failed');
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to get role statistics');
      }

      // Mapper les données
      const rolesByTypeMap: Record<SomelecRole, number> = {
        [SomelecRole.ADMIN]: 0,
        [SomelecRole.MANAGER]: 0,
        [SomelecRole.DIRECTOR]: 0,
        [SomelecRole.AGENT]: 0,
        [SomelecRole.SUPPLIER]: 0
      };
      if (rolesByType && Array.isArray(rolesByType)) {
        rolesByType.forEach((item: { role_name: string }) => {
          const role = item.role_name as SomelecRole;
          if (role in rolesByTypeMap) {
            rolesByTypeMap[role] += 1; // Increment count for each role found
          }
        });
      }

      // Type for count results from Supabase
      type CountResult = { count: number } | null;

      return {
        totalRoles: (totalRoles as CountResult)?.count || 0,
        activeRoles: (activeRoles as CountResult)?.count || 0,
        expiredRoles: (expiredRoles as CountResult)?.count || 0,
        revokedRoles: (revokedRoles as CountResult)?.count || 0,
        rolesByType: rolesByTypeMap,
        recentAssignments: recentAssignments.map(row => this.mapRowToEntity(row))
      };
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.getRoleStatistics unexpected error');
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error getting role statistics');
    }
  }

  async cleanupExpiredRoles(): Promise<number> {
    try {
      // Note: The user_roles table doesn't have status or expires_at columns in the current schema
      // This function would need to be implemented when the schema is updated
      // For now, we return 0 as no cleanup can be performed
      return 0;
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.cleanupExpiredRoles unexpected error');
      return 0;
    }
  }

  async roleExists(userId: string, roleName: SomelecRole): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_name', roleName)
        .limit(1);

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to check if role exists'), 'SupabaseUserRoleAdapter.roleExists failed');
        return false;
      }

      return data.length > 0;
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.roleExists unexpected error');
      return false;
    }
  }

  async getRoleHistory(userId: string): Promise<UserRoleEntity[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) {
        ErrorLogger.log(new Error(error.message || 'Failed to get role history'), 'SupabaseUserRoleAdapter.getRoleHistory failed');
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to get role history');
      }

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.getRoleHistory unexpected error');
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error getting role history');
    }
  }

  async exportRoles(criteria?: RoleSearchCriteria): Promise<string> {
    try {
      const roles = await this.searchRoles(criteria || {});
      
      const headers = ['id', 'user_id', 'role_name', 'assigned_at', 'assigned_by'];
      const csvContent = [
        headers.join(','),
        ...roles.map(role => [
          role.id,
          role.userId,
          role.roleName,
          role.assignedAt.toISOString(),
          role.assignedBy || ''
        ].join(','))
      ].join('\n');

      return csvContent;
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.exportRoles failed');
      throw new AppError(ErrorCode.ROLE_EXPORT_ERROR, 'Failed to export roles');
    }
  }

  async importRoles(csvData: string): Promise<{
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
        const rowData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        try {
          const options: AssignRoleOptions = {
            assignedBy: rowData.assigned_by || undefined
          };
          
          await this.assignRole(
            rowData.user_id,
            rowData.role_name as SomelecRole,
            options
          );
          imported++;
        } catch (error) {
          errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      return { imported, errors };
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error(String(error)), 'SupabaseUserRoleAdapter.importRoles failed');
      return { imported: 0, errors: [{ row: 0, error: 'Failed to parse CSV data' }] };
    }
  }

  async validateRoleConfiguration(
    userId: string,
    roleName: SomelecRole,
    options?: AssignRoleOptions
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation de base
    if (!userId || userId.trim() === '') {
      errors.push('User ID is required');
    }

    if (!Object.values(SomelecRole).includes(roleName)) {
      errors.push(`Invalid role: ${roleName}`);
    }

    // Validation des options
    if (options?.expiresAt && options.expiresAt <= new Date()) {
      errors.push('Expiry date must be in the future');
    }

    // Vérifier si le rôle existe déjà
    const exists = await this.roleExists(userId, roleName);
    if (exists) {
      warnings.push('Role already assigned to user');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Méthode privée pour mapper les données de la base vers l'entité
  private mapRowToEntity(row: Record<string, any>): UserRoleEntity {
    // Derive status from assigned_at since status column doesn't exist
    const status = row.assigned_at ? UserRoleStatus.ACTIVE : UserRoleStatus.REVOKED;
    
    return UserRoleEntity.create({
      id: row.id,
      userId: row.user_id,
      roleName: row.role_name,
      status,
      assignedAt: new Date(row.assigned_at || new Date()), // Fallback to current date if null
      assignedBy: row.assigned_by,
      revokedAt: undefined, // revoked_at doesn't exist in table
      expiresAt: undefined  // expires_at doesn't exist in table
    });
  }
}
