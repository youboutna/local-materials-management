// src/application/services/OAuthProviderService.ts

import {
  IOAuthProviderRepository,
  OAuthProvider,
  OAuthProviderCreateData,
  OAuthProviderUpdateData
} from "@/domain/repositories/IOAuthProviderRepository";
import { OAuthProviderDTO } from '@/dtos/entities/AuthDTO';;
import { OAuthProviderTransformer } from "@/dtos/transforms/OAuthProviderTransformer";
import { RepositoryFactory } from "@/infrastructure/RepositoryFactory";
import { AppError, ErrorCode } from "@/utils/errorHandling";

export class OAuthProviderService {
  private repository: IOAuthProviderRepository;

  constructor(repository?: IOAuthProviderRepository) {
    this.repository = repository || RepositoryFactory.getOAuthProviderRepository();
  }

  // ========== LECTURE ==========

  async getOAuthProviders(): Promise<OAuthProvider[]> {
    return this.repository.findAll();
  }

  async getOAuthProvidersDTO(): Promise<OAuthProviderDTO[]> {
    const entities = await this.repository.findAll();
    return OAuthProviderTransformer.manyToDTO(entities);
  }

  async getOAuthProviderByName(providerName: string): Promise<OAuthProvider | null> {
    return this.repository.findByName(providerName);
  }

  async getOAuthProviderDTOByName(providerName: string): Promise<OAuthProviderDTO | null> {
    const entity = await this.repository.findByName(providerName);
    return entity ? OAuthProviderTransformer.toDTO(entity) : null;
  }

  async getEnabledOAuthProviders(): Promise<OAuthProvider[]> {
    return this.repository.findEnabled();
  }

  async getEnabledOAuthProvidersDTO(): Promise<OAuthProviderDTO[]> {
    const entities = await this.repository.findEnabled();
    return OAuthProviderTransformer.manyToDTO(entities);
  }

  async getEnabledOAuthProvidersResponse(): Promise<OAuthProviderResponse[]> {
    const entities = await this.repository.findEnabled();
    return OAuthProviderTransformer.manyToResponse(entities);
  }

  async getOAuthProviderList(): Promise<OAuthProviderListResponse> {
    const entities = await this.repository.findAll();
    const enabled = entities.filter(p => p.enabled);
    
    return {
      providers: OAuthProviderTransformer.manyToDTO(entities),
      total: entities.length,
      enabledCount: enabled.length,
    };
  }

  // ========== ÉCRITURE ==========

  async createOAuthProvider(data: OAuthProviderCreateData): Promise<OAuthProvider> {
    this.validateProviderData(data);
    
    const existing = await this.repository.findByName(data.providerName);
    if (existing) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Provider "${data.providerName}" already exists`);
    }
    
    return this.repository.upsert(data);
  }

  async createOAuthProviderDTO(data: OAuthProviderCreateData): Promise<OAuthProviderDTO> {
    const entity = await this.createOAuthProvider(data);
    return OAuthProviderTransformer.toDTO(entity);
  }

  async updateOAuthProvider(providerName: string, data: OAuthProviderUpdateData): Promise<OAuthProvider> {
    const existing = await this.repository.findByName(providerName);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, `Provider "${providerName}" not found`);
    }
    
    const merged: OAuthProviderCreateData = {
      providerName: data.providerName || existing.providerName,
      clientId: data.clientId ?? existing.clientId,
      clientSecret: data.clientSecret,
      authUrl: data.authUrl ?? existing.authUrl,
      tokenUrl: data.tokenUrl ?? existing.tokenUrl,
      userInfoUrl: data.userInfoUrl ?? existing.userInfoUrl,
      scopes: data.scopes ?? existing.scopes,
      enabled: data.enabled ?? existing.enabled,
      configuration: data.configuration ?? existing.configuration,
    };
    
    return this.repository.upsert(merged);
  }

  async updateOAuthProviderDTO(providerName: string, data: OAuthProviderUpdateData): Promise<OAuthProviderDTO> {
    const entity = await this.updateOAuthProvider(providerName, data);
    return OAuthProviderTransformer.toDTO(entity);
  }

  async upsertOAuthProvider(data: OAuthProviderCreateData): Promise<OAuthProvider> {
    this.validateProviderData(data);
    return this.repository.upsert(data);
  }

  async upsertOAuthProviderDTO(data: OAuthProviderCreateData): Promise<OAuthProviderDTO> {
    const entity = await this.upsertOAuthProvider(data);
    return OAuthProviderTransformer.toDTO(entity);
  }

  async toggleOAuthProvider(providerName: string, enabled: boolean): Promise<void> {
    const existing = await this.repository.findByName(providerName);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, `Provider "${providerName}" not found`);
    }
    await this.repository.toggleEnabled(providerName, enabled);
  }

  async deleteOAuthProvider(providerName: string): Promise<void> {
    const existing = await this.repository.findByName(providerName);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, `Provider "${providerName}" not found`);
    }
    await this.repository.delete(providerName);
  }

  // ========== OAUTH ==========

  generateOAuthUrl(provider: OAuthProvider, redirectUri: string, state?: string): string {
    if (!provider.authUrl || !provider.clientId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "OAuth provider not properly configured");
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: provider.scopes?.join(" ") || "openid email profile",
      ...(state && { state }),
    });

    return `${provider.authUrl}?${params.toString()}`;
  }

  async exchangeOAuthCode(
    provider: OAuthProvider,
    code: string,
    redirectUri: string,
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    if (!provider.tokenUrl || !provider.clientId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "OAuth provider not properly configured");
    }

    const response = await fetch(provider.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: provider.clientId,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new AppError(ErrorCode.NETWORK_ERROR, "Failed to exchange OAuth code");
    }

    return await response.json();
  }

  async getOAuthUserInfo(provider: OAuthProvider, accessToken: string): Promise<any> {
    if (!provider.userInfoUrl) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "OAuth provider user info URL not configured");
    }

    const response = await fetch(provider.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new AppError(ErrorCode.NETWORK_ERROR, "Failed to fetch OAuth user info");
    }

    return response.json();
  }

  // ========== PRIVÉES ==========

  private validateProviderData(data: OAuthProviderCreateData): void {
    if (!data.providerName || data.providerName.trim() === '') {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Provider name is required");
    }
    
    if (data.authUrl && !this.isValidUrl(data.authUrl)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid auth URL format");
    }
    
    if (data.tokenUrl && !this.isValidUrl(data.tokenUrl)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid token URL format");
    }
    
    if (data.userInfoUrl && !this.isValidUrl(data.userInfoUrl)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid user info URL format");
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getDefaultProviders(): OAuthProviderCreateData[] {
    return [
      { providerName: 'google', authUrl: 'https://accounts.google.com/o/oauth2/v2/auth', tokenUrl: 'https://oauth2.googleapis.com/token', userInfoUrl: 'https://www.googleapis.com/oauth2/v1/userinfo', scopes: ['openid', 'email', 'profile'], enabled: true },
      { providerName: 'github', authUrl: 'https://github.com/login/oauth/authorize', tokenUrl: 'https://github.com/login/oauth/access_token', userInfoUrl: 'https://api.github.com/user', scopes: ['read:user', 'user:email'], enabled: true },
      { providerName: 'microsoft', authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', userInfoUrl: 'https://graph.microsoft.com/v1.0/me', scopes: ['openid', 'email', 'profile', 'User.Read'], enabled: true },
    ];
  }

  async initializeDefaultProviders(): Promise<OAuthProvider[]> {
    const results: OAuthProvider[] = [];
    for (const provider of this.getDefaultProviders()) {
      const existing = await this.repository.findByName(provider.providerName);
      if (!existing) {
        results.push(await this.repository.upsert(provider));
      } else {
        results.push(existing);
      }
    }
    return results;
  }
}