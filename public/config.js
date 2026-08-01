/**
 * Runtime browser configuration.
 *
 * Historically this file exposed a DEV_MODE bypass (SKIP_AUTH_CHECKS,
 * DEV_USER_*). Authentication now flows exclusively through the provider
 * adapters selected by VITE_AUTH_PROVIDER (see docs/SELF_HOSTING.md).
 * Dev credentials live in src/config/constants.ts (DEV_USERS) and are only
 * honored by the `local` auth provider.
 *
 * Any values set here are read-only hints for the browser bundle. Do NOT put
 * secrets in this file — it is served publicly.
 */
window.__APP_CONFIG__ = {
  // Public build metadata (optional; safe to expose)
  BUILD_ENV: 'development',
  // Schéma PostgREST des tables métier (doit être exposé dans Supabase > API).
  VITE_BTP_SCHEMA: 'btp',
};

