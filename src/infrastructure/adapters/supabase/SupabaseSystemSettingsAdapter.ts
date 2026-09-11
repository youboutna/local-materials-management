/**
 * Supabase adapter for btp.system_settings
 *
 * ⚠️ La contrainte UNIQUE est sur (category, key).
 *    Pour lire un paramètre précis, utiliser findByCategoryAndKey().
 */

import { btpClient } from '@/integrations/supabase/schema-clients';
import { BtpTablesInsert } from '@/integrations/supabase/btp-types';
import type {
  ISystemSettingsRepository,
  SystemSettingRow,
} from '@/domain/repositories/ISystemSettingsRepository';

export class SupabaseSystemSettingsAdapter implements ISystemSettingsRepository {
  /** @deprecated Utiliser findByCategoryAndKey(). */
  async findByKey(key: string): Promise<SystemSettingRow | null> {
    const { data, error } = await btpClient
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return (data as SystemSettingRow) || null;
  }

  async findByCategoryAndKey(category: string, key: string): Promise<SystemSettingRow | null> {
    const { data, error } = await btpClient
      .from('system_settings')
      .select('*')
      .eq('category', category)
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return (data as SystemSettingRow) || null;
  }

  async findAll(): Promise<SystemSettingRow[]> {
    const { data, error } = await btpClient
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true });

    if (error) throw error;
    return (data || []) as SystemSettingRow[];
  }

  async findByCategory(category: string): Promise<SystemSettingRow[]> {
    const { data, error } = await btpClient
      .from('system_settings')
      .select('*')
      .eq('category', category)
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
        } as BtpTablesInsert<'system_settings'>,
        { onConflict: 'category,key' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as SystemSettingRow;
  }

  async delete(category: string, key: string): Promise<void> {
    const { error } = await btpClient
      .from('system_settings')
      .delete()
      .eq('category', category)
      .eq('key', key);

    if (error) throw error;
  }
}
