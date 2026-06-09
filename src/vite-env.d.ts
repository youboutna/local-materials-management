/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_MODE: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  /**
   * Nom du schéma Postgres utilisé pour les données métier BTP.
   * Par défaut `public`. Mettre `btp` si le schéma est exposé côté
   * Supabase Dashboard (Settings > API > Exposed schemas).
   */
  readonly VITE_BTP_SCHEMA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
