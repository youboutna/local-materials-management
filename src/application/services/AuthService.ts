/**
 * Auth Service
 * Implements business logic for authentication operations
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
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
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current user');
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    try {
      const result = await this.authRepository.signIn(credentials);
      
      if (result.error) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid credentials');
      }

      if (!result.session) {
        return { user: null, session: null };
      }

      return { user: result.session.user, session: result.session };
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
}
