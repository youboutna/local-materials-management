/**
 * KeycloakAuthAdapter
 * Adapter pour l'authentification Keycloak
 * Architecture hexagonale pure - implémentation technique uniquement
 */

import { AuthUser, AuthProvider, AuthUserStatus } from '@/domain/entities/AuthUser';
import { IAuthRepository, SignInCredentials, SignUpData, AuthSession, AuthProviderConfig } from '@/domain/repositories/IAuthRepositoryMulti';
import { AppError, ErrorLogger, ErrorCode } from '@/utils/errorHandling';

interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  clientSecret?: string;
}

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  session_state?: string;
  scope?: string;
}

interface KeycloakUserInfo {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  preferred_username?: string;
  email_verified?: boolean;
}

export class KeycloakAuthAdapter implements IAuthRepository {
  private config?: KeycloakConfig;

  constructor(config?: KeycloakConfig) {
    this.config = config;
  }

  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Keycloak adapter not configured');
    }

    try {
      const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret || '',
          username: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_SIGNIN_ERROR, 'Keycloak authentication failed');
      }

      const tokenData: KeycloakTokenResponse = await response.json();

      // Récupérer les informations utilisateur
      const userInfo = await this.getUserInfo(tokenData.access_token);

      return {
        user: this.mapKeycloakUserToAuthUser(userInfo),
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        provider: AuthProvider.KEYCLOAK
      };
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_SIGNIN_ERROR, 'Failed to sign in with Keycloak', error), 
        'KeycloakAuthAdapter.signIn failed'
      );
      throw new AppError(ErrorCode.AUTH_SIGNIN_ERROR, 'Failed to sign in with Keycloak');
    }
  }

  async signUp(userData: SignUpData): Promise<AuthUser> {
    // Keycloak utilise généralement des workflows d'inscription externes
    throw new AppError(ErrorCode.AUTH_SIGNUP_ERROR, 'User registration not supported through Keycloak adapter');
  }

  async signOut(sessionId: string): Promise<void> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Keycloak adapter not configured');
    }

    try {
      ErrorLogger.log(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Keycloak signOut called', { sessionId }),
        'KeycloakAuthAdapter.signOut called'
      );
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_SIGNOUT_ERROR, 'Failed to sign out from Keycloak', error), 
        'KeycloakAuthAdapter.signOut failed'
      );
      throw new AppError(ErrorCode.AUTH_SIGNOUT_ERROR, 'Failed to sign out from Keycloak');
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return null;
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Keycloak adapter not configured');
    }

    try {
      const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret || '',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_SESSION_REFRESH_ERROR, 'Keycloak token refresh failed');
      }

      const tokenData: KeycloakTokenResponse = await response.json();

      const userInfo = await this.getUserInfo(tokenData.access_token);

      return {
        user: this.mapKeycloakUserToAuthUser(userInfo),
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        provider: AuthProvider.KEYCLOAK
      };
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_SESSION_REFRESH_ERROR, 'Failed to refresh Keycloak session', error), 
        'KeycloakAuthAdapter.refreshSession failed'
      );
      throw new AppError(ErrorCode.AUTH_SESSION_REFRESH_ERROR, 'Failed to refresh Keycloak session');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/userinfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Keycloak token validation failed', error), 
        'KeycloakAuthAdapter.validateToken failed'
      );
      return false;
    }
  }

  async resetPassword(email: string): Promise<void> {
    throw new AppError(ErrorCode.AUTH_PASSWORD_RESET_ERROR, 'Password reset not supported through Keycloak adapter');
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    throw new AppError(ErrorCode.AUTH_PASSWORD_RESET_ERROR, 'Password reset not supported through Keycloak adapter');
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    throw new AppError(ErrorCode.AUTH_PASSWORD_CHANGE_ERROR, 'Password change not supported through Keycloak adapter');
  }

  async updateUserStatus(userId: string, status: AuthUserStatus): Promise<void> {
    throw new AppError(ErrorCode.AUTH_USER_UPDATE_ERROR, 'User status update not supported through Keycloak adapter');
  }

  async updateUserMetadata(userId: string, metadata: Record<string, unknown>): Promise<void> {
    throw new AppError(ErrorCode.AUTH_USER_UPDATE_ERROR, 'User metadata update not supported through Keycloak adapter');
  }

  async getProviderConfig(provider: AuthProvider): Promise<AuthProviderConfig | null> {
    if (provider !== AuthProvider.KEYCLOAK) {
      return null;
    }

    return {
      name: AuthProvider.KEYCLOAK,
      displayName: 'Keycloak Auth',
      isEnabled: !!this.config,
      config: this.config || {}
    };
  }

  async testProviderConnection(provider: AuthProvider): Promise<boolean> {
    if (provider !== AuthProvider.KEYCLOAK || !this.config) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.url}/realms/${this.config.realm}/.well-known/openid-configuration`);
      return response.ok;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Keycloak provider connection test failed', error), 
        'KeycloakAuthAdapter.testProviderConnection failed'
      );
      return false;
    }
  }

  async getAvailableProviders(): Promise<AuthProvider[]> {
    return [AuthProvider.KEYCLOAK];
  }

  async searchUsers(criteria: {
    email?: string;
    fullName?: string;
    provider?: AuthProvider;
    status?: AuthUserStatus;
    limit?: number;
    offset?: number;
  }): Promise<AuthUser[]> {
    throw new AppError(ErrorCode.AUTH_USER_SEARCH_ERROR, 'User search not supported through Keycloak adapter');
  }

  async countUsers(criteria: {
    provider?: AuthProvider;
    status?: AuthUserStatus;
  }): Promise<number> {
    throw new AppError(ErrorCode.AUTH_USER_COUNT_ERROR, 'User count not supported through Keycloak adapter');
  }

  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    throw new AppError(ErrorCode.AUTH_EMAIL_CHECK_ERROR, 'Email check not supported through Keycloak adapter');
  }

  private async getUserInfo(accessToken: string): Promise<KeycloakUserInfo> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Keycloak adapter not configured');
    }

    const response = await fetch(`${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/userinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new AppError(ErrorCode.AUTH_USER_INFO_ERROR, 'Failed to get user info from Keycloak');
    }

    return await response.json();
  }

  private mapKeycloakUserToAuthUser(keycloakUser: KeycloakUserInfo): AuthUser {
    return new AuthUser(
      keycloakUser.sub,
      keycloakUser.email,
      AuthProvider.KEYCLOAK,
      AuthUserStatus.ACTIVE,
      {
        email_verified: keycloakUser.email_verified,
        given_name: keycloakUser.given_name,
        family_name: keycloakUser.family_name,
        preferred_username: keycloakUser.preferred_username,
        name: keycloakUser.name,
        phone_number: keycloakUser.phone_number
      },
      new Date(),
      new Date(),
      new Date()
    );
  }
}
