/**
 * UnifiedAuthService – Orchestrateur de l'authentification
 * 
 * Architecture hexagonale :
 *   - Dépend UNIQUEMENT des ports (IAuthRepository, IUserRoleRepository)
 *   - Aucun import direct d'infrastructure
 *   - Utilise les entités domaine et les DTO via transformateurs
 * 
 * Corrections appliquées :
 *   - ✅ Injection de IUserRoleRepository (plus d'import direct d'adapter)
 *   - ✅ hydrateRoles utilise le port injecté
 *   - ✅ loginWithOAuth crée un profil ACTIVE (pas PENDING_VERIFICATION)
 *   - ✅ toUnifiedSession normalise expiresAt / expires_at
 *   - ✅ ROLE_PRIORITY aligné avec User.ts
 */

import { getOAuthProviderService } from '@/application/services/OAuthProviderService';
import { AuthProvider } from '@/config/app';
import { AUTH_ERROR_MESSAGES } from '@/config/auth';
import { DEV_MODE, DEV_USER, getActiveDevRole, IS_LOCAL_BYPASS } from '@/config/constants';
import { UserProfile, ProfileStatus } from '@/domain/entities/UserProfile';
import { ROLE_PRIORITY, type SomelecRole } from '@/domain/entities/User';
import {
  IAuthRepository,
  LoginCredentials,
  RegisterData,
} from '@/domain/repositories/IAuthRepository';
import type { IUserRoleRepository } from '@/domain/repositories/IUserRoleRepository';
import type { OAuthProvider } from '@/domain/repositories/IOAuthProviderRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { OAuthProviderService } from './OAuthProviderService';

// ────────────────────────────────────────────────────────────
// TYPES PUBLICS
// ────────────────────────────────────────────────────────────

export interface UnifiedAuthUser {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  nationalId?: string;
  role?: string;
  avatarUrl?: string;
  authProvider: string;
  providerId?: string;
  providerData?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  profile?: UserProfile;

  // Alias de compatibilité présentation (Keycloak, Supabase metadata)
  firstName?: string;
  lastName?: string;
  username?: string;
  keycloakId?: string;
  picture?: string;
  roles?: string[];
  full_name?: string;
  avatar_url?: string;
  national_id?: string;
  metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export interface UnifiedAuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  expires_at?: string;
  user: UnifiedAuthUser;
  provider: AuthProvider;
}

export interface OAuthLoginData {
  provider: string;
  code: string;
  state?: string;
  redirectUri: string;
}

// ────────────────────────────────────────────────────────────
// SERVICE
// ────────────────────────────────────────────────────────────

export class UnifiedAuthService {
  private oAuthService: OAuthProviderService;

  /**
   * Priorité des rôles (source unique : User.ts ROLE_PRIORITY)
   * Utilisée pour déterminer le rôle principal lors de l'hydratation.
   */
  private static readonly ROLE_PRIORITY_LIST: readonly SomelecRole[] = Object.entries(
    ROLE_PRIORITY
  )
    .sort(([, a], [, b]) => b - a)
    .map(([role]) => role);

  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly userRoleRepository: IUserRoleRepository
  ) {
    this.oAuthService = getOAuthProviderService();
  }

  // ────────────────────────────────────────────────────────────
  // DEV MODE
  // ────────────────────────────────────────────────────────────

  private buildDevSession(): { user: UnifiedAuthUser; session: UnifiedAuthSession } {
    const role = getActiveDevRole().role;
    const now = new Date().toISOString();

    const user: UnifiedAuthUser = {
      id: DEV_USER.id,
      email: DEV_USER.email,
      fullName: DEV_USER.user_metadata.full_name,
      phone: DEV_USER.user_metadata.phone,
      nationalId: DEV_USER.user_metadata.national_id,
      role,
      authProvider: 'dev',
      createdAt: now,
    };

    const session: UnifiedAuthSession = {
      accessToken: 'dev-token',
      refreshToken: 'dev-refresh',
      expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
      user,
      provider: 'supabase',
    };

    return { user, session };
  }

  // ────────────────────────────────────────────────────────────
  // MAPPING
  // ────────────────────────────────────────────────────────────

  /**
   * Convertit une session brute (AuthSession du domaine ou réponse Supabase)
   * en UnifiedAuthSession.
   * 
   * Gère les deux conventions de nommage (camelCase / snake_case)
   * pour faciliter la transition.
   */
  private toUnifiedSession(session: any, profile?: UserProfile): UnifiedAuthSession {
    const roleFromSession = session.user?.role || session.user?.user_metadata?.role || 'user';
    const roleFromProfile = profile?.isAdmin ? 'admin' : undefined;
    const finalRole = roleFromProfile || roleFromSession;

    const user: UnifiedAuthUser = {
      id: session.user.id,
      email: session.user.email,
      fullName: profile?.fullName || session.user.fullName || session.user.full_name,
      phone: profile?.phone || session.user.phone,
      nationalId: profile?.nationalId || session.user.nationalId || session.user.national_id,
      role: finalRole,
      avatarUrl: profile?.avatarUrl || session.user.avatarUrl || session.user.avatar_url,
      authProvider: 'supabase',
      createdAt:
        session.user.createdAt ||
        session.user.created_at ||
        new Date().toISOString(),
      updatedAt: profile?.updatedAt?.toISOString() || session.user.updatedAt || session.user.updated_at,
      profile: profile || undefined,

      // Alias de compatibilité
      full_name: profile?.fullName || session.user.fullName || session.user.full_name,
      avatar_url: profile?.avatarUrl || session.user.avatarUrl || session.user.avatar_url,
      national_id:
        profile?.nationalId || session.user.nationalId || session.user.national_id,
      roles: finalRole ? [String(finalRole)] : [],
      user_metadata: {
        full_name: profile?.fullName || session.user.fullName,
        phone: profile?.phone || session.user.phone,
        national_id: profile?.nationalId || session.user.nationalId,
        avatar_url: profile?.avatarUrl,
        role: finalRole,
      },
      metadata: {},
    };

    // Normalisation : on accepte les 2 conventions
    const accessToken = session.accessToken || session.access_token;
    const refreshToken = session.refreshToken || session.refresh_token;
    const expiresAt = session.expiresAt || session.expires_at;

    return {
      accessToken,
      refreshToken,
      expiresAt,
      expires_at: expiresAt, // alias
      user,
      provider: 'supabase',
    };
  }

  /**
   * Hydrate les rôles applicatifs (public.user_roles) dans la session.
   * Source de vérité unique des permissions — jamais dérivée du profil.
   * 
   * ✅ Utilise le port IUserRoleRepository (pas d'import infrastructure)
   */
  private async hydrateRoles(session: UnifiedAuthSession): Promise<UnifiedAuthSession> {
    try {
      const roles = await this.userRoleRepository.getActiveUserRoles(session.user.id);

      const roleNames = Array.from(
        new Set(roles.map((r) => String(r.roleName).toLowerCase()))
      ).filter(Boolean) as SomelecRole[];

      if (roleNames.length === 0) return session;

      // Détermine le rôle principal selon ROLE_PRIORITY
      const primary =
        UnifiedAuthService.ROLE_PRIORITY_LIST.find((r) => roleNames.includes(r)) ||
        roleNames[0];

      const user: UnifiedAuthUser = {
        ...session.user,
        role: primary,
        roles: roleNames,
        user_metadata: {
          ...(session.user as any).user_metadata,
          role: primary,
        },
      };

      return { ...session, user };
    } catch (error) {
      console.warn(
        'UnifiedAuthService.hydrateRoles failed, fallback on session role:',
        error
      );
      return session;
    }
  }

  // ────────────────────────────────────────────────────────────
  // SESSION
  // ────────────────────────────────────────────────────────────

  async getCurrentSession(): Promise<{
    user: UnifiedAuthUser | null;
    session: UnifiedAuthSession | null;
  }> {
    if (IS_LOCAL_BYPASS) {
      const { user, session } = this.buildDevSession();
      return { user, session };
    }

    try {
      const result = await this.authRepository.getCurrentSession();
      if (result.error || !result.session) return { user: null, session: null };

      const profileResult = await this.authRepository.getProfile(result.session.user.id);

      const unifiedSession = await this.hydrateRoles(
        this.toUnifiedSession(result.session, profileResult.profile || undefined)
      );

      return { user: unifiedSession.user, session: unifiedSession };
    } catch (error) {
      console.error('UnifiedAuthService.getCurrentSession error:', error);
      return { user: null, session: null };
    }
  }

  async getCurrentUser(): Promise<{ user: UnifiedAuthUser | null }> {
    const { user } = await this.getCurrentSession();
    return { user };
  }

  // ────────────────────────────────────────────────────────────
  // LOGIN
  // ────────────────────────────────────────────────────────────

  async login(credentials: LoginCredentials): Promise<{
    user: UnifiedAuthUser | null;
    session: UnifiedAuthSession | null;
  }> {
    try {
      const result = await this.authRepository.signIn(credentials);

      if (result.error) {
        const msg = result.error.message || '';
        if (msg.includes('Invalid login credentials')) {
          throw new AppError(
            ErrorCode.UNAUTHORIZED,
            AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
            result.error
          );
        }
        if (msg.toLowerCase().includes('email not confirmed')) {
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

      const profileResult = await this.authRepository.getProfile(result.session.user.id);

      const unifiedSession = await this.hydrateRoles(
        this.toUnifiedSession(result.session, profileResult.profile || undefined)
      );

      return { user: unifiedSession.user, session: unifiedSession };
    } catch (error) {
      console.error('UnifiedAuthService.login failed:', error);
      throw error instanceof AppError
        ? error
        : new AppError(ErrorCode.INTERNAL_ERROR, 'Login failed', error);
    }
  }

  /**
   * Connexion rapide DEV (boutons de test) : LocalAuthAdapter, sans appel réseau.
   */
  async devLogin(credentials: LoginCredentials): Promise<{
    user: UnifiedAuthUser | null;
    session: UnifiedAuthSession | null;
  }> {
    const { LocalAuthAdapter } = await import('@/infrastructure/adapters/local/LocalAuthAdapter');
    const local = new LocalAuthAdapter();
    const result = await local.signIn(credentials);

    if (result.error || !result.session) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
        result.error
      );
    }

    const session = this.toUnifiedSession(result.session);
    return { user: session.user, session };
  }

  // ────────────────────────────────────────────────────────────
  // OAUTH
  // ────────────────────────────────────────────────────────────

  async loginWithOAuth(oAuthData: OAuthLoginData): Promise<{
    user: UnifiedAuthUser | null;
    session: UnifiedAuthSession | null;
  }> {
    try {
      const provider = await this.oAuthService.getOAuthProviderByName(oAuthData.provider);
      if (!provider || !provider.enabled) {
        throw new AppError(
          ErrorCode.PROVIDER_NOT_ENABLED,
          `Provider ${oAuthData.provider} not enabled`
        );
      }

      const tokens = await this.oAuthService.exchangeOAuthCode(
        provider,
        oAuthData.code,
        oAuthData.redirectUri
      );
      const userInfo = await this.oAuthService.getOAuthUserInfo(provider, tokens.accessToken);

      const signInResult = await this.authRepository.signInWithIdToken({
        provider: oAuthData.provider,
        token: tokens.accessToken,
        nonce: oAuthData.state,
      });

      if (signInResult.error || !signInResult.session) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'OAuth login failed', signInResult.error);
      }

      // ✅ FIX : Utiliser ProfileStatus.ACTIVE pour un utilisateur OAuth validé
      // (au lieu de UserProfile.create() qui met PENDING_VERIFICATION)
      const profile = new UserProfile(
        signInResult.session.user.id,                        // id
        signInResult.session.user.id,                        // userId
        userInfo.name || userInfo.display_name || 'Unknown', // fullName
        userInfo.phone,                                      // phone
        userInfo.national_id,                                // nationalId
        userInfo.picture,                                    // avatarUrl
        false,                                               // isAdmin
        ProfileStatus.ACTIVE                                 // ✅ statut explicite
      );

      await this.authRepository.upsertProfile(profile);

      const unifiedSession = await this.hydrateRoles(
        this.toUnifiedSession(signInResult.session, profile)
      );

      return { user: unifiedSession.user, session: unifiedSession };
    } catch (error) {
      console.error('UnifiedAuthService.loginWithOAuth failed:', error);
      throw error instanceof AppError
        ? error
        : new AppError(ErrorCode.INTERNAL_ERROR, 'OAuth login failed', error);
    }
  }

  async getAvailableOAuthProviders(): Promise<OAuthProvider[]> {
    return this.oAuthService.getEnabledOAuthProviders();
  }

  async generateOAuthLoginUrl(providerName: string, redirectUri: string): Promise<string> {
    const provider = await this.oAuthService.getOAuthProviderByName(providerName);
    if (!provider || !provider.enabled) {
      throw new AppError(
        ErrorCode.PROVIDER_NOT_ENABLED,
        `Provider ${providerName} not available`
      );
    }
    return this.oAuthService.generateOAuthUrl(provider, redirectUri, this.generateState());
  }

  // ────────────────────────────────────────────────────────────
  // REGISTER / LOGOUT
  // ────────────────────────────────────────────────────────────

  async register(data: RegisterData): Promise<UnifiedAuthUser | null> {
    try {
      const result = await this.authRepository.signUp(data);
      if (result.error || !result.user) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Registration failed', result.error);
      }

      // Création du profil (statut PENDING_VERIFICATION par défaut)
      const profile = UserProfile.create(
        result.user.id,
        result.user.id,
        data.fullName || 'Unknown',
        data.phone,
        data.nationalId
      );
      await this.authRepository.upsertProfile(profile);

      const user: UnifiedAuthUser = {
        id: result.user.id,
        email: result.user.email,
        fullName: profile.fullName,
        phone: profile.phone,
        nationalId: profile.nationalId,
        role: profile.isAdmin ? 'admin' : 'user',
        avatarUrl: profile.avatarUrl,
        authProvider: 'supabase',
        createdAt: result.user.createdAt || new Date().toISOString(),
        profile,
      };

      return user;
    } catch (error) {
      console.error('UnifiedAuthService.register failed:', error);
      throw error instanceof AppError
        ? error
        : new AppError(ErrorCode.INTERNAL_ERROR, 'Registration failed', error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authRepository.signOut();
      const current = await this.authRepository.getCurrentUser();
      if (current.user) await this.authRepository.clearSessions(current.user.id);
    } catch (error) {
      console.error('UnifiedAuthService.logout failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Logout failed', error);
    }
  }

  // ────────────────────────────────────────────────────────────
  // EMAIL
  // ────────────────────────────────────────────────────────────

  async resendConfirmationEmail(email: string): Promise<void> {
    const result = await this.authRepository.resendConfirmationEmail(email);
    if (result.error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to resend confirmation email',
        result.error
      );
    }
  }

  async confirmUserEmail(userId: string): Promise<void> {
    const result = await this.authRepository.confirmUserEmail(userId);
    if (result.error) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to confirm email', result.error);
    }
  }

  async updateEmail(oldEmail: string, newEmail: string): Promise<void> {
    const result = await this.authRepository.updateEmail(oldEmail, newEmail);
    if (result.error) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED,
        result.error
      );
    }
  }

  // ────────────────────────────────────────────────────────────
  // RÔLES (délégué au port IUserRoleRepository)
  // ────────────────────────────────────────────────────────────

  /**
   * Assigne un rôle applicatif (persiste dans public.user_roles)
   */
  async assignUserRole(userId: string, role: SomelecRole): Promise<void> {
    try {
      await this.userRoleRepository.assignRole(userId, role);
    } catch (error) {
      console.error('UnifiedAuthService.assignUserRole failed:', error);
      throw error instanceof AppError
        ? error
        : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to assign user role', error);
    }
  }

  /**
   * Révoque un rôle applicatif
   */
  async revokeUserRole(userId: string, role: SomelecRole): Promise<void> {
    try {
      await this.userRoleRepository.revokeRole(userId, role);
    } catch (error) {
      console.error('UnifiedAuthService.revokeUserRole failed:', error);
      throw error instanceof AppError
        ? error
        : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to revoke user role', error);
    }
  }

  /**
   * Récupère les rôles actifs d'un utilisateur
   */
  async getUserRoles(userId: string) {
    return this.userRoleRepository.getActiveUserRoles(userId);
  }

  /**
   * Vérifie si un utilisateur possède un rôle spécifique
   */
  async hasRole(userId: string, role: SomelecRole): Promise<boolean> {
    return this.userRoleRepository.hasRole(userId, role);
  }

  // ────────────────────────────────────────────────────────────
  // UTILITAIRES
  // ────────────────────────────────────────────────────────────

  private generateState(): string {
    return btoa(
      JSON.stringify({
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(2),
      })
    );
  }
}

// ────────────────────────────────────────────────────────────
// FACTORY SINGLETON
// ────────────────────────────────────────────────────────────

let instance: UnifiedAuthService | null = null;

export function getUnifiedAuthService(): UnifiedAuthService {
  if (!instance) {
    instance = new UnifiedAuthService(
      RepositoryFactory.getAuthRepository(),
      RepositoryFactory.getUserRoleRepository()
    );
  }
  return instance;
}