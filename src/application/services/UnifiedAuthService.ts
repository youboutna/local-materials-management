/**
 * UnifiedAuthService – Orchestrateur de l'authentification
 * Dépend de IAuthRepository (abstraction) – aucune dépendance directe à l'infrastructure
 * Utilise les entités domaine et les DTO via les transformateurs
 */

import { getOAuthProviderService } from '@/application/services/OAuthProviderService';
import { AuthProvider } from '@/config/app';
import { AUTH_ERROR_MESSAGES } from '@/config/auth';
import { DEV_MODE, DEV_USER, getActiveDevRole } from '@/config/constants';
import { UserProfile } from '@/domain/entities/UserProfile';
import { IAuthRepository, LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';
import type { OAuthProvider } from '@/domain/repositories/IOAuthProviderRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { OAuthProviderService } from './OAuthProviderService';

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
  // Alias / champs de compatibilité présentation (Keycloak, Supabase metadata)
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

export class UnifiedAuthService {
  private oAuthService: OAuthProviderService;

  constructor(private authRepository: IAuthRepository) {
    this.oAuthService = getOAuthProviderService();
  }

  // ========== DEV mode ==========
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
      provider: 'supabase'
    };
    return { user, session };
  }

  private toUnifiedSession(session: any, profile?: UserProfile): UnifiedAuthSession {
    // Le rôle provient de session.user (AuthUser) ou on peut le surcharger par le profil si isAdmin
    const roleFromSession = session.user.role || 'user';
    const roleFromProfile = profile?.isAdmin ? 'admin' : undefined;
    const finalRole = roleFromProfile || roleFromSession;

    const user: UnifiedAuthUser = {
      id: session.user.id,
      email: session.user.email,
      fullName: profile?.fullName || session.user.full_name,
      phone: profile?.phone || session.user.phone,
      nationalId: profile?.nationalId || session.user.national_id,
      role: finalRole,
      avatarUrl: profile?.avatarUrl,
      authProvider: 'supabase', // Le provider est fixe ici (peut être dérivé de session)
      createdAt: session.user.created_at || new Date().toISOString(),
      updatedAt: profile?.updatedAt?.toISOString() || session.user.updated_at,
      profile: profile || undefined,
      full_name: profile?.fullName || session.user.full_name,
      avatar_url: profile?.avatarUrl,
      national_id: profile?.nationalId || session.user.national_id,
      roles: finalRole ? [String(finalRole)] : [],
      user_metadata: {
        full_name: profile?.fullName || session.user.full_name,
        phone: profile?.phone || session.user.phone,
        national_id: profile?.nationalId || session.user.national_id,
        avatar_url: profile?.avatarUrl,
        role: finalRole,
      },
      metadata: {},
    };
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      expires_at: session.expires_at,
      user,
      provider: 'supabase'
    };
  }

  /**
   * Hydrate les rôles applicatifs (public.user_roles) dans la session.
   * Source de vérité unique des permissions — jamais dérivée du profil.
   */
  private static readonly ROLE_PRIORITY = [
    'super_admin', 'admin', 'director', 'manager', 'project_manager',
    'consultant', 'engineering_consultant', 'inspector', 'supplier', 'user',
  ];

  private async hydrateRoles(session: UnifiedAuthSession): Promise<UnifiedAuthSession> {
    try {
      const { SupabaseUserRoleAdapter } = await import('@/infrastructure/adapters/supabase/SupabaseUserRoleAdapter');
      const roles = await new SupabaseUserRoleAdapter().getUserRoles(session.user.id);
      const roleNames = Array.from(new Set(roles.map((r) => String(r.roleName).toLowerCase()))).filter(Boolean);
      if (roleNames.length === 0) return session;

      const primary =
        UnifiedAuthService.ROLE_PRIORITY.find((r) => roleNames.includes(r)) || roleNames[0];

      const user: UnifiedAuthUser = {
        ...session.user,
        role: primary,
        roles: roleNames,
        user_metadata: { ...(session.user as any).user_metadata, role: primary },
      };
      return { ...session, user };
    } catch (error) {
      console.warn('UnifiedAuthService.hydrateRoles failed, fallback on session role:', error);
      return session;
    }
  }

  // ========== Méthodes publiques ==========
  async getCurrentSession(): Promise<{ user: UnifiedAuthUser | null; session: UnifiedAuthSession | null }> {
    if (DEV_MODE) {
      const { user, session } = this.buildDevSession();
      return { user, session };
    }
    try {
      const result = await this.authRepository.getCurrentSession();
      if (result.error || !result.session) return { user: null, session: null };
      const profileResult = await this.authRepository.getProfile(result.session.user.id);
      const unifiedSession = await this.hydrateRoles(
        this.toUnifiedSession(result.session, profileResult.profile || undefined),
      );
      return { user: unifiedSession.user, session: unifiedSession };
    } catch (error) {
      console.error('UnifiedAuthService.getCurrentSession error:', error);
      return { user: null, session: null };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: UnifiedAuthUser | null; session: UnifiedAuthSession | null }> {
    if (DEV_MODE) {
      const result = await this.authRepository.signIn(credentials);
      if (result.error || !result.session) throw new AppError(ErrorCode.UNAUTHORIZED, AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS, result.error);
      const { user, session } = this.buildDevSession();
      return { user, session };
    }
    try {
      const result = await this.authRepository.signIn(credentials);
      if (result.error) {
        const msg = result.error.message || '';
        if (msg.includes('Invalid login credentials')) throw new AppError(ErrorCode.UNAUTHORIZED, AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS, result.error);
        if (msg.toLowerCase().includes('email not confirmed')) throw new AppError(ErrorCode.UNAUTHORIZED, AUTH_ERROR_MESSAGES.EMAIL_NOT_CONFIRMED, result.error);
        throw new AppError(ErrorCode.UNAUTHORIZED, AUTH_ERROR_MESSAGES.CONNECTION_FAILED, result.error);
      }
      if (!result.session) return { user: null, session: null };
      const profileResult = await this.authRepository.getProfile(result.session.user.id);
      const unifiedSession = await this.hydrateRoles(
        this.toUnifiedSession(result.session, profileResult.profile || undefined),
      );
      return { user: unifiedSession.user, session: unifiedSession };
    } catch (error) {
      console.error('UnifiedAuthService.login failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Login failed', error);
    }
  }

  async loginWithOAuth(oAuthData: OAuthLoginData): Promise<{ user: UnifiedAuthUser | null; session: UnifiedAuthSession | null }> {
    try {
      const provider = await this.oAuthService.getOAuthProviderByName(oAuthData.provider);
      if (!provider || !provider.enabled) throw new AppError(ErrorCode.PROVIDER_NOT_ENABLED, `Provider ${oAuthData.provider} not enabled`);
      const tokens = await this.oAuthService.exchangeOAuthCode(provider, oAuthData.code, oAuthData.redirectUri);
      const userInfo = await this.oAuthService.getOAuthUserInfo(provider, tokens.accessToken);
      const signInResult = await this.authRepository.signInWithIdToken({
        provider: oAuthData.provider,
        token: tokens.accessToken,
        nonce: oAuthData.state
      });
      if (signInResult.error || !signInResult.session) throw new AppError(ErrorCode.UNAUTHORIZED, 'OAuth login failed', signInResult.error);
      // Create/update profile
      const profile = UserProfile.create(
        signInResult.session.user.id,
        signInResult.session.user.id,
        userInfo.name || userInfo.display_name || 'Unknown',
        userInfo.phone,
        userInfo.national_id
      );
      if (userInfo.picture) profile.updateAvatarUrl(userInfo.picture);
      await this.authRepository.upsertProfile(profile);
      const unifiedSession = await this.hydrateRoles(this.toUnifiedSession(signInResult.session, profile));
      return { user: unifiedSession.user, session: unifiedSession };
    } catch (error) {
      console.error('UnifiedAuthService.loginWithOAuth failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'OAuth login failed', error);
    }
  }

  async register(data: RegisterData): Promise<UnifiedAuthUser | null> {
    try {
      const result = await this.authRepository.signUp(data);
      if (result.error || !result.user) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Registration failed', result.error);
      // Create profile
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
        profile
      };
      return user;
    } catch (error) {
      console.error('UnifiedAuthService.register failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Registration failed', error);
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

  async getAvailableOAuthProviders(): Promise<OAuthProvider[]> {
    return this.oAuthService.getEnabledOAuthProviders();
  }

  async generateOAuthLoginUrl(providerName: string, redirectUri: string): Promise<string> {
    const provider = await this.oAuthService.getOAuthProviderByName(providerName);
    if (!provider || !provider.enabled) throw new AppError(ErrorCode.PROVIDER_NOT_ENABLED, `Provider ${providerName} not available`);
    return this.oAuthService.generateOAuthUrl(provider, redirectUri, this.generateState());
  }

  async resendConfirmationEmail(email: string): Promise<void> {
    const result = await this.authRepository.resendConfirmationEmail(email);
    if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to resend confirmation email', result.error);
  }

  async confirmUserEmail(userId: string): Promise<void> {
    const result = await this.authRepository.confirmUserEmail(userId);
    if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to confirm email', result.error);
  }

  async getCurrentUser(): Promise<{ user: UnifiedAuthUser | null }> {
    const { user } = await this.getCurrentSession();
    return { user };
  }

  async updateEmail(oldEmail: string, newEmail: string): Promise<void> {
    const result = await this.authRepository.updateEmail(oldEmail, newEmail);
    if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED, result.error);
  }

  private generateState(): string {
    return btoa(JSON.stringify({ timestamp: Date.now(), random: Math.random().toString(36).substring(2) }));
  }
}

let instance: UnifiedAuthService | null = null;
export function getUnifiedAuthService(): UnifiedAuthService {
  if (!instance) {
    instance = new UnifiedAuthService(RepositoryFactory.getAuthRepository());
  }
  return instance;
}