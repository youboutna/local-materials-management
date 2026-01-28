/**
 * Auth0Adapter
 * Adapter pour l'authentification Auth0
 * Architecture hexagonale pure - implémentation technique uniquement
 */

import { AuthUser, AuthProvider, AuthUserStatus } from '@/domain/entities/AuthUser';
import { IAuthRepository, SignInCredentials, SignUpData, AuthSession, AuthProviderConfig } from '@/domain/repositories/IAuthRepositoryMulti';
import { AppError, ErrorLogger, ErrorCode } from '@/utils/errorHandling';

interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret?: string;
  audience?: string;
}

interface Auth0TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface Auth0UserInfo {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  picture?: string;
  email_verified?: boolean;
  nickname?: string;
  updated_at?: string;
}

export class Auth0Adapter implements IAuthRepository {
  private config?: Auth0Config;

  constructor(config?: Auth0Config) {
    this.config = config;
  }

  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    try {
      const response = await fetch(`https://${this.config.domain}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'password',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret || '',
          username: credentials.email,
          password: credentials.password,
          audience: this.config.audience || `https://${this.config.domain}/api/v2/`,
          scope: 'openid profile email'
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_SIGNIN_ERROR, 'Auth0 authentication failed');
      }

      const tokenData: Auth0TokenResponse = await response.json();

      const userInfo = await this.getUserInfo(tokenData.access_token);

      return {
        user: this.mapAuth0UserToAuthUser(userInfo),
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        provider: AuthProvider.AUTH0
      };
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_SIGNIN_ERROR, 'Failed to sign in with Auth0', error), 
        'Auth0Adapter.signIn failed'
      );
      throw new AppError(ErrorCode.AUTH_SIGNIN_ERROR, 'Failed to sign in with Auth0');
    }
  }

  async signUp(userData: SignUpData): Promise<AuthUser> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    try {
      const response = await fetch(`https://${this.config.domain}/dbconnections/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          email: userData.email,
          password: userData.password,
          connection: 'Username-Password-Authentication',
          user_metadata: {
            full_name: userData.fullName,
            phone: userData.phone,
            national_id: userData.nationalId
          }
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_SIGNUP_ERROR, 'Auth0 registration failed');
      }

      const result = await response.json();

      return new AuthUser(
        result.user_id || result.sub,
        userData.email,
        AuthProvider.AUTH0,
        AuthUserStatus.PENDING,
        {
          email_verified: false,
          created_via: 'auth0_adapter',
          full_name: userData.fullName,
          phone: userData.phone,
          national_id: userData.nationalId
        },
        new Date(),
        new Date()
      );
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_SIGNUP_ERROR, 'Failed to sign up with Auth0', error), 
        'Auth0Adapter.signUp failed'
      );
      throw new AppError(ErrorCode.AUTH_SIGNUP_ERROR, 'Failed to sign up with Auth0');
    }
  }

  async signOut(sessionId: string): Promise<void> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    try {
      ErrorLogger.log(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Auth0 signOut called', { sessionId }),
        'Auth0Adapter.signOut called'
      );
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_SIGNOUT_ERROR, 'Failed to sign out from Auth0', error), 
        'Auth0Adapter.signOut failed'
      );
      throw new AppError(ErrorCode.AUTH_SIGNOUT_ERROR, 'Failed to sign out from Auth0');
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return null;
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    try {
      const response = await fetch(`https://${this.config.domain}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret || '',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_SESSION_REFRESH_ERROR, 'Auth0 token refresh failed');
      }

      const tokenData: Auth0TokenResponse = await response.json();

      const userInfo = await this.getUserInfo(tokenData.access_token);

      return {
        user: this.mapAuth0UserToAuthUser(userInfo),
        token: tokenData.access_token,
        refreshToken: tokenData.refresh_token || '',
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        provider: AuthProvider.AUTH0
      };
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_SESSION_REFRESH_ERROR, 'Failed to refresh Auth0 session', error), 
        'Auth0Adapter.refreshSession failed'
      );
      throw new AppError(ErrorCode.AUTH_SESSION_REFRESH_ERROR, 'Failed to refresh Auth0 session');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    try {
      const response = await fetch(`https://${this.config.domain}/userinfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Auth0 token validation failed', error), 
        'Auth0Adapter.validateToken failed'
      );
      return false;
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    try {
      const response = await fetch(`https://${this.config.domain}/dbconnections/change_password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          email: email,
          connection: 'Username-Password-Authentication'
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_PASSWORD_RESET_ERROR, 'Auth0 password reset failed');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_PASSWORD_RESET_ERROR, 'Failed to reset password with Auth0', error), 
        'Auth0Adapter.resetPassword failed'
      );
      throw new AppError(ErrorCode.AUTH_PASSWORD_RESET_ERROR, 'Failed to reset password with Auth0');
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    throw new AppError(ErrorCode.AUTH_PASSWORD_RESET_ERROR, 'Password reset confirmation not supported through Auth0 adapter');
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    try {
      const response = await fetch(`https://${this.config.domain}/api/v2/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getManagementToken()}`,
        },
        body: JSON.stringify({
          password: newPassword,
          connection: 'Username-Password-Authentication'
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_PASSWORD_CHANGE_ERROR, 'Auth0 password change failed');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_PASSWORD_CHANGE_ERROR, 'Failed to change password with Auth0', error), 
        'Auth0Adapter.changePassword failed'
      );
      throw new AppError(ErrorCode.AUTH_PASSWORD_CHANGE_ERROR, 'Failed to change password with Auth0');
    }
  }

  async updateUserStatus(userId: string, status: AuthUserStatus): Promise<void> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    try {
      const response = await fetch(`https://${this.config.domain}/api/v2/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getManagementToken()}`,
        },
        body: JSON.stringify({
          user_metadata: {
            status: status
          }
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_USER_UPDATE_ERROR, 'Auth0 user status update failed');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_USER_UPDATE_ERROR, 'Failed to update user status with Auth0', error), 
        'Auth0Adapter.updateUserStatus failed'
      );
      throw new AppError(ErrorCode.AUTH_USER_UPDATE_ERROR, 'Failed to update user status with Auth0');
    }
  }

  async updateUserMetadata(userId: string, metadata: Record<string, unknown>): Promise<void> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    try {
      const response = await fetch(`https://${this.config.domain}/api/v2/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getManagementToken()}`,
        },
        body: JSON.stringify({
          user_metadata: metadata
        }),
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_USER_UPDATE_ERROR, 'Auth0 user metadata update failed');
      }
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_USER_UPDATE_ERROR, 'Failed to update user metadata with Auth0', error), 
        'Auth0Adapter.updateUserMetadata failed'
      );
      throw new AppError(ErrorCode.AUTH_USER_UPDATE_ERROR, 'Failed to update user metadata with Auth0');
    }
  }

  async getProviderConfig(provider: AuthProvider): Promise<AuthProviderConfig | null> {
    if (provider !== AuthProvider.AUTH0) {
      return null;
    }

    return {
      name: AuthProvider.AUTH0,
      displayName: 'Auth0',
      isEnabled: !!this.config,
      config: this.config || {}
    };
  }

  async testProviderConnection(provider: AuthProvider): Promise<boolean> {
    if (provider !== AuthProvider.AUTH0 || !this.config) {
      return false;
    }

    try {
      const response = await fetch(`https://${this.config.domain}/.well-known/openid-configuration`);
      return response.ok;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Auth0 provider connection test failed', error), 
        'Auth0Adapter.testProviderConnection failed'
      );
      return false;
    }
  }

  async getAvailableProviders(): Promise<AuthProvider[]> {
    return [AuthProvider.AUTH0];
  }

  async searchUsers(criteria: {
    email?: string;
    fullName?: string;
    provider?: AuthProvider;
    status?: AuthUserStatus;
    limit?: number;
    offset?: number;
  }): Promise<AuthUser[]> {
    if (!this.config || criteria.provider && criteria.provider !== AuthProvider.AUTH0) {
      return [];
    }

    try {
      const managementToken = await this.getManagementToken();
      let searchQuery = `q=*`;

      if (criteria.email) {
        searchQuery += ` AND email:"${criteria.email}"`;
      }
      if (criteria.fullName) {
        searchQuery += ` AND name:"${criteria.fullName}"`;
      }

      let url = `https://${this.config.domain}/api/v2/users?${searchQuery}`;
      
      if (criteria.limit) {
        url += `&per_page=${criteria.limit}`;
      }
      if (criteria.offset) {
        url += `&page=${Math.floor(criteria.offset / (criteria.limit || 50)) + 1}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
        },
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.AUTH_USER_SEARCH_ERROR, 'Auth0 user search failed');
      }

      const users: Auth0UserInfo[] = await response.json();
      
      let authUsers = users.map(user => this.mapAuth0UserToAuthUser(user));

      if (criteria.status) {
        authUsers = authUsers.filter(user => user.status === criteria.status);
      }

      return authUsers;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.AUTH_USER_SEARCH_ERROR, 'Failed to search users with Auth0', error), 
        'Auth0Adapter.searchUsers failed'
      );
      throw new AppError(ErrorCode.AUTH_USER_SEARCH_ERROR, 'Failed to search users with Auth0');
    }
  }

  async countUsers(criteria: {
    provider?: AuthProvider;
    status?: AuthUserStatus;
  }): Promise<number> {
    if (!this.config || criteria.provider && criteria.provider !== AuthProvider.AUTH0) {
      return 0;
    }

    try {
      const managementToken = await this.getManagementToken();
      let searchQuery = `q=*`;

      if (criteria.status) {
        searchQuery += ` AND user_metadata.status:"${criteria.status}"`;
      }

      const response = await fetch(`https://${this.config.domain}/api/v2/users?${searchQuery}&per_page=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
        },
      });

      if (!response.ok) {
        return 0;
      }

      const totalCount = response.headers.get('x-total-count');
      return totalCount ? parseInt(totalCount) : 0;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Auth0 user count failed', error), 
        'Auth0Adapter.countUsers failed'
      );
      return 0;
    }
  }

  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    if (!this.config) {
      return false;
    }

    try {
      const users = await this.searchUsers({ email, limit: 1 });
      
      if (excludeUserId) {
        return users.some(user => user.email === email && user.id !== excludeUserId);
      }
      
      return users.length > 0;
    } catch (error) {
      ErrorLogger.log(
        new AppError(ErrorCode.INTERNAL_ERROR, 'Auth0 email check failed', error), 
        'Auth0Adapter.isEmailTaken failed'
      );
      return false;
    }
  }

  private async getUserInfo(accessToken: string): Promise<Auth0UserInfo> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    const response = await fetch(`https://${this.config.domain}/userinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new AppError(ErrorCode.AUTH_USER_INFO_ERROR, 'Failed to get user info from Auth0');
    }

    return await response.json();
  }

  private async getManagementToken(): Promise<string> {
    if (!this.config) {
      throw new AppError(ErrorCode.AUTH_CONFIG_ERROR, 'Auth0 adapter not configured');
    }

    const response = await fetch(`https://${this.config.domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret || '',
        audience: `https://${this.config.domain}/api/v2/`
      }),
    });

    if (!response.ok) {
      throw new AppError(ErrorCode.AUTH_MANAGEMENT_TOKEN_ERROR, 'Failed to get Auth0 management token');
    }

    const tokenData = await response.json();
    return tokenData.access_token;
  }

  private mapAuth0UserToAuthUser(auth0User: Auth0UserInfo): AuthUser {
    return new AuthUser(
      auth0User.sub,
      auth0User.email,
      AuthProvider.AUTH0,
      AuthUserStatus.ACTIVE,
      {
        email_verified: auth0User.email_verified,
        given_name: auth0User.given_name,
        family_name: auth0User.family_name,
        nickname: auth0User.nickname,
        picture: auth0User.picture,
        name: auth0User.name,
        phone_number: auth0User.phone_number,
        updated_at: auth0User.updated_at
      },
      auth0User.updated_at ? new Date(auth0User.updated_at) : new Date(),
      new Date(),
      new Date()
    );
  }
}
