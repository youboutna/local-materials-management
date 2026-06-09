/**
 * Schema-Specific Supabase Clients — Hadratech-GPI (BTP only)
 *
 * Scope applicatif : isolation stricte sur le schéma `btp`.
 * Les schémas `fishing`, `health`, `fuel_stations` sont HORS scope de
 * cette application et ne doivent jamais être exposés ici.
 *
 * Le client `supabase` par défaut (schéma public) reste utilisé pour les
 * tables transverses : profiles, user_roles, notifications, locations,
 * contact_messages, etc.
 *
 * IMPORTANT : pour que `.schema('btp')` fonctionne sans HTTP 406 (PGRST106),
 * le schéma `btp` DOIT être déclaré dans `supabase/config.toml` sous
 * `[api].schemas`.
 *
 * Usage:
 *   import { btpClient } from '@/integrations/supabase/schema-clients';
 *   const { data } = await btpClient.from('projects').select('*');
 */

import { supabase } from './client';

/**
 * BTP (Construction) schema client.
 * Tables : projects, project_phases, inspections, payments, documents,
 * tenders, materials, employees, suppliers, task_assignments,
 * bank_guarantees, insurance_certificates, mission_expenses, etc.
 */
export const btpClient = supabase.schema('btp' as any);

/**
 * Constantes de noms de schéma autorisés dans Hadratech-GPI.
 */
export const SCHEMAS = {
  BTP: 'btp',
  PUBLIC: 'public',
} as const;

export type SchemaName = typeof SCHEMAS[keyof typeof SCHEMAS];
