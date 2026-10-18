import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { configScript } from './lib/public-config.mjs';

function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'frontend-release-'));
  try {
    mkdirSync(join(root, 'scripts')); mkdirSync(join(root, 'dist')); mkdirSync(join(root, 'bin'));
    for (const file of ['release-frontend.sh', 'check-public-config.mjs']) cpSync(new URL(file, import.meta.url), join(root, 'scripts', file));
    cpSync(new URL('lib', import.meta.url), join(root, 'scripts/lib'), { recursive: true });
    writeFileSync(join(root, 'dist/index.html'), '<div id="root"></div>');
    writeFileSync(join(root, 'scripts/check-frontend-http.sh'), 'exit 0\n');
    writeFileSync(join(root, 'config.js'), configScript({ VITE_SUPABASE_URL: 'https://supabase.example.com', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', VITE_ACTIVE_PROFILE: 'supabase-selfhosted', VITE_APP_MODE: 'production', VITE_DEV_MODE: 'false', VITE_BTP_SCHEMA: 'btp' }));
    writeFileSync(join(root, 'bin/docker'), '#!/bin/sh\nprintf "%s\\n" "$*" >> "$CALL_LOG"\nif [ "$1" = image ]; then exit "${IMAGE_EXISTS:-1}"; fi\nexit 0\n', { mode: 0o755 });
    const invoke = (extra = {}) => spawnSync('bash', [join(root, 'scripts/release-frontend.sh')], { encoding: 'utf8', env: { PATH: `${root}/bin:${process.env.PATH}`, PUBLIC_CONFIG_FILE: join(root, 'config.js'), APP_IMAGE_TAG: 'release-test-1', CALL_LOG: join(root, 'calls'), ...extra } });
    run({ root, invoke, calls: () => readFileSync(join(root, 'calls'), 'utf8') });
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test('release never overwrites an existing rollback image', () => fixture(({ invoke, calls }) => {
  assert.notEqual(invoke({ IMAGE_EXISTS: '0' }).status, 0);
  assert.equal(calls().includes('compose'), false);
}));
test('release rejects mutable tags and missing external configuration', () => fixture(({ root, invoke }) => {
  assert.notEqual(invoke({ APP_IMAGE_TAG: 'latest' }).status, 0);
  assert.notEqual(invoke({ PUBLIC_CONFIG_FILE: join(root, 'missing.js') }).status, 0);
}));
test('release starts only the frontend without loading repository env or rebuilding on up', () => fixture(({ invoke, calls }) => {
  assert.equal(invoke().status, 0);
  const lines = calls().trim().split('\n');
  assert.equal(lines.length, 4);
  assert.ok(lines[1].includes('--env-file /dev/null') && lines[1].endsWith('config -q'));
  assert.ok(lines[2].endsWith('build app'));
  assert.ok(lines[3].endsWith('up -d --no-build --no-deps --wait app'));
}));