import { SUPABASE_CLOUD_PROFILE } from './supabase-cloud.profile';
import { SUPABASE_SELFHOSTED_PROFILE } from './supabase-selfhosted.profile';
import { POSTGREST_GOTRUE_PROFILE } from './postgrest-gotrue.profile';
import { KEYCLOAK_POSTGREST_PROFILE } from './keycloak-postgrest.profile';
import { LOCAL_BYPASS_PROFILE } from './local-bypass.profile';
import type { DeploymentProfile } from './types';

export const ALL_PROFILES: DeploymentProfile[] = [
  SUPABASE_CLOUD_PROFILE,
  SUPABASE_SELFHOSTED_PROFILE,
  POSTGREST_GOTRUE_PROFILE,
  KEYCLOAK_POSTGREST_PROFILE,
  LOCAL_BYPASS_PROFILE,
];

export function getDefaultProfileId(): string {
  const mode = (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE;
  return mode === 'production' ? 'supabase-cloud' : 'supabase-selfhosted';
}

export function getProfileById(id: string): DeploymentProfile | undefined {
  return ALL_PROFILES.find((p) => p.id === id);
}

export {
  SUPABASE_CLOUD_PROFILE,
  SUPABASE_SELFHOSTED_PROFILE,
  POSTGREST_GOTRUE_PROFILE,
  KEYCLOAK_POSTGREST_PROFILE,
  LOCAL_BYPASS_PROFILE,
};
export * from './types';
