/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_MODE: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  /** Schéma Postgres BTP (par défaut `btp`). */
  readonly VITE_BTP_SCHEMA?: string;
  readonly VITE_PGRST_SCHEMAS?: string;
  readonly VITE_PGRST_EXTRA_SEARCH_PATH?: string;
  /** Secret HS256 partagé avec GoTrue/PostgREST pour le Mode B (local auth + self-hosted data). */
  readonly VITE_JWT_SECRET?: string;
  readonly VITE_JWT_EXPIRY?: string;
  readonly VITE_AUTH_PROVIDER?: string;
  readonly VITE_DATA_PROVIDER?: string;
  readonly VITE_STORAGE_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
