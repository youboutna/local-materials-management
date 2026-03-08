// @ts-nocheck
/**
 * Supabase Auth Adapter
 * Implements IAuthRepository for Supabase authentication
 * Following hexagonal architecture principles
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IAuthRepository, 
  AuthUser, 
  AuthSession, 
  LoginCredentials, 
  RegisterData 
} from '@/domain/repositories/IAuthRepository';
import { AuthManagerConfig } from '@/application/services/AuthManager';

export class SupabaseAuthAdapter implements IAuthRepository {
  private config?: AuthManagerConfig;

  constructor(config?: AuthManagerConfig) {
    this.config = config;
  }
  /**
   * Get current session
   */
  async getCurrentSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { session: null, error };
      }

      if (!session) {
        return { session: null, error: null };
      }

      const authSession: AuthSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        expires_at: session.expires_at?.toString() || '',
        user: {
          id: session.user.id,
          email: session.user.email || undefined,
          full_name: session.user.user_metadata?.full_name || undefined,
          role: session.user.user_metadata?.role || undefined,
          phone: session.user.phone || undefined,
          national_id: session.user.user_metadata?.national_id || undefined,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at
        }
      };

      return { session: authSession, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Sign in with credentials
   */
  async signIn(credentials: LoginCredentials): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const email = String(credentials.email || '').trim();

      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      });
      
      if (error) {
        return { session: null, error };
      }

      if (!session) {
        return { session: null, error: new Error('No session returned') };
      }

      const authSession: AuthSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        expires_at: session.expires_at?.toString() || '',
        user: {
          id: session.user.id,
          email: session.user.email || undefined,
          full_name: session.user.user_metadata?.full_name || undefined,
          role: session.user.user_metadata?.role || undefined,
          phone: session.user.phone || undefined,
          national_id: session.user.user_metadata?.national_id || undefined,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at
        }
      };

      return { session: authSession, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Sign up new user
   */
  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
            national_id: data.national_id,
            role: data.role || 'user'
          }
        }
      });
      
      if (error) {
        return { user: null, error };
      }

      if (!user) {
        return { user: null, error: new Error('No user returned') };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || undefined,
        full_name: user.user_metadata?.full_name || undefined,
        role: user.user_metadata?.role || undefined,
        phone: user.phone || undefined,
        national_id: user.user_metadata?.national_id || undefined,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return { user: authUser, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return { user: null, error };
      }

      if (!user) {
        return { user: null, error: null };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || undefined,
        full_name: user.user_metadata?.full_name || undefined,
        role: user.user_metadata?.role || undefined,
        phone: user.phone || undefined,
        national_id: user.user_metadata?.national_id || undefined,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return { user: authUser, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      // First verify the current user is the one being updated or has admin privileges
      const { data: { user: currentUser }, error: currentUserError } = await supabase.auth.getUser();
      
      if (currentUserError) {
        return { user: null, error: currentUserError };
      }

      // For now, we'll update the current user's role
      // In a real implementation, you might need to use admin privileges to update other users
      if (currentUser?.id !== userId) {
        return { 
          user: null, 
          error: new Error('Cannot update role for other users without admin privileges') 
        };
      }

      const { data: { user }, error } = await supabase.auth.updateUser({
        data: {
          user_metadata: {
            role: role
          }
        }
      });
      
      if (error) {
        return { user: null, error };
      }

      if (!user) {
        return { user: null, error: new Error('No user returned') };
      }

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || undefined,
        full_name: user.user_metadata?.full_name || undefined,
        role: user.user_metadata?.role || undefined,
        phone: user.phone || undefined,
        national_id: user.user_metadata?.national_id || undefined,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return { user: authUser, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }
}
