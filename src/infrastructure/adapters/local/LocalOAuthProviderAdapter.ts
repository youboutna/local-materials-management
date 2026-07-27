// src/infrastructure/adapters/local/LocalOAuthProviderAdapter.ts

import {
  IOAuthProviderRepository,
  OAuthProvider,
  OAuthProviderCreateData
} from "@/domain/repositories/IOAuthProviderRepository";

export class LocalOAuthProviderAdapter implements IOAuthProviderRepository {
  private providers: OAuthProvider[] = [
    { id: '1', providerName: 'Google', enabled: true },
    { id: '2', providerName: 'GitHub', enabled: true },
    { id: '3', providerName: 'Microsoft', enabled: true },
  ];

  async findAll(): Promise<OAuthProvider[]> {
    return this.providers;
  }

  async findByName(name: string): Promise<OAuthProvider | null> {
    return this.providers.find(p => p.providerName === name) || null;
  }

  async findEnabled(): Promise<OAuthProvider[]> {
    return this.providers.filter(p => p.enabled);
  }

  async upsert(data: OAuthProviderCreateData): Promise<OAuthProvider> {
    const existing = this.providers.find(p => p.providerName === data.providerName);
    if (existing) {
      Object.assign(existing, data);
      return existing;
    }
    const newProvider: OAuthProvider = {
      id: String(Date.now()),
      providerName: data.providerName,
      clientId: data.clientId,
      authUrl: data.authUrl,
      tokenUrl: data.tokenUrl,
      userInfoUrl: data.userInfoUrl,
      scopes: data.scopes,
      enabled: data.enabled ?? false,
      configuration: data.configuration,
    };
    this.providers.push(newProvider);
    return newProvider;
  }

  async toggleEnabled(name: string, enabled: boolean): Promise<void> {
    const provider = this.providers.find(p => p.providerName === name);
    if (provider) provider.enabled = enabled;
  }

  async delete(name: string): Promise<void> {
    this.providers = this.providers.filter(p => p.providerName !== name);
  }
}