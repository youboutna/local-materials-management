import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configScript, parseConfigScript, validatePublicConfig } from './lib/public-config.mjs';
const base = { VITE_SUPABASE_URL: 'https://supabase.example.com', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', VITE_ACTIVE_PROFILE: 'supabase-selfhosted', VITE_APP_MODE: 'production', VITE_DEV_MODE: 'false', VITE_BTP_SCHEMA: 'btp' };
test('public configuration round trips without code execution', () => assert.deepEqual(parseConfigScript(configScript(base)), base));
test('private settings and service-role keys cannot be published', () => {
  assert.throws(() => validatePublicConfig({ ...base, SUPABASE_SERVICE_ROLE_KEY: 'test-only' }));
  assert.throws(() => validatePublicConfig({ ...base, VITE_SUPABASE_PUBLISHABLE_KEY: `h.${Buffer.from('{"role":"service_role"}').toString('base64url')}.s` }));
  assert.throws(() => validatePublicConfig({ ...base, VITE_SUPABASE_ANON_KEY: `h.${Buffer.from('{"role":"service_role"}').toString('base64url')}.s` }));
});
test('production config disables DEV and forbids credential URLs', () => {
  assert.throws(() => validatePublicConfig({ ...base, VITE_DEV_MODE: 'true' }));
  assert.throws(() => validatePublicConfig({ ...base, VITE_SUPABASE_URL: 'https://user:test-only@supabase.example.com' }));
});