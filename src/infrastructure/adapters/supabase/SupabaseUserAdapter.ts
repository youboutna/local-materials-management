/**
 * Supabase User Adapter
 * Implements IAuthRepository using Supabase
 * Delegates profile operations to SupabaseUserProfileAdapter
 * Uses UserTransformer for mapping
 */

import { UserProfile } from '@/domain/entities/UserProfile';
import { AuthSession, AuthUser, IAuthRepository, LoginCredentials, OAuthSignInParams, RegisterData } from '@/domain/repositories/IAuthRepository';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseUserProfileAdapter } from './SupabaseUserProfileAdapter';
import { BaseAuthAdapter } from '@/infrastructure/adapters/auth/BaseAuthAdapter';

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

  async signIn(credentials: LoginCredentials): Promise<{ session: AuthSession | null; error: Error | null }> {
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

  async signInWithIdToken(params: OAuthSignInParams): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: params.provider as any,
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
            full_name: data.full_name,
            phone: data.phone,
            national_id: data.national_id,
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

  async updateUserRole(userId: string, role: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { error: upsertError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role_name: role, assigned_at: new Date().toISOString(), status: 'active' });
      if (upsertError) return { user: null, error: new Error(upsertError.message) };
      await supabase.from('users' as any).update({ role }).eq('id', userId);
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
      const { error } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // ============================
  // Profile (delegation to profile adapter)
  // ============================
  async getProfile(userId: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
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
  // Mapping helpers
  // ============================
  private mapUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name,
      role: user.user_metadata?.role,
      phone: user.phone,
      national_id: user.user_metadata?.national_id,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  private mapSession(session: any): AuthSession {
    const user = this.mapUser(session.user);
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: new Date(session.expires_at || '').toISOString(),
      user
    };
  }
}