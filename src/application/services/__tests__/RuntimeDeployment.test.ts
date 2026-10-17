import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/application/services/SystemSettingsService', () => ({ getSystemSettingsService: () => ({ getByCategoryAndKey: async () => null }) }));
import { resolveSupabaseConfig } from '@/config/supabaseConfig';
import { getActiveProfileSync } from '@/config/profile-manager';
import { isDevMode, DEV_MODE_OVERRIDE_KEY } from '@/config/constants';
const windowConfig = window as Window & { __APP_CONFIG__?: Record<string, string> };
afterEach(() => { delete windowConfig.__APP_CONFIG__; vi.unstubAllEnvs(); localStorage.clear(); });
describe('Self-hosted runtime configuration', () => {
  it('never reuses a built-in hosted key for a runtime self-hosted URL', () => {
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_hosted_test');
    const anon = `h.${btoa('{"role":"anon"}')}.s`;
    windowConfig.__APP_CONFIG__ = { VITE_SUPABASE_URL: 'https://supabase.example.com', VITE_SUPABASE_ANON_KEY: anon };
    expect(resolveSupabaseConfig().publishableKey).toBe(anon);
  });
  it('operator self-hosted profile wins and DEV stays off despite local override', () => {
    windowConfig.__APP_CONFIG__ = { VITE_ACTIVE_PROFILE: 'supabase-selfhosted', VITE_DEV_MODE: 'false' };
    localStorage.setItem(DEV_MODE_OVERRIDE_KEY, 'true');
    expect(getActiveProfileSync().id).toBe('supabase-selfhosted');
    expect(isDevMode()).toBe(false);
  });
});