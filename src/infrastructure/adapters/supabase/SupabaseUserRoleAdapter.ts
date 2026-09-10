/**
 * SupabaseUserRoleAdapter
 * Adapter pour la table public.user_roles
 * Architecture hexagonale pure - implémentation technique uniquement
 *
 * Structure réelle de la table :
 *   - id           : uuid PK
 *   - user_id      : uuid NOT NULL
 *   - role_name    : text NOT NULL
 *   - assigned_by  : uuid NULL
 *   - assigned_at  : timestamptz NULL DEFAULT now()
 *   - status       : text NULL DEFAULT 'active' ('active' | 'pending' | 'inactive')
 *   - expired_at   : timestamptz NULL
 *   - UNIQUE(user_id, role_name)
 *
 * ⚠️ Le CHECK SQL n'accepte que : 'active', 'pending', 'inactive'
 * Le statut métier REVOKED ('inactive' côté domaine) est mappé vers 'inactive'
 */

import {
  UserRoleEntity,
  SomelecRole,
  UserRoleStatus,
} from '@/domain/entities/User';
import {
  IUserRoleRepository,
  AssignRoleOptions,
  RoleSearchCriteria,
  RoleStatistics,
} from '@/domain/repositories/IUserRoleRepository';
import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorLogger, ErrorCode } from '@/utils/errorHandling';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Type des lignes de la table user_roles (source unique de vérité)
 */
interface UserRoleRow {
  id: string;
  user_id: string;
  role_name: string;
  assigned_by: string | null;
  assigned_at: string | null;
  status: string | null;
  expired_at: string | null;
}

/**
 * Valeurs de statut acceptées par le CHECK SQL
 */
type DbStatus = 'active' | 'pending' | 'inactive';

export class SupabaseUserRoleAdapter implements IUserRoleRepository {
  private static readonly TABLE = 'user_roles';

  // ────────────────────────────────────────────────────────────
  // HELPERS DE MAPPING (DB ↔ DOMAINE)
  // ────────────────────────────────────────────────────────────

  /**
   * Mappe un statut domaine vers une valeur acceptée par le CHECK SQL.
   * REVOKED → 'inactive' (seule valeur persistable)
   */
  private toDbStatus(status: UserRoleStatus): DbStatus {
    switch (status) {
      case UserRoleStatus.ACTIVE:
        return 'active';
      case UserRoleStatus.PENDING:
        return 'pending';
      case UserRoleStatus.INACTIVE:
      case UserRoleStatus.REVOKED:
        return 'inactive';
      default:
        return 'active';
    }
  }

  /**
   * Mappe un statut DB vers UserRoleStatus.
   * 'inactive' devient INACTIVE (le REVOKED métier n'est pas persisté tel quel).
   */
  private fromDbStatus(dbStatus: string | null): UserRoleStatus {
    switch (dbStatus) {
      case 'active':
        return UserRoleStatus.ACTIVE;
      case 'pending':
        return UserRoleStatus.PENDING;
      case 'inactive':
        return UserRoleStatus.INACTIVE;
      default:
        return UserRoleStatus.ACTIVE;
    }
  }

  /**
   * Mappe une ligne Supabase vers une entité du domaine
   */
  private mapRowToEntity(row: UserRoleRow): UserRoleEntity {
    return UserRoleEntity.create({
      id: row.id,
      userId: row.user_id,
      roleName: row.role_name as SomelecRole,
      status: this.fromDbStatus(row.status),
      assignedAt: row.assigned_at ? new Date(row.assigned_at) : new Date(),
      assignedBy: row.assigned_by ?? undefined,
      expiresAt: row.expired_at ? new Date(row.expired_at) : undefined,
    });
  }

  // ────────────────────────────────────────────────────────────
  // ASSIGNATION / RÉVOCATION
  // ────────────────────────────────────────────────────────────

  async assignRole(
    userId: string,
    roleName: SomelecRole,
    options?: AssignRoleOptions
  ): Promise<UserRoleEntity> {
    try {
      const now = new Date();

      const { data, error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .insert({
          user_id: userId,
          role_name: roleName,
          assigned_at: now.toISOString(),
          assigned_by: options?.assignedBy ?? null,
          status: 'active' as DbStatus,
          expired_at: options?.expiresAt ? options.expiresAt.toISOString() : null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new AppError(
            ErrorCode.ROLE_ASSIGNMENT_ERROR,
            `Le rôle "${roleName}" est déjà assigné à cet utilisateur`
          );
        }

        ErrorLogger.log(
          new AppError(ErrorCode.ROLE_ASSIGNMENT_ERROR, 'Failed to assign role', error, {
            userId,
            roleName,
          }),
          'SupabaseUserRoleAdapter.assignRole failed'
        );
        throw new AppError(ErrorCode.ROLE_ASSIGNMENT_ERROR, 'Failed to assign role');
      }

      return this.mapRowToEntity(data as UserRoleRow);
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        new AppError(
          ErrorCode.ROLE_ASSIGNMENT_ERROR,
          'Unexpected error in role assignment',
          error,
          { userId, roleName }
        ),
        'SupabaseUserRoleAdapter.assignRole unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_ASSIGNMENT_ERROR, 'Unexpected error assigning role');
    }
  }

  async revokeRole(userId: string, roleName: string, revokedBy?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .update({
          status: 'inactive' as DbStatus, // ✅ valeur littérale alignée sur le CHECK
          expired_at: new Date().toISOString(),
          assigned_by: revokedBy ?? null,
        })
        .eq('user_id', userId)
        .eq('role_name', roleName);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.ROLE_REVOCATION_ERROR, 'Failed to revoke role', error, {
            userId,
            roleName,
          }),
          'SupabaseUserRoleAdapter.revokeRole failed'
        );
        throw new AppError(ErrorCode.ROLE_REVOCATION_ERROR, 'Failed to revoke role');
      }
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.revokeRole unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_REVOCATION_ERROR, 'Unexpected error revoking role');
    }
  }

  // ────────────────────────────────────────────────────────────
  // LECTURE DES RÔLES
  // ────────────────────────────────────────────────────────────

  async getUserRoles(userId: string): Promise<UserRoleEntity[]> {
    try {
      const { data, error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false });

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to fetch user roles', error, { userId }),
          'SupabaseUserRoleAdapter.getUserRoles failed'
        );
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to fetch user roles');
      }

      return (data as UserRoleRow[]).map((row) => this.mapRowToEntity(row));
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.getUserRoles unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error fetching user roles');
    }
  }

  async getActiveUserRoles(userId: string): Promise<UserRoleEntity[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .or(`expired_at.is.null,expired_at.gt.${now}`)
        .order('assigned_at', { ascending: false });

      if (error) {
        ErrorLogger.log(
          new AppError(
            ErrorCode.ROLE_FETCH_ERROR,
            'Failed to fetch active user roles',
            error,
            { userId }
          ),
          'SupabaseUserRoleAdapter.getActiveUserRoles failed'
        );
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to fetch active user roles');
      }

      return (data as UserRoleRow[]).map((row) => this.mapRowToEntity(row));
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.getActiveUserRoles unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error fetching active user roles');
    }
  }

  async hasRole(userId: string, roleName: SomelecRole): Promise<boolean> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .select('id')
        .eq('user_id', userId)
        .eq('role_name', roleName)
        .eq('status', 'active')
        .or(`expired_at.is.null,expired_at.gt.${now}`)
        .limit(1);

      if (error) {
        ErrorLogger.log(
          error instanceof Error ? error : new Error(error.message || 'Failed to check user role'),
          'SupabaseUserRoleAdapter.hasRole failed'
        );
        return false;
      }

      return (data?.length ?? 0) > 0;
    } catch (error) {
      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.hasRole unexpected error'
      );
      return false;
    }
  }

  async hasAnyRole(userId: string, roleNames: SomelecRole[]): Promise<boolean> {
    try {
      if (roleNames.length === 0) return false;

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .select('id')
        .eq('user_id', userId)
        .in('role_name', roleNames)
        .eq('status', 'active')
        .or(`expired_at.is.null,expired_at.gt.${now}`)
        .limit(1);

      if (error) {
        ErrorLogger.log(
          error instanceof Error ? error : new Error(error.message || 'Database query failed'),
          'SupabaseUserRoleAdapter.hasAnyRole failed'
        );
        return false;
      }

      return (data?.length ?? 0) > 0;
    } catch (error) {
      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.hasAnyRole unexpected error'
      );
      return false;
    }
  }

  async getUsersByRole(
    roleName: SomelecRole,
    includeInactive = false
  ): Promise<UserRoleEntity[]> {
    try {
      let query = supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .select('*')
        .eq('role_name', roleName)
        .order('assigned_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to fetch users by role', error, {
            roleName,
          }),
          'SupabaseUserRoleAdapter.getUsersByRole failed'
        );
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to fetch users by role');
      }

      return (data as UserRoleRow[]).map((row) => this.mapRowToEntity(row));
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.getUsersByRole unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error fetching users by role');
    }
  }

  // ────────────────────────────────────────────────────────────
  // RECHERCHE / STATISTIQUES
  // ────────────────────────────────────────────────────────────

  async searchRoles(criteria: RoleSearchCriteria): Promise<UserRoleEntity[]> {
    try {
      let query = supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .select('*')
        .order('assigned_at', { ascending: false });

      query = this.applyCriteria(query, criteria);

      if (criteria.limit !== undefined && criteria.offset !== undefined) {
        query = query.range(criteria.offset, criteria.offset + criteria.limit - 1);
      } else if (criteria.limit !== undefined) {
        query = query.limit(criteria.limit);
      } else if (criteria.offset !== undefined) {
        query = query.range(criteria.offset, criteria.offset + 9999);
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to search roles', error, { criteria }),
          'SupabaseUserRoleAdapter.searchRoles failed'
        );
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to search roles');
      }

      return (data as UserRoleRow[]).map((row) => this.mapRowToEntity(row));
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.searchRoles unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error searching roles');
    }
  }

  async countRoles(criteria: Omit<RoleSearchCriteria, 'limit' | 'offset'>): Promise<number> {
    try {
      let query = supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .select('id', { count: 'exact', head: true });

      query = this.applyCriteria(query, criteria);

      const { count, error } = await query;

      if (error) {
        ErrorLogger.log(
          error instanceof Error ? error : new Error(error.message || 'Failed to count roles'),
          'SupabaseUserRoleAdapter.countRoles failed'
        );
        return 0;
      }

      return count ?? 0;
    } catch (error) {
      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.countRoles unexpected error'
      );
      return 0;
    }
  }

  async getRoleStatistics(
    criteria?: Omit<RoleSearchCriteria, 'limit' | 'offset'>
  ): Promise<RoleStatistics> {
    try {
      const now = new Date().toISOString();

      const [totalRes, activeRes, expiredRes, revokedRes, rolesByTypeRes, recentRes] =
        await Promise.all([
          this.buildCountQuery(criteria),
          this.buildCountQuery({ ...criteria, status: UserRoleStatus.ACTIVE }),
          supabase
            .from(SupabaseUserRoleAdapter.TABLE)
            .select('id', { count: 'exact', head: true })
            .lt('expired_at', now),
          this.buildCountQuery({ ...criteria, status: UserRoleStatus.INACTIVE }),
          supabase
            .from(SupabaseUserRoleAdapter.TABLE)
            .select('role_name')
            .eq('status', 'active'),
          supabase
            .from(SupabaseUserRoleAdapter.TABLE)
            .select('*')
            .order('assigned_at', { ascending: false })
            .limit(5),
        ]);

      const combinedError =
        totalRes.error ||
        activeRes.error ||
        expiredRes.error ||
        revokedRes.error ||
        rolesByTypeRes.error ||
        recentRes.error;

      if (combinedError) {
        ErrorLogger.log(
          new AppError(
            ErrorCode.ROLE_FETCH_ERROR,
            'Failed to get role statistics',
            combinedError,
            { criteria }
          ),
          'SupabaseUserRoleAdapter.getRoleStatistics failed'
        );
        throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Failed to get role statistics');
      }

      const rolesByTypeMap: Record<string, number> = {
        admin: 0,
        manager: 0,
        director: 0,
        agent: 0,
        supplier: 0,
      };

      (rolesByTypeRes.data as Array<{ role_name: string }> | null)?.forEach((item) => {
        const role = item.role_name;
        if (role in rolesByTypeMap) {
          rolesByTypeMap[role] += 1;
        }
      });

      return {
        totalRoles: totalRes.count ?? 0,
        activeRoles: activeRes.count ?? 0,
        expiredRoles: expiredRes.count ?? 0,
        revokedRoles: revokedRes.count ?? 0,
        rolesByType: rolesByTypeMap,
        recentAssignments: (recentRes.data as UserRoleRow[]).map((row) =>
          this.mapRowToEntity(row)
        ),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.getRoleStatistics unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_FETCH_ERROR, 'Unexpected error getting role statistics');
    }
  }

  // ────────────────────────────────────────────────────────────
  // MISE À JOUR / MAINTENANCE
  // ────────────────────────────────────────────────────────────

  async updateRoleStatus(roleId: string, status: UserRoleStatus): Promise<void> {
    try {
      const dbStatus = this.toDbStatus(status);

      const { error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .update({ status: dbStatus })
        .eq('id', roleId);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Failed to update role status', error, {
            roleId,
            status,
          }),
          'SupabaseUserRoleAdapter.updateRoleStatus failed'
        );
        throw new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Failed to update role status');
      }
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.updateRoleStatus unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Unexpected error updating role status');
    }
  }

  async extendRoleExpiry(roleId: string, newExpiryDate: Date): Promise<void> {
    try {
      const { error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .update({ expired_at: newExpiryDate.toISOString() })
        .eq('id', roleId);

      if (error) {
        ErrorLogger.log(
          new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Failed to extend role expiry', error, {
            roleId,
            newExpiryDate,
          }),
          'SupabaseUserRoleAdapter.extendRoleExpiry failed'
        );
        throw new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Failed to extend role expiry');
      }
    } catch (error) {
      if (error instanceof AppError) throw error;

      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.extendRoleExpiry unexpected error'
      );
      throw new AppError(ErrorCode.ROLE_UPDATE_ERROR, 'Unexpected error extending role expiry');
    }
  }

  async cleanupExpiredRoles(): Promise<number> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .update({ status: 'inactive' as DbStatus })
        .lt('expired_at', now)
        .eq('status', 'active')
        .select('id');

      if (error) {
        ErrorLogger.log(
          error instanceof Error ? error : new Error(error.message || 'Failed to cleanup roles'),
          'SupabaseUserRoleAdapter.cleanupExpiredRoles failed'
        );
        return 0;
      }

      return data?.length ?? 0;
    } catch (error) {
      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.cleanupExpiredRoles unexpected error'
      );
      return 0;
    }
  }

  // ────────────────────────────────────────────────────────────
  // UTILITAIRES
  // ────────────────────────────────────────────────────────────

  async roleExists(userId: string, roleName: SomelecRole): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(SupabaseUserRoleAdapter.TABLE)
        .select('id')
        .eq('user_id', userId)
        .eq('role_name', roleName)
        .limit(1);

      if (error) {
        ErrorLogger.log(
          error instanceof Error ? error : new Error(error.message || 'Failed to check role'),
          'SupabaseUserRoleAdapter.roleExists failed'
        );
        return false;
      }

      return (data?.length ?? 0) > 0;
    } catch (error) {
      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.roleExists unexpected error'
      );
      return false;
    }
  }

  async getRoleHistory(userId: string): Promise<UserRoleEntity[]> {
    // L'historique est implicite (UNIQUE user_id, role_name)
    return this.getUserRoles(userId);
  }

  async exportRoles(criteria?: RoleSearchCriteria): Promise<string> {
    try {
      const roles = await this.searchRoles(criteria ?? {});

      const headers = [
        'id',
        'user_id',
        'role_name',
        'status',
        'assigned_at',
        'assigned_by',
        'expired_at',
      ];
      const csvContent = [
        headers.join(','),
        ...roles.map((role) =>
          [
            role.id,
            role.userId,
            role.roleName,
            role.status,
            role.assignedAt.toISOString(),
            role.assignedBy ?? '',
            role.expiresAt ? role.expiresAt.toISOString() : '',
          ].join(',')
        ),
      ].join('\n');

      return csvContent;
    } catch (error) {
      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.exportRoles failed'
      );
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
      const lines = csvData.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        return { imported: 0, errors: [{ row: 0, error: 'CSV empty or missing headers' }] };
      }

      const headers = lines[0].split(',').map((h) => h.trim());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index] ?? '';
        });

        try {
          const options: AssignRoleOptions = {
            assignedBy: rowData.assigned_by || undefined,
            expiresAt: rowData.expired_at ? new Date(rowData.expired_at) : undefined,
          };

          await this.assignRole(rowData.user_id, rowData.role_name as SomelecRole, options);
          imported++;
        } catch (error) {
          errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return { imported, errors };
    } catch (error) {
      ErrorLogger.log(
        error instanceof Error ? error : new Error(String(error)),
        'SupabaseUserRoleAdapter.importRoles failed'
      );
      return { imported: 0, errors: [{ row: 0, error: 'Failed to parse CSV data' }] };
    }
  }

  async validateRoleConfiguration(
    userId: string,
    roleName: SomelecRole,
    options?: AssignRoleOptions
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!userId || userId.trim() === '') {
      errors.push('User ID is required');
    }

    const validRoles = ['admin', 'manager', 'director', 'agent', 'supplier'];
    if (!validRoles.includes(String(roleName).toLowerCase())) {
      errors.push(`Invalid role: ${roleName}`);
    }

    if (options?.expiresAt && options.expiresAt <= new Date()) {
      errors.push('Expiry date must be in the future');
    }

    const exists = await this.roleExists(userId, roleName);
    if (exists) {
      warnings.push('Role already assigned to user');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  // ────────────────────────────────────────────────────────────
  // MÉTHODES PRIVÉES
  // ────────────────────────────────────────────────────────────

  /**
   * Applique les critères de recherche à une requête Supabase
   */
  private applyCriteria<T extends ReturnType<typeof supabase.from>>(
    query: T,
    criteria: Omit<RoleSearchCriteria, 'limit' | 'offset'>
  ): T {
    let q = query;

    if (criteria.userId) q = q.eq('user_id', criteria.userId) as T;
    if (criteria.roleName) q = q.eq('role_name', criteria.roleName) as T;
    if (criteria.status) q = q.eq('status', this.toDbStatus(criteria.status)) as T;
    if (criteria.assignedBy) q = q.eq('assigned_by', criteria.assignedBy) as T;
    if (criteria.assignedAfter) q = q.gte('assigned_at', criteria.assignedAfter.toISOString()) as T;
    if (criteria.assignedBefore) q = q.lte('assigned_at', criteria.assignedBefore.toISOString()) as T;
    if (criteria.expiresAfter) q = q.gte('expired_at', criteria.expiresAfter.toISOString()) as T;
    if (criteria.expiresBefore) q = q.lte('expired_at', criteria.expiresBefore.toISOString()) as T;

    return q;
  }

  /**
   * Construit une requête COUNT avec critères
   */
  private async buildCountQuery(
    criteria?: Omit<RoleSearchCriteria, 'limit' | 'offset'>
  ): Promise<{ count: number | null; error: PostgrestError | null }> {
    let query = supabase
      .from(SupabaseUserRoleAdapter.TABLE)
      .select('id', { count: 'exact', head: true });

    if (criteria) {
      query = this.applyCriteria(query, criteria);
    }

    const { count, error } = await query;
    return { count, error };
  }
}