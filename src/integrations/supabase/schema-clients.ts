/**
 * Schema-Specific Supabase Clients — Hadratech-GPI
 *
 * Pourquoi un adapter ?
 * ---------------------
 * Sur Supabase, plusieurs projets/applicatifs peuvent cohabiter dans la même
 * instance. L'isolation logique se fait par **schéma nommé** (ex: `btp`,
 * `fishing`, `health`, ...). PostgREST n'expose toutefois QUE les schémas
 * listés dans Dashboard > API > Exposed schemas (par défaut `public`,
 * `graphql_public`).
 *
 * Cet adapter centralise la résolution du schéma cible :
 *  1. Lecture de la variable d'env `VITE_BTP_SCHEMA` (override runtime/build).
 *  2. Fallback sur `DEFAULT_BTP_SCHEMA` (code TypeScript) si non défini.
 *  3. Si le schéma résolu est `public`, on renvoie le client par défaut
 *     (pas d'appel à `.schema()`, ce qui évite l'erreur PGRST106
 *     « The schema must be one of the following: public, graphql_public »
 *     tant qu'aucun schéma custom n'est exposé côté Dashboard).
 *  4. Sinon, on renvoie `supabase.schema(name)` typé sur ce schéma.
 *
 * Pour activer le schéma `btp` en production :
 *   - Dashboard Supabase > Settings > API > Exposed schemas : ajouter `btp`.
 *   - Définir `VITE_BTP_SCHEMA=btp` dans `.env` (ou via le build host).
 *   - Aucun changement de code applicatif requis.
 */

import { supabase } from './client';

/** Schéma BTP par défaut codé en dur (utilisé si l'env n'est pas défini). */
/**
 * Défaut sûr = `public` tant que le schéma `btp` n'est pas ajouté dans
 * Dashboard Supabase > Settings > API > Exposed schemas. Passez à `btp`
 * (via `VITE_BTP_SCHEMA=btp` ou en éditant cette constante) UNE FOIS le
 * schéma exposé — sinon PostgREST renvoie PGRST106.
 */
const DEFAULT_BTP_SCHEMA = 'btp';

/** Schémas connus de l'écosystème Supabase multi-projets. Pour documentation. */
export const SCHEMAS = {
  PUBLIC: 'public',
  BTP: 'btp',
} as const;

export type SchemaName = string;

/** Résout le nom du schéma BTP courant (env-first, fallback code). */
export function resolveBtpSchemaName(): SchemaName {
  // 1. Runtime override (public/config.js) — permet de changer de schéma sans rebuild.
  const runtime = typeof window !== 'undefined'
    ? (window as Window & { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__
    : undefined;
  const fromRuntime = runtime?.VITE_BTP_SCHEMA;
  if (fromRuntime && fromRuntime.trim()) return fromRuntime.trim();

  // 2. Variable de build.
  const fromEnv = import.meta.env?.VITE_BTP_SCHEMA as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();

  // 3. Fallback code : les tables métier vivent dans `btp`.
  return DEFAULT_BTP_SCHEMA;
}

/**
 * Factory générique : renvoie un client Supabase ciblant un schéma nommé.
 * Si le schéma est `public`, renvoie le client racine sans appeler `.schema()`
 * pour éviter PGRST106 lorsque le schéma n'est pas exposé.
 */
export function getSchemaClient(schemaName: SchemaName) {
  if (!schemaName || schemaName === 'public') {
    return supabase;
  }
  // Cast nécessaire : `.schema()` n'accepte que des schémas connus dans les
  // types générés. On garde l'API ouverte pour des schémas custom exposés.
  return (supabase as any).schema(schemaName);
}

/** Client BTP — résolu une fois au chargement du module. */
export const BTP_SCHEMA: SchemaName = resolveBtpSchemaName();
export const btpClient = getSchemaClient(BTP_SCHEMA);
