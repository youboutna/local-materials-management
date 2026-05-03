/**
 * Schema-Specific Supabase Clients
 * Multi-schema architecture: btp, fishing, health, fuel_stations
 * 
 * Each client targets a specific PostgreSQL schema via .schema()
 * The default `supabase` client (public schema) is used for shared tables:
 * profiles, user_roles, notifications, locations, etc.
 * 
 * Usage:
 *   import { btpClient } from '@/integrations/supabase/schema-clients';
 *   const { data } = await btpClient.from('projects').select('*');
 */

import { supabase } from './client';

/**
 * BTP (Construction) schema client
 * 
 * IMPORTANT: Uses the default public schema client because all BTP tables
 * are exposed through public proxy views (e.g. public.projects → btp.projects).
 * Using .schema('btp') causes HTTP 406 (PGRST106) errors since the btp schema
 * is not in PostgREST's db-schemas config.
 * 
 * Tables available via public views: projects, project_phases, inspections,
 * payments, documents, tenders, materials, employees, suppliers,
 * task_assignments, bank_guarantees, insurance_certificates, etc.
 */

export const btpClient = supabase.schema('btp' as any);


/**
 * Fishing schema client
 * Tables: fishing_missions, vessels, catch_records, fishing_licenses, etc.
 */
export const fishingClient = supabase.schema('fishing' as any);

/**
 * Health schema client
 * Tables: patients, prescriptions, health_claims, medical_acts, etc.
 */
export const healthClient = supabase.schema('health' as any);

/**
 * Fuel Stations schema client
 * Tables: service_stations, hse_evaluations, authorization_requests, etc.
 */
export const fuelStationsClient = supabase.schema('fuel_stations' as any);

/**
 * Schema name constants for reference
 */
export const SCHEMAS = {
  BTP: 'btp',
  FISHING: 'fishing',
  HEALTH: 'health',
  FUEL_STATIONS: 'fuel_stations',
  PUBLIC: 'public',
} as const;

export type SchemaName = typeof SCHEMAS[keyof typeof SCHEMAS];
