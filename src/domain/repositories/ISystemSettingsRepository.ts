/**
 * System Settings Repository Port (btp.system_settings)
 * Colonnes réelles: id, key, category, configuration (jsonb), created_at, updated_at
 */

export interface SystemSettingRow {
  id?: string;
  key: string;
  category?: string;
  configuration?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ISystemSettingsRepository {
  findByKey(key: string): Promise<SystemSettingRow | null>;
  findAll(): Promise<SystemSettingRow[]>;
  upsert(setting: SystemSettingRow): Promise<SystemSettingRow>;
}
