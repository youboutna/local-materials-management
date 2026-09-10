/**
 * Supabase Auth Adapter
 * Implements IAuthRepository for Supabase authentication
 * 
 * Architecture hexagonale :
 *   - Implémente le port IAuthRepository
 *   - Ne gère QUE l'authentification (pas les rôles métier)
 *   - Convertit snake_case (Supabase) → camelCase (domaine)
 *   - Ne bloque jamais sur session manquante
 */

import { supabase } from '@/integrations/supabase/client';
import {
  IAuthRepository,
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from '@/domain/repositories/IAuthRepository';
import { AuthManagerConfig } from '@/application/services/AuthManager';
import { BaseAuthAdapter } from '@/infrastructure/adapters/auth/BaseAuthAdapter';

export class SupabaseAuthAdapter extends BaseAuthAdapter implements IAuthRepository {
  private config?: AuthManagerConfig;

  constructor(config?: AuthManagerConfig) {
    super();
    this.config = config;
  }

  // ────────────────────────────────────────────────────────────
  // HELPERS PRIVÉS (mapping Supabase → domaine)
  // ────────────────────────────────────────────────────────────

  /**
   * Mappe un User Supabase vers AuthUser (domaine)
   */
  private mapSupabaseUserToAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email || undefined,
      fullName: user.user_metadata?.full_name || undefined,
      role: user.user_metadata?.role || undefined,
      phone: user.phone || undefined,
      nationalId: user.user_metadata?.national_id || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Mappe une Session Supabase vers AuthSession (domaine)
   */
  private mapSupabaseSessionToAuthSession(session: any): AuthSession {
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token || '',
      expiresAt: session.expires_at?.toString() || '',
      user: this.mapSupabaseUserToAuthUser(session.user),
    };
  }

  // ────────────────────────────────────────────────────────────
  // SESSION
  // ────────────────────────────────────────────────────────────

  /**
   * Récupère la session courante
   * ✅ Retourne null sans erreur si aucune session active
   */
  async getCurrentSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      // Erreurs normales (pas de session) → null sans erreur
      if (error) {
        const msg = error.message?.toLowerCase() || '';
        if (
          msg.includes('session') ||
          msg.includes('authsessionmissing') ||
          msg.includes('not found')
        ) {
          return { session: null, error: null };
        }
        return { session: null, error };
      }

      if (!session) {
        return { session: null, error: null };
      }

      return {
        session: this.mapSupabaseSessionToAuthSession(session),
        error: null,
      };
    } catch (error) {
      console.warn('SupabaseAuthAdapter.getCurrentSession catch:', error);
      return { session: null, error: null };
    }
  }

  // ────────────────────────────────────────────────────────────
  // AUTHENTIFICATION
  // ────────────────────────────────────────────────────────────

  async signIn(
    credentials: LoginCredentials
  ): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const email = String(credentials.email || '').trim();

      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      });

      if (error) {
        return { session: null, error };
      }

      if (!session) {
        return { session: null, error: new Error('No session returned') };
      }

      return {
        session: this.mapSupabaseSessionToAuthSession(session),
        error: null,
      };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  async signInWithIdToken(
    params: { provider: string; token: string; nonce?: string }
  ): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: params.provider as any,
        token: params.token,
        nonce: params.nonce,
      });

      if (error) return { session: null, error };
      if (!data.session) return { session: null, error: new Error('No session returned') };

      return {
        session: this.mapSupabaseSessionToAuthSession(data.session),
        error: null,
      };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            national_id: data.nationalId,
            role: data.role || 'user',
          },
        },
      });

      if (error) return { user: null, error };
      if (!user) return { user: null, error: new Error('No user returned') };

      return {
        user: this.mapSupabaseUserToAuthUser(user),
        error: null,
      };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // ────────────────────────────────────────────────────────────
  // MOT DE PASSE
  // ────────────────────────────────────────────────────────────

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // ────────────────────────────────────────────────────────────
  // UTILISATEUR
  // ────────────────────────────────────────────────────────────

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) return { user: null, error };
      if (!user) return { user: null, error: null };

      return {
        user: this.mapSupabaseUserToAuthUser(user),
        error: null,
      };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  // ────────────────────────────────────────────────────────────
  // RÔLES (DÉPRÉCIÉ - utilise IUserRoleRepository à la place)
  // ────────────────────────────────────────────────────────────

  /**
   * @deprecated Utiliser IUserRoleRepository.assignRole()
   * 
   * Modifie uniquement raw_user_meta_data.role de auth.users.
   * Ne persiste PAS dans public.user_roles.
   */
  async updateUserRole(
    userId: string,
    role: string
  ): Promise<{ user: AuthUser | null; error: Error | null }> {
    console.warn(
      '[DEPRECATED] SupabaseAuthAdapter.updateUserRole : ' +
        'utiliser IUserRoleRepository.assignRole() pour persister dans public.user_roles'
    );

    try {
      const {
        data: { user: currentUser },
        error: currentUserError,
      } = await supabase.auth.getUser();

      if (currentUserError) return { user: null, error: currentUserError };

      if (currentUser?.id !== userId) {
        return {
          user: null,
          error: new Error('Cannot update role for other users without admin privileges'),
        };
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.updateUser({
        data: {
          user_metadata: {
            ...currentUser.user_metadata,
            role,
          },
        },
      });

      if (error) return { user: null, error };
      if (!user) return { user: null, error: new Error('No user returned') };

      return {
        user: this.mapSupabaseUserToAuthUser(user),
        error: null,
      };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  // ────────────────────────────────────────────────────────────
  // EMAIL
  // ────────────────────────────────────────────────────────────

  /**
   * Update user's email without an active session.
   * Uses a secure Supabase Edge Function (service_role) to bypass user permissions.
   */
  async updateEmail(oldEmail: string, newEmail: string): Promise<{ error: Error | null }> {
    try {
      const functionUrl = import.meta.env.VITE_SUPABASE_UPDATE_EMAIL_FUNCTION_URL;
      if (!functionUrl) {
        throw new Error('Update email function URL not configured in environment');
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldEmail, newEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: new Error(errorData.error || 'Failed to update email') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async resendConfirmationEmail(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async confirmUserEmail(userId: string): Promise<{ error: Error | null }> {
    try {
      // Note : Supabase ne permet pas la confirmation côté client sans Edge Function.
      // Cette méthode doit être implémentée via une Edge Function avec service_role.
      console.warn(
        '[SupabaseAuthAdapter.confirmUserEmail] Non implémenté côté client. ' +
          'Utiliser une Edge Function avec service_role.'
      );
      return { error: new Error('Not implemented - use Edge Function') };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // ────────────────────────────────────────────────────────────
  // PROFILE
  // ────────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<{ profile: any | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) return { profile: null, error };
      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error: error as Error };
    }
  }

  async upsertProfile(profile: any): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // ────────────────────────────────────────────────────────────
  // SESSION CLEANUP / RESTORE
  // ────────────────────────────────────────────────────────────

  async clearSessions(userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('auth_sessions')
        .delete()
        .eq('user_id', userId);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async setSession(params: {
    access_token: string;
    refresh_token: string;
    user?: AuthUser | null;
    expires_at?: string | number;
  }): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (error) return { session: null, error };
      if (!data.session) return { session: null, error: new Error('No session') };

      return {
        session: this.mapSupabaseSessionToAuthSession(data.session),
        error: null,
      };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  // ────────────────────────────────────────────────────────────
  // RÉACTIF
  // ────────────────────────────────────────────────────────────

  /**
   * Flux réactif de session (remplace tout usage direct de supabase.auth dans l'UI).
   * ✅ Construction propre et typée - pas de cast `as unknown`
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        callback(null);
        return;
      }

      const authSession: AuthSession = {
        accessToken: session.access_token,
        refreshToken: session.refresh_token || '',
        expiresAt: session.expires_at?.toString() || '',
        user: {
          id: session.user.id,
          email: session.user.email || undefined,
          fullName: session.user.user_metadata?.full_name || undefined,
          role: session.user.user_metadata?.role || undefined,
          phone: session.user.phone || undefined,
          nationalId: session.user.user_metadata?.national_id || undefined,
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at,
        },
      };

      callback(authSession);
    });

    return () => data.subscription.unsubscribe();
  }
}