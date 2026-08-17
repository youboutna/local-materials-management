import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * Unified Auth Service
 * Implements unified authentication logic for multiple providers
 * CORRIGÉ : getCurrentSession ne bloque plus sur erreur de session
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { AUTH_ERROR_MESSAGES } from '@/config/auth';
import { AuthProvider } from '@/config/app';
import { supabase } from '@/integrations/supabase/client';
import { DEV_MODE, DEV_USER, getActiveDevRole } from '@/config/constants';
import { OAuthProviderService } from './OAuthProviderService';
import type { OAuthProvider } from '@/domain/repositories/IOAuthProviderRepository';
import { getOAuthProviderService } from '@/application/services/OAuthProviderService';
import { 
  IAuthRepository, 
  AuthUser, 
  AuthSession, 
  LoginCredentials, 
  RegisterData 
} from '@/domain/repositories/IAuthRepository';

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
}

export interface UnifiedAuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
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

  /**
   * DEV MODE bypass
   */
  private buildDevSession(): { user: UnifiedAuthUser; session: UnifiedAuthSession } {
    const role = getActiveDevRole().role;
    const nowIso = new Date().toISOString();
    const unifiedUser: UnifiedAuthUser = {
      id: DEV_USER.id,
      email: DEV_USER.email,
      fullName: DEV_USER.user_metadata.full_name,
      phone: DEV_USER.user_metadata.phone,
      nationalId: DEV_USER.user_metadata.national_id,
      role,
      authProvider: 'dev',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const unifiedSession: UnifiedAuthSession = {
      accessToken: 'dev-mode-token',
      refreshToken: 'dev-mode-refresh',
      expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
      user: unifiedUser,
      provider: 'supabase',
    };
    return { user: unifiedUser, session: unifiedSession };
  }

  private toUnifiedSessionFromAdapter(
    session: AuthSession
  ): { user: UnifiedAuthUser; session: UnifiedAuthSession } {
    const unifiedUser: UnifiedAuthUser = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.full_name,
      phone: session.user.phone,
      nationalId: session.user.national_id,
      role: session.user.role,
      authProvider: 'dev',
      createdAt: session.user.created_at || new Date().toISOString(),
      updatedAt: session.user.updated_at,
    };
    const unifiedSession: UnifiedAuthSession = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      user: unifiedUser,
      provider: 'supabase',
    };
    return { user: unifiedUser, session: unifiedSession };
  }

  /**
   * Get current session with provider info
   * 🔥 CORRIGÉ : retourne null sans erreur si aucune session ou erreur non critique
   */
  async getCurrentSession(): Promise<{ user: UnifiedAuthUser | null; session: UnifiedAuthSession | null }> {
    if (DEV_MODE) {
      const result = await this.authRepository.getCurrentSession();
      if (!result.session) return { user: null, session: null };
      return this.toUnifiedSessionFromAdapter(result.session);
    }
    try {
      const result = await this.authRepository.getCurrentSession();
      
      // ✅ Si l'adaptateur renvoie une erreur, on loggue mais on ne bloque pas
      if (result.error) {
        console.warn('AuthRepository getCurrentSession error (non-fatale):', result.error);
        return { user: null, session: null };
      }

      if (!result.session) {
        return { user: null, session: null };
      }

      // Récupération du profil (optionnel, peut échouer)
      let profile = null;
      try {
        profile = await this.getUserProfile(result.session.user.id);
      } catch (profileError) {
        console.warn('Could not fetch profile, using session data:', profileError);
      }

      const unifiedUser: UnifiedAuthUser = {
        id: result.session.user.id,
        email: result.session.user.email,
        fullName: profile?.full_name || result.session.user.full_name,
        phone: result.session.user.phone,
        nationalId: profile?.national_id || result.session.user.national_id,
        role: profile?.role || result.session.user.role,
        avatarUrl: profile?.avatar_url,
        authProvider: profile?.auth_provider || 'supabase',
        providerId: profile?.provider_id,
        providerData: profile?.provider_data,
        createdAt: result.session.user.created_at || new Date().toISOString(),
        updatedAt: profile?.updated_at
      };

      const unifiedSession: UnifiedAuthSession = {
        accessToken: result.session.access_token,
        refreshToken: result.session.refresh_token,
        expiresAt: result.session.expires_at,
        user: unifiedUser,
        provider: (profile?.auth_provider as AuthProvider) || 'supabase'
      };

      return { user: unifiedUser, session: unifiedSession };
    } catch (error) {
      console.error('UnifiedAuthService.getCurrentSession unexpected error:', error);
      // ✅ On retourne null plutôt que de lever une exception
      return { user: null, session: null };
    }
  }

  /**
   * Standard email/password login
   */
  async login(credentials: LoginCredentials): Promise<{ user: UnifiedAuthUser | null; session: UnifiedAuthSession | null }> {
    if (DEV_MODE) {
      const normalized: LoginCredentials = {
        ...credentials,
        email: String(credentials.email || '').trim(),
      };
      const result = await this.authRepository.signIn(normalized);
      if (result.error || !result.session) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
          result.error ?? undefined
        );
      }
      return this.toUnifiedSessionFromAdapter(result.session);
    }
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
      if (!result.session) return { user: null, session: null };
      return await this.getCurrentSession();
    } catch (error) {
      console.error('UnifiedAuthService.login failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Login failed', error);
    }
  }

  /**
   * OAuth provider login
   */
  async loginWithOAuth(oAuthData: OAuthLoginData): Promise<{ user: UnifiedAuthUser | null; session: UnifiedAuthSession | null }> {
    try {
      const provider = await this.oAuthService.getOAuthProviderByName(oAuthData.provider);
      if (!provider || !provider.enabled) {
        throw new AppError(ErrorCode.PROVIDER_NOT_ENABLED, `OAuth provider ${oAuthData.provider} is not enabled`);
      }
      const tokens = await this.oAuthService.exchangeOAuthCode(
        provider,
        oAuthData.code,
        oAuthData.redirectUri
      );
      const userInfo = await this.oAuthService.getOAuthUserInfo(provider, tokens.accessToken);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: oAuthData.provider as any,
        token: tokens.accessToken,
        nonce: oAuthData.state
      });
      if (error) throw new AppError(ErrorCode.UNAUTHORIZED, 'OAuth login failed', error);
      if (!data.session) throw new AppError(ErrorCode.INTERNAL_ERROR, 'No session created from OAuth login');
      await this.updateProfileWithOAuthData(data.user!.id, oAuthData.provider, userInfo, tokens);
      return await this.getCurrentSession();
    } catch (error) {
      console.error('UnifiedAuthService.loginWithOAuth failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'OAuth login failed', error);
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<UnifiedAuthUser | null> {
    try {
      const result = await this.authRepository.signUp(data);
      if (result.error) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Registration failed', result.error);
      if (!result.user) return null;
      return await this.transformToUnifiedUser(result.user);
    } catch (error) {
      console.error('UnifiedAuthService.register failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Registration failed', error);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const result = await this.authRepository.signOut();
      if (result.error) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout', result.error);
      await this.clearAuthSessions();
    } catch (error) {
      console.error('UnifiedAuthService.logout failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout', error);
    }
  }

  /**
   * Get OAuth providers for login UI
   */
  async getAvailableOAuthProviders(): Promise<OAuthProvider[]> {
    return await this.oAuthService.getEnabledOAuthProviders();
  }

  /**
   * Generate OAuth login URL
   */
  async generateOAuthLoginUrl(providerName: string, redirectUri: string): Promise<string> {
    const provider = await this.oAuthService.getOAuthProviderByName(providerName);
    if (!provider || !provider.enabled) {
      throw new AppError(ErrorCode.PROVIDER_NOT_ENABLED, `OAuth provider ${providerName} is not available`);
    }
    const state = this.generateState();
    return this.oAuthService.generateOAuthUrl(provider, redirectUri, state);
  }

  /**
   * 🔥 Met à jour l'email d'un utilisateur sans session (via Edge Function)
   */
  async updateEmail(oldEmail: string, newEmail: string): Promise<void> {
    try {
      const result = await this.authRepository.updateEmail(oldEmail, newEmail);
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED, result.error);
      }
    } catch (error) {
      console.error('UnifiedAuthService.updateEmail failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, AUTH_ERROR_MESSAGES.EMAIL_UPDATE_FAILED, error);
    }
  }

  // Private helpers
  private async getUserProfile(userId: string): Promise<any> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        return data ?? null;
      } catch (error) {
        const message = error instanceof Error ? error.message : String((error as any)?.message ?? error);
        const isNetworkError = /NetworkError|Failed to fetch|network/i.test(message);
        if (attempt < maxAttempts && isNetworkError) {
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
          continue;
        }
        if (!isNetworkError) console.warn('Failed to fetch user profile:', message);
        return null;
      }
    }
    return null;
  }

  private async updateProfileWithOAuthData(
    userId: string, 
    provider: string, 
    userInfo: any, 
    tokens: any
  ): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: userInfo.name || userInfo.display_name,
          avatar_url: userInfo.picture || userInfo.avatar_url,
          auth_provider: provider,
          provider_id: userInfo.id || userInfo.sub,
          provider_data: userInfo,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to update profile with OAuth data:', error);
    }
  }

  private async clearAuthSessions(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase
          .from('auth_sessions')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.warn('Failed to clear auth sessions:', error);
    }
  }

  private generateState(): string {
    return btoa(JSON.stringify({
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2)
    }));
  }

  private async transformToUnifiedUser(authUser: AuthUser): Promise<UnifiedAuthUser> {
    const profile = await this.getUserProfile(authUser.id);
    return {
      id: authUser.id,
      email: authUser.email,
      fullName: profile?.full_name || authUser.full_name,
      phone: authUser.phone,
      nationalId: profile?.national_id || authUser.national_id,
      role: profile?.role || authUser.role,
      avatarUrl: profile?.avatar_url,
      authProvider: profile?.auth_provider || 'supabase',
      providerId: profile?.provider_id,
      providerData: profile?.provider_data,
      createdAt: authUser.created_at || new Date().toISOString(),
      updatedAt: profile?.updated_at
    };
  }
}

let unifiedAuthServiceInstance: UnifiedAuthService | null = null;
export function getUnifiedAuthService(): UnifiedAuthService {
  if (!unifiedAuthServiceInstance) {
    unifiedAuthServiceInstance = new UnifiedAuthService(RepositoryFactory.getAuthRepository());
  }
  return unifiedAuthServiceInstance;
}