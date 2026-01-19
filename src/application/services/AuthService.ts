/**
 * Auth Service
 * Implements business logic for authentication operations
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface AuthUser {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  national_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  national_id?: string;
  role?: string;
}

interface SupabaseUser {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  national_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: SupabaseUser;
}

export interface AuthSession {
  user: AuthUser | null;
  session: SupabaseSession | null;
}

export class AuthService {
  /**
   * Get current session
   */
  async getCurrentSession(): Promise<AuthSession> {
    try {
      const result = await this.getSupabaseSession();
      const session = result.data.session;
      
      if (!session) {
        return { user: null, session: null };
      }

      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.full_name,
        role: session.user.role,
        phone: session.user.phone,
        national_id: session.user.national_id,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at
      };

      return { user, session };
    } catch (error) {
      console.error('AuthService.getCurrentSession failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session');
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      const { data, error } = await this.signInWithSupabase(credentials);
      
      if (error) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid credentials');
      }

      const session = data.session;
      if (!session) {
        return { user: null, session: null };
      }

      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.full_name,
        role: session.user.role,
        phone: session.user.phone,
        national_id: session.user.national_id,
        created_at: session.user.created_at,
        updated_at: session.user.updated_at
      };

      return { user, session };
    } catch (error) {
      console.error('AuthService.login failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthUser | null> {
    try {
      const { data: signUpData, error } = await this.signUpWithSupabase(data);
      
      if (error) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Registration failed');
      }

      const user = signUpData.user;
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        national_id: user.national_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      console.error('AuthService.register failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Registration failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const { error } = await this.signOutWithSupabase();
      
      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout');
      }
    } catch (error) {
      console.error('AuthService.logout failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout');
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await this.resetPasswordWithSupabase(email);
      
      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset password');
      }
    } catch (error) {
      console.error('AuthService.resetPassword failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset password');
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await this.updatePasswordWithSupabase(newPassword);
      
      if (error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update password');
      }
    } catch (error) {
      console.error('AuthService.updatePassword failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update password');
    }
  }

  // Private methods that would interact with Supabase adapters
  private async getSupabaseSession(): Promise<{ data: { session: SupabaseSession | null }, error: Error | null }> {
    // This would call the auth repository
    // For now, using placeholder
    return { data: { session: null }, error: null };
  }

  private async signInWithSupabase(_credentials: LoginCredentials): Promise<{ data: { session: SupabaseSession | null }, error: Error | null }> {
    // This would call the auth repository
    return { data: { session: null }, error: null };
  }

  private async signUpWithSupabase(_data: RegisterData): Promise<{ data: { user: SupabaseUser | null }, error: Error | null }> {
    // This would call the auth repository
    return { data: { user: null }, error: null };
  }

  private async signOutWithSupabase(): Promise<{ error: Error | null }> {
    // This would call the auth repository
    return { error: null };
  }

  private async resetPasswordWithSupabase(_email: string): Promise<{ error: Error | null }> {
    // This would call the auth repository
    return { error: null };
  }

  private async updatePasswordWithSupabase(_newPassword: string): Promise<{ error: Error | null }> {
    // This would call the auth repository
    return { error: null };
  }
}
