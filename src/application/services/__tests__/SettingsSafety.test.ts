import { describe, expect, it, vi } from 'vitest';
vi.mock('@/infrastructure/RepositoryFactory', () => ({ RepositoryFactory: {} }));
import { assertSafeSetting, safeSettings } from '@/config/settings-safety';
import { SystemSettingsService } from '../SystemSettingsService';
import type { ISystemSettingsRepository } from '@/domain/repositories/ISystemSettingsRepository';

describe('Settings are not a secret store', () => {
  it('rejects private storage credentials before persistence', async () => {
    const upsert = vi.fn();
    const service = new SystemSettingsService({ upsert } as unknown as ISystemSettingsRepository);
    await expect(service.setConfiguration('profile_config', { VITE_STORAGE_SECRET_KEY: 'test-only-value' })).rejects.toThrow();
    expect(upsert).not.toHaveBeenCalled();
  });
  it('allows an anon public key but rejects service-role credentials under the same key', () => {
    const key = (role: string) => `header.${btoa(JSON.stringify({ role }))}.signature`;
    expect(() => assertSafeSetting('VITE_SUPABASE_ANON_KEY', key('anon'))).not.toThrow();
    expect(() => assertSafeSetting('VITE_SUPABASE_ANON_KEY', key('service_role'))).toThrow();
  });
  it('excludes persisted nested secrets and credential-bearing database URLs from display', () => {
    expect(safeSettings([
      { key: 'branding', configuration: { name: 'HadraTech' } },
      { key: 'profile', configuration: { clientSecret: 'test-only' } },
      { key: 'database_url', configuration: { url: 'postgresql://user:test-only@host/db' } },
    ])).toEqual([{ key: 'branding', configuration: { name: 'HadraTech' } }]);
  });
});