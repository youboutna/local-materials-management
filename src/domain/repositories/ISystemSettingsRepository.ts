/**
 * System Settings Repository Port (btp.system_settings)
 * Colonnes réelles: id, key, category, configuration (jsonb), created_at, updated_at
 *
 * ⚠️ La contrainte UNIQUE est composite (category, key) : utiliser
 *    findByCategoryAndKey() pour cibler un paramètre précis.
 */

export interface SystemSettingRow {
  id?: string;
  key: string;
  category?: string;
  configuration?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  /** Alias camelCase historiques (transformers UI). */
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ISystemSettingsRepository {
  /** @deprecated Utiliser findByCategoryAndKey(). */
  findByKey(key: string): Promise<SystemSettingRow | null>;

  /** Récupère un paramètre par (category, key). */
  findByCategoryAndKey(category: string, key: string): Promise<SystemSettingRow | null>;

  findAll(): Promise<SystemSettingRow[]>;

  /** Récupère tous les paramètres d'une catégorie. */
  findByCategory(category: string): Promise<SystemSettingRow[]>;

  upsert(setting: SystemSettingRow): Promise<SystemSettingRow>;

  /** Supprime un paramètre par (category, key). */
  delete(category: string, key: string): Promise<void>;
}
