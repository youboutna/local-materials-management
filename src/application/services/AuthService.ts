/**
 * Auth Service – Implémente la logique métier d'authentification
 * 
 * Architecture hexagonale :
 *   - Dépend UNIQUEMENT des ports (IAuthRepository, IUserRoleRepository)
 *   - Aucun import direct d'infrastructure
 *   - Délègue la gestion des rôles à IUserRoleRepository
 * 
 * Corrections appliquées :
 *   - ✅ Injection de IUserRoleRepository (séparation des responsabilités)
 *   - ✅ assignUserRole / revokeUserRole typés SomelecRole
 *   - ✅ Plus d'appel à IAuthRepository.updateUserRole (déprécié)
 *   - ✅ Nouvelles méthodes getUserRoles / hasRole
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AUTH_ERROR_MESSAGES } from '@/config/auth';
import {
  IAuthRepository,
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from '@/domain/repositories/IAuthRepository';
import type { IUserRoleRepository } from '@/domain/repositories/IUserRoleRepository';
import type { SomelecRole, UserRoleEntity } from '@/domain/entities/User';

export class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly userRoleRepository: IUserRoleRepository
  ) {}

  // ────────────────────────────────────────────────────────────
  // SESSION
  // ────────────────────────────────────────────────────────────

  async getCurrentSession(): Promise<{
    user: AuthUser | null;
    session: AuthSession | null;
  }> {
    try {
      const result = await this.authRepository.getCurrentSession();
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session');
      }
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

  // ────────────────────────────────────────────────────────────
  // LOGIN / REGISTER
  // ────────────────────────────────────────────────────────────

  async login(
    credentials: LoginCredentials
  ): Promise<{ user: AuthUser | null; session: AuthSession | null }> {
    try {
      const normalized = {
        ...credentials,
        email: String(credentials.email || '').trim(),
      };

      const result = await this.authRepository.signIn(normalized);

      if (result.error) {
        const rawMessage = String((result.error as any)?.message || '');

        if (rawMessage.includes('Invalid login credentials')) {
          throw new AppError(
            ErrorCode.UNAUTHORIZED,
            AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
            result.error
          );
        }

        if (rawMessage.toLowerCase().includes('email not confirmed')) {
          throw new AppError(
            ErrorCode.UNAUTHORIZED,
            AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED,
            result.error
          );
        }

        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          AUTH_ERROR_MESSAGES.CONNECTION_FAILED,
          result.error
        );
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
      if (result.error) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Registration failed');
      }
      return result.user;
    } catch (error) {
      console.error('AuthService.register failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      const result = await this.authRepository.signOut();
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout');
      }
    } catch (error) {
      console.error('AuthService.logout failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout');
    }
  }

  // ────────────────────────────────────────────────────────────
  // MOT DE PASSE
  // ────────────────────────────────────────────────────────────

  async resetPassword(email: string): Promise<void> {
    try {
      const result = await this.authRepository.resetPassword(email);
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset password');
      }
    } catch (error) {
      console.error('AuthService.resetPassword failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to reset password');
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    try {
      const result = await this.authRepository.updatePassword(newPassword);
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update password');
      }
    } catch (error) {
      console.error('AuthService.updatePassword failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update password');
    }
  }

  async updateEmail(oldEmail: string, newEmail: string): Promise<void> {
    try {
      const result = await this.authRepository.updateEmail(oldEmail, newEmail);
      if (result.error) {
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED,
          result.error
        );
      }
    } catch (error) {
      console.error('AuthService.updateEmail failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED,
        error
      );
    }
  }

  // ────────────────────────────────────────────────────────────
  // ALIAS (compat couche présentation)
  // ────────────────────────────────────────────────────────────

  async signUp(data: RegisterData): Promise<AuthUser | null> {
    return this.register(data);
  }

  async setSession(params: {
    access_token: string;
    refresh_token: string;
    user?: AuthUser | null;
    expires_at?: string | number;
  }): Promise<{ session: AuthSession | null; error: Error | null }> {
    return this.authRepository.setSession(params);
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    return this.authRepository.onAuthStateChange(callback);
  }

  // ────────────────────────────────────────────────────────────
  // RÔLES (délégué au port IUserRoleRepository)
  // ────────────────────────────────────────────────────────────

  /**
   * Assigne un rôle applicatif (persiste dans public.user_roles)
   * ✅ Délègue à IUserRoleRepository (plus d'appel à authRepository)
   */
  async assignUserRole(userId: string, role: SomelecRole): Promise<void> {
    try {
      await this.userRoleRepository.assignRole(userId, role);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to assign user role', error);
    }
  }

  /**
   * Révoque un rôle applicatif
   */
  async revokeUserRole(userId: string, role: SomelecRole): Promise<void> {
    try {
      await this.userRoleRepository.revokeRole(userId, role);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to revoke user role', error);
    }
  }

  /**
   * Récupère les rôles actifs d'un utilisateur
   */
  async getUserRoles(userId: string): Promise<UserRoleEntity[]> {
    return this.userRoleRepository.getActiveUserRoles(userId);
  }

  /**
   * Vérifie si un utilisateur possède un rôle spécifique
   */
  async hasRole(userId: string, role: SomelecRole): Promise<boolean> {
    return this.userRoleRepository.hasRole(userId, role);
  }
}

// ────────────────────────────────────────────────────────────
// FACTORY SINGLETON
// ────────────────────────────────────────────────────────────

let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(
      RepositoryFactory.getAuthRepository(),
      RepositoryFactory.getUserRoleRepository()
    );
  }
  return authServiceInstance;
}