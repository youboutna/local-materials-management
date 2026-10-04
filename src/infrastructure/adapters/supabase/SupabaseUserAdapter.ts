/**
 * Supabase User Adapter
 * Implements IAuthRepository using Supabase
 * Delegates profile operations to SupabaseUserProfileAdapter
 *
 * ⚠️ Un utilisateur peut avoir PLUSIEURS rôles dans public.user_roles.
 * Toutes les opérations sur les rôles passent par des tableaux.
 */

import { UserProfile } from '@/domain/entities/UserProfile';
import {
  AuthSession,
  AuthUser,
  IAuthRepository,
  LoginCredentials,
  OAuthSignInParams,
  RegisterData,
} from '@/domain/repositories/IAuthRepository';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseUserProfileAdapter } from './SupabaseUserProfileAdapter';
import { BaseAuthAdapter } from '@/infrastructure/adapters/auth/BaseAuthAdapter';

const ROLE_PRIORITY: string[] = [
  'admin',
  'super_admin',
  'director',
  'manager',
  'inspector',
  'supervisor',
  'project_manager',
  'project',
  'project_project',
  'supplier',
  'consultant',
  'public',
  'user',
];

export class SupabaseUserAdapter extends BaseAuthAdapter implements IAuthRepository {
  private profileAdapter: SupabaseUserProfileAdapter;

  constructor() {
    super();
    this.profileAdapter = new SupabaseUserProfileAdapter();
  }

  // ============================
  // Session
  // ============================
  async getCurrentSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) return { session: null, error: new Error(error.message) };
      if (!session) return { session: null, error: null };
      return { session: this.mapSession(session), error: null };
    } catch (error) {
      return { session: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async signIn(
    credentials: LoginCredentials
  ): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) return { session: null, error: new Error(error.message) };
      if (!data.session) return { session: null, error: new Error('No session returned') };
      return { session: this.mapSession(data.session), error: null };
    } catch (error) {
      return { session: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async signInWithIdToken(
    params: OAuthSignInParams
  ): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: params.provider as never,
        token: params.token,
        nonce: params.nonce,
      });
      if (error) return { session: null, error: new Error(error.message) };
      if (!data.session) return { session: null, error: new Error('No session returned') };
      return { session: this.mapSession(data.session), error: null };
    } catch (error) {
      return { session: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            national_id: data.nationalId,
            role: data.role,
          },
        },
      });
      if (error) return { user: null, error: new Error(error.message) };
      if (!authData.user) return { user: null, error: new Error('No user returned') };
      return { user: this.mapUser(authData.user), error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return { user: null, error: new Error(error.message) };
      if (!user) return { user: null, error: null };
      return { user: this.mapUser(user), error: null };
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // ============================
  // ROLES — Multi-rôles
  // ============================

  async getUserRolesList(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('user_roles')
        .select('role_name, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gt.${now}`);

      if (error) {
        console.error('[SupabaseUserAdapter.getUserRolesList] Error:', error);
        return [];
      }
      return (data ?? []).map((r) => r.role_name);
    } catch (error) {
      console.error('[SupabaseUserAdapter.getUserRolesList] Unexpected:', error);
      return [];
    }
  }

  async getPrimaryRole(userId: string): Promise<string> {
    const roles = await this.getUserRolesList(userId);
    if (roles.length === 0) return 'user';
    for (const p of ROLE_PRIORITY) if (roles.includes(p)) return p;
    return roles[0];
  }

  async updateUserRole(
    userId: string,
    role: string
  ): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      if (!userId || !role) {
        return { user: null, error: new Error('userId and role are required') };
      }

      const { data: existing, error: lookupError } = await supabase
        .from('user_roles')
        .select('id, status')
        .eq('user_id', userId)
        .eq('role_name', role)
        .maybeSingle();

      if (lookupError) return { user: null, error: new Error(lookupError.message) };

      if (existing) {
        if (existing.status !== 'active') {
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({
              status: 'active',
              assigned_at: new Date().toISOString(),
              expires_at: null,
            })
            .eq('id', existing.id);
          if (updateError) return { user: null, error: new Error(updateError.message) };
        }
        return this.getCurrentUser();
      }

      const { error: insertError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role_name: role,
        status: 'active',
        assigned_at: new Date().toISOString(),
      });

      if (insertError && insertError.code !== '23505') {
        return { user: null, error: new Error(insertError.message) };
      }

      return this.getCurrentUser();
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async removeUserRole(
    userId: string,
    role: string
  ): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      if (!userId || !role) {
        return { user: null, error: new Error('userId and role are required') };
      }
      const { error } = await supabase
        .from('user_roles')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('role_name', role);
      if (error) return { user: null, error: new Error(error.message) };
      return this.getCurrentUser();
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async setUserRoles(
    userId: string,
    roles: string[]
  ): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      if (!userId) return { user: null, error: new Error('userId is required') };

      const { error: revokeError } = await supabase
        .from('user_roles')
        .update({ status: 'inactive' })
        .eq('user_id', userId);
      if (revokeError) return { user: null, error: new Error(revokeError.message) };

      for (const role of roles) {
        const result = await this.updateUserRole(userId, role);
        if (result.error) return result;
      }
      return this.getCurrentUser();
    } catch (error) {
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // ============================
  // Email confirmation
  // ============================
  async resendConfirmationEmail(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async confirmUserEmail(userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // ============================
  // Profile (delegation)
  // ============================
  async getProfile(
    userId: string
  ): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const profile = await this.profileAdapter.getProfileByUserId(userId);
      return { profile, error: null };
    } catch (error) {
      return { profile: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  async upsertProfile(profile: UserProfile): Promise<{ error: Error | null }> {
    try {
      await this.profileAdapter.saveProfile(profile);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // ============================
  // Session cleanup
  // ============================
  async clearSessions(userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.from('auth_sessions').delete().eq('user_id', userId);
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // ============================
  // Mapping
  // ============================
  private mapUser(user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    phone?: string;
    created_at?: string;
    updated_at?: string;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      fullName: (user.user_metadata?.full_name as string) ?? undefined,
      role: (user.user_metadata?.role as string) ?? undefined,
      phone: user.phone,
      nationalId: (user.user_metadata?.national_id as string) ?? undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  private mapSession(session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    user: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown>;
      phone?: string;
      created_at?: string;
      updated_at?: string;
    };
  }): AuthSession {
    const user = this.mapUser(session.user);
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
      user,
    };
  }
}