/**
 * src/infrastructure/supabase/adapters/SupabaseOAuthProviderAdapter.ts
 * Supabase OAuth Provider Adapter
 * Implements IOAuthProviderRepository pour la table public.oauth_providers
 */

import {
  IOAuthProviderRepository,
  OAuthProvider,
  OAuthProviderCreateData,
} from '@/domain/repositories/IOAuthProviderRepository';
import { OAuthProviderTransformer } from '@/dtos/transforms/OAuthProviderTransformer';
import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class SupabaseOAuthProviderAdapter implements IOAuthProviderRepository {
  async findAll(): Promise<OAuthProvider[]> {
    const { data, error } = await supabase
      .from('oauth_providers')
      .select('*')
      .order('provider_name');

    if (error) {
      // Lecture non critique : ne jamais bloquer la page de connexion (401/permission denied).
      console.warn('⚠️ SupabaseOAuthProviderAdapter.findAll unavailable:', error.message);
      return [];
    }


    return OAuthProviderTransformer.manyFromDB(data || []);
  }

  async findByName(name: string): Promise<OAuthProvider | null> {
    const { data, error } = await supabase
      .from('oauth_providers')
      .select('*')
      .eq('provider_name', name)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ SupabaseOAuthProviderAdapter.findByName unavailable:', error.message);
      return null;
    }


    return data ? OAuthProviderTransformer.fromDB(data) : null;
  }

  async findEnabled(): Promise<OAuthProvider[]> {
    const { data, error } = await supabase
      .from('oauth_providers')
      .select('*')
      .eq('enabled', true)
      .order('provider_name');

    if (error) {
      console.error('❌ SupabaseOAuthProviderAdapter.findEnabled error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch enabled OAuth providers', error);
    }

    return OAuthProviderTransformer.manyFromDB(data || []);
  }

  async upsert(data: OAuthProviderCreateData): Promise<OAuthProvider> {
    const dbData = OAuthProviderTransformer.createToDB(data);

    // ✅ Correction: utiliser `as any` pour contourner le typage strict
    const { data: provider, error } = await supabase
      .from('oauth_providers')
      .upsert(dbData as any, { onConflict: 'provider_name' })
      .select()
      .single();

    if (error) {
      console.error('❌ SupabaseOAuthProviderAdapter.upsert error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to upsert OAuth provider', error);
    }

    return OAuthProviderTransformer.fromDB(provider);
  }

  async toggleEnabled(name: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('oauth_providers')
      .update({ enabled })
      .eq('provider_name', name);

    if (error) {
      console.error('❌ SupabaseOAuthProviderAdapter.toggleEnabled error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to toggle OAuth provider', error);
    }
  }

  async delete(name: string): Promise<void> {
    const { error } = await supabase
      .from('oauth_providers')
      .delete()
      .eq('provider_name', name);

    if (error) {
      console.error('❌ SupabaseOAuthProviderAdapter.delete error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete OAuth provider', error);
    }
  }
}