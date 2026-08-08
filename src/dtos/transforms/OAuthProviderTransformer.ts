// =============================================================================
// OAuthProviderTransformer.ts – Transformation DB ↔ Domaine ↔ DTO
// =============================================================================

import {
  OAuthProvider,
  OAuthProviderCreateData,
  OAuthProviderUpdateData,
  OAuthSession,
  OAuthSessionCreateData,
  OAuthSessionUpdateData
} from "@/domain/repositories/IOAuthProviderRepository";
import { OAuthProviderDTO } from '@/dtos/entities/AuthDTO';;
import { Json } from "@/integrations/supabase/types";

// =============================================================================
// TRANSFORMER: OAuth Provider
// =============================================================================

export class OAuthProviderTransformer {
  // ========== DB → Domain ==========
  static fromDB(row: any): OAuthProvider {
    return {
      id: row.id,
      providerName: row.provider_name,
      clientId: row.client_id ?? null,
      clientSecret: row.client_secret ?? null,
      authUrl: row.auth_url ?? null,
      tokenUrl: row.token_url ?? null,
      userInfoUrl: row.user_info_url ?? null,
      scopes: row.scopes ?? null,
      enabled: row.enabled ?? null,
      configuration: this.parseConfiguration(row.configuration),
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    };
  }

  static manyFromDB(rows: any[]): OAuthProvider[] {
    return rows.map(row => this.fromDB(row));
  }

  // ========== Domain → DTO ==========
  static toDTO(entity: OAuthProvider): OAuthProviderDTO {
    return {
      id: entity.id,
      providerName: entity.providerName,
      clientId: entity.clientId ?? null,
      clientSecret: entity.clientSecret ?? null,
      authUrl: entity.authUrl ?? null,
      tokenUrl: entity.tokenUrl ?? null,
      userInfoUrl: entity.userInfoUrl ?? null,
      scopes: entity.scopes ?? null,
      enabled: entity.enabled ?? null,
      configuration: entity.configuration ?? null,
      createdAt: entity.createdAt ?? null,
      updatedAt: entity.updatedAt ?? null,
    };
  }

  static manyToDTO(entities: OAuthProvider[]): OAuthProviderDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  // ========== Domain → Response ==========
  static toResponse(entity: OAuthProvider): OAuthProviderResponse {
    return {
      id: entity.id,
      providerName: entity.providerName,
      clientId: entity.clientId ?? null,
      enabled: entity.enabled ?? null,
      scopes: entity.scopes ?? null,
    };
  }

  static manyToResponse(entities: OAuthProvider[]): OAuthProviderResponse[] {
    return entities.map(entity => this.toResponse(entity));
  }

  // ========== Create/Update → DB ==========
  static createToDB(data: OAuthProviderCreateData): Record<string, any> {
    const result: Record<string, any> = {
      provider_name: data.providerName,
      enabled: data.enabled ?? false,
    };
    
    if (data.clientId !== undefined) result.client_id = data.clientId;
    if (data.clientSecret !== undefined) result.client_secret = data.clientSecret;
    if (data.authUrl !== undefined) result.auth_url = data.authUrl;
    if (data.tokenUrl !== undefined) result.token_url = data.tokenUrl;
    if (data.userInfoUrl !== undefined) result.user_info_url = data.userInfoUrl;
    if (data.scopes !== undefined) result.scopes = data.scopes;
    if (data.configuration !== undefined) result.configuration = data.configuration;
    
    return result;
  }

  static updateToDB(data: OAuthProviderUpdateData): Record<string, any> {
    const result: Record<string, any> = {};
    
    if (data.providerName !== undefined) result.provider_name = data.providerName;
    if (data.clientId !== undefined) result.client_id = data.clientId;
    if (data.clientSecret !== undefined) result.client_secret = data.clientSecret;
    if (data.authUrl !== undefined) result.auth_url = data.authUrl;
    if (data.tokenUrl !== undefined) result.token_url = data.tokenUrl;
    if (data.userInfoUrl !== undefined) result.user_info_url = data.userInfoUrl;
    if (data.scopes !== undefined) result.scopes = data.scopes;
    if (data.enabled !== undefined) result.enabled = data.enabled;
    if (data.configuration !== undefined) result.configuration = data.configuration;
    
    return result;
  }

  // ========== Private helpers ==========
  private static parseConfiguration(config: Json): Record<string, any> | null {
    if (!config || config === null) return null;
    if (typeof config === "object" && !Array.isArray(config)) {
      return config as Record<string, any>;
    }
    return null;
  }
}

// =============================================================================
// TRANSFORMER: OAuth Session
// =============================================================================

export class OAuthSessionTransformer {
  // ========== DB → Domain ==========
  static fromDB(row: any): OAuthSession {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      providerSessionId: row.provider_session_id ?? null,
      expiresAt: row.expires_at ?? null,
      refreshToken: row.refresh_token ?? null,
      accessToken: row.access_token ?? null,
      metadata: row.metadata ?? null,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
    };
  }

  static manyFromDB(rows: any[]): OAuthSession[] {
    return rows.map(row => this.fromDB(row));
  }

  // ========== Domain → DTO ==========
  static toDTO(entity: OAuthSession): OAuthSessionDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      provider: entity.provider,
      providerSessionId: entity.providerSessionId ?? null,
      expiresAt: entity.expiresAt ?? null,
      refreshToken: entity.refreshToken ?? null,
      accessToken: entity.accessToken ?? null,
      metadata: entity.metadata ?? null,
      createdAt: entity.createdAt ?? null,
      updatedAt: entity.updatedAt ?? null,
    };
  }

  static manyToDTO(entities: OAuthSession[]): OAuthSessionDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  // ========== Create/Update → DB ==========
  static createToDB(data: OAuthSessionCreateData): Record<string, any> {
    const result: Record<string, any> = {
      user_id: data.userId,
      provider: data.provider,
    };
    
    if (data.providerSessionId !== undefined) result.provider_session_id = data.providerSessionId;
    if (data.expiresAt !== undefined) result.expires_at = data.expiresAt;
    if (data.refreshToken !== undefined) result.refresh_token = data.refreshToken;
    if (data.accessToken !== undefined) result.access_token = data.accessToken;
    if (data.metadata !== undefined) result.metadata = data.metadata;
    
    return result;
  }

  static updateToDB(data: OAuthSessionUpdateData): Record<string, any> {
    const result: Record<string, any> = {};
    
    if (data.providerSessionId !== undefined) result.provider_session_id = data.providerSessionId;
    if (data.expiresAt !== undefined) result.expires_at = data.expiresAt;
    if (data.refreshToken !== undefined) result.refresh_token = data.refreshToken;
    if (data.accessToken !== undefined) result.access_token = data.accessToken;
    if (data.metadata !== undefined) result.metadata = data.metadata;
    
    return result;
  }
}