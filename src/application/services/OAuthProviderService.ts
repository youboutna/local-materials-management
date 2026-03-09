/**
 * OAuth Provider Service
 * Implements business logic for OAuth provider management
 * Following hexagonal architecture principles from PROMPTS.md
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { supabase } from '@/integrations/supabase/client';

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

export class OAuthProviderService {
  
  /**
   * Get all OAuth providers
   */
  async getOAuthProviders(): Promise<OAuthProvider[]> {
    try {
      const { data, error } = await supabase
        .from('oauth_providers')
        .select('*')
        .order('provider_name');

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch OAuth providers', error);
      }

      return (data || []).map(provider => ({
        id: provider.id,
        providerName: provider.provider_name,
        clientId: provider.client_id,
        authUrl: provider.auth_url,
        tokenUrl: provider.token_url,
        userInfoUrl: provider.user_info_url,
        scopes: provider.scopes,
        enabled: provider.enabled,
        configuration: provider.configuration
      }));
    } catch (error) {
      console.error('OAuthProviderService.getOAuthProviders failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch OAuth providers', error);
    }
  }

  /**
   * Get OAuth provider by name
   */
  async getOAuthProviderByName(providerName: string): Promise<OAuthProvider | null> {
    try {
      const { data, error } = await supabase
        .from('oauth_providers')
        .select('*')
        .eq('provider_name', providerName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No provider found
        }
        throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch OAuth provider', error);
      }

      return {
        id: data.id,
        providerName: data.provider_name,
        clientId: data.client_id,
        authUrl: data.auth_url,
        tokenUrl: data.token_url,
        userInfoUrl: data.user_info_url,
        scopes: data.scopes,
        enabled: data.enabled,
        configuration: data.configuration
      };
    } catch (error) {
      console.error('OAuthProviderService.getOAuthProviderByName failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch OAuth provider', error);
    }
  }

  /**
   * Get enabled OAuth providers
   */
  async getEnabledOAuthProviders(): Promise<OAuthProvider[]> {
    try {
      const { data, error } = await supabase
        .from('oauth_providers')
        .select('*')
        .eq('enabled', true)
        .order('provider_name');

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch enabled OAuth providers', error);
      }

      return (data || []).map(provider => ({
        id: provider.id,
        providerName: provider.provider_name,
        clientId: provider.client_id,
        authUrl: provider.auth_url,
        tokenUrl: provider.token_url,
        userInfoUrl: provider.user_info_url,
        scopes: provider.scopes,
        enabled: provider.enabled,
        configuration: provider.configuration
      }));
    } catch (error) {
      console.error('OAuthProviderService.getEnabledOAuthProviders failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch enabled OAuth providers', error);
    }
  }

  /**
   * Create or update OAuth provider
   */
  async upsertOAuthProvider(data: OAuthProviderCreateData): Promise<OAuthProvider> {
    try {
      const { data: provider, error } = await supabase
        .from('oauth_providers')
        .upsert({
          provider_name: data.providerName,
          client_id: data.clientId,
          auth_url: data.authUrl,
          token_url: data.tokenUrl,
          user_info_url: data.userInfoUrl,
          scopes: data.scopes,
          enabled: data.enabled ?? false,
          configuration: data.configuration
        }, {
          onConflict: 'provider_name'
        })
        .select()
        .single();

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create/update OAuth provider', error);
      }

      return {
        id: provider.id,
        providerName: provider.provider_name,
        clientId: provider.client_id,
        authUrl: provider.auth_url,
        tokenUrl: provider.token_url,
        userInfoUrl: provider.user_info_url,
        scopes: provider.scopes,
        enabled: provider.enabled,
        configuration: provider.configuration
      };
    } catch (error) {
      console.error('OAuthProviderService.upsertOAuthProvider failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create/update OAuth provider', error);
    }
  }

  /**
   * Toggle OAuth provider status
   */
  async toggleOAuthProvider(providerName: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('oauth_providers')
        .update({ enabled })
        .eq('provider_name', providerName);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to toggle OAuth provider', error);
      }
    } catch (error) {
      console.error('OAuthProviderService.toggleOAuthProvider failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to toggle OAuth provider', error);
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  generateOAuthUrl(provider: OAuthProvider, redirectUri: string, state?: string): string {
    if (!provider.authUrl || !provider.clientId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'OAuth provider not properly configured');
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: provider.scopes?.join(' ') || 'openid email profile',
      ...(state && { state })
    });

    return `${provider.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for tokens
   */
  async exchangeOAuthCode(
    provider: OAuthProvider, 
    code: string, 
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    try {
      if (!provider.tokenUrl || !provider.clientId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'OAuth provider not properly configured');
      }

      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          client_id: provider.clientId,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.NETWORK_ERROR, 'Failed to exchange OAuth code');
      }

      const tokens = await response.json();

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in
      };
    } catch (error) {
      console.error('OAuthProviderService.exchangeOAuthCode failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to exchange OAuth code', error);
    }
  }

  /**
   * Get user info from OAuth provider
   */
  async getOAuthUserInfo(provider: OAuthProvider, accessToken: string): Promise<any> {
    try {
      if (!provider.userInfoUrl) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'OAuth provider user info URL not configured');
      }

      const response = await fetch(provider.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new AppError(ErrorCode.NETWORK_ERROR, 'Failed to fetch OAuth user info');
      }

      return await response.json();
    } catch (error) {
      console.error('OAuthProviderService.getOAuthUserInfo failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch OAuth user info', error);
    }
  }
}