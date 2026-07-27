// src/dtos/entities/OAuthProviderDTO.ts

export interface OAuthProviderDTO {
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

export interface OAuthProviderResponse {
  id: string;
  providerName: string;
  clientId?: string;
  enabled: boolean;
  scopes?: string[];
}

export interface OAuthProviderListResponse {
  providers: OAuthProviderDTO[];
  total: number;
  enabledCount: number;
}