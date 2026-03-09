/**
 * Unified Auth Service
 * Implements unified authentication logic for multiple providers
 * Following hexagonal architecture principles from PROMPTS.md
 * UI Component → Transformer → DTO (camelCase) → Service → Domain ← Adapter(snake_case) → DB
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { AUTH_ERROR_MESSAGES } from '@/config/auth';
import { AuthProvider } from '@/config/app';
import { supabase } from '@/integrations/supabase/client';
import { OAuthProviderService, OAuthProvider } from './OAuthProviderService';
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
    this.oAuthService = new OAuthProviderService();
  }

  /**
   * Get current session with provider info
   */
  async getCurrentSession(): Promise<{ user: UnifiedAuthUser | null; session: UnifiedAuthSession | null }> {
    try {
      const result = await this.authRepository.getCurrentSession();
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session', result.error);
      }

      if (!result.session) {
        return { user: null, session: null };
      }

      // Get profile data with provider info
      const profile = await this.getUserProfile(result.session.user.id);
      
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
        createdAt: result.session.user.created_at,
        updatedAt: profile?.updated_at
      };

      const unifiedSession: UnifiedAuthSession = {
        accessToken: result.session.access_token,
        refreshToken: result.session.refresh_token,
        expiresAt: result.session.expires_at,
        user: unifiedUser,
        provider: profile?.auth_provider as AuthProvider || 'supabase'
      };

      return { user: unifiedUser, session: unifiedSession };
    } catch (error) {
      console.error('UnifiedAuthService.getCurrentSession failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get current session', error);
    }
  }

  /**
   * Standard email/password login
   */
  async login(credentials: LoginCredentials): Promise<{ user: UnifiedAuthUser | null; session: UnifiedAuthSession | null }> {
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
      // Get OAuth provider configuration
      const provider = await this.oAuthService.getOAuthProviderByName(oAuthData.provider);
      if (!provider || !provider.enabled) {
        throw new AppError(ErrorCode.PROVIDER_NOT_ENABLED, `OAuth provider ${oAuthData.provider} is not enabled`);
      }

      // Exchange code for tokens
      const tokens = await this.oAuthService.exchangeOAuthCode(
        provider,
        oAuthData.code,
        oAuthData.redirectUri
      );

      // Get user info from OAuth provider
      const userInfo = await this.oAuthService.getOAuthUserInfo(provider, tokens.accessToken);

      // Sign in with Supabase using OAuth
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: oAuthData.provider as any,
        token: tokens.accessToken,
        nonce: oAuthData.state
      });

      if (error) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'OAuth login failed', error);
      }

      if (!data.session) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'No session created from OAuth login');
      }

      // Update profile with OAuth data
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
      
      if (result.error) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Registration failed', result.error);
      }

      return result.user ? await this.transformToUnifiedUser(result.user) : null;
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
      
      if (result.error) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to logout', result.error);
      }

      // Clear auth sessions
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

  // Private helper methods
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      return null;
    }
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
      // Don't throw here - profile update failure shouldn't block login
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
      // Don't throw - session cleanup failure shouldn't block logout
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
      createdAt: authUser.created_at,
      updatedAt: profile?.updated_at
    };
  }
}