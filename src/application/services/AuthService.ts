/**
 * Auth Service – Implémente la logique métier
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

  async getCurrentSession(): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    try {
      const result = await this.authRepository.getCurrentSession();
      if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session');
      if (!result.session) return { user: null, session: null };
      return { user: result.session.user, session: result.session };
    } catch (error) {
      console.error('AuthService.getCurrentSession failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session');
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const result = await this.authRepository.getCurrentUser();
      if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current user');
      return result.user;
    } catch (error) {
      console.error('AuthService.getCurrentUser failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current user');
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    try {
      const normalized = { ...credentials, email: String(credentials.email || '').trim() };
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
      if (!result.session) return { user: null, session: null };
      return { user: result.session.user, session: result.session };
    } catch (error) {
      console.error('AuthService.login failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Login failed', error);
    }
  }

  async register(data: RegisterData): Promise<AuthUser | null> {
    try {
      const result = await this.authRepository.signUp(data);
      if (result.error) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Registration failed');
      return result.user;
    } catch (error) {
      console.error('AuthService.register failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      const result = await this.authRepository.signOut();
      if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout');
    } catch (error) {
      console.error('AuthService.logout failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const result = await this.authRepository.resetPassword(email);
      if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset password');
    } catch (error) {
      console.error('AuthService.resetPassword failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset password');
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    try {
      const result = await this.authRepository.updatePassword(newPassword);
      if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update password');
    } catch (error) {
      console.error('AuthService.updatePassword failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update password');
    }
  }

  // 🔥 NOUVELLE MÉTHODE pour mettre à jour l'email (sans session active)
  async updateEmail(oldEmail: string, newEmail: string): Promise<void> {
    try {
      const result = await this.authRepository.updateEmail(oldEmail, newEmail);
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED, result.error);
      }
    } catch (error) {
      console.error('AuthService.updateEmail failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED, error);
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