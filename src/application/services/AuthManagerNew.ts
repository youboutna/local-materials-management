/**
 * AuthManager
 * Service central pour la coordination multi-providers d'authentification
 * Architecture hexagonale pure - logique métier uniquement
 */

import { AuthUser, AuthProvider, AuthUserStatus } from '@/domain/entities/AuthUser';
import { IAuthRepository, SignInCredentials, SignUpData, AuthSession, AuthProviderConfig } from '@/domain/repositories/IAuthRepositoryMulti';
import { AppError, ErrorLogger, ErrorCode } from '@/utils/errorHandling';

export interface AuthManagerConfig {
  defaultProvider: AuthProvider;
  providers: {
    [key in AuthProvider]?: {
      enabled: boolean;
      config?: Record<string, unknown>;
    };
  };
  sessionTimeout?: number;
  allowProviderSwitching?: boolean;
}

export class AuthManager {
  private adapters: Map<AuthProvider, IAuthRepository> = new Map();
  private currentProvider: AuthProvider;
  private config: AuthManagerConfig;

  constructor(config: AuthManagerConfig) {
    this.config = config;
    this.currentProvider = config.defaultProvider;
  }

  registerAdapter(provider: AuthProvider, adapter: IAuthRepository): void {
    this.adapters.set(provider, adapter);
  }

  async signIn(credentials: SignInCredentials, provider?: AuthProvider): Promise<AuthSession> {
    const targetProvider = provider || this.currentProvider;
    const adapter = this.getAdapter(targetProvider);

    try {
      const session = await adapter.signIn(credentials);
      
      if (provider && provider !== this.currentProvider) {
        await this.switchProvider(provider);
      }

      ErrorLogger.log('info', 'AuthManager.signIn successful', { 
        provider: targetProvider, 
        userId: session.user.id 
      });

      return session;
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.signIn failed', { 
        provider: targetProvider, 
        error 
      });
      throw error;
    }
  }

  async signUp(userData: SignUpData, provider?: AuthProvider): Promise<AuthUser> {
    const targetProvider = provider || this.currentProvider;
    const adapter = this.getAdapter(targetProvider);

    try {
      const user = await adapter.signUp(userData);
      
      ErrorLogger.log('info', 'AuthManager.signUp successful', { 
        provider: targetProvider, 
        userId: user.id 
      });

      return user;
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.signUp failed', { 
        provider: targetProvider, 
        error 
      });
      throw error;
    }
  }

  async signOut(sessionId: string): Promise<void> {
    const adapter = this.getAdapter(this.currentProvider);

    try {
      await adapter.signOut(sessionId);
      
      ErrorLogger.log('info', 'AuthManager.signOut successful', { 
        provider: this.currentProvider 
      });
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.signOut failed', { 
        provider: this.currentProvider, 
        error 
      });
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const adapter = this.getAdapter(this.currentProvider);

    try {
      return await adapter.getCurrentUser();
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.getCurrentUser failed', { 
        provider: this.currentProvider, 
        error 
      });
      return null;
    }
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    const adapter = this.getAdapter(this.currentProvider);

    try {
      const session = await adapter.refreshSession(refreshToken);
      
      ErrorLogger.log('info', 'AuthManager.refreshSession successful', { 
        provider: this.currentProvider 
      });

      return session;
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.refreshSession failed', { 
        provider: this.currentProvider, 
        error 
      });
      throw error;
    }
  }

  async validateToken(token: string, provider?: AuthProvider): Promise<boolean> {
    const targetProvider = provider || this.currentProvider;
    const adapter = this.getAdapter(targetProvider);

    try {
      return await adapter.validateToken(token);
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.validateToken failed', { 
        provider: targetProvider, 
        error 
      });
      return false;
    }
  }

  async resetPassword(email: string, provider?: AuthProvider): Promise<void> {
    const targetProvider = provider || this.currentProvider;
    const adapter = this.getAdapter(targetProvider);

    try {
      await adapter.resetPassword(email);
      
      ErrorLogger.log('info', 'AuthManager.resetPassword successful', { 
        provider: targetProvider 
      });
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.resetPassword failed', { 
        provider: targetProvider, 
        error 
      });
      throw error;
    }
  }

  async confirmPasswordReset(token: string, newPassword: string, provider?: AuthProvider): Promise<void> {
    const targetProvider = provider || this.currentProvider;
    const adapter = this.getAdapter(targetProvider);

    try {
      await adapter.confirmPasswordReset(token, newPassword);
      
      ErrorLogger.log('info', 'AuthManager.confirmPasswordReset successful', { 
        provider: targetProvider 
      });
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.confirmPasswordReset failed', { 
        provider: targetProvider, 
        error 
      });
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const adapter = this.getAdapter(this.currentProvider);

    try {
      await adapter.changePassword(userId, currentPassword, newPassword);
      
      ErrorLogger.log('info', 'AuthManager.changePassword successful', { 
        provider: this.currentProvider 
      });
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.changePassword failed', { 
        provider: this.currentProvider, 
        error 
      });
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: AuthUserStatus): Promise<void> {
    const adapter = this.getAdapter(this.currentProvider);

    try {
      await adapter.updateUserStatus(userId, status);
      
      ErrorLogger.log('info', 'AuthManager.updateUserStatus successful', { 
        provider: this.currentProvider 
      });
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.updateUserStatus failed', { 
        provider: this.currentProvider, 
        error 
      });
      throw error;
    }
  }

  async updateUserMetadata(userId: string, metadata: Record<string, unknown>): Promise<void> {
    const adapter = this.getAdapter(this.currentProvider);

    try {
      await adapter.updateUserMetadata(userId, metadata);
      
      ErrorLogger.log('info', 'AuthManager.updateUserMetadata successful', { 
        provider: this.currentProvider 
      });
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.updateUserMetadata failed', { 
        provider: this.currentProvider, 
        error 
      });
      throw error;
    }
  }

  async switchProvider(provider: AuthProvider): Promise<void> {
    if (!this.config.allowProviderSwitching) {
      throw new AppError(ErrorCode.PROVIDER_SWITCH_ERROR, 'Provider switching is not allowed');
    }

    if (!this.isProviderEnabled(provider)) {
      throw new AppError(ErrorCode.PROVIDER_NOT_ENABLED, `Provider ${provider} is not enabled`);
    }

    try {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        await this.signOut('current_session');
      }

      this.currentProvider = provider;
      
      ErrorLogger.log('info', 'AuthManager.switchProvider successful', { 
        newProvider: provider 
      });
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.switchProvider failed', { 
        provider, 
        error 
      });
      throw error;
    }
  }

  async getProviderConfig(provider: AuthProvider): Promise<AuthProviderConfig | null> {
    const adapter = this.getAdapter(provider);
    return await adapter.getProviderConfig(provider);
  }

  async testProviderConnection(provider: AuthProvider): Promise<boolean> {
    const adapter = this.getAdapter(provider);
    return await adapter.testProviderConnection(provider);
  }

  async getAvailableProviders(): Promise<AuthProvider[]> {
    const providers: AuthProvider[] = [];

    for (const [provider, config] of Object.entries(this.config.providers)) {
      if (config.enabled && this.adapters.has(provider as AuthProvider)) {
        providers.push(provider as AuthProvider);
      }
    }

    return providers;
  }

  async searchUsers(criteria: {
    email?: string;
    fullName?: string;
    provider?: AuthProvider;
    status?: AuthUserStatus;
    limit?: number;
    offset?: number;
  }): Promise<AuthUser[]> {
    const targetProvider = criteria.provider || this.currentProvider;
    const adapter = this.getAdapter(targetProvider);

    try {
      return await adapter.searchUsers(criteria);
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.searchUsers failed', { 
        provider: targetProvider, 
        criteria, 
        error 
      });
      throw error;
    }
  }

  async countUsers(criteria: {
    provider?: AuthProvider;
    status?: AuthUserStatus;
  }): Promise<number> {
    const targetProvider = criteria.provider || this.currentProvider;
    const adapter = this.getAdapter(targetProvider);

    try {
      return await adapter.countUsers(criteria);
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.countUsers failed', { 
        provider: targetProvider, 
        criteria, 
        error 
      });
      return 0;
    }
  }

  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    const adapter = this.getAdapter(this.currentProvider);

    try {
      return await adapter.isEmailTaken(email, excludeUserId);
    } catch (error) {
      ErrorLogger.log('error', 'AuthManager.isEmailTaken failed', { 
        provider: this.currentProvider, 
        email, 
        error 
      });
      return false;
    }
  }

  getCurrentProvider(): AuthProvider {
    return this.currentProvider;
  }

  isProviderEnabled(provider: AuthProvider): boolean {
    return this.config.providers[provider]?.enabled || false;
  }

  async isProviderAvailable(provider: AuthProvider): Promise<boolean> {
    if (!this.isProviderEnabled(provider)) {
      return false;
    }

    return await this.testProviderConnection(provider);
  }

  async getProviderStatistics(): Promise<{
    [key in AuthProvider]?: {
      enabled: boolean;
      available: boolean;
      userCount: number;
      lastTested?: Date;
    };
  }> {
    const statistics: any = {};

    for (const provider of Object.values(AuthProvider)) {
      const enabled = this.isProviderEnabled(provider);
      let available = false;
      let userCount = 0;

      if (enabled) {
        try {
          available = await this.isProviderAvailable(provider);
          userCount = await this.countUsers({ provider });
        } catch (error) {
          ErrorLogger.log('error', 'AuthManager.getProviderStatistics failed for provider', { 
            provider, 
            error 
          });
        }
      }

      statistics[provider] = {
        enabled,
        available,
        userCount,
        lastTested: new Date()
      };
    }

    return statistics;
  }

  async saveConfig(config: Partial<AuthManagerConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    ErrorLogger.log('info', 'AuthManager.saveConfig successful', { 
      updatedKeys: Object.keys(config) 
    });
  }

  getConfig(): AuthManagerConfig {
    return { ...this.config };
  }

  private getAdapter(provider: AuthProvider): IAuthRepository {
    const adapter = this.adapters.get(provider);
    
    if (!adapter) {
      throw new AppError(ErrorCode.PROVIDER_NOT_FOUND, `Adapter not found for provider: ${provider}`);
    }

    return adapter;
  }
}
