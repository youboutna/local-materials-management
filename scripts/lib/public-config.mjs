export const PUBLIC_CONFIG_KEYS = new Set([
  'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PROJECT_ID', 'VITE_SITE_URL', 'VITE_ACTIVE_PROFILE',
  'VITE_APP_MODE', 'VITE_BTP_SCHEMA', 'VITE_STORAGE_BUCKET', 'VITE_DEV_MODE',
]);

export function validatePublicConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Public configuration must be an object');
  for (const [key, value] of Object.entries(config)) {
    if (!PUBLIC_CONFIG_KEYS.has(key) || typeof value !== 'string') throw new Error(`Unsupported public setting: ${key}`);
  }
  const url = new URL(config.VITE_SUPABASE_URL);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
    throw new Error('Use a public HTTPS Supabase URL (HTTP only for localhost)');
  }
  const keys = [config.VITE_SUPABASE_PUBLISHABLE_KEY, config.VITE_SUPABASE_ANON_KEY].filter(Boolean);
  if (keys.length === 0) throw new Error('A public Supabase key is required');
  for (const key of keys) {
    if (key.startsWith('sb_publishable_')) continue;
    let payload;
    try { payload = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString()); } catch { throw new Error('Use an anon JWT or publishable key'); }
    if (payload.role !== 'anon') throw new Error('Only anon keys may be published');
    const ref = /^([a-z0-9-]+)\.supabase\./i.exec(url.hostname)?.[1];
    if (ref && payload.ref && payload.ref !== ref) throw new Error('URL and public key must belong to the same project');
  }
  if (config.VITE_APP_MODE !== 'production' || config.VITE_DEV_MODE !== 'false' || config.VITE_ACTIVE_PROFILE !== 'supabase-selfhosted' || config.VITE_BTP_SCHEMA !== 'btp') {
    throw new Error('Release config requires production mode, DEV disabled, supabase-selfhosted profile and btp schema');
  }
  return config;
}

export const configScript = (config) => `window.__APP_CONFIG__ = ${JSON.stringify(validatePublicConfig(config))};\n`;
export function parseConfigScript(source) {
  const match = /^window\.__APP_CONFIG__ = (\{[^]*\});\s*$/.exec(source);
  if (!match) throw new Error('Use prepare-public-config.mjs to produce config.js');
  return validatePublicConfig(JSON.parse(match[1]));
}