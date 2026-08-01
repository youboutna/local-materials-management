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
  // Projet Supabase cible (override runtime — priorité sur le bundle/.env,
  // qui est régénéré automatiquement par la plateforme). Clés publiques only.
  VITE_SUPABASE_URL: 'https://ttrfbzonzcyimfmezuqv.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_3D_VE71oaK5UEDKbBsjP5A_xpBeBM1C',
  VITE_SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0cmZiem9uemN5aW1mbWV6dXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NTc1NTUsImV4cCI6MjEwMDUzMzU1NX0.KdPcWJclXFVK8af-67HCv191VP7sUuDXxY8BhcJQCZw',
  VITE_SUPABASE_PROJECT_ID: 'ttrfbzonzcyimfmezuqv',
};

