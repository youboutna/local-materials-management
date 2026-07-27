// src/domain/repositories/IOAuthProviderRepository.ts

export interface OAuthProvider {
  id: string;
  providerName: string;
  clientId?: string;
  authUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scopes?: string[];
  enabled: boolean;
  configuration?: Record<string, any>;
}

export interface OAuthProviderCreateData {
  providerName: string;
  clientId?: string;
  clientSecret?: string;
  authUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scopes?: string[];
  enabled?: boolean;
  configuration?: Record<string, any>;
}

export interface OAuthProviderUpdateData {
  providerName?: string;
  clientId?: string;
  clientSecret?: string;
  authUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scopes?: string[];
  enabled?: boolean;
  configuration?: Record<string, any>;
}

export interface IOAuthProviderRepository {
  findAll(): Promise<OAuthProvider[]>;
  findByName(name: string): Promise<OAuthProvider | null>;
  findEnabled(): Promise<OAuthProvider[]>;
  upsert(data: OAuthProviderCreateData): Promise<OAuthProvider>;
  toggleEnabled(name: string, enabled: boolean): Promise<void>;
  delete(name: string): Promise<void>;
}