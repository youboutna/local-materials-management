/**
 * AuthAdapterFactory
 *
 * Single point of switching between IAuthRepository implementations.
 * All adapters (LocalAuthAdapter, SupabaseAuthAdapter, future Keycloak…)
 * share the same domain contract — this factory picks one from config.
 *
 * Selection order:
 *   1. Explicit VITE_AUTH_PROVIDER env ('local' | 'supabase' | 'keycloak')
 *   2. DEV_MODE flag → 'local'
 *   3. Default → 'supabase'
 */

import { DEV_MODE } from '@/config/constants';
import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { LocalAuthAdapter } from '@/infrastructure/adapters/local/LocalAuthAdapter';
import { SupabaseAuthAdapter } from '@/infrastructure/adapters/supabase/SupabaseAuthAdapter';

export type AuthAdapterKind = 'local' | 'supabase' | 'keycloak';

function resolveKind(): AuthAdapterKind {
  const explicit = (import.meta as any)?.env?.VITE_AUTH_PROVIDER as
    | AuthAdapterKind
    | undefined;
  if (explicit === 'local' || explicit === 'supabase' || explicit === 'keycloak') {
    return explicit;
  }
  if (DEV_MODE) return 'local';
  return 'supabase';
}

export class AuthAdapterFactory {
  private static instance: IAuthRepository | null = null;
  private static kind: AuthAdapterKind | null = null;

  static getKind(): AuthAdapterKind {
    if (!this.kind) this.kind = resolveKind();
    return this.kind;
  }

  static create(): IAuthRepository {
    if (this.instance) return this.instance;
    const kind = this.getKind();
    switch (kind) {
      case 'local':
        this.instance = new LocalAuthAdapter();
        break;
      case 'keycloak':
        // Not implemented yet — fall back on Supabase to keep contract valid.
        console.warn('[AuthAdapterFactory] keycloak adapter not implemented, using supabase');
        this.instance = new SupabaseAuthAdapter();
        break;
      case 'supabase':
      default:
        this.instance = new SupabaseAuthAdapter();
        break;
    }
    return this.instance;
  }

  /** Test / provider-swap helper. */
  static reset(): void {
    this.instance = null;
    this.kind = null;
  }
}
