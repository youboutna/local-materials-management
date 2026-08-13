/**
 * Supabase adapter for btp.escalation_thresholds
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  IEscalationThresholdRepository,
  EscalationThresholdRow,
} from '@/domain/repositories/IEscalationThresholdRepository';
import { BtpTablesUpdate } from '@/integrations/supabase/btp-types';

export class SupabaseEscalationThresholdAdapter implements IEscalationThresholdRepository {
  async findAll(): Promise<EscalationThresholdRow[]> {
    const { data, error } = await btpClient
      .from('escalation_thresholds')
      .select('*')
      .order('threshold_type', { ascending: true })
      .order('threshold_value', { ascending: true });

    if (error) throw error;
    return ((data || []) as EscalationThresholdRow[]).filter((row) => !!row.id);
  }

  async update(
    id: string,
    updates: Partial<EscalationThresholdRow>
  ): Promise<EscalationThresholdRow> {
    const { data, error } = await btpClient
      .from('escalation_thresholds')
      .update({ ...updates, updated_at: new Date().toISOString() } as BtpTablesUpdate<'escalation_thresholds'>)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as EscalationThresholdRow;
  }
}
