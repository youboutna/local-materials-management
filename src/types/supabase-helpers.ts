import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper type to access tables that aren't in generated types yet
 */
export type ExtendedSupabaseClient = SupabaseClient & {
  from(table: 'submission_activity_logs'): any;
  from(table: 'document_validation_logs'): any;
};
