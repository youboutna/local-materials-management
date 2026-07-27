// src/dtos/transforms/OAuthProviderTransformer.ts

import {
  OAuthProvider,
  OAuthProviderCreateData,
  OAuthProviderUpdateData
} from "@/domain/repositories/IOAuthProviderRepository";
import {
  OAuthProviderDTO,
  OAuthProviderResponse
} from "@/dtos/entities/OAuthProviderDTO";
import { Json } from "@/integrations/supabase/types";

export class OAuthProviderTransformer {
  // ========== DB → Domain ==========
  static fromDB(row: any): OAuthProvider {
    return {
      id: row.id,
      providerName: row.provider_name,
      clientId: row.client_id || undefined,
      authUrl: row.auth_url || undefined,
      tokenUrl: row.token_url || undefined,
      userInfoUrl: row.user_info_url || undefined,
      scopes: row.scopes || undefined,
      enabled: Boolean(row.enabled),
      configuration: this.parseConfiguration(row.configuration),
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
      clientId: entity.clientId,
      authUrl: entity.authUrl,
      tokenUrl: entity.tokenUrl,
      userInfoUrl: entity.userInfoUrl,
      scopes: entity.scopes,
      enabled: entity.enabled,
      configuration: entity.configuration,
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
      clientId: entity.clientId,
      enabled: entity.enabled,
      scopes: entity.scopes,
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
  private static parseConfiguration(config: Json): Record<string, any> | undefined {
    if (!config || config === null) return undefined;
    if (typeof config === "object" && !Array.isArray(config)) {
      return config as Record<string, any>;
    }
    return undefined;
  }
}