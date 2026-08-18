/**
 * Supabase User Repository Adapter
 * Implements IUserRepository (CRUD + search on public.profiles / public.user_roles)
 * Distinct from SupabaseUserAdapter which implements IAuthRepository.
 */

import { User, UserRoleEntity, UserRoleStatus } from '@/domain/entities/User';
import {
  IUserRepository,
  SearchUsersOptions,
  SearchUsersResult,
} from '@/domain/repositories/IUserRepository';
import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  national_id: string | null;
  avatar_url: string | null;
  status: string | null;
  role: string | null;
  provider_data: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

type RoleRow = {
  id: string;
  user_id: string;
  role_name: string;
  status: string | null;
  assigned_at: string | null;
  assigned_by: string | null;
  expires_at: string | null;
};

const PROFILE_COLUMNS =
  'id, full_name, phone, national_id, avatar_url, status, role, provider_data, created_at, updated_at';

export class SupabaseUserRepositoryAdapter implements IUserRepository {
  // ---------- mapping ----------
  private resolveEmail(row: ProfileRow): string {
    const fromProvider =
      row.provider_data && typeof row.provider_data === 'object'
        ? (row.provider_data as { email?: unknown }).email
        : undefined;
    if (typeof fromProvider === 'string' && fromProvider.includes('@')) return fromProvider;
    // The public profiles table does not expose auth emails; keep a stable
    // non-routable placeholder so the domain entity stays valid.
    return `${row.id}@users.local`;
  }

  private mapRoles(rows: RoleRow[]): UserRoleEntity[] {
    return rows.map((r) =>
      UserRoleEntity.create({
        id: r.id,
        userId: r.user_id,
        roleName: r.role_name,
        status: (r.status as UserRoleStatus) || UserRoleStatus.ACTIVE,
        assignedAt: r.assigned_at ? new Date(r.assigned_at) : undefined,
        assignedBy: r.assigned_by || undefined,
        expiresAt: r.expires_at ? new Date(r.expires_at) : undefined,
      })
    );
  }

  private toDomain(row: ProfileRow, roles: RoleRow[] = []): User {
    let roleEntities = this.mapRoles(roles);
    // Fallback on the legacy profiles.role column when no user_roles row exists.
    if (roleEntities.length === 0 && row.role) {
      roleEntities = [
        UserRoleEntity.create({
          id: `${row.id}-legacy`,
          userId: row.id,
          roleName: row.role,
          status: UserRoleStatus.ACTIVE,
        }),
      ];
    }

    return new User(
      row.id,
      this.resolveEmail(row),
      row.full_name || 'Utilisateur',
      row.phone || undefined,
      row.national_id || undefined,
      row.avatar_url || undefined,
      (row.status ?? 'active') !== 'inactive',
      row.created_at ? new Date(row.created_at) : new Date(),
      row.updated_at ? new Date(row.updated_at) : new Date(),
      undefined,
      roleEntities
    );
  }

  private async loadRoles(userIds: string[]): Promise<Map<string, RoleRow[]>> {
    const map = new Map<string, RoleRow[]>();
    if (userIds.length === 0) return map;
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, user_id, role_name, status, assigned_at, assigned_by, expires_at')
      .in('user_id', userIds);
    if (error) return map;
    (data as RoleRow[] | null)?.forEach((r) => {
      const list = map.get(r.user_id) ?? [];
      list.push(r);
      map.set(r.user_id, list);
    });
    return map;
  }

  private fail(message: string, error: unknown): never {
    ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, message, error));
    throw new AppError(ErrorCode.INTERNAL_ERROR, message);
  }

  // ---------- reads ----------
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) this.fail('Failed to load user profile', error);
    if (!data) return null;
    const roles = await this.loadRoles([id]);
    return this.toDomain(data as unknown as ProfileRow, roles.get(id) ?? []);
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) this.fail('Failed to load users', error);
    const rows = (data as unknown as ProfileRow[]) ?? [];
    const roles = await this.loadRoles(rows.map((r) => r.id));
    return rows.map((r) => this.toDomain(r, roles.get(r.id) ?? []));
  }

  async searchUsers(options: SearchUsersOptions): Promise<SearchUsersResult> {
    let query = supabase.from('profiles').select(PROFILE_COLUMNS, { count: 'exact' });

    if (options.searchTerm && options.searchTerm.trim().length > 0) {
      const term = `%${options.searchTerm.trim()}%`;
      query = query.or(`full_name.ilike.${term},national_id.ilike.${term},phone.ilike.${term}`);
    }
    if (options.isActive !== undefined) {
      query = options.isActive
        ? query.neq('status', 'inactive')
        : query.eq('status', 'inactive');
    }
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) this.fail('Failed to search users', error);

    const rows = (data as unknown as ProfileRow[]) ?? [];
    const roles = await this.loadRoles(rows.map((r) => r.id));
    let users = rows.map((r) => this.toDomain(r, roles.get(r.id) ?? []));

    if (options.roleFilter && options.roleFilter.length > 0) {
      users = users.filter((u) => u.hasAnyRole(options.roleFilter as string[]));
    }

    return { users, total: count ?? users.length };
  }

  async findByRole(role: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_name', role);
    if (error) this.fail('Failed to load users by role', error);
    const ids = Array.from(new Set(((data as { user_id: string }[] | null) ?? []).map((r) => r.user_id)));
    if (ids.length === 0) return [];

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .in('id', ids);
    if (profileError) this.fail('Failed to load users by role', profileError);

    const rows = (profiles as unknown as ProfileRow[]) ?? [];
    const roles = await this.loadRoles(rows.map((r) => r.id));
    return rows.map((r) => this.toDomain(r, roles.get(r.id) ?? []));
  }

  async findActive(): Promise<User[]> {
    const all = await this.findAll();
    return all.filter((u) => u.isActive);
  }

  // ---------- writes ----------
  async create(userData: Omit<User, 'id'>): Promise<User> {
    const source = userData as unknown as Record<string, unknown>;
    const id = (source.id as string) || crypto.randomUUID();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id,
        full_name: (source.fullName as string) || null,
        phone: (source.phone as string) || null,
        national_id: (source.nationalId as string) || null,
        avatar_url: (source.avatarUrl as string) || null,
        status: 'active',
      })
      .select(PROFILE_COLUMNS)
      .single();
    if (error) this.fail('Failed to create user profile', error);
    return this.toDomain(data as unknown as ProfileRow);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const source = userData as unknown as Record<string, unknown>;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (source.fullName !== undefined) patch.full_name = source.fullName;
    if (source.phone !== undefined) patch.phone = source.phone;
    if (source.nationalId !== undefined) patch.national_id = source.nationalId;
    if (source.avatarUrl !== undefined) patch.avatar_url = source.avatarUrl;
    if (source.isActive !== undefined) patch.status = source.isActive ? 'active' : 'inactive';

    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', id)
      .select(PROFILE_COLUMNS)
      .single();
    if (error) this.fail('Failed to update user profile', error);
    const roles = await this.loadRoles([id]);
    return this.toDomain(data as unknown as ProfileRow, roles.get(id) ?? []);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) this.fail('Failed to deactivate user', error);
  }
}
