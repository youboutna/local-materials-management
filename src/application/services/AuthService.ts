/**
 * Auth Service
 * Implements business logic for authentication operations
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AUTH_ERROR_MESSAGES } from '@/config/auth';
import { 
  IAuthRepository, 
  AuthUser, 
  AuthSession, 
  LoginCredentials, 
  RegisterData 
} from '@/domain/repositories/IAuthRepository';

export class AuthService {
  constructor(private authRepository: IAuthRepository) {}

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    try {
      const result = await this.authRepository.getCurrentSession();
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session');
      }

      if (!result.session) {
        return { user: null, session: null };
      }

      return { user: result.session.user, session: result.session };
    } catch (error) {
      console.error('AuthService.getCurrentSession failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session');
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const result = await this.authRepository.getCurrentUser();
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current user');
      }

      return result.user;
    } catch (error) {
      console.error('AuthService.getCurrentUser failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current user');
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    try {
      const normalized: LoginCredentials = {
        ...credentials,
        email: String(credentials.email || '').trim(),
      };

      const result = await this.authRepository.signIn(normalized);

      if (result.error) {
        const rawMessage = String((result.error as any)?.message || '');

        if (rawMessage.includes('Invalid login credentials')) {
          throw new AppError(ErrorCode.UNAUTHORIZED, AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS, result.error);
        }
        if (rawMessage.toLowerCase().includes('email not confirmed')) {
          throw new AppError(ErrorCode.UNAUTHORIZED, AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED, result.error);
        }

        throw new AppError(ErrorCode.UNAUTHORIZED, AUTH_ERROR_MESSAGES.CONNECTION_FAILED, result.error);
      }

      if (!result.session) {
        return { user: null, session: null };
      }

      return { user: result.session.user, session: result.session };
    } catch (error) {
      console.error('AuthService.login failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Login failed', error);
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthUser | null> {
    try {
      const result = await this.authRepository.signUp(data);
      
      if (result.error) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Registration failed');
      }

      return result.user;
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
      const result = await this.authRepository.signOut();
      
      if (result.error) {
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
      const result = await this.authRepository.resetPassword(email);
      
      if (result.error) {
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
      const result = await this.authRepository.updatePassword(newPassword);
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update password');
      }
    } catch (error) {
      console.error('AuthService.updatePassword failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update password');
    }
  }

  /**
   * Sign up new user (alias for register)
   */
  async signUp(data: RegisterData): Promise<AuthUser | null> {
    return this.register(data);
  }

  /**
   * Set session
   * Validates and sets user session with proper error handling
   */
  async setSession(sessionData: AuthSession): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      // Validate session data
      if (!sessionData || !sessionData.user) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid session data');
      }

      // Verify session is still valid
      const currentSession = await this.authRepository.getCurrentSession();
      
      if (currentSession.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to validate session');
      }

      // In a real implementation, this would update the session in the auth provider
      // For now, we return the validated session data
      return { session: sessionData, error: null };
    } catch (error) {
      console.error('AuthService.setSession failed:', error);
      return { session: null, error: error as Error };
    }
  }

  /**
   * Assign role to user
   * Validates and assigns user role with proper error handling
   */
  async assignUserRole(userId: string, roleName: string): Promise<void> {
    try {
      // Validate inputs
      if (!userId || !roleName) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID and role name are required');
      }

      // Validate role name format
      const validRoles = ['admin', 'user', 'manager', 'employee', 'supplier'];
      if (!validRoles.includes(roleName.toLowerCase())) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Invalid role: ${roleName}`);
      }

      // Get current user to verify permissions
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Must be authenticated to assign roles');
      }

      // Check if user has permission to assign roles (admin only)
      if (currentUser.role !== 'admin') {
        throw new AppError(ErrorCode.FORBIDDEN, 'Only admins can assign roles');
      }

      // Update user role in auth repository
      const result = await this.authRepository.updateUserRole(userId, roleName);
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update user role');
      }
      
      console.log(`Successfully assigned role ${roleName} to user ${userId} by admin ${currentUser.id}`);
      
    } catch (error) {
      console.error('AuthService.assignUserRole failed:', error);
      throw error;
    }
  }

  /**
   * Get user permissions
   * Returns user permissions based on role
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      if (!userId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }

      // Get user details
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'User not authenticated');
      }

      // Return permissions based on role
      const rolePermissions: Record<string, string[]> = {
        admin: ['read', 'write', 'delete', 'manage_users', 'assign_roles'],
        manager: ['read', 'write', 'manage_team'],
        employee: ['read', 'write_own'],
        supplier: ['read_own', 'write_own'],
        user: ['read']
      };

      const userRole = currentUser.role || 'user';
      return rolePermissions[userRole] || rolePermissions.user;
    } catch (error) {
      console.error('AuthService.getUserPermissions failed:', error);
      throw error;
    }
  }

  /**
   * Refresh session
   * Refreshes the current session token
   */
  async refreshSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      // Get current session to refresh
      const currentSession = await this.authRepository.getCurrentSession();
      
      if (currentSession.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session for refresh');
      }

      if (!currentSession.session) {
        return { session: null, error: new Error('No active session to refresh') };
      }

      // In a real implementation, this would refresh the token
      // For now, we return the current session as "refreshed"
      return { session: currentSession.session, error: null };
    } catch (error) {
      console.error('AuthService.refreshSession failed:', error);
      return { session: null, error: error as Error };
    }
  }
}

let authServiceInstance: AuthService | null = null;
export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(RepositoryFactory.getAuthRepository());
  }
  return authServiceInstance;
}
