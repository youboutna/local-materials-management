// @ts-nocheck
/**
 * Supabase adapter for btp.system_settings
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import type {
  ISystemSettingsRepository,
  SystemSettingRow,
} from '@/domain/repositories/ISystemSettingsRepository';

export class SupabaseSystemSettingsAdapter implements ISystemSettingsRepository {
  async findByKey(key: string): Promise<SystemSettingRow | null> {
    const { data, error } = await btpClient
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return (data as SystemSettingRow) || null;
  }

  async findAll(): Promise<SystemSettingRow[]> {
    const { data, error } = await btpClient
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;
    return (data || []) as SystemSettingRow[];
  }

  async upsert(setting: SystemSettingRow): Promise<SystemSettingRow> {
    const { data, error } = await btpClient
      .from('system_settings')
      .upsert(
        {
          key: setting.key,
          category: setting.category ?? 'general',
          configuration: setting.configuration ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as SystemSettingRow;
  }
}
