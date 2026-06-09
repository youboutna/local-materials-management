/**
 * Schema-Specific Supabase Clients — Hadratech-GPI
 *
 * IMPORTANT — État du projet hébergé :
 * Le projet Supabase distant n'expose actuellement QUE les schémas
 * `public` et `graphql_public` via PostgREST. Toutes les tables métier
 * (projects, tender_estimates, project_alerts, inspections, payments,
 * documents, materials, employees, suppliers, etc.) résident dans
 * `public`. Tenter `supabase.schema('btp')` provoque l'erreur
 * « The schema must be one of the following: public, graphql_public »
 * et casse toutes les opérations CRUD.
 *
 * Conséquence : `btpClient` est volontairement aliasé sur le client
 * `supabase` par défaut (schéma public). Si un jour le schéma `btp`
 * est exposé côté Dashboard Supabase (API > Exposed schemas), il
 * suffira de basculer cette ligne sur `supabase.schema('btp')`.
 *
 * Les schémas `fishing`, `health`, `fuel_stations` sont hors scope
 * de cette application.
 */

import { supabase } from './client';

/**
 * BTP client — alias du client public tant que le schéma `btp`
 * n'est pas exposé côté Supabase Dashboard.
 */
export const btpClient = supabase;

/**
 * Constantes de noms de schéma autorisés dans Hadratech-GPI.
 */
export const SCHEMAS = {
  BTP: 'btp',
  PUBLIC: 'public',
} as const;

export type SchemaName = typeof SCHEMAS[keyof typeof SCHEMAS];
